-- =============================================================================
-- Grimório 5.5e — esquema do banco e regras de acesso (Supabase / Postgres)
--
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Pode rodar mais de uma vez: tudo é idempotente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Perfis (espelho de auth.users, com o nome que aparece na mesa)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nome text not null default '',
  criado_em timestamptz not null default now()
);

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Mesas e membros
-- -----------------------------------------------------------------------------
create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null references auth.users on delete cascade,
  nome text not null default 'Nova mesa',
  codigo text not null unique,
  criado_em timestamptz not null default now()
);

create table if not exists public.mesa_membros (
  mesa_id uuid not null references public.mesas on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  papel text not null default 'jogador' check (papel in ('dm', 'jogador')),
  entrou_em timestamptz not null default now(),
  primary key (mesa_id, user_id)
);

create index if not exists mesa_membros_user_idx on public.mesa_membros (user_id);

-- Função auxiliar: o usuário atual participa da mesa?
-- SECURITY DEFINER evita recursão infinita nas políticas de RLS.
create or replace function public.eh_membro(p_mesa uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.mesa_membros
    where mesa_id = p_mesa and user_id = auth.uid()
  );
$$;

create or replace function public.eh_dm(p_mesa uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.mesa_membros
    where mesa_id = p_mesa and user_id = auth.uid() and papel = 'dm'
  );
$$;

-- -----------------------------------------------------------------------------
-- Personagens — cada jogador é dono da própria ficha
-- -----------------------------------------------------------------------------
create table if not exists public.personagens (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid references public.mesas on delete cascade,
  dono_id uuid not null references auth.users on delete cascade,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);

create index if not exists personagens_mesa_idx on public.personagens (mesa_id);

-- -----------------------------------------------------------------------------
-- Estado compartilhado da mesa (campanha, bestiário, batalha, mapa)
--
-- Espelha o armazenamento chave-valor que o app já usa localmente.
-- Convenção: chaves terminadas em `_pub` são a projeção PÚBLICA — a versão já
-- censurada que os jogadores podem ler. As demais só o DM enxerga.
-- -----------------------------------------------------------------------------
create table if not exists public.mesa_estado (
  mesa_id uuid not null references public.mesas on delete cascade,
  chave text not null,
  dados jsonb not null,
  atualizado_em timestamptz not null default now(),
  primary key (mesa_id, chave)
);

-- -----------------------------------------------------------------------------
-- Histórico de rolagens compartilhado
-- -----------------------------------------------------------------------------
create table if not exists public.rolagens (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas on delete cascade,
  autor_id uuid not null references auth.users on delete cascade,
  dados jsonb not null,
  criado_em timestamptz not null default now()
);

create index if not exists rolagens_mesa_idx on public.rolagens (mesa_id, criado_em desc);

-- =============================================================================
-- Permissões de acesso pela API
--
-- Ao criar o projeto, o Supabase pergunta se deve "expor novas tabelas
-- automaticamente". Se você desmarcou essa opção, as tabelas acima nascem sem
-- permissão nenhuma e o app responde "permission denied". Os GRANTs abaixo
-- resolvem isso — o esquema funciona com a opção ligada ou desligada.
--
-- Isto NÃO abre os dados: quem decide o que cada pessoa enxerga são as
-- políticas de RLS logo em seguida. Sem uma política que permita, um GRANT não
-- devolve uma única linha.
--
-- O papel `anon` (quem não fez login) fica de fora de propósito: todas as
-- políticas exigem estar autenticado.
-- =============================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.mesas,
  public.mesa_membros,
  public.personagens,
  public.mesa_estado,
  public.rolagens
to authenticated;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles      enable row level security;
alter table public.mesas         enable row level security;
alter table public.mesa_membros  enable row level security;
alter table public.personagens   enable row level security;
alter table public.mesa_estado   enable row level security;
alter table public.rolagens      enable row level security;

-- Perfis: qualquer autenticado lê (para mostrar nomes); só o dono edita
drop policy if exists "perfis visiveis" on public.profiles;
create policy "perfis visiveis" on public.profiles
  for select to authenticated using (true);

drop policy if exists "edita proprio perfil" on public.profiles;
create policy "edita proprio perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Mesas: membros leem; qualquer autenticado cria; só o DM altera/apaga
drop policy if exists "le mesas que participa" on public.mesas;
create policy "le mesas que participa" on public.mesas
  for select to authenticated using (public.eh_membro(id));

drop policy if exists "cria mesa" on public.mesas;
create policy "cria mesa" on public.mesas
  for insert to authenticated with check (dm_id = auth.uid());

drop policy if exists "dm altera mesa" on public.mesas;
create policy "dm altera mesa" on public.mesas
  for update to authenticated using (dm_id = auth.uid()) with check (dm_id = auth.uid());

drop policy if exists "dm apaga mesa" on public.mesas;
create policy "dm apaga mesa" on public.mesas
  for delete to authenticated using (dm_id = auth.uid());

-- Membros: quem é da mesa vê os colegas; o DM gerencia; cada um pode sair
drop policy if exists "le membros da mesa" on public.mesa_membros;
create policy "le membros da mesa" on public.mesa_membros
  for select to authenticated using (public.eh_membro(mesa_id));

drop policy if exists "dm adiciona membro" on public.mesa_membros;
create policy "dm adiciona membro" on public.mesa_membros
  for insert to authenticated with check (
    public.eh_dm(mesa_id)
    -- o próprio criador da mesa se inscreve como DM
    or (user_id = auth.uid() and exists (
      select 1 from public.mesas m where m.id = mesa_id and m.dm_id = auth.uid()
    ))
  );

drop policy if exists "sai da mesa" on public.mesa_membros;
create policy "sai da mesa" on public.mesa_membros
  for delete to authenticated using (user_id = auth.uid() or public.eh_dm(mesa_id));

-- Personagens: membros da mesa leem (o DM precisa ver o grupo);
-- só o dono escreve.
drop policy if exists "le personagens da mesa" on public.personagens;
create policy "le personagens da mesa" on public.personagens
  for select to authenticated using (
    dono_id = auth.uid() or (mesa_id is not null and public.eh_membro(mesa_id))
  );

drop policy if exists "dono cria personagem" on public.personagens;
create policy "dono cria personagem" on public.personagens
  for insert to authenticated with check (dono_id = auth.uid());

drop policy if exists "dono altera personagem" on public.personagens;
create policy "dono altera personagem" on public.personagens
  for update to authenticated using (dono_id = auth.uid()) with check (dono_id = auth.uid());

-- O DM ajusta a ficha de quem está na mesa dele.
--
-- Sem isto o controle de combate fica dividido: o DM aplica dano no encontro e
-- a ficha do jogador continua cheia, e cada um passa a sessão com um número
-- diferente na frente.
--
-- O limite que importa está no `mesa_id is not null`: alcança só as fichas
-- ENVIADAS para a mesa. A cópia privada da conta do jogador (mesa_id nulo)
-- continua fora do alcance de qualquer um que não seja o dono — enviar a ficha
-- é o consentimento, e ele continua reversível.
drop policy if exists "dm ajusta ficha da mesa" on public.personagens;
create policy "dm ajusta ficha da mesa" on public.personagens
  for update to authenticated
  using (mesa_id is not null and public.eh_dm(mesa_id))
  with check (mesa_id is not null and public.eh_dm(mesa_id));

drop policy if exists "dono apaga personagem" on public.personagens;
create policy "dono apaga personagem" on public.personagens
  for delete to authenticated using (dono_id = auth.uid());

-- Estado da mesa: ESTA É A REGRA CENTRAL.
-- O DM lê tudo; o jogador só consegue ler as chaves públicas (`_pub`).
-- Segredos do DM nunca saem do banco para o cliente de um jogador.
drop policy if exists "le estado permitido" on public.mesa_estado;
create policy "le estado permitido" on public.mesa_estado
  for select to authenticated using (
    public.eh_dm(mesa_id)
    or (public.eh_membro(mesa_id) and chave like '%\_pub')
  );

drop policy if exists "dm escreve estado" on public.mesa_estado;
create policy "dm escreve estado" on public.mesa_estado
  for insert to authenticated with check (public.eh_dm(mesa_id));

drop policy if exists "dm atualiza estado" on public.mesa_estado;
create policy "dm atualiza estado" on public.mesa_estado
  for update to authenticated using (public.eh_dm(mesa_id)) with check (public.eh_dm(mesa_id));

drop policy if exists "dm apaga estado" on public.mesa_estado;
create policy "dm apaga estado" on public.mesa_estado
  for delete to authenticated using (public.eh_dm(mesa_id));

-- Rolagens: todos da mesa veem; cada um registra as suas
drop policy if exists "le rolagens da mesa" on public.rolagens;
create policy "le rolagens da mesa" on public.rolagens
  for select to authenticated using (public.eh_membro(mesa_id));

drop policy if exists "registra propria rolagem" on public.rolagens;
create policy "registra propria rolagem" on public.rolagens
  for insert to authenticated with check (autor_id = auth.uid() and public.eh_membro(mesa_id));

-- =============================================================================
-- Criar uma mesa
--
-- Precisa ser uma função porque as duas escritas (mesa + membro DM) têm de
-- acontecer juntas: logo após criar a mesa o usuário ainda não é membro dela,
-- então o RLS impediria de ler a linha recém-criada.
-- =============================================================================
create or replace function public.criar_mesa(p_nome text, p_codigo text)
returns public.mesas
language plpgsql
security definer set search_path = public
as $$
declare
  v_mesa public.mesas;
begin
  if auth.uid() is null then
    raise exception 'Precisa estar autenticado';
  end if;

  insert into public.mesas (dm_id, nome, codigo)
  values (auth.uid(), coalesce(nullif(trim(p_nome), ''), 'Nova mesa'), upper(trim(p_codigo)))
  returning * into v_mesa;

  insert into public.mesa_membros (mesa_id, user_id, papel)
  values (v_mesa.id, auth.uid(), 'dm');

  return v_mesa;
end;
$$;

revoke all on function public.criar_mesa(text, text) from public;
grant execute on function public.criar_mesa(text, text) to authenticated;

-- =============================================================================
-- Entrar numa mesa pelo código de convite
--
-- Precisa ser uma função: o jogador não pode enxergar a lista de mesas para
-- descobrir o id a partir do código.
-- =============================================================================
create or replace function public.entrar_na_mesa(p_codigo text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_mesa uuid;
begin
  select id into v_mesa from public.mesas where upper(codigo) = upper(trim(p_codigo));
  if v_mesa is null then
    raise exception 'Código de mesa inválido';
  end if;

  insert into public.mesa_membros (mesa_id, user_id, papel)
  values (v_mesa, auth.uid(), 'jogador')
  on conflict (mesa_id, user_id) do nothing;

  return v_mesa;
end;
$$;

revoke all on function public.entrar_na_mesa(text) from public;
grant execute on function public.entrar_na_mesa(text) to authenticated;

-- =============================================================================
-- Realtime — publica as tabelas que o app escuta
-- =============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'mesa_estado'
  ) then
    alter publication supabase_realtime add table public.mesa_estado;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'personagens'
  ) then
    alter publication supabase_realtime add table public.personagens;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'rolagens'
  ) then
    alter publication supabase_realtime add table public.rolagens;
  end if;
end $$;

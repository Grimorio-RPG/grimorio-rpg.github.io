\set ON_ERROR_STOP on
\pset tuples_only on

-- Começa do zero, para o arquivo poder ser rodado quantas vezes quiser.
-- (apagar o usuário derruba mesas, membros, fichas e rolagens em cascata)
delete from auth.users where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Três contas: o DM, um jogador da mesa e um estranho.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'dm@teste.com',       '{"nome":"Mestre"}'),
  ('22222222-2222-2222-2222-222222222222', 'jogador@teste.com',  '{"nome":"Jogador"}'),
  ('33333333-3333-3333-3333-333333333333', 'estranho@teste.com', '{"nome":"Estranho"}');

select '01 perfis criados pelo gatilho: ' ||
  (select count(*) from public.profiles) || ' (esperado 3)';

-- ---------------------------------------------------------------- DM
set role authenticated;
set teste.uid = '11111111-1111-1111-1111-111111111111';

select '02 criar_mesa devolve o codigo: ' || (select codigo from public.criar_mesa('Mesa de Teste', 'abc123'));
select '03 DM ve a propria mesa: ' || (select count(*) from public.mesas) || ' (esperado 1)';
select '04 DM esta como dm: ' || (select papel from public.mesa_membros where user_id = auth.uid());

insert into public.mesa_estado (mesa_id, chave, dados)
select id, 'bestiario', '{"segredo":"o dragao e uma ilusao"}'::jsonb from public.mesas;
insert into public.mesa_estado (mesa_id, chave, dados)
select id, 'batalha_pub', '{"rodada":3}'::jsonb from public.mesas;

select '05 DM le as duas chaves: ' || (select count(*) from public.mesa_estado) || ' (esperado 2)';

-- ---------------------------------------------------------------- Jogador
reset role; set role authenticated;
set teste.uid = '22222222-2222-2222-2222-222222222222';

select '06 jogador nao ve mesa antes de entrar: ' || (select count(*) from public.mesas) || ' (esperado 0)';
select '07 entrar_na_mesa (codigo minusculo): ' ||
  case when public.entrar_na_mesa('abc123') is not null then 'entrou' else 'falhou' end;
select '08 jogador agora ve a mesa: ' || (select count(*) from public.mesas) || ' (esperado 1)';
select '09 jogador ve os 2 membros: ' || (select count(*) from public.mesa_membros) || ' (esperado 2)';

-- O TESTE QUE IMPORTA: o segredo do DM nao pode sair do banco.
select '10 jogador le SO a chave publica: ' ||
  coalesce(string_agg(chave, ',' order by chave), '(nenhuma)') || ' (esperado batalha_pub)'
  from public.mesa_estado;

-- Jogador nao escreve estado da mesa
do $$
begin
  insert into public.mesa_estado (mesa_id, chave, dados)
  select id, 'batalha_pub', '{"trapaca":true}'::jsonb from public.mesas limit 1;
  raise notice '11 FALHA: jogador conseguiu escrever estado!';
exception when insufficient_privilege or others then
  raise notice '11 ok: jogador bloqueado ao escrever estado';
end $$;

-- Ficha do jogador
insert into public.personagens (mesa_id, dono_id, dados)
select id, auth.uid(), '{"nome":"Arch Rios"}'::jsonb from public.mesas;
select '12 jogador ve a propria ficha: ' || (select count(*) from public.personagens) || ' (esperado 1)';

-- ---------------------------------------------------------------- DM de novo
reset role; set role authenticated;
set teste.uid = '11111111-1111-1111-1111-111111111111';
select '13 DM ve a ficha do jogador: ' ||
  (select coalesce(dados->>'nome','(nada)') from public.personagens);

-- ---------------------------------------------------------------- Estranho
reset role; set role authenticated;
set teste.uid = '33333333-3333-3333-3333-333333333333';
select '14 estranho nao ve mesa: '     || (select count(*) from public.mesas)        || ' (esperado 0)';
select '15 estranho nao ve estado: '   || (select count(*) from public.mesa_estado)  || ' (esperado 0)';
select '16 estranho nao ve fichas: '   || (select count(*) from public.personagens)  || ' (esperado 0)';

do $$
begin
  perform public.entrar_na_mesa('ZZZZZZ');
  raise notice '17 FALHA: codigo invalido foi aceito!';
exception when others then
  raise notice '17 ok: codigo invalido recusado';
end $$;

reset role;

-- ============================ Rolagens compartilhadas ========================
reset role; set role authenticated;
set teste.uid = '11111111-1111-1111-1111-111111111111';
insert into public.rolagens (mesa_id, autor_id, dados)
select id, auth.uid(), '{"id":"r1","total":18,"rotulo":"Percepcao"}'::jsonb from public.mesas;
select '18 DM registrou a rolagem: ' || (select count(*) from public.rolagens) || ' (esperado 1)';

reset role; set role authenticated;
set teste.uid = '22222222-2222-2222-2222-222222222222';
insert into public.rolagens (mesa_id, autor_id, dados)
select id, auth.uid(), '{"id":"r2","total":20,"rotulo":"Ataque"}'::jsonb from public.mesas;
select '19 jogador ve as rolagens do grupo: ' || (select count(*) from public.rolagens) || ' (esperado 2)';

-- Forjar autoria: assinar uma rolagem com o id do DM
do $$
declare v_mesa uuid;
begin
  select id into v_mesa from public.mesas limit 1;
  insert into public.rolagens (mesa_id, autor_id, dados)
  values (v_mesa, '11111111-1111-1111-1111-111111111111', '{"id":"r3","total":20}'::jsonb);
  raise notice '20 FALHA: jogador assinou rolagem como o DM!';
exception when others then
  raise notice '20 ok: nao da para assinar rolagem em nome de outro';
end $$;

-- Estranho não vê as rolagens da mesa
reset role; set role authenticated;
set teste.uid = '33333333-3333-3333-3333-333333333333';
select '21 estranho nao ve rolagens: ' || (select count(*) from public.rolagens) || ' (esperado 0)';

do $$
declare v_mesa uuid := '00000000-0000-0000-0000-000000000000';
begin
  insert into public.rolagens (mesa_id, autor_id, dados)
  values (v_mesa, auth.uid(), '{"id":"r4"}'::jsonb);
  raise notice '22 FALHA: estranho registrou rolagem!';
exception when others then
  raise notice '22 ok: estranho bloqueado ao registrar rolagem';
end $$;

reset role;

-- ======================= Visitante sem login (papel anon) ====================
-- O app é um site público: qualquer um carrega o JavaScript e a chave anon.
-- Sem fazer login, não pode enxergar nada.
reset role; set role anon;

do $$
begin
  perform 1 from public.mesas;
  raise notice '23 FALHA: visitante sem login leu as mesas!';
exception when insufficient_privilege then
  raise notice '23 ok: visitante sem login nao acessa as mesas';
end $$;

do $$
begin
  perform 1 from public.mesa_estado;
  raise notice '24 FALHA: visitante sem login leu o estado das mesas!';
exception when insufficient_privilege then
  raise notice '24 ok: visitante sem login nao acessa o estado';
end $$;

do $$
begin
  perform 1 from public.personagens;
  raise notice '25 FALHA: visitante sem login leu as fichas!';
exception when insufficient_privilege then
  raise notice '25 ok: visitante sem login nao acessa as fichas';
end $$;

reset role;

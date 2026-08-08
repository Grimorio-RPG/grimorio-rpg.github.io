-- =============================================================================
-- Grimório 5.5e — imagens no Storage
--
-- Rode DEPOIS de `schema.sql`, no SQL Editor do painel do Supabase. É
-- idempotente: pode rodar de novo quantas vezes quiser.
--
-- Por que existe
-- -------------
-- Até aqui as imagens de mapa viajavam como data URL dentro de uma linha JSON
-- da tabela `mesa_estado`. Funciona, e é o caminho errado: um mapa de 1,5 MB
-- vira ~2 MB de base64 numa coluna jsonb, sobe inteiro a cada republicação,
-- desce inteiro para cada jogador e ainda mora no mesmo lugar que os pontos do
-- mapa — que mudam toda vez que o DM revela um lugar.
--
-- Aqui a imagem passa a ser um arquivo. O que trafega no banco vira o caminho
-- dela, que tem algumas dezenas de bytes.
--
-- O balde é PRIVADO
-- -----------------
-- Um mapa que o DM ainda não revelou é segredo dele. Balde público entrega o
-- arquivo a quem tiver o link, e "link difícil de adivinhar" não é uma
-- fronteira de segurança — é uma esperança. Privado, quem lê é quem o RLS
-- deixa, e o app pede uma URL assinada de curta duração na hora de mostrar.
--
-- O caminho carrega a permissão
-- -----------------------------
-- Todo arquivo mora em `{mesa_id}/...`, e a primeira pasta é o que as políticas
-- leem para decidir. Sem isso não haveria como saber de que mesa é o arquivo
-- sem uma tabela paralela — e uma tabela paralela é mais uma coisa para sair de
-- sincronia com a verdade.
-- =============================================================================

-- 1. O balde ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imagens',
  'imagens',
  false,
  8388608, -- 8 MB: mapa grande cabe, vídeo disfarçado não
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. As políticas -------------------------------------------------------------
--
-- `storage.foldername(name)` devolve as pastas do caminho; a primeira é a mesa.
-- O `::uuid` derruba qualquer caminho que não comece com um id de mesa válido,
-- que é exatamente o que se quer barrar.

drop policy if exists "imagens: membro lê" on storage.objects;
create policy "imagens: membro lê"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'imagens'
    and public.eh_membro(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "imagens: membro envia" on storage.objects;
create policy "imagens: membro envia"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'imagens'
    and public.eh_membro(((storage.foldername(name))[1])::uuid)
  );

-- Trocar e apagar são só de quem enviou.
--
-- Membro da mesa pode ACRESCENTAR arquivo, mas não sobrescrever o do colega:
-- sem isto, um jogador trocaria o mapa do DM por outra imagem e ninguém saberia
-- de onde veio.
drop policy if exists "imagens: dono troca" on storage.objects;
create policy "imagens: dono troca"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'imagens'
    and owner = auth.uid()
    and public.eh_membro(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "imagens: dono apaga" on storage.objects;
create policy "imagens: dono apaga"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'imagens'
    and owner = auth.uid()
    and public.eh_membro(((storage.foldername(name))[1])::uuid)
  );

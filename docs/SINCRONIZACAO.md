# Sincronização em tempo real

Como o Grimório sai de "cada navegador é uma ilha" para **todo mundo na mesma
mesa, cada um no seu aparelho**.

O app continua sendo um **site estático**: não há servidor próprio para manter.
Ele conversa direto com o **Supabase** (Postgres + Auth + Realtime).

```
 Celular do Jogador A ─┐
 Celular do Jogador B ─┼── HTTPS + WebSocket ──►  Supabase
 Notebook do DM       ─┘                          • Postgres + RLS
                                                  • Auth
                                                  • Realtime
```

## Estado atual

| Etapa | Situação |
|---|---|
| 1. Esquema do banco e políticas de acesso | ✅ pronto (`supabase/schema.sql`) |
| 2. Detecção de ambiente + cliente sob demanda | ✅ pronto (`src/lib/sync/`) |
| 3. Login e perfil | ⬜ falta o projeto Supabase |
| 4. Mesa: criar, convidar, entrar | ⬜ |
| 5. Realtime por aba (começando por Batalhas) | ⬜ |
| 6. Projeção pública automática | ⬜ |

**O modo local nunca deixa de existir.** Sem as variáveis de ambiente o app roda
exatamente como hoje: IndexedDB, offline, sem conta.

---

## O que você precisa fazer (≈ 5 minutos)

1. **Criar o projeto**
   Em [supabase.com](https://supabase.com) → *New project*. Escolha a região
   mais próxima (South America, se houver). Guarde a senha do banco.

2. **Rodar o esquema**
   No painel → **SQL Editor** → *New query* → cole todo o conteúdo de
   [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.
   Pode rodar de novo quantas vezes quiser: é idempotente.

3. **Pegar as chaves**
   **Project Settings → API**:
   - *Project URL* → `VITE_SUPABASE_URL`
   - *Project API keys → `anon` `public`* → `VITE_SUPABASE_ANON_KEY`

   ⚠️ Use a chave **anon**, nunca a `service_role`. A anon é pública por
   natureza (vai no código do site); quem protege os dados é o RLS.

4. **Configurar o app**
   ```bash
   cp .env.example .env
   # preencha as duas variáveis
   npm run dev
   ```
   Na aba **Dados**, o selo deve mudar de *📴 modo local* para *☁️ nuvem configurada*.

5. **Me avisar** — com o projeto no ar eu implemento login, mesas e realtime.

> Não precisa me passar as chaves: elas ficam no seu `.env` (que está no
> `.gitignore`). Só me diga que está configurado. Se quiser que eu valide de
> ponta a ponta aqui, aí sim precisaria da URL e da chave anon — são públicas,
> mas a escolha é sua.

---

## Modelo de dados

| Tabela | O que guarda | Quem escreve |
|---|---|---|
| `profiles` | nome de exibição | o próprio |
| `mesas` | mesa + código de convite | DM |
| `mesa_membros` | quem participa e em que papel | DM / quem entra |
| `personagens` | fichas (`jsonb`) | **o dono da ficha** |
| `mesa_estado` | campanha, bestiário, batalha e mapa (`jsonb`) | DM |
| `rolagens` | histórico compartilhado de dados | cada um as suas |

`mesa_estado` é uma tabela **chave-valor** — exatamente o formato que o app já
usa localmente (`src/lib/store.ts`). Isso faz a camada de nuvem ficar quase
simétrica à local: onde hoje se lê a chave `bestiario` do IndexedDB, amanhã se
lê a linha `(mesa_id, 'bestiario')` do Postgres.

## O ponto central: segredos que não saem do banco

Hoje a "Visão dos Jogadores" filtra **no navegador**. Os dados do DM chegam ao
aparelho do jogador; o app só não os desenha. Quem abrir as ferramentas de
desenvolvedor vê tudo.

Com o backend isso muda de natureza. A convenção é simples:

- `bestiario`, `batalha`, `campanha`, `mapa` → **privadas do DM**
- `bestiario_pub`, `batalha_pub`, `campanha_pub`, `mapa_pub` → **projeção pública**

Quando o DM salva, o app grava as duas versões: a completa e a já censurada
(sem táticas, sem segredos, sem criaturas desconhecidas). A política de RLS
garante o resto:

```sql
create policy "le estado permitido" on public.mesa_estado
  for select to authenticated using (
    public.eh_dm(mesa_id)
    or (public.eh_membro(mesa_id) and chave like '%\_pub')
  );
```

Um jogador **não consegue baixar** as linhas privadas — o banco recusa. O
sistema de conhecimento progressivo deixa de ser cosmético e passa a valer de
verdade.

## Conflitos

Última escrita vence, por entidade. Na prática quase não há conflito: o DM é
dono de quase todo o estado compartilhado, e cada jogador é dono só da própria
ficha.

## Custo

Um grupo de 5–6 pessoas cabe com folga no **plano gratuito** do Supabase.
O front-end é estático e hospeda de graça (Cloudflare Pages, Vercel, Netlify).

⚠️ No plano gratuito o projeto **hiberna** após alguns dias sem uso — a primeira
requisição depois disso demora alguns segundos.

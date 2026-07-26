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
| 3. Login e perfil | ✅ pronto (aba **Mesa**) |
| 4. Mesa: criar, convidar, entrar | ✅ pronto (código de 6 letras) |
| 5. Realtime — aba **Batalhas** | ✅ pronto |
| 6. Projeção pública automática | ✅ pronto para Batalhas (`projetarBatalha`) |
| 7. Realtime nas abas Mapa, Bestiário e Campanha | ⬜ próximo |
| 8. Fichas do grupo visíveis para o DM | ⬜ |

**O modo local nunca deixa de existir.** Sem as variáveis de ambiente o app roda
exatamente como hoje: IndexedDB, offline, sem conta. E mesmo com a nuvem ligada,
quem não entra numa mesa continua com o app inteiro só para si.

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
   Abra a aba **Mesa**: ela deve trocar as instruções de instalação por uma
   tela de login.

5. **Criar sua conta e a mesa**
   Na aba **Mesa** → *Criar conta* → depois *Sou o DM* → dê um nome à mesa.
   Sai um **código de 6 letras**.

6. **Cada jogador**
   Abre o mesmo endereço, cria a conta dele, escolhe *Sou jogador* e digita o
   código. Pronto: quando você montar um encontro na aba **Batalhas**, ele
   aparece no celular de cada um em segundos.

> Não precisa me passar as chaves: elas ficam no seu `.env` (que está no
> `.gitignore`).

### Se o projeto Supabase pedir confirmação de e-mail

Por padrão o Supabase manda um e-mail de confirmação antes de liberar o login.
Para uma mesa de amigos costuma ser mais prático desligar: **Authentication →
Providers → Email → Confirm email: off**.

### Publicando com a nuvem ligada

No GitHub: **Settings → Secrets and variables → Actions → New repository
secret**, criando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. O workflow de
publicação já lê esses dois nomes.

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

### O que sai numa batalha

`projetarBatalha()` (em `src/lib/battle.ts`) é quem faz a censura antes de
publicar. Para cada inimigo:

| Campo | Vira |
|---|---|
| `nome` | `"???"` se o DM marcou *ocultar nome* |
| `imagemUrl` (foto da ficha do DM) | a imagem de jogador |
| `ca` | `0` |
| `pvAtual` / `pvMax` | **porcentagem**, não o número real |

A barra de vida e o rótulo (*Saudável / Ferido / Quase morrendo*) continuam
corretos, mas nem abrindo o inspetor do navegador o jogador descobre que faltam
exatamente 7 pontos de vida. Aliados não passam por isso: o grupo vê o próprio
PV normalmente.

### Como isso foi verificado

O schema foi rodado num Postgres limpo com um `auth.uid()` de mentira e
exercitado com três contas — DM, jogador e um estranho. Os 17 casos passaram; os
que importam:

- o jogador lê **só** `batalha_pub`, nunca a chave `bestiario` do DM;
- o jogador é bloqueado ao tentar escrever em `mesa_estado`;
- quem não é da mesa não vê mesa, estado nem fichas;
- código de convite inválido é recusado, e o válido funciona em minúsculas.

## Conflitos

Última escrita vence, por entidade. Na prática quase não há conflito: o DM é
dono de quase todo o estado compartilhado, e cada jogador é dono só da própria
ficha.

## Custo

Um grupo de 5–6 pessoas cabe com folga no **plano gratuito** do Supabase.
O front-end é estático e hospeda de graça (Cloudflare Pages, Vercel, Netlify).

⚠️ No plano gratuito o projeto **hiberna** após alguns dias sem uso — a primeira
requisição depois disso demora alguns segundos.

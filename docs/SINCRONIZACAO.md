# Sincronização em tempo real — arquitetura

Este documento descreve o plano para transformar o Grimório 5.5e (hoje 100%
local, no navegador) em um app **multi-dispositivo em tempo real**: o DM e cada
jogador acessam a mesma mesa, cada um no seu aparelho, e as mudanças aparecem
para todos na hora.

## Visão geral

O app continua sendo um **site estático (React)** — não há servidor próprio para
manter. Ele conversa **diretamente** com um backend gerenciado (BaaS) que provê
banco de dados, autenticação e realtime.

```
  Celular do Jogador A ─┐
  Celular do Jogador B ─┼──HTTPS/WebSocket──►  Backend gerenciado (nuvem)
  Notebook do DM      ─┘                        - Banco de dados (Postgres)
                                                 - Autenticação
                                                 - Realtime (WebSocket)
                                                 - Regras de acesso (RLS)
```

## Recomendação de plataforma: Supabase

**Supabase** (Postgres gerenciado + Auth + Realtime + Storage) é a melhor opção
para este caso:

- **Realtime nativo:** o banco emite as mudanças por WebSocket; o cliente se
  inscreve e recebe atualizações instantâneas. Ideal para "todos veem juntos".
- **Postgres + RLS:** regras de segurança no servidor (Row Level Security)
  garantem que jogadores só leiam o que podem — inclusive impedindo, de verdade,
  que vejam os PV exatos ou fichas ocultas de inimigos.
- **App continua client-only:** sem servidor Node para manter/deploy.
- **Chave pública segura:** a `anon key` vai no cliente sem risco, pois quem
  protege os dados são as políticas RLS.
- **Plano gratuito** cobre grupos pessoais com folga.

Alternativas: Firebase/Firestore (parecido, do Google) ou um servidor Node
próprio (mais controle, porém precisa hospedar e manter). Supabase é o melhor
custo-benefício aqui.

## Onde fica hospedado

- **Backend (dados/auth/realtime):** Supabase Cloud (nuvem gerenciada). Você
  cria um projeto gratuito; nada roda na sua máquina.
- **Frontend (o app React):** site estático, publicável de graça em
  Vercel, Netlify, Cloudflare Pages ou GitHub Pages. Cada jogador só abre a URL.

## Como os dados são salvos

Reaproveitamos os tipos que já existem (`Character`, `Campaign`, `Monster`,
`Battle`) guardando-os em colunas `jsonb`, com algumas colunas relacionais para
filtro e segurança. Esboço do schema:

| Tabela          | Campos principais                                              | Quem escreve |
|-----------------|---------------------------------------------------------------|--------------|
| `profiles`      | `user_id`, `nome`                                             | o próprio    |
| `mesas`         | `id`, `dm_id`, `nome`, `codigo_convite`                       | DM           |
| `mesa_membros`  | `mesa_id`, `user_id`, `papel` ('dm'/'jogador')               | DM / entrar  |
| `personagens`   | `id`, `mesa_id`, `dono_id`, `dados jsonb`, `updated_at`       | dono da ficha|
| `bestiario`     | `id`, `mesa_id`, `dados jsonb`                                | DM           |
| `campanha`      | `mesa_id`, `dados jsonb`                                      | DM           |
| `batalha`       | `mesa_id`, `dados jsonb`                                      | DM           |

- **Última escrita vence** (last-write-wins) por entidade, usando `updated_at`.
  Conflitos são raros: o DM é dono de quase todo o estado compartilhado, e cada
  jogador é dono só da própria ficha.
- **Cache offline:** o `localStorage` atual vira cache; o app funciona offline e
  sincroniza ao reconectar.

## Contas e como a mesa é compartilhada

1. O **DM cria uma Mesa** e recebe um **código/link de convite**.
2. Cada **jogador entra** com o código e vira membro da mesa.
3. Papéis definem permissões (DM x jogador).

### Segurança (RLS) — o ponto-chave

As políticas no servidor garantem:

- Um membro só lê dados **da sua mesa**.
- Só o **DM** escreve bestiário, batalha e campanha.
- Cada jogador escreve **apenas a própria ficha**.
- **Visão dos Jogadores de verdade:** para inimigos ocultos/parciais, o servidor
  só entrega aos jogadores a projeção permitida (nome/stats redigidos conforme o
  nível de conhecimento). Hoje isso é filtrado no cliente (o DM controla, mas os
  dados trafegam); com backend passa a ser garantido no servidor. Implementação:
  uma *view* Postgres ou uma *Edge Function* que devolve a batalha/bestiário já
  redigidos para quem é jogador.

## Modo local (sem conta) continua existindo

Quem só quer usar sozinho continua no modo local (como hoje), sem login. O login
é necessário só para o jogo compartilhado. Uma camada de acesso a dados
(`DataStore`) abstrai "local" x "nuvem", então a maior parte da UI não muda.

## Migração dos dados atuais

As fichas já podem ser exportadas/importadas em `.json`. Ao entrar numa mesa, dá
para **subir a ficha local para a nuvem** com um clique, reaproveitando esse
mecanismo.

## O que eu preciso de você para colocar no ar

1. Criar um projeto **gratuito** no Supabase (leva ~2 min).
2. Me passar a **Project URL** e a **anon public key** (podem ir num `.env` — a
   anon key é pública por design e protegida por RLS).

Com isso eu: aplico o schema + políticas RLS, ligo o cliente Supabase atrás de
uma flag de ambiente (o app segue funcionando local se as chaves não existirem),
e implemento login, criação/entrada de mesa e as assinaturas realtime por aba.

## Passo a passo de implementação (proposto)

1. Camada `DataStore` (abstrai local x nuvem) — refatoração segura, sem mudar UX.
2. Cliente Supabase + config por ambiente (inerte sem chaves).
3. Schema + RLS no Supabase.
4. Login + perfil.
5. Mesa: criar, convidar, entrar.
6. Realtime por aba (fichas, campanha, bestiário, batalha).
7. Projeção segura da Visão dos Jogadores (view/Edge Function).
8. Deploy do frontend + guia para o grupo.

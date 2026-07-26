# Testes das regras de acesso

Estes arquivos verificam, num Postgres comum, que as políticas de RLS do
`schema.sql` fazem o que prometem — que o segredo do DM não sai do banco para o
aparelho de um jogador.

Não é preciso rodá-los para usar o app. Rode se você mexer no `schema.sql`.

## Como rodar

Você precisa de um Postgres local (qualquer versão 14+) e do `psql`.

```bash
# 1. suba um Postgres descartável (exemplo com Docker)
docker run --rm -d --name pg-grimorio -e POSTGRES_HOST_AUTH_METHOD=trust -p 5433:5432 postgres:16

# 2. finja ser o Supabase: schema auth, auth.uid(), papéis e a publicação realtime
psql -h localhost -p 5433 -U postgres -f supabase/testes/00-stub-supabase.sql

# 3. aplique o esquema de verdade
psql -h localhost -p 5433 -U postgres -f supabase/schema.sql

# 4. rode os testes
psql -h localhost -p 5433 -U postgres -f supabase/testes/01-regras-de-acesso.sql
```

Cada linha da saída traz o valor obtido e o esperado ao lado. São 25
verificações com três contas — o DM, um jogador da mesa e um estranho — mais o
visitante que nem fez login. O arquivo pode ser rodado quantas vezes quiser: ele
limpa os dados de teste no começo.

| # | O que prova |
|---|---|
| 01–05 | perfil criado no cadastro; `criar_mesa` inscreve o DM; o DM lê tudo |
| 06–09 | o jogador não vê a mesa antes de entrar; o código funciona em minúsculas |
| **10–11** | **o jogador lê só as chaves `_pub` e não consegue escrever estado** |
| 12–13 | cada um escreve a própria ficha; o DM lê as do grupo |
| 14–17 | quem não é da mesa não vê nada; código inválido é recusado |
| 18–22 | rolagens: o grupo vê as de todos, ninguém assina em nome de outro |
| 23–25 | quem não fez login não acessa mesas, estado nem fichas |

Os testes 10, 11 e 20 são os que realmente importam — os outros existem para
que uma falha neles seja fácil de diagnosticar.

O stub deste diretório **não** concede permissões automáticas às tabelas, de
propósito: assim os testes provam que os `grant` do próprio `schema.sql` bastam,
mesmo que você desmarque *"Automatically expose new tables"* ao criar o projeto
no Supabase.

## Nota sobre o stub

`00-stub-supabase.sql` recria o mínimo do Supabase que o esquema usa: o schema
`auth`, a função `auth.uid()` (que aqui lê uma variável de sessão em vez do JWT),
os papéis `anon`/`authenticated` e a publicação `supabase_realtime`.

Isso cobre RLS, funções e políticas. **Não** cobre o Auth nem o Realtime de
verdade — para esses, só testando contra um projeto Supabase real.

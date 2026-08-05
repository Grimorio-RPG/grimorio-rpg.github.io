---
name: rodar
description: Sobe o Grimório e o percorre num navegador sem janela, tirando screenshots. Use quando a mudança for de interface — layout, cor, posição, um painel novo — e for preciso VER antes de dizer que está pronto. As checagens de `npm run verificar` não olham a tela.
---

# Rodar o Grimório e olhar

As 1.300 checagens de `npm run verificar` cobrem regra, projeção e migração.
Nenhuma delas olha a tela. Dois defeitos passaram por elas inteiras e só
apareceram numa screenshot: tokens entrando sobrepostos (posições diferentes,
mas o passo era menor que o token) e um mapa preto sobre fundo preto.

Se a mudança mexe em layout, cor, posição ou num painel novo, rode e olhe.

## 1. Servidor

```bash
cd ~/Documents/grimorio
(npm run dev > /tmp/vite.log 2>&1 &)
timeout 60 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do sleep 1; done'
```

Ao terminar:

```bash
lsof -ti:5173 -sTCP:LISTEN | xargs -r kill
```

## 2. Navegador

Não há driver no projeto, e não deve haver — `package.json` fica limpo. O
Chromium vive no scratchpad:

```bash
cd "$SCRATCHPAD"
npm init -y && npm i playwright-core
npx --yes playwright@latest install chromium
```

## 3. Semear dados pelo `localStorage`

Criar um chefe com ações lendárias e tesouro pela interface são dezenas de
cliques frágeis. `initStore` migra do `localStorage` para o IndexedDB no boot,
então basta semear ANTES da primeira carga:

```js
await ctx.addInitScript(([chefe, campanha]) => {
  localStorage.setItem('grimorio55e.bestiary.v1', JSON.stringify([chefe]))
  localStorage.setItem('grimorio55e.bestiary.seeded.v1', '1')
  localStorage.setItem('grimorio55e.campaign.v1', JSON.stringify(campanha))
}, [CHEFE, CAMPANHA])
```

As chaves estão em `src/lib/store.ts`, em `CHAVES`. Sem a bandeira
`bestiary.seeded.v1` o app semeia os exemplos por cima.

## 4. Percurso que vale a pena

Rotas são hash (`#/batalhas`), então `a[href="#/batalhas"]` acha o menu.

```js
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
await p.waitForSelector('a[href="#/batalhas"]', { timeout: 20000 })
```

Um combate completo, que é onde mora quase tudo:

```js
await p.click('button:has-text("Masmorra")')        // mapa pronto
await p.locator('select').first().selectOption({ index: 1 })
await p.click('button:has-text("Add")')
await p.click('button:has-text("Iniciativa de todos")')
await p.click('button:has-text("Iniciar combate")')

const dano = p.locator('input[title*="dano"]').first()
await dano.fill('4'); await dano.press('Enter')     // Enter = dano
await p.click('button[title^="Desfazer"]')
await p.click('button:has-text("Encerrar")')
await p.click('button:has-text("Revelar o saque")')
```

Sempre em duas larguras: **1440×950** (duas colunas) e **390×844** (empilhado).

## Armadilhas já encontradas

- **`text=Grimório` casa 3 elementos**, e no celular o da barra lateral está
  oculto — o `waitForSelector` espera para sempre. Prefira
  `a[href="#/batalhas"]`.
- **O seletor de mapas some depois da escolha.** Os mapas viram botões só de
  ícone dentro de `⚙️ Cena`; `button:has-text("Caverna")` não acha mais.
- **Para julgar os mapas prontos**, renderize os SVG num HTML próprio, sobre o
  fundo do app e com a grade e dois tokens por cima. Dentro do app eles ficam
  pequenos demais para avaliar cor.
- **`console --errors` importa**: os dois defeitos visuais não geraram erro
  nenhum. Console limpo não quer dizer tela certa.

## O que olhar

Abrir a screenshot e **olhar** — quadro em branco é falha de carga. Depois:
tokens sobrepostos, texto ilegível sobre o fundo, coluna vazia, algo que
deveria aparecer e não apareceu (foi assim que o saque perdido apareceu).

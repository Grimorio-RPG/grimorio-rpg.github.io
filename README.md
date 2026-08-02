# 🐉 Grimório 5.5e

App para **DMs e jogadores de D&D 5.5e** (regras de 2024), pensado para ser
**amigável a iniciantes**. Reúne numa só ferramenta o que hoje fica espalhado
entre D&D Beyond, Owlbear e anotações soltas.

No ar em **[grimorio-rpg.github.io](https://grimorio-rpg.github.io/)** — todo push
na `main` republica em cerca de dois minutos.

Referência de layout da ficha: [critical20.com.br](https://www.critical20.com.br/ficha/dnd55).

---

## 🚀 Rodando o projeto

Requisitos: **Node.js 18+** (testado no 24).

```bash
git clone https://github.com/Grimorio-RPG/grimorio-rpg.github.io.git grimorio
cd grimorio

npm install
npm run dev        # abre em http://localhost:5173
```

Para sincronizar na nuvem enquanto desenvolve, copie `.env.example` para `.env`
e preencha as duas chaves — veja [docs/SINCRONIZACAO.md](docs/SINCRONIZACAO.md).
Sem elas o app roda em modo local, o que é suficiente para mexer na interface.

Outros comandos:

```bash
npm run build      # build de produção em dist/
npm run preview    # serve o build em http://localhost:4173
npm run lint       # checagem de tipos (tsc --noEmit)
```

### Abrindo no VS Code

```bash
code .
```

Ao abrir, o VS Code sugere as extensões recomendadas (Tailwind IntelliSense e
ESLint). O projeto já vem com `.vscode/` configurado para formatar ao salvar e
para o autocomplete das classes do Tailwind funcionar.

### 📦 Levando seus dados junto

Os dados ficam no **navegador** (IndexedDB), não no código — então mudar de
máquina ou de endereço (de `claude.ai` para `localhost`, por exemplo) **não**
leva as fichas junto. Para transferir:

1. No app antigo: aba **💾 Dados** → **Baixar backup** (gera um `.json` com tudo).
2. No app novo: aba **💾 Dados** → **Restaurar backup** → selecione o arquivo.

O backup inclui personagens, campanha, codex, bestiário, batalha, mapa e
histórico de rolagens.

---

## ✨ O que o app faz

### Para jogadores
- **Assistente de criação** passo a passo: espécie, classe, antecedente,
  atributos (arranjo padrão, compra de pontos ou manual) e perícias da classe.
- **Importar ficha do D&D Beyond (PDF)** — lê os campos do PDF exportado e monta
  a ficha completa (atributos, perícias, ataques, magias, inventário, moedas).
- **Ficha viva**: modo leitura por padrão (bom para consultar em jogo) e edição
  sob demanda. Inclui espaços de magia, testes de morte, exaustão, condições,
  inventário com moedas, talentos e armadura.
- **Cálculo automático**: CA a partir da armadura equipada + Destreza + escudo,
  e ataques com bônus e dano calculados ao escolher a arma no catálogo.
- **Rolador de dados integrado**: toque no bônus de uma perícia, salvaguarda ou
  ataque para rolar; bandeja flutuante com d4–d100, notação livre (`2d6+3`),
  vantagem/desvantagem e histórico.
- **Subir de nível guiado** e **descansos** (curto gastando dados de vida, longo
  recarregando tudo).

### Para o DM
- **Painel da campanha**: fichas do grupo, "tela do mestre" com CA, PV e
  percepções passivas, diário de sessões e NPCs.
- **Bestiário** com foto, estatísticas, ações (ação, bônus, reação, lendária e de
  covil), tesouro e táticas privadas.
- **Batalhas**: monta o encontro com PCs e monstros, controla iniciativa, turnos,
  vida e condições com prazo. Ações lendárias aparecem no turno dos outros — que
  é quando a regra as gasta — e as de covil avisam sozinhas na iniciativa 20.
- **Registro de combate**: o que aconteceu, na ordem, censurado antes de chegar
  ao grupo. Vira os destaques da tela de vitória.
- **Tabelas sorteáveis**: encontros por região, nomes de NPC, rumores.
- **Linha do tempo**: sessões, chefes derrubados e lugares revelados numa lista
  só, montada a partir do que já está salvo.
- **Mapa / mesa virtual**: mapa com grade, tokens arrastáveis (com encaixe na
  grade), zoom, régua e tokens ocultáveis.
- **Codex do mundo**: locais, facções, divindades e segredos, além de documentos
  (handouts) e reputação do grupo.

### 👥 Visão dos Jogadores
Bestiário, Batalhas, Mapa e Campanha têm um botão que alterna entre a **visão do
DM** e a **visão dos jogadores** — esta última mostra só o que o grupo já
descobriu. O DM controla o nível de conhecimento de cada criatura e de cada
verbete do codex (*desconhecido → encontrado → parcial → completo*), e segredos
do DM nunca aparecem nela.

---

## 🧱 Tecnologia

Vite · React · TypeScript · Tailwind CSS · React Router · pdf.js (importação).

```
src/
  data/        regras 5.5e: classes, perícias, ações, talentos, equipamento,
               feitiços e tabelas de progressão
  lib/         cálculos (modificadores, CA, CD), dados, armazenamento e backup
  hooks/       estado de fichas, campanha, bestiário, batalha, mapa e rolagens
  components/  layout e componentes reutilizáveis
  pages/       telas (fichas, ficha, feitiços, bestiário, batalhas, mapa,
               campanha, dados)
```

Notas de arquitetura:

- **Armazenamento** (`src/lib/store.ts`): tudo no IndexedDB, com API síncrona
  (o cache é carregado antes de renderizar) e migração automática do
  localStorage antigo.
- **Cada tela é um arquivo à parte** (`src/pages/rotas.ts`), buscado só quando
  alguém abre aquela aba — quem entra pelo link para ver a própria ficha não
  baixa o bestiário nem o mapa tático. O menu adianta a tela no passar do mouse,
  então a troca de aba continua instantânea. Entrada: ~93 KB comprimidos.
- **pdf.js é carregado sob demanda**, só quando você importa um PDF.
- **PWA**: dá para instalar no celular e usar offline (`public/sw.js`).

## 🗺️ Próximos passos

- [`docs/MELHORIAS.md`](docs/MELHORIAS.md) — o que falta no app, de onde vem cada
  ideia (RPGs, JRPGs, roguelites e cardgames) e quanto custa.
- [`docs/SINCRONIZACAO.md`](docs/SINCRONIZACAO.md) — como o estado da mesa chega
  ao celular de cada jogador.

## ⚖️ Conteúdo

Os textos de regras aqui são **resumos e explicações próprias**, não cópias dos
livros. Para expandir o catálogo com segurança, use o material do
**SRD 5.2**, publicado sob licença Creative Commons pela Wizards of the Coast.

# 🐉 Grimório 5.5e

App para **DMs e jogadores de D&D 5.5e** (regras de 2024), pensado para ser
**amigável a iniciantes**. Reúne, aos poucos, o melhor de ferramentas como
D&D Beyond e Owlbear em um só lugar.

Referência de layout da ficha: [critical20.com.br](https://www.critical20.com.br/ficha/dnd55).

## ✨ O que já funciona (MVP)

- **Ficha de personagem completa** pelas regras de 5.5e:
  - Identidade: espécie, classe, subclasse, nível, antecedente, alinhamento.
  - **Atributos** com cálculo automático de modificadores.
  - **Salvaguardas** e **perícias** com proficiência e _expertise_ (bônus dobrado).
  - **Combate**: CA (automática ou manual), iniciativa, deslocamento, PV, dados de vida.
  - **Ataques & ações** e **magias** (com CD e bônus de ataque calculados).
  - **Dicas em cada campo** (os `?`) explicando os termos para quem está começando.
- **Salvamento automático** no navegador (nada é enviado a servidores).
- **Exportar / Importar** ficha em `.json` — o jeito do jogador enviar a ficha ao DM.
- **Catálogo de Feitiços** com explicações diretas ("o que faz na prática").

## 🗺️ Roadmap (navegação já pronta)

- **Bestiário**: fichas e fotos de inimigos para o DM.
- **Mapa / Mesa Virtual**: mapa com tokens, grade e névoa de guerra (estilo Owlbear).
- **Campanha & Painel do DM**: resumo da história, NPCs e visão das fichas do grupo.

## 🚀 Como rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # pré-visualiza o build
```

## 🧱 Tecnologia

Vite · React · TypeScript · Tailwind CSS · React Router.

Estrutura:

```
src/
  data/        regras 5.5e (classes, espécies, perícias) e catálogo de feitiços
  lib/         cálculos (modificadores, CA, CD), persistência e export/import
  hooks/       estado das fichas
  components/  layout e componentes de UI reutilizáveis
  pages/       telas (fichas, ficha, feitiços, bestiário, mapa, campanha)
```

O modelo de dados (`src/types.ts`) foi desenhado para, no futuro, plugar um
backend com contas e sincronização em tempo real sem reescrever a ficha.

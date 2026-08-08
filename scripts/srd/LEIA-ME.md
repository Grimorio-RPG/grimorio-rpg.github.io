# Ler o SRD 5.2.1

O SRD 5.2.1 é distribuído pela Wizards sob **Creative Commons Attribution
4.0**, então o texto real dos itens pode ser usado — desde que a atribuição
apareça no app. É melhor do que resumo escrito de memória: em item mágico o
detalhe é tudo (quantas cargas, se recarrega ao amanhecer, se a CD é 15 ou 17),
e é exatamente onde a memória erra.

## O arquivo

Não está no repositório: são 6 MB que não mudam nunca. Baixe de
<https://www.dndbeyond.com/srd> e aponte o caminho no `srd.mjs`.

## Uso

```bash
cd scripts/srd
npm i --no-save pdfjs-dist@4        # ferramenta, não dependência do app

node srd.mjs 209 253 itens.txt      # extrai a seção "Magic Items A–Z"
node gerar.mjs itens.txt itens.json # vira dado e escreve src/data/srd/itens-srd.ts

npm i --no-save pdfjs-dist@^3.11.174   # devolve a versão que o app usa
```

> **Cuidado.** `scripts/srd` não tem `package.json` próprio, então o npm sobe
> até o do app e instala **lá**. Um `npm i pdfjs-dist@4` troca a versão 3 que o
> `ddbImport.ts` importa, e a importação do D&D Beyond para de compilar sem que
> nada aqui reclame. Por isso o `--no-save` e a linha que devolve a versão.

## O que custou descobrir

- **O SRD é em duas colunas.** Agrupar os pedaços do PDF só pela altura mistura
  as duas: a linha da esquerda emenda na da direita e o texto fica ilegível. A
  separação tem de ser por posição horizontal, lendo uma coluna inteira antes
  da outra.

- **A raridade quebra de linha** quando o tipo é longo: `Armor (Any Medium or
  Heavy, Except Hide Armor),` numa linha e `Uncommon` na seguinte. Sem juntar
  as duas, 40 itens saíam sem raridade — e raridade é o preço.

- **`common` está dentro de `uncommon`**, e `rare` dentro de `very rare`. Um
  item Incomum saía também como Comum, e o preço caía de 400 para 100 PO.

- **`\b` num template literal do JS é backspace**, não fronteira de palavra. A
  tentativa de resolver o item acima com regex fez TODOS os 196 itens saírem
  sem raridade. O `raridade.mjs` não usa regex por isso.

## Preço

O SRD não dá preço item a item; dá por raridade, e é o bastante para uma loja:

| Raridade | Valor |
|---|---|
| Comum | 100 PO |
| Incomum | 400 PO |
| Raro | 4.000 PO |
| Muito raro | 40.000 PO |
| Lendário | 200.000 PO |

Item que é armadura ou arma vale isso **mais** o preço do item base — uma
Armadura de Placas +1 Rara vale 4.000 + 1.500.

## O que só apareceu quando o parser foi consertado

A primeira versão entregava 196 itens e 32 sem raridade. Depois de corrigir o
que está abaixo, são **253 itens e 3 sem raridade** — ou seja, 57 itens estavam
sendo silenciosamente engolidos, e ninguém tinha como perceber.

- **O nome do item pode começar com uma categoria.** "Ammunition, +1, +2, or +3"
  era descartado porque começa com "Ammunition", e a munição inteira ia parar
  dentro do texto da Adamantine Armor. Cabeçalho de verdade tem parêntese,
  raridade, ou termina em vírgula; nome não tem nada disso.
- **O nome quebra em duas linhas** quando é longo: "Amulet of Proof against
  Detection" / "and Location". Olhando só a linha de cima, o item sumia.
- **O cabeçalho quebra dentro do parêntese**: "Legendary (Requires" /
  "Attunement)". Sobrava "Attunement)" no começo do texto e a sintonia não era
  detectada.
- **A quebra cai no meio do nome da raridade**: "…, Rare (+1), Very" /
  "Rare (+2), or Legendary (+3)".
- **Falsos começos**: "This concoction looks, smells, and tastes like a" chegou
  a ser um item mágico. Nome do SRD é Título Assim — uma palavra minúscula que
  não seja conectivo denuncia que é frase.
- **Linha de tabela virando nome**: "PotionStr.Rarity Potion of Giant
  Strength(hill)21Uncommon". Dígito colado em letra denuncia. Só parêntese não
  denuncia nada: "Stone of Good Luck (Luckstone)" é nome de verdade.

## O que ainda não sai limpo

- **Tabelas.** São duas colunas dentro de duas colunas, e às vezes uma coluna
  reaparece no meio do item seguinte. Não dá para consertar lendo o PDF, então
  o texto é cortado onde a tabela começa e o item fica com `tabelaOmitida`.
  Acontece com 22 itens.
- **Três itens sem raridade** — Belt of Giant Strength, Dragon Orb e Ioun Stone:
  a raridade está dentro da tabela de variantes. Precisam de leitura à mão.
- **Potion of Giant Strength não existe como item**: o verbete inteiro dela é
  uma tabela.

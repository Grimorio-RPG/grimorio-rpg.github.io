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
npm i pdfjs-dist@4          # fora do package.json do app, é ferramenta

node srd.mjs 209 253 itens.txt      # extrai a seção "Magic Items A–Z"
node gerar.mjs itens.txt itens.json # vira dado estruturado
```

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

## O que ainda não sai limpo

Dos 196 extraídos, 32 ficam sem raridade. Dois motivos:

- **Itens com variantes em tabela** — Belt of Giant Strength, Figurine of
  Wondrous Power, Dragon Orb. A raridade está numa tabela dentro do verbete,
  não na linha de cabeçalho. Precisam de leitura à mão.
- **Falsos começos**: um parágrafo que começa com maiúscula logo antes de uma
  linha de tipo vira "item". Dá para reconhecer pelo nome ter mais de 60
  caracteres ou terminar em ponto.

# Plano de melhorias

Levantado lendo o código, não imaginando. Cada item diz **o que falta hoje** (com
o lugar onde dá para conferir), **de onde vem a ideia** entre os benchmarks que
escolhemos — RPGs, JRPGs, roguelites e cardgames — e **o que custa**.

A ordem é uma recomendação, não uma fila fechada.

---

## Onde estamos

O que já está de pé: fichas com regras de classe/subclasse/espécie, importação
do D&D Beyond, rolador com bandeja e feed para a mesa, bestiário com ranks e
fases de chefe, batalhas com iniciativa/PV/condições/XP, mapa tático, mapa de
mundo, codex, diário de sessão, sincronização ao vivo entre aparelhos e visão
censurada para os jogadores.

O que este plano ataca é outra coisa: **o combate ainda é uma planilha bonita.**
Ele guarda estado, mas não conta história nem lembra o que aconteceu.

---

## Nível 1 — o que o combate está pedindo ✅ FEITO

> Os três itens abaixo estão no ar. O texto de cada um foi mantido como estava
> quando descrevia o problema — é o registro do que faltava, e vale mais assim
> do que reescrito no passado.
>
> O que mudou: as ações de monstro têm tipo (ação, bônus, reação, lendária,
> covil) e o leitor de bloco colado não descarta mais nenhuma seção; as
> lendárias aparecem durante o turno dos OUTROS, que é quando a regra as gasta,
> com o orçamento recarregando na vez do chefe; as ações de covil avisam sozinhas
> na iniciativa 20; o combate tem registro, censurado antes de ir para o grupo; e
> as condições têm prazo que cai sozinho, com a concentração pedindo a
> salvaguarda com a CD já calculada.
>
> Falta o que só a mesa responde: **jogar uma sessão com isso ligado.**

### 1. Registro de combate

**Hoje não existe.** Procurei em [battle.ts](../src/lib/battle.ts) e
[BattlePage.tsx](../src/pages/BattlePage.tsx): a batalha guarda um retrato do
agora — quem está vivo, de quem é a vez — e nada do que passou. Quando alguém
pergunta "quanto de dano foi aquilo?", a resposta não está em lugar nenhum.

**Benchmark:** o log lateral de *Slay the Spire* e *Darkest Dungeon*; o histórico
de turno dos JRPGs de time (*Persona*, *Octopath*).

**O que seria:** uma faixa rolável na tela de batalha — "Rodada 2 · Thorn acertou
Goblin 3 (18 vs CA 15) · 8 cortante · Goblin 3 caiu". Alimentada pelas rolagens
que já passam por `rolarComModo` e pelas mudanças de PV que a tela já faz.

**Por que vale mais do que parece:** três coisas saem de graça depois disso — o
resumo de sessão deixa de ser digitado à mão, os "destaques" da tela de vitória
(item 4) têm de onde sair, e um "desfazer" do último golpe fica possível, que
hoje é o erro mais caro de corrigir no meio da luta.

**Custo:** médio. Um tipo `EventoDeCombate` + persistência na batalha + a faixa.
O risco é de volume: o log precisa entrar na projeção censurada, senão vira o
caminho mais fácil para o grupo ler o PV exato de um inimigo.

### 2. Condições com duração, e concentração

**Hoje** condição é texto solto: `condicoes: string[]` em
[types.ts:401](../src/types.ts). Não tem quantos turnos faltam, nem quem causou,
nem salvaguarda para escapar. Concentração aparece como propriedade de magia em
[spells.ts](../src/data/spells.ts) e some no combate — a mesa toda esquece que o
mago está concentrado até alguém lembrar meia hora depois.

**Benchmark:** os ícones de status com contador dos JRPGs; os "buffs com
stacks" dos cardgames, onde o número no ícone é a informação inteira.

**O que seria:** condição vira objeto — nome, rodadas restantes, origem, e a
salvaguarda para escapar quando houver. O contador cai sozinho na virada de
turno e avisa quando zera. Concentração ganha lugar próprio: qual magia, e um
aviso automático de teste quando o conjurador toma dano (com a CD já calculada:
10 ou metade do dano, o que for maior).

**Custo:** médio, e é a mudança mais chata de migrar — `string[]` vira objeto,
com as batalhas salvas de hoje precisando continuar abrindo.

### 3. Ações lendárias, reações e ações de covil

**Hoje o modelo não tem.** `MonsterAction` em [types.ts:358](../src/types.ts) é
só nome + descrição, sem tipo. Pior: o leitor de stat block colado **descarta**
essa parte — [statblock.ts:90](../src/lib/statblock.ts) para de ler ao encontrar
"LENDÁRIAS", "REAÇÃO" ou "AÇÃO BÔNUS", e nada mais lê essas seções depois. Quem
cola um chefe do livro perde justamente o que faz dele um chefe.

**Benchmark:** os chefes de *Hades* e *Darkest Dungeon*, onde a ameaça não é o
tamanho da barra de vida e sim o fato de o chefe agir fora do turno dele.

**O que seria:** `MonsterAction` ganha `tipo` (ação, bônus, reação, lendária,
covil) e um contador de ações lendárias que recarrega no início do turno do
chefe. O painel do inimigo da vez — que acabamos de construir — mostra quantas
restam. Ações de covil entram na iniciativa 20 automaticamente.

**Custo:** baixo-médio. É o item com melhor relação valor/esforço da lista, e
casa direto com as fases de chefe que você já usa no Belak.

---

## Nível 2 — o momento da recompensa ✅ FEITO

> No ar. Cada criatura tem tesouro opcional em notação de dado, com chance por
> item; cada criatura derrubada rola o próprio, e o saque aparece virado na tela
> de vitória, com a divisão pelo grupo e a sobra visível. Os destaques vêm do
> registro de combate.
>
> O que **não** foi feito de propósito: o app não escreve no inventário de
> ninguém. A ficha é do jogador, e mexer nela sem ele ver seria pior do que não
> mexer — a tela pede para anotar.

### 4. Tela de vitória de verdade

**Hoje** encerrar a batalha abre um modal de XP
([BattlePage.tsx:246](../src/pages/BattlePage.tsx)). Funciona, e é seco.

**Benchmark:** a tela de fim de run de *Slay the Spire* e *Hades* — o momento em
que o jogo para e diz o que você conquistou. É o instante de maior atenção da
mesa inteira.

**O que seria:** XP com a barra de cada personagem enchendo, quem subiu de nível
com destaque, tesouro sorteado (item 5), e os destaques que vêm do registro de
combate: maior dano, o teste de morte que quase deu errado, o golpe que derrubou
o chefe.

**Custo:** baixo depois do item 1. Sem o registro, os destaques não existem.

### 5. Tesouro

**Hoje não existe** — nem no `Monster`, nem em lugar nenhum. O DM distribui
moeda por fora.

**Benchmark:** as tabelas de loot dos roguelites; a carta virada dos cardgames.

**O que seria:** cada criatura com um tesouro opcional (moedas em notação de
dado, itens, chance), sorteado no fim da batalha e enviável direto para o
inventário de quem pegou. Um "revelar" com carta virada para o grupo.

**Custo:** médio. Depende de decidir se as tabelas do livro entram ou se é tudo
livre — recomendo livre, pelo mesmo motivo do resto do app.

---

## Nível 3 — a mesa como espetáculo ✅ FEITO

> No ar. Boss e BBEG levantam uma barra dedicada no topo da tela do grupo, pelo
> rank **aparente** — é o que sustenta o plot twist. O número de fases continua
> sem existir do lado do jogador. A inspiração heroica ganhou botão de conceder
> no combate, e o valor volta para a ficha do dono.

### 6. Barra de chefe para o grupo

**Hoje** as fases de chefe funcionam e a transformação acontece, mas o grupo vê
a mesma barrinha de sempre.

**Benchmark:** a barra de chefe dos souls-like — nome, título, e os segmentos
que mostram que ainda tem mais por vir. Só que aqui o segmento **não** pode
aparecer antes da hora: as fases são surpresa, e isso já está decidido.

**O que seria:** quando um combatente de rank Boss/BBEG entra, a tela dos
jogadores ganha uma barra dedicada no topo, com o nome (ou "???") e a arte
pública. Ao virar de fase, a barra quebra e remonta.

**Custo:** baixo. É quase todo CSS, e a projeção censurada já existe. Cuidado
único: o número de fases nunca pode viajar para o aparelho do jogador — o
`verificar-projecoes.mjs` precisa de uma checagem nova para isso.

### 7. Inspiração heroica como moeda

**Hoje** é um `boolean` que vira um selo no card
([ficha-card.tsx:247](../src/components/ficha-card.tsx)). O DM não tem como
conceder de onde ele está.

**Benchmark:** a economia de ficha/token dos cardgames — o recurso é visível,
tem animação ao ganhar e ao gastar, e por isso as pessoas lembram de usá-lo.

**O que seria:** botão de conceder na tela do DM, com o token aparecendo na tela
do jogador na hora; gastar rola com vantagem direto da bandeja de dados.

**Custo:** baixo.

---

## Nível 4 — o DM improvisando ✅ FEITO

> No ar. As tabelas sorteáveis vivem na aba Tabelas da Campanha, com peso por
> entrada, sorteio que evita repetir o que acabou de sair e contexto casado de
> forma frouxa com o lugar. A linha do tempo é a aba nova da Campanha, montada
> na hora a partir do que já estava salvo — sessões, chefes derrubados, lugares
> revelados, crônica de estrada e recados.

### 8. Baralho de encontros e tabelas

**Benchmark:** o baralho dos cardgames e os eventos de sala dos roguelites.

Tabelas próprias, sorteáveis: encontros aleatórios por região, nomes de NPC,
rumores de taverna, complicações. O mapa de mundo já sabe onde o grupo está —
sortear "por região" é a versão que vale a pena.

**Custo:** baixo por tabela, e cresce sozinho com o uso.

### 9. Linha do tempo da campanha

**Benchmark:** o histórico de runs dos roguelites; a crônica dos JRPGs longos.

Sessões, mortes, subidas de nível, chefes derrubados, marcos do mapa — numa
linha só. O diário de sessão e o codex já guardam metade disso solto.

**Custo:** médio, quase todo de interface.

---

## Nível 5 — infraestrutura (invisível, mas destrava o resto)

### 10. Imagens fora do JSON

**Hoje** cada imagem é uma data URL dentro do JSON que sincroniza. Já ficou
bem melhor (WebP, redimensionamento, e paramos de reenviar o que não mudou), mas
o teto continua: mudar o nome de um monstro reenvia a foto dele junto.

**O que seria:** as imagens vão para o Supabase Storage e o JSON guarda só o
link. O bucket precisa de RLS espelhando a regra de projeção — e é exatamente aí
que mora o risco, porque um link vazado não obedece a RLS de tabela.

**Custo:** alto, e é o único item que exige SQL novo da sua parte. Só vale
quando o bestiário crescer a ponto de doer.

### 11. pdf.js moderno

O `ddbImport` pesa 1,5 MB por causa do build *legacy* do pdf.js — escolhido de
propósito, para rodar sob a CSP da versão publicada sem worker em blob. Como ele
só carrega quando você importa um PDF, o custo é pequeno. Trocar pelo build
moderno cortaria bastante, mas mexe justamente na parte que foi difícil de fazer
funcionar. **Recomendo não mexer** enquanto a importação estiver funcionando.

---

## Segunda leva

Os níveis 1 a 4 saíram, e com eles saiu também o que não estava no plano: a
fusão do mapa com a batalha, o desfazer, os mapas prontos e o corte de peso.
O que segue foi levantado depois disso, olhando o app rodando.

### A. O jogador só assiste

**Hoje** a tela de batalha de quem joga é, no próprio comentário do código,
"espelho, só leitura". O DM digita o PV de cinco pessoas, marca as condições de
cinco pessoas e rola a iniciativa de cinco pessoas.

Numa mesa de verdade isso faz do DM um digitador — e é a origem da divergência
que passamos o dia consertando: quanto mais coisa passa por um só teclado, mais
chance de o número na tela e o número na ficha se separarem.

**O que seria:** o jogador aplica dano e cura no próprio combatente, marca as
próprias condições e rola a própria iniciativa direto na fila do DM.

**O que já está pronto para isso:** a ficha já é dele (`dono_id = auth.uid()`),
o DM já escreve na ficha compartilhada, e o feed de rolagens já vai e volta. O
encanamento existe.

**O risco real:** dois teclados no mesmo PV. Precisa de uma regra de quem vence
— provavelmente o mais recente, como no resto do app.

**Custo:** médio. É o item de maior impacto na mesa.

### B. Uma cena e uma batalha só

`CHAVES.mapa` e `CHAVES.batalha` são chaves únicas: o app guarda **uma** cena e
**uma** batalha. Preparar uma masmorra de quatro salas significa subir o mapa de
novo e remontar o encontro a cada porta — no meio da sessão, com a mesa
esperando.

Isso sempre foi assim, mas passou a doer agora: o mapa virou a tela do combate,
então trocar de sala é trocar a tela inteira.

**O que seria:** cenas com nome e encontros salvos, com um seletor. Preparar
antes, escolher na hora.

**Custo:** médio, e mexe na sincronização — cada cena precisa da própria chave,
ou de uma lista.

### C. Reações e ações bônus dos personagens

As ações de monstro ganharam tipo hoje. A ficha não: `Attack` continua sendo
nome, bônus e dano. O personagem tem reação e ação bônus como qualquer criatura,
e a ficha não sabe disso.

**Custo:** baixo-médio, e reaproveita o que já foi feito no bestiário.

### D. Decisões paradas

Três coisas foram decididas por mim, sozinho, e continuam sem confirmação:

- o prazo de condição de um inimigo **aparece** para o grupo;
- o nome da magia que um inimigo concentra **não** aparece;
- o contador de ações lendárias **não** aparece.

E duas perguntas sem resposta: semear tabelas de fábrica (nomes de NPC,
rumores), e se o painel do inimigo da vez deveria sobrepor o mapa em vez de
ficar na coluna.

---

## O que vem agora

Do plano original sobra só o item 10 (imagens no Supabase Storage), que **exige
SQL seu** e só vale quando o bestiário crescer a ponto de doer; o item 11
continua com a recomendação de não mexer.

Da segunda leva, a ordem que eu seguiria é **A → B → C**: o jogador agir sozinho
muda a mesa; várias cenas tiram o atrito da preparação; e as ações da ficha são
acabamento.

Nada disso vale mais do que **rodar uma sessão de verdade com o grupo**. As
correções que mais importaram até aqui — a CA do Thorn, as manobras do
Guilherme, o Belak diferente entre os aparelhos — vieram todas de gente jogando,
nenhuma de mim lendo o código.

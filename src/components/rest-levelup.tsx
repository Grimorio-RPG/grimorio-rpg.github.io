import { useEffect, useMemo, useState } from 'react'
import type { Character, SpellRef } from '../types'
import { rotuloClasse } from '../data/rules'
import { espacosPorNivel, marcosDoNivel, mediaDoDado, temEspacos } from '../data/progression'
import { abilityMod, classInfo, proficiencyBonus } from '../lib/calc'
import { tracosGanhosNoNivel } from '../lib/features'
import { registrarGanho, reverterNivel } from '../lib/levelup'
import { ganhoDoNivel, listaFixa, quotaDoNivel, usaGrimorio } from '../lib/conjuracao'
import { EscolherMagias } from './magias-ui'
import { uid } from '../lib/character'
import { ABILITIES } from '../data/rules'
import { TALENTOS } from '../data/feats'
import type { AbilityKey } from '../types'
import { EscolhaDeSubclasse } from './subclasse-ui'
import { rolar } from '../lib/dice'
import { addRoll } from '../lib/rollLog'
import { Modal } from './layout-ui'

type Update = (patch: Partial<Character>) => void

/** Faces do dado de vida da classe (cai para o texto da ficha se preciso). */
function facesDoDado(char: Character): number {
  const info = classInfo(char.classe)
  if (info) return info.dadoDeVida
  const m = char.dadosDeVida.match(/d(\d+)/i)
  return m ? parseInt(m[1], 10) : 8
}

// ---------------------------------------------------------------------------
// Painel de descanso
// ---------------------------------------------------------------------------
export function RestPanel({ char, update }: { char: Character; update: Update }) {
  const faces = facesDoDado(char)
  const total = char.nivel
  const disponiveis = Math.max(0, total - (char.dadosDeVidaUsados ?? 0))
  const conMod = abilityMod(char.atributos.con)
  const [qtd, setQtd] = useState(1)
  const [ultimo, setUltimo] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [amanheceu, setAmanheceu] = useState<{
    pvRecuperado: number
    dadosDevolvidos: number
    espacosDevolvidos: number
    exaustaoReduzida: number
  } | null>(null)

  const podeDescansar = disponiveis > 0 && char.pvAtual < char.pvMax

  function descansoCurto() {
    const usar = Math.min(qtd, disponiveis)
    if (usar <= 0) return
    const r = rolar(usar, faces, conMod * usar, `Descanso curto (${usar}d${faces})`)
    addRoll(r)
    const curado = Math.max(usar, r.total) // nunca menos de 1 PV por dado
    const novo = Math.min(char.pvMax, char.pvAtual + curado)
    update({
      pvAtual: novo,
      dadosDeVidaUsados: (char.dadosDeVidaUsados ?? 0) + usar,
    })
    setUltimo(`Recuperou ${novo - char.pvAtual} PV (${r.dados.join(' + ')} + ${conMod * usar}).`)
  }

  /**
   * Descanso longo.
   *
   * Abre a confirmação em tela própria, e não num `confirm()` do navegador: é o
   * momento em que a mesa fecha o dia, e virava um diálogo de sistema. Depois
   * de confirmar, mostra o amanhecer com o que voltou — pousada de JRPG, onde a
   * recuperação é vista e não deduzida.
   */
  function descansoLongo() {
    const recupera = Math.max(1, Math.floor(total / 2))
    const antes = {
      pv: char.pvAtual,
      dados: disponiveis,
      espacos: char.espacosMagia.reduce((t, s) => t + s.usados, 0),
      exaustao: char.exaustao,
    }
    update({
      pvAtual: char.pvMax,
      pvTemporario: 0,
      testesMorte: { sucessos: 0, falhas: 0 },
      exaustao: Math.max(0, char.exaustao - 1),
      espacosMagia: char.espacosMagia.map((s) => ({ ...s, usados: 0 })),
      dadosDeVidaUsados: Math.max(0, (char.dadosDeVidaUsados ?? 0) - recupera),
    })
    setConfirmando(false)
    setAmanheceu({
      pvRecuperado: char.pvMax - antes.pv,
      dadosDevolvidos: Math.min(recupera, total - antes.dados),
      espacosDevolvidos: antes.espacos,
      exaustaoReduzida: antes.exaustao > 0 ? 1 : 0,
    })
    setUltimo('Descanso longo concluído: vida cheia e recursos recarregados.')
  }

  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="panel-title">Descanso</h3>
        <span className="text-xs text-parchment-200/60">
          Dados de vida: <b className="text-parchment-100">{disponiveis}/{total}</b> d{faces}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Curto */}
        <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
          <p className="text-sm font-medium text-parchment-50">☕ Descanso curto</p>
          <p className="mt-0.5 text-xs text-parchment-200/60">
            1 hora. Gaste dados de vida para curar: cada dado rola d{faces} + {conMod >= 0 ? `+${conMod}` : conMod} (CON).
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={Math.max(1, disponiveis)}
              value={qtd}
              onChange={(e) => setQtd(Math.max(1, Math.min(disponiveis || 1, parseInt(e.target.value, 10) || 1)))}
              className="w-16 rounded-md border border-white/10 bg-ink-800 px-2 py-1 text-center text-sm outline-none focus:border-arcane-400"
            />
            <button className="btn-primary flex-1 py-1.5 text-xs" disabled={!podeDescansar} onClick={descansoCurto}>
              🎲 Gastar dado(s)
            </button>
          </div>
          {disponiveis === 0 && <p className="mt-2 text-xs text-dragon-400">Sem dados de vida — só um descanso longo devolve.</p>}
        </div>

        {/* Longo */}
        <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
          <p className="text-sm font-medium text-parchment-50">🌙 Descanso longo</p>
          <p className="mt-0.5 text-xs text-parchment-200/60">
            8 horas. Vida cheia, espaços de magia e testes de morte zerados, metade dos dados de vida de volta e −1 exaustão.
          </p>
          <button className="btn-ghost mt-2 w-full py-1.5 text-xs" onClick={() => setConfirmando(true)}>Fazer descanso longo</button>
        </div>
      </div>

      {ultimo && <p className="mt-3 text-xs text-emerald-400">{ultimo}</p>}

      {confirmando && (
        <Modal titulo="🌙 Fechar o dia" onClose={() => setConfirmando(false)}>
          <p className="text-sm text-parchment-200/80">
            Oito horas de descanso. Ao acordar, {char.nome || 'seu personagem'} recupera:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-parchment-100">
            <li>❤️ Vida cheia — {char.pvAtual} → <b>{char.pvMax}</b></li>
            <li>🎲 Metade dos dados de vida ({Math.max(1, Math.floor(total / 2))} de {total})</li>
            {temEspacos(char.classe) && <li>✨ Todos os espaços de magia</li>}
            <li>💀 Testes de morte zerados</li>
            {char.exaustao > 0 && <li>😮‍💨 Um nível de exaustão ({char.exaustao} → {char.exaustao - 1})</li>}
          </ul>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmando(false)}>Ainda não</button>
            <button className="btn-primary" onClick={descansoLongo}>🌙 Dormir</button>
          </div>
        </Modal>
      )}

      {amanheceu && <Amanhecer dados={amanheceu} onFim={() => setAmanheceu(null)} />}
    </section>
  )
}

/**
 * O amanhecer.
 *
 * A pousada de JRPG não informa a recuperação, ela mostra: a tela escurece, o
 * sol nasce, e o grupo está de pé. Aqui o mesmo — some sozinho, porque o
 * momento é a recompensa e não uma caixa para fechar.
 */
function Amanhecer({
  dados,
  onFim,
}: {
  dados: { pvRecuperado: number; dadosDevolvidos: number; espacosDevolvidos: number; exaustaoReduzida: number }
  onFim: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onFim, 2600)
    return () => clearTimeout(t)
  }, [onFim])

  const ganhos = [
    dados.pvRecuperado > 0 && `+${dados.pvRecuperado} PV`,
    dados.espacosDevolvidos > 0 && `${dados.espacosDevolvidos} espaço(s) de magia`,
    dados.dadosDevolvidos > 0 && `${dados.dadosDevolvidos} dado(s) de vida`,
    dados.exaustaoReduzida > 0 && '−1 exaustão',
  ].filter(Boolean) as string[]

  return (
    <div
      className="gv-amanhecer fixed inset-0 z-50 grid place-items-center bg-gradient-to-b from-ink-900 via-amber-950/40 to-amber-900/30"
      onClick={onFim}
      role="presentation"
    >
      <div className="gv-sol text-center">
        <div className="mx-auto mb-3 h-20 w-20 rounded-full bg-amber-300 shadow-[0_0_80px_30px_rgba(251,191,36,0.55)]" />
        <p className="font-display text-4xl text-amber-100 drop-shadow sm:text-5xl">Amanheceu</p>
        {ganhos.length > 0 ? (
          <p className="mt-2 text-sm text-amber-100/90">{ganhos.join(' · ')}</p>
        ) : (
          <p className="mt-2 text-sm text-amber-100/70">O grupo já estava inteiro.</p>
        )}
      </div>
    </div>
  )
}

/**
 * As magias que este nível traz.
 *
 * Três coisas diferentes cabem aqui, e a classe decide quais:
 *
 * - TRUQUES: quase toda classe ganha mais em certos níveis, e eles ficam para
 *   sempre.
 * - GRIMÓRIO: só o Mago. Duas magias novas no livro a cada nível.
 * - LISTA: Bardo, Feiticeiro e Bruxo escolhem uma lista que só muda ao subir
 *   de nível. Clérigo, Druida, Paladino, Patrulheiro e Mago trocam as
 *   preparadas no descanso longo — para esses, pedir aqui seria cobrar uma
 *   decisão que a pessoa refaz de manhã.
 */
function MagiasDoNivel({
  char,
  nivel,
  ganho,
  escolhidas,
  onMudar,
}: {
  char: Character
  nivel: number
  ganho: NonNullable<ReturnType<typeof ganhoDoNivel>>
  escolhidas: SpellRef[]
  onMudar: (m: SpellRef[]) => void
}) {
  const [aba, setAba] = useState<0 | 1>(ganho.truques > 0 ? 0 : 1)
  const quota = quotaDoNivel(char.classe, nivel)
  const livro = usaGrimorio(char.classe)
  const fixa = listaFixa(char.classe)

  // Quantas magias de círculo este nível pede: o livro do Mago, ou a lista de
  // quem só troca ao subir. Quem prepara no descanso longo não pede nenhuma.
  const pedeDeCirculo = livro ? ganho.grimorio : fixa ? ganho.preparadas : 0

  const jaTem = new Set(
    [...char.magias, ...escolhidas].map((m) => m.nome.toLowerCase()),
  )
  const postos = (n: number) => escolhidas.filter((m) => (n === 0 ? m.nivel === 0 : m.nivel > 0)).length
  const faltamTruques = Math.max(0, ganho.truques - postos(0))
  const faltamMagias = Math.max(0, pedeDeCirculo - postos(1))

  return (
    <div className="rounded-xl border border-arcane-400/40 bg-arcane-500/10 p-3">
      <h4 className="mb-1 panel-title">Magias novas</h4>
      <p className="mb-2.5 text-xs text-parchment-200/70">
        {[
          ganho.truques > 0 && `${ganho.truques} truque(s)`,
          pedeDeCirculo > 0 && `${pedeDeCirculo} ${livro ? 'para o grimório' : 'para a sua lista'}`,
        ]
          .filter(Boolean)
          .join(' e ')}
        {ganho.circuloNovo > 0 && ` · abre o ${ganho.circuloNovo}º círculo`}
        {!livro && !fixa && ganho.preparadas > 0 &&
          ` · você pode preparar ${ganho.preparadas} a mais, e escolhe quais no descanso longo`}
      </p>

      {escolhidas.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {escolhidas.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="chip border-emerald-400/40 text-emerald-300 hover:border-dragon-400/60 hover:text-dragon-300"
                title="Tirar da escolha"
                onClick={() => onMudar(escolhidas.filter((x) => x.id !== m.id))}
              >
                {m.nome} ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {ganho.truques > 0 && pedeDeCirculo > 0 && (
        <div className="mb-2 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {([0, 1] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAba(a)}
              className={`flex-1 rounded px-2 py-1 text-xs transition ${
                aba === a ? 'bg-arcane-500/25 text-parchment-50' : 'text-parchment-200/70'
              }`}
            >
              {a === 0 ? `Truques (${faltamTruques})` : `${livro ? 'Grimório' : 'Lista'} (${faltamMagias})`}
            </button>
          ))}
        </div>
      )}

      {/* Quem só ganhou espaço para preparar mais não escolhe nada aqui: a
          escolha dele é no descanso longo, e a linha acima já diz isso. */}
      {(ganho.truques > 0 || pedeDeCirculo > 0) && (
        <EscolherMagias
          classe={char.classe}
          circulo={aba}
          maiorCirculo={quota?.maiorCirculo ?? 1}
          jaTem={jaTem}
          faltam={aba === 0 ? faltamTruques : faltamMagias}
          altura="max-h-52"
          onEscolher={(m) =>
            onMudar([
              ...escolhidas,
              // No grimório a magia entra desmarcada: preparar é outra decisão,
              // e é a da manhã seguinte. Em quem tem lista fixa, entrar na lista
              // É estar preparada.
              { id: uid(), nome: m.nomePt, nivel: m.nivel, preparada: m.nivel > 0 && !livro },
            ])
          }
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assistente de subida de nível
// ---------------------------------------------------------------------------
export function LevelUpModal({
  char,
  update,
  onClose,
}: {
  char: Character
  update: Update
  onClose: () => void
}) {
  const novoNivel = Math.min(20, char.nivel + 1)
  const faces = facesDoDado(char)
  const conMod = abilityMod(char.atributos.con)
  const media = mediaDoDado(faces)

  const [metodo, setMetodo] = useState<'media' | 'rolar'>('media')
  const [rolado, setRolado] = useState<number | null>(null)
  const [subclasse, setSubclasse] = useState(char.subclasse)
  // Aumento de Atributo resolvido aqui dentro: anunciar sem oferecer é meio
  // caminho do defeito que o jogador reportou no estilo de luta.
  const [modoAsi, setModoAsi] = useState<'atributos' | 'talento'>('atributos')
  const [atrA, setAtrA] = useState<AbilityKey>('for')
  const [atrB, setAtrB] = useState<AbilityKey | ''>('')
  const [talento, setTalento] = useState('')
  // As magias que este nível traz. Ficam aqui até o "Subir": cancelar no meio
  // não pode deixar meia escolha gravada na ficha.
  const [novasMagias, setNovasMagias] = useState<SpellRef[]>([])

  const precisaSubclasse = novoNivel === 3 && !char.subclasse
  const marcos = useMemo(() => marcosDoNivel(char.classe, novoNivel), [char.classe, novoNivel])

  // A subclasse escolhida agora já conta: quem vira Mestre de Batalha aqui vê
  // as Manobras aparecerem na lista antes de confirmar.
  const tracosNovos = useMemo(
    () => tracosGanhosNoNivel({ ...char, subclasse: subclasse || char.subclasse }, novoNivel),
    [char, subclasse, novoNivel],
  )
  const temEscolha = tracosNovos.some((t) => t.efeito?.tipo === 'escolha')
  const temAsi = tracosNovos.some((t) => t.efeito?.tipo === 'escolha' && t.efeito.oque === 'talento')

  const ganhoBase = metodo === 'media' ? media : (rolado ?? 0)
  const ganhoPv = ganhoBase > 0 ? Math.max(1, ganhoBase + conMod) : 0

  // O ganho de magia deste nível. Separado do ganho de espaços porque são
  // coisas diferentes: o espaço é o combustível, a magia é o que se aprende —
  // e um mago podia ganhar quatro espaços novos sem aprender nada.
  const ganhoMagias = useMemo(
    () => ganhoDoNivel(char.classe, char.nivel, novoNivel),
    [char.classe, char.nivel, novoNivel],
  )

  const espacosNovos = useMemo(() => espacosPorNivel(char.classe, novoNivel), [char.classe, novoNivel])
  const espacosAntigos = useMemo(() => espacosPorNivel(char.classe, char.nivel), [char.classe, char.nivel])
  const mudouEspacos = temEspacos(char.classe) &&
    espacosNovos.some((s, i) => s.total !== espacosAntigos[i].total)

  function rolarPv() {
    const r = rolar(1, faces, 0, `PV do nível ${novoNivel}`)
    addRoll(r)
    setRolado(r.total)
  }

  /**
   * Descer de nível.
   *
   * Editar o campo "nível" na mão não desfazia nada: os PV ganhos e os espaços
   * de magia ficavam, e a ficha virava uma mistura de dois níveis. Aqui a
   * subida é revertida de verdade.
   *
   * Os PV são estimados pela média do dado, porque o valor rolado na subida não
   * é guardado — daí o aviso antes de confirmar.
   */
  function descerDeNivel() {
    const anterior = char.nivel - 1
    if (anterior < 1) return
    const { pvGanho: perda, exata, historico } = reverterNivel(char, faces, conMod)
    const explicacao = exata
      ? `Vou tirar exatamente os ${perda} PV que este nível deu.`
      : `Esta subida é anterior ao registro de histórico, então vou tirar ${perda} PV pela média ` +
        `do d${faces} mais CON — confira o máximo depois.`
    if (!confirm(`Descer para o nível ${anterior}?

${explicacao}`)) return
    const espacos = espacosPorNivel(char.classe, anterior).map((s, i) => ({
      total: s.total,
      usados: Math.min(char.espacosMagia[i]?.usados ?? 0, s.total),
    }))
    const novoMax = Math.max(1, char.pvMax - perda)
    update({
      nivel: anterior,
      pvMax: novoMax,
      pvAtual: Math.min(char.pvAtual, novoMax),
      dadosDeVida: `${anterior}d${faces}`,
      dadosDeVidaUsados: Math.min(char.dadosDeVidaUsados ?? 0, anterior),
      espacosMagia: temEspacos(char.classe) ? espacos : char.espacosMagia,
      historicoNiveis: historico,
    })
    onClose()
  }

  function confirmar() {
    if (ganhoPv <= 0) return
    // preserva os espaços já gastos, sem passar do novo total
    const espacos = espacosNovos.map((s, i) => ({
      total: s.total,
      usados: Math.min(char.espacosMagia[i]?.usados ?? 0, s.total),
    }))
    const patch: Partial<Character> = {
      nivel: novoNivel,
      pvMax: char.pvMax + ganhoPv,
      pvAtual: char.pvAtual + ganhoPv,
      dadosDeVida: `${novoNivel}d${faces}`,
      subclasse: subclasse || char.subclasse,
      espacosMagia: temEspacos(char.classe) ? espacos : char.espacosMagia,
      magias: novasMagias.length ? [...char.magias, ...novasMagias] : char.magias,
      // Guardar o que este nível deu é o que torna a descida exata depois.
      historicoNiveis: registrarGanho(char.historicoNiveis, {
        nivel: novoNivel,
        pvGanho: ganhoPv,
        rolado: metodo === 'rolar',
      }),
    }

    if (temAsi) {
      if (modoAsi === 'talento' && talento) {
        patch.talentos = [...char.talentos, talento]
      } else if (modoAsi === 'atributos') {
        const atributos = { ...char.atributos }
        // +2 num atributo, ou +1 em dois. Teto de 20, como manda a regra.
        if (atrB) {
          atributos[atrA] = Math.min(20, atributos[atrA] + 1)
          atributos[atrB] = Math.min(20, atributos[atrB] + 1)
        } else {
          atributos[atrA] = Math.min(20, atributos[atrA] + 2)
        }
        patch.atributos = atributos
      }
    }

    update(patch)
    onClose()
  }

  return (
    <Modal onClose={onClose} titulo={`Subir para o nível ${novoNivel}`} largura="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-parchment-200/70">
          <b className="text-parchment-50">{char.nome || 'Seu personagem'}</b> — {char.classe ? rotuloClasse(char.classe) : 'sem classe'}{' '}
          nível {char.nivel} → <b className="text-parchment-50">{novoNivel}</b>
        </p>

        {/* Pontos de vida */}
        <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
          <h4 className="mb-2 panel-title">Pontos de vida</h4>
          <div className="mb-2 flex gap-1 rounded-lg border border-white/10 bg-ink-900/60 p-1 text-xs">
            <button
              onClick={() => setMetodo('media')}
              className={`flex-1 rounded-md px-2 py-1.5 font-semibold transition ${metodo === 'media' ? 'bg-dragon-500 text-parchment-50' : 'text-parchment-200/70'}`}
            >
              Média ({media})
            </button>
            <button
              onClick={() => setMetodo('rolar')}
              className={`flex-1 rounded-md px-2 py-1.5 font-semibold transition ${metodo === 'rolar' ? 'bg-dragon-500 text-parchment-50' : 'text-parchment-200/70'}`}
            >
              Rolar d{faces}
            </button>
          </div>
          {metodo === 'rolar' && (
            <button className="btn-ghost mb-2 w-full py-1.5 text-xs" onClick={rolarPv}>
              🎲 {rolado == null ? `Rolar d${faces}` : `Rolou ${rolado} — rolar de novo`}
            </button>
          )}
          <p className="text-sm text-parchment-100">
            Ganho: <b className="text-emerald-400">+{ganhoPv} PV</b>{' '}
            <span className="text-xs text-parchment-200/50">
              ({ganhoBase || '?'} do dado {conMod >= 0 ? '+' : ''}{conMod} de CON)
            </span>
          </p>
          <p className="text-xs text-parchment-200/50">
            Novo máximo: {char.pvMax} → <b className="text-parchment-100">{char.pvMax + ganhoPv}</b>
          </p>
        </div>

        {/* Subclasse */}
        {precisaSubclasse && (
          <div className="rounded-xl border border-arcane-400/40 bg-arcane-500/10 p-3">
            <h4 className="mb-1 panel-title">Escolha sua subclasse</h4>
            <p className="mb-2.5 text-xs text-parchment-200/70">
              É a decisão mais pesada do personagem e vale a campanha inteira.
            </p>
            <EscolhaDeSubclasse
              classe={char.classe}
              valor={subclasse}
              onEscolher={setSubclasse}
              nivel={novoNivel}
            />
          </div>
        )}

        {/* Aumento de Atributo — resolvido aqui, não só anunciado */}
        {temAsi && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3">
            <h4 className="mb-1 panel-title">Aumento de Atributo</h4>
            <p className="mb-2.5 text-xs text-parchment-200/70">
              +2 num atributo, +1 em dois, ou um talento no lugar. O teto é 20.
            </p>

            <div className="mb-3 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              {(['atributos', 'talento'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModoAsi(m)}
                  className={`flex-1 rounded px-2 py-1 text-xs transition ${
                    modoAsi === m ? 'bg-arcane-500/25 text-parchment-50' : 'text-parchment-200/70'
                  }`}
                >
                  {m === 'atributos' ? 'Subir atributos' : 'Pegar um talento'}
                </button>
              ))}
            </div>

            {modoAsi === 'atributos' ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-parchment-200/70">
                  {atrB ? 'Primeiro (+1)' : 'Atributo (+2)'}
                  <select
                    className="stat-input mt-1 py-1.5 text-sm"
                    value={atrA}
                    onChange={(e) => setAtrA(e.target.value as AbilityKey)}
                  >
                    {ABILITIES.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.nome} ({char.atributos[a.key]} → {Math.min(20, char.atributos[a.key] + (atrB ? 1 : 2))})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-parchment-200/70">
                  Segundo (+1) — opcional
                  <select
                    className="stat-input mt-1 py-1.5 text-sm"
                    value={atrB}
                    onChange={(e) => setAtrB(e.target.value as AbilityKey | '')}
                  >
                    <option value="">Nenhum (dar +2 no primeiro)</option>
                    {ABILITIES.filter((a) => a.key !== atrA).map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.nome} ({char.atributos[a.key]} → {Math.min(20, char.atributos[a.key] + 1)})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <select
                className="stat-input py-1.5 text-sm"
                value={talento}
                onChange={(e) => setTalento(e.target.value)}
              >
                <option value="">Selecione um talento…</option>
                {TALENTOS.filter((t) => t.categoria === 'Geral' && !char.talentos.includes(t.nome)).map((t) => (
                  <option key={t.nome} value={t.nome}>
                    {t.nome}{t.requisito ? ` — precisa de ${t.requisito}` : ''}
                  </option>
                ))}
              </select>
            )}
            {modoAsi === 'talento' && talento && (
              <p className="mt-2 text-xs text-parchment-200/60">
                {TALENTOS.find((t) => t.nome === talento)?.resumo}
              </p>
            )}
          </div>
        )}

        {/* Espaços de magia */}
        {mudouEspacos && (
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
            <h4 className="mb-2 panel-title">Espaços de magia</h4>
            <div className="flex flex-wrap gap-1.5">
              {espacosNovos.map((s, i) => {
                const antes = espacosAntigos[i].total
                if (s.total === 0 && antes === 0) return null
                const novo = s.total > antes
                return (
                  <span key={i} className={`chip ${novo ? 'border-emerald-400/50 text-emerald-400' : ''}`}>
                    Nv {i + 1}: {antes} → {s.total}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Magias novas. Anunciar sem oferecer é o defeito que o jogador já
            apontou no estilo de luta: o assistente dizia "você ganha X" e
            deixava a pessoa procurar onde escolher. */}
        {ganhoMagias?.algo && (
          <MagiasDoNivel
            char={char}
            nivel={novoNivel}
            ganho={ganhoMagias}
            escolhidas={novasMagias}
            onMudar={setNovasMagias}
          />
        )}

        {/* O que este nível dá — vem do catálogo de traços, não de texto solto */}
        {(tracosNovos.length > 0 || marcos.length > 0) && (
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-3">
            <h4 className="mb-2 panel-title">O que você ganha neste nível</h4>
            <ul className="space-y-1.5">
              {tracosNovos.map((t) => (
                <li key={`${t.origem}-${t.nome}`} className="flex gap-2 text-sm text-parchment-100">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      t.efeito?.tipo === 'escolha' ? 'bg-amber-400' : 'bg-dragon-400'
                    }`}
                  />
                  <span>
                    <b>{t.nome}</b>
                    {t.efeito?.tipo === 'escolha' && (
                      <span className="ml-1 text-xs text-amber-300">— precisa escolher</span>
                    )}
                    <span className="block text-xs text-parchment-200/60">{t.resumo}</span>
                  </span>
                </li>
              ))}
              {/* Marcos antigos que o catálogo ainda não cobre */}
              {marcos
                .filter((m) => !tracosNovos.some((t) => m.includes(t.nome)))
                .map((m) => (
                  <li key={m} className="flex gap-2 text-sm text-parchment-100">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-dragon-400" />
                    {m}
                  </li>
                ))}
            </ul>
            {temEscolha && (
              <p className="mt-2 text-xs text-amber-300/80">
                Você faz estas escolhas na aba <b>Traços</b> da ficha, onde elas ficam marcadas até
                serem feitas.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-parchment-200/50">
          Bônus de proficiência: +{proficiencyBonus(char.nivel)} → <b className="text-parchment-100">+{proficiencyBonus(novoNivel)}</b>.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          {char.nivel > 1 && (
            <button
              className="btn-ghost mr-auto text-xs text-parchment-200/60"
              title="Desfaz a última subida: devolve os PV e os espaços de magia do nível anterior"
              onClick={descerDeNivel}
            >
              ↓ Descer para o nível {char.nivel - 1}
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary"
            disabled={
              ganhoPv <= 0 ||
              (precisaSubclasse && !subclasse) ||
              (temAsi && modoAsi === 'talento' && !talento)
            }
            onClick={confirmar}
          >
            ✓ Subir para o nível {novoNivel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

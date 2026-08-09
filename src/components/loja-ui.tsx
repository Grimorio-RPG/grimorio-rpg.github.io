// A loja na tela.
//
// O DM monta a prateleira e escolhe quem está comprando; o dinheiro sai da
// bolsa da ficha e o item cai na mochila de equipamento. Sem passo manual no
// meio: "anota aí que ele gastou 400 PO" é exatamente o tipo de conta na cabeça
// que o resto do app veio tirar da mesa.

import { useEffect, useMemo, useState } from 'react'
import type { Character } from '../types'
import type { ItemDoSrd } from '../data/srd'
import { carregarItensSrd } from '../data/srd'
import { Original } from './layout-ui'
import { sortearLoja } from '../lib/loja-nomes'
import {
  PORTES,
  type Loja,
  type PorteDeLoja,
  comEstoqueDosJogadores,
  comprar,
  emOuro,
  projetarLoja,
  adicionarNaPrateleira,
  gerarPrateleira,
  loadLoja,
  precoManual,
  removerDaPrateleira,
  podePagar,
  porteInfo,
  saveLoja,
  valorDeVenda,
  vender,
} from '../lib/loja'
import { coresDe } from '../lib/equipamento'
import { loadCharacters, upsertCharacter } from '../lib/storage'
import { useEstadoMesa, useMesa } from '../hooks/useSync'
import { CHAVES_MESA } from '../lib/sync/config'
import { publicarComAtraso } from '../lib/sync/estado'
import { enviarFicha } from '../lib/sync/personagens'
import { GlossarioProvider, TextoComTermos } from './glossario-ui'

const ouro = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

export function PainelDaLoja() {
  const { mesa, souDm } = useMesa()
  return souDm || !mesa
    ? <LojaDoDm mesaId={mesa && souDm ? mesa.id : null} />
    : <LojaDoGrupo mesaId={mesa.id} />
}

function LojaDoDm({ mesaId }: { mesaId: string | null }) {
  const [loja, setLoja] = useState<Loja>(() => loadLoja())
  const [fichas, setFichas] = useState<Character[]>(() => loadCharacters())
  const [compradorId, setCompradorId] = useState('')
  const [catalogo, setCatalogo] = useState<ItemDoSrd[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [recado, setRecado] = useState('')
  const [aberto, setAberto] = useState<ItemDoSrd | null>(null)

  const comprador = fichas.find((c) => c.id === compradorId) ?? null

  // O catálogo do SRD passa de 200 KB de texto oficial. Só desce quando alguém
  // abre a loja de verdade — abrir a aba Mundo não pode custar isso.
  //
  // "De verdade" inclui CHEGAR COM PRATELEIRA PRONTA. Enquanto a condição era
  // só o clique em "Sortear", a loja da sessão passada voltava do disco morta:
  // clicar num item não abria a ficha dele e o botão Comprar não fazia nada —
  // sem recado, sem erro, sem pista. Prateleira cheia é prova de que esta mesa
  // usa a loja, e aí os 200 KB já estão pagos.
  useEffect(() => {
    if (catalogo || (!carregando && loja.prateleira.length === 0)) return
    let vivo = true
    void carregarItensSrd().then((itens) => {
      if (!vivo) return
      setCatalogo(itens)
      setCarregando(false)
    })
    return () => {
      vivo = false
    }
  }, [carregando, catalogo, loja.prateleira.length])

  /**
    * A prateleira depois do que os jogadores levaram, e a publicação dela.
    *
    * O jogador compra do aparelho dele: paga da própria bolsa e o item entra na
    * própria mochila. O que ele NÃO consegue é tirar o item da prateleira — no
    * banco, quem escreve estado da mesa é só o DM. Então a prateleira se acerta
    * aqui, lendo as fichas, do mesmo jeito que o combate lê os PV.
    */
  useEffect(() => {
    const acertada = comEstoqueDosJogadores(loja, fichas)
    if (acertada !== loja) {
      setLoja(acertada)
      saveLoja(acertada)
      return
    }
    if (!mesaId) return
    publicarComAtraso(mesaId, CHAVES_MESA.lojaPub, projetarLoja(loja), 900)
  }, [mesaId, loja, fichas])

  function mudar(patch: Partial<Loja> | Loja) {
    const nova = { ...loja, ...patch, atualizadoEm: Date.now() }
    setLoja(nova)
    saveLoja(nova)
  }

  /** Sorteia a loja e quem atende, do mesmo tema. */
  function sortearIdentidade() {
    const nova = sortearLoja(loja.porte)
    mudar({ nome: nova.nome, vendedor: nova.vendedor })
  }

  function gerar() {
    if (!catalogo) {
      setCarregando(true)
      return
    }
    mudar({ prateleira: gerarPrateleira(catalogo, loja.porte, loja.margem) })
    setRecado('')
  }

  // Assim que o catálogo chega por causa de um clique em "Sortear", monta a
  // prateleira sem exigir um segundo clique.
  useEffect(() => {
    if (catalogo && loja.prateleira.length === 0) {
      mudar({ prateleira: gerarPrateleira(catalogo, loja.porte, loja.margem) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogo])

  function aoComprar(itemId: string) {
    if (!comprador) return
    // Sem catálogo não dá para montar o item. Antes isto era um `return` mudo,
    // e um botão que não faz nada e não diz nada é pior do que um botão
    // desabilitado.
    if (!catalogo) {
      setRecado('O baú ainda está abrindo. Tente de novo em um instante.')
      return
    }
    const r = comprar(comprador, loja, itemId, catalogo)
    if (!r.ok) {
      setRecado(r.motivo ?? 'Não deu.')
      return
    }
    setFichas(upsertCharacter(r.char))
    setLoja(r.loja)
    saveLoja(r.loja)
    setRecado(`${r.char.nome || 'A ficha'} comprou.`)
  }

  function aoVender(equipamentoId: string) {
    if (!comprador) return
    const r = vender(comprador, loja, equipamentoId)
    if (!r.ok) {
      setRecado(r.motivo ?? 'Não deu.')
      return
    }
    setFichas(upsertCharacter(r.char))
    setRecado('Vendido.')
  }

  const guardados = useMemo(
    () => (comprador?.equipamentos ?? []).filter((e) => !e.equipado),
    [comprador],
  )

  return (
    <GlossarioProvider>
      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="panel-title">Loja</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-ghost py-1 text-xs" onClick={gerar}>
              {carregando ? 'Abrindo o baú…' : loja.prateleira.length ? '↻ Sortear estoque' : '+ Sortear estoque'}
            </button>
            {/* Montar a loja é trabalho do DM e acontece ANTES da cena. Sem
                esta trava o grupo vê a prateleira sendo mexida ao vivo, o que
                estraga a cena e entrega a mão dele. */}
            <button
              type="button"
              onClick={() => mudar({ liberada: !loja.liberada })}
              className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                loja.liberada
                  ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/15 text-parchment-200/60 hover:border-emerald-400/40'
              }`}
              title={
                loja.liberada
                  ? 'O grupo está vendo esta loja e pode comprar'
                  : 'Só você vê. Monte a prateleira antes de abrir'
              }
            >
              {loja.liberada ? '🔓 Aberta ao grupo' : '🔒 Fechada — só você vê'}
            </button>
          </div>
        </div>

        {/* Quem é a loja */}
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-parchment-200/60">Nome</span>
            <input
              className="input w-full"
              value={loja.nome}
              placeholder="A Bigorna Torta"
              onChange={(e) => mudar({ nome: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-parchment-200/60">Vendedor</span>
            <input
              className="input w-full"
              value={loja.vendedor}
              placeholder="Durnan, anão de poucas palavras"
              onChange={(e) => mudar({ vendedor: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 flex items-center justify-between gap-2 text-xs text-parchment-200/60">
              Porte
              <button
                type="button"
                className="text-[11px] text-arcane-300 hover:text-arcane-200"
                title="Sorteia o nome e quem atende, combinando com o porte"
                onClick={sortearIdentidade}
              >
                🎲 sortear nome
              </button>
            </span>
            <select
              className="input w-full"
              value={loja.porte}
              onChange={(e) => {
                const porte = e.target.value as PorteDeLoja
                mudar({ porte, margem: porteInfo(porte).margem })
              }}
            >
              {PORTES.map((p) => (
                <option key={p.valor} value={p.valor}>{p.nome}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-1 text-xs text-parchment-200/50">{porteInfo(loja.porte).descricao}</p>

        {/* Quem está comprando */}
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-parchment-200/60">Quem está comprando</span>
            <select
              className="input"
              value={compradorId}
              onChange={(e) => setCompradorId(e.target.value)}
            >
              <option value="">— escolha uma ficha —</option>
              {fichas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome || 'Sem nome'}</option>
              ))}
            </select>
          </label>
          {comprador && (
            <p className="text-sm text-parchment-100">
              Bolsa: <b className="text-amber-300">{ouro(emOuro(comprador.moedas))} PO</b>
            </p>
          )}
          {recado && <p className="text-xs text-parchment-200/70">{recado}</p>}
        </div>

        {/* Pôr item à mão. O sorteio monta a base; o que faz a loja ser DAQUELA
            vila é o DM acrescentar a espada que o ferreiro guardou para o grupo
            — e tirar o que não faz sentido ali. */}
        <AdicionarItem
          catalogo={catalogo}
          onAdicionar={(item) => {
            mudar(adicionarNaPrateleira(loja, item))
            setRecado(`${item.nomePt} entrou na prateleira.`)
          }}
        />

        {/* A prateleira */}
        {loja.prateleira.length === 0 ? (
          <p className="mt-4 text-sm text-parchment-200/50">
            Prateleira vazia. Sorteie o estoque — o porte decide o que aparece, para o ferreiro do
            vilarejo não vender Espada Vorpal.
          </p>
        ) : (
          <ul className="mt-4 space-y-1.5">
            {loja.prateleira.map((item) => {
              const cor = coresDe(item.raridade)
              const doCatalogo = catalogo?.find((i) => i.nome === item.chave)
              const cabe = comprador ? podePagar(comprador.moedas, item.precoPO) : false
              return (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center gap-2 rounded-lg border p-2.5 ${cor.anel} ${cor.fundo}`}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => doCatalogo && setAberto(doCatalogo)}
                    title="Ver o que faz"
                  >
                    <span className={`block truncate text-sm font-medium ${cor.texto}`}>
                      {item.nome}
                      <Original pt={item.nome} en={item.chave} />
                      {item.qtd > 1 && <span className="ml-1 text-parchment-200/50">×{item.qtd}</span>}
                    </span>
                    <span className="block text-xs text-parchment-200/50">{item.raridade}</span>
                  </button>
                  {/* O preço é editável. O modelo dá um número plausível, mas
                      quem decide quanto o ferreiro cobra do grupo é o DM — e
                      pechinchar é meia cena de mesa que o app não pode travar. */}
                  <label className="flex items-center gap-1 text-sm text-amber-300">
                    <input
                      type="number"
                      min={0}
                      value={item.precoPO}
                      onChange={(e) => mudar(
                        precoManual(loja, item.id, Number(e.target.value)),
                      )}
                      className="w-24 rounded-md border border-white/10 bg-ink-900/70 px-1 py-1 text-right tabular-nums outline-none focus:border-amber-400"
                    />
                    PO
                  </label>
                  <button
                    className="btn-ghost py-1 text-xs disabled:opacity-30"
                    disabled={!comprador || !cabe}
                    title={!comprador ? 'Escolha quem está comprando' : cabe ? '' : 'Dinheiro insuficiente'}
                    onClick={() => aoComprar(item.id)}
                  >
                    Comprar
                  </button>
                  <button
                    className="px-1 text-parchment-200/40 hover:text-dragon-400"
                    title="Tirar da prateleira"
                    aria-label={`Tirar ${item.nome} da prateleira`}
                    onClick={() => mudar(removerDaPrateleira(loja, item.id))}
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Vender */}
        {comprador && guardados.length > 0 && (
          <div className="mt-5">
            <p className="panel-title mb-2">
              Vender — o vendedor paga {Math.round(loja.fracaoDeVenda * 100)}% da tabela
            </p>
            <ul className="space-y-1.5">
              {guardados.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-ink-900/40 p-2.5"
                >
                  <span className={`min-w-0 flex-1 truncate text-sm ${coresDe(item.raridade).texto}`}>
                    {item.nome || 'Sem nome'}
                    {(item.qtd ?? 1) > 1 && (
                      <span className="ml-1 text-parchment-200/50">×{item.qtd}</span>
                    )}
                  </span>
                  <span className="tabular-nums text-sm text-amber-300/80">
                    {ouro(valorDeVenda(item, loja))} PO
                  </span>
                  <button className="btn-ghost py-1 text-xs" onClick={() => aoVender(item.id)}>
                    Vender
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-parchment-200/40">
              O que está vestido não aparece aqui: tire da boneca antes de vender.
            </p>
          </div>
        )}

        {aberto && <FichaDoItem item={aberto} onFechar={() => setAberto(null)} />}
      </section>
    </GlossarioProvider>
  )
}

/** O que o item faz, no texto do SRD traduzido — com os termos clicáveis. */
function FichaDoItem({ item, onFechar }: { item: ItemDoSrd; onFechar: () => void }) {
  const cor = coresDe(item.raridades[0])
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onFechar}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className={`text-lg font-semibold ${cor.texto}`}>
              {item.nomePt}
              <Original pt={item.nomePt} en={item.nome} />
            </h4>
            <p className="text-xs text-parchment-200/50">
              {item.raridades.join(' ou ')}
              {item.sintonia && ' · exige sintonia'}
              {item.porQuem && ` (${item.porQuem})`}
            </p>
          </div>
          <button className="btn-ghost shrink-0 py-1 text-xs" onClick={onFechar}>Fechar</button>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-parchment-100">
          <TextoComTermos texto={item.textoPt} />
        </p>

        {item.tabelaOmitida && (
          <p className="mt-3 text-xs text-amber-200/80">
            Este item tem uma tabela de variantes que não cabe aqui — está no SRD.
          </p>
        )}

        {/* O original, para quando a mesa discutir a regra. */}
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-parchment-200/40 hover:text-parchment-200/70">
            Texto oficial em inglês
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-parchment-200/50">
            {item.texto}
          </p>
        </details>
      </div>
    </div>
  )
}

/**
 * Pôr um item na prateleira à mão.
 *
 * O sorteio monta a base, e é bom nisso. O que faz a loja ser DAQUELA vila é o
 * DM acrescentar a espada que o ferreiro guardou para o grupo — e o sorteio,
 * por definição, nunca vai adivinhar isso.
 *
 * A busca só aparece com o catálogo carregado. Um campo que não acha nada e não
 * explica por quê é o tipo de coisa que faz a pessoa achar que digitou errado.
 */
function AdicionarItem({
  catalogo,
  onAdicionar,
}: {
  catalogo: ItemDoSrd[] | null
  onAdicionar: (item: ItemDoSrd) => void
}) {
  const [busca, setBusca] = useState('')

  const achados = useMemo(() => {
    const t = busca.trim().toLowerCase()
    if (!catalogo || t.length < 2) return []
    return catalogo
      .filter((i) => i.nomePt.toLowerCase().includes(t) || i.nome.toLowerCase().includes(t))
      .slice(0, 8)
  }, [catalogo, busca])

  if (!catalogo) return null

  return (
    <div className="mt-4">
      <input
        className="input w-full"
        value={busca}
        placeholder="Pôr item na prateleira — busque pelo nome…"
        onChange={(e) => setBusca(e.target.value)}
      />
      {achados.length > 0 && (
        <ul className="mt-1 space-y-1">
          {achados.map((i) => (
            <li key={i.nome}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-ink-900/40 px-2.5 py-1.5 text-left text-sm hover:border-emerald-400/50"
                onClick={() => {
                  onAdicionar(i)
                  setBusca('')
                }}
              >
                <span className="min-w-0 truncate text-parchment-100">
                  {i.nomePt}
                  <Original pt={i.nomePt} en={i.nome} />
                </span>
                <span className="shrink-0 text-xs text-parchment-200/50">
                  {i.raridades.join(' ou ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {busca.trim().length >= 2 && achados.length === 0 && (
        <p className="mt-1 text-xs text-parchment-200/50">Nada com esse nome no catálogo do SRD.</p>
      )}
    </div>
  )
}

/**
 * A loja do lado do jogador.
 *
 * Ele vê a prateleira que o DM liberou e compra sozinho: o dinheiro sai da
 * bolsa DELE e o item entra na mochila DELE. Todas as escritas são na própria
 * ficha, que é exatamente o que o banco permite — no `mesa_estado`, quem
 * escreve é só o DM.
 *
 * A prateleira não encolhe aqui, porque tirar o item dela é estado do DM. Em
 * vez de fingir que encolheu, o item comprado fica marcado como levado até o
 * DM republicar. Fingir seria pior: dois jogadores comprando o último item ao
 * mesmo tempo veriam duas prateleiras que discordam da mesa.
 */
function LojaDoGrupo({ mesaId }: { mesaId: string }) {
  const remota = useEstadoMesa<Loja>(mesaId, CHAVES_MESA.lojaPub)
  const [fichas, setFichas] = useState<Character[]>(() => loadCharacters())
  const [minhaId, setMinhaId] = useState('')
  const [catalogo, setCatalogo] = useState<ItemDoSrd[] | null>(null)
  const [recado, setRecado] = useState('')
  const [aberto, setAberto] = useState<ItemDoSrd | null>(null)

  const loja = remota && remota.liberada ? remota : null
  const minha = fichas.find((c) => c.id === minhaId) ?? fichas[0] ?? null

  useEffect(() => {
    if (!loja || catalogo) return
    let vivo = true
    void carregarItensSrd().then((i) => vivo && setCatalogo(i))
    return () => {
      vivo = false
    }
  }, [loja, catalogo])

  if (remota === undefined) {
    return (
      <section className="card p-5 text-sm text-parchment-200/60">Procurando a loja…</section>
    )
  }
  if (!loja) {
    // Nenhuma loja aberta não é "loja vazia": dizer que o vendedor não tem nada
    // seria uma informação, e errada.
    return (
      <section className="card p-5 text-sm text-parchment-200/60">
        Nenhuma loja aberta agora. Quando o seu DM abrir uma, ela aparece aqui.
      </section>
    )
  }

  function comprarItem(itemId: string) {
    if (!minha) return setRecado('Escolha a sua ficha primeiro.')
    if (!catalogo) return setRecado('O baú ainda está abrindo. Tente de novo em um instante.')
    const r = comprar(minha, loja!, itemId, catalogo)
    if (!r.ok) return setRecado(r.motivo ?? 'Não deu.')
    setFichas(upsertCharacter(r.char))
    // A ficha vai para a nuvem na hora: é por ela que a prateleira do DM
    // descobre o que foi levado.
    void enviarFicha(mesaId, r.char)
    setRecado(`Comprado. Sobrou ${ouro(emOuro(r.char.moedas))} PO.`)
  }

  const levados = new Set(minha?.comprasNaLoja ?? [])

  return (
    <GlossarioProvider>
      <section className="card p-5">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg text-parchment-50">{loja.nome || 'Loja'}</h3>
          <span className="chip border-emerald-400/40 text-emerald-300">aberta</span>
        </div>
        {loja.vendedor && (
          <p className="mb-3 text-sm text-parchment-200/60">{loja.vendedor}</p>
        )}

        <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-parchment-200/60">Comprando com</span>
            <select className="input" value={minha?.id ?? ''} onChange={(e) => setMinhaId(e.target.value)}>
              {fichas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome || 'Sem nome'}</option>
              ))}
            </select>
          </label>
          {minha && (
            <p className="text-sm text-parchment-100">
              Bolsa: <b className="text-amber-300">{ouro(emOuro(minha.moedas))} PO</b>
            </p>
          )}
          {recado && <p className="text-xs text-parchment-200/70">{recado}</p>}
        </div>

        <ul className="space-y-1.5">
          {loja.prateleira.map((item) => {
            const cor = coresDe(item.raridade)
            const doCatalogo = catalogo?.find((i) => i.nome === item.chave)
            const jaLevei = levados.has(item.id)
            const cabe = minha ? podePagar(minha.moedas, item.precoPO) : false
            return (
              <li
                key={item.id}
                className={`flex flex-wrap items-center gap-2 rounded-lg border p-2.5 ${cor.anel} ${cor.fundo} ${jaLevei ? 'opacity-40' : ''}`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => doCatalogo && setAberto(doCatalogo)}
                  title="Ver o que faz"
                >
                  <span className={`block truncate text-sm font-medium ${cor.texto}`}>
                    {item.nome}
                    <Original pt={item.nome} en={item.chave} />
                    {item.qtd > 1 && <span className="ml-1 text-parchment-200/50">×{item.qtd}</span>}
                  </span>
                  <span className="block text-xs text-parchment-200/50">{item.raridade}</span>
                </button>
                <span className="tabular-nums text-sm text-amber-300">{ouro(item.precoPO)} PO</span>
                <button
                  className="btn-ghost py-1 text-xs disabled:opacity-30"
                  disabled={!minha || !cabe || jaLevei}
                  title={
                    jaLevei ? 'Você já levou este' : cabe ? '' : 'Dinheiro insuficiente'
                  }
                  onClick={() => comprarItem(item.id)}
                >
                  {jaLevei ? 'Levado' : 'Comprar'}
                </button>
              </li>
            )
          })}
        </ul>

        {loja.prateleira.length === 0 && (
          <p className="text-sm text-parchment-200/50">O vendedor está sem estoque.</p>
        )}

        {aberto && <FichaDoItem item={aberto} onFechar={() => setAberto(null)} />}
      </section>
    </GlossarioProvider>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Campaign, Character } from '../types'
import { useCampaign } from '../hooks/useCampaign'
import { useEstadoMesa, useMesa } from '../hooks/useSync'
import { CHAVES_MESA } from '../lib/sync/config'
import { SelosDaMesa } from '../components/mesa-ui'
import type { FichaDaMesa } from '../lib/sync/personagens'
import { assinarFichasDaMesa, listarFichasDaMesa } from '../lib/sync/personagens'
import {
  campanhaVazia,
  dataCurta,
  novaAtualizacao,
  novaSessao,
  novoNpc,
  ordenarAtualizacoes,
  projetarCampanha,
} from '../lib/campaign'
import { loadCharacters, parseImportedCharacter } from '../lib/storage'
import { uid } from '../lib/character'
import {
  armorClass,
  fmtMod,
  passivePerception,
  passiveSkill,
  saveBonus,
} from '../lib/calc'
import { ABILITIES } from '../data/rules'
import CharacterReadonly from '../components/CharacterReadonly'
import { Field, SectionCard, TextArea, TextField } from '../components/ui'
import { ViewToggle } from '../components/layout-ui'
import { CodexTab, HandoutsTab, ReputacaoTab } from '../components/codex'
import { EstradaTab } from '../components/estrada'

type Aba =
  | 'mural'
  | 'grupo'
  | 'tela'
  | 'estrada'
  | 'historia'
  | 'sessoes'
  | 'npcs'
  | 'codex'
  | 'handouts'
  | 'reputacao'
type Modo = 'dm' | 'jogadores'

const ABAS: { id: Aba; label: string; icon: string; soDm?: boolean }[] = [
  { id: 'mural', label: 'Mural', icon: '📌' },
  { id: 'grupo', label: 'Grupo', icon: '🛡️', soDm: true },
  { id: 'tela', label: 'Tela do Mestre', icon: '📊', soDm: true },
  { id: 'estrada', label: 'Estrada', icon: '🧭' },
  { id: 'historia', label: 'História', icon: '📜' },
  { id: 'sessoes', label: 'Sessões', icon: '📅' },
  { id: 'npcs', label: 'NPCs', icon: '🎭', soDm: true },
  { id: 'codex', label: 'Codex', icon: '📖' },
  { id: 'handouts', label: 'Documentos', icon: '🗞️' },
  { id: 'reputacao', label: 'Reputação', icon: '⚖️' },
]

export default function CampaignPage() {
  const { mesa, souJogador } = useMesa()

  // Quem entrou na mesa como jogador não tem visão de DM — nem por engano, nem
  // por um botão escondido: os dados do DM sequer chegam a este aparelho.
  if (souJogador && mesa) return <CampanhaDoJogador mesaId={mesa.id} />
  return <CampanhaDoMestre />
}

function CampanhaDoMestre() {
  const { campaign, update } = useCampaign()
  const [aba, setAba] = useState<Aba>('mural')
  const [modo, setModo] = useState<Modo>('dm')

  if (!campaign) return null
  // "Visão dos Jogadores" aqui é a pré-visualização do DM: mostra o mesmo
  // recorte que o grupo recebe, sem sair da conta.
  const visaoJogador = modo === 'jogadores'
  const dados = visaoJogador ? projetarCampanha(campaign) : campaign
  const abas = ABAS.filter((a) => !visaoJogador || !a.soDm)
  const abaAtual = abas.some((a) => a.id === aba) ? aba : abas[0].id

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <span className="text-3xl">📖</span>
          <div className="min-w-0 flex-1">
            {visaoJogador ? (
              <h1 className="truncate font-display text-2xl text-parchment-50 sm:text-3xl">
                {campaign.nome || 'A campanha'}
              </h1>
            ) : (
              <input
                className="w-full bg-transparent font-display text-2xl text-parchment-50 outline-none placeholder:text-parchment-200/30 sm:text-3xl"
                placeholder="Nome da sua campanha…"
                value={campaign.nome}
                onChange={(e) => update({ nome: e.target.value })}
              />
            )}
            <p className="mt-1 text-xs text-parchment-200/60 sm:text-sm">
              {visaoJogador
                ? 'Prévia: é exatamente isto que chega ao grupo.'
                : 'Painel do DM — fichas do grupo, mundo e documentos da mesa.'}
            </p>
          </div>
        </div>
        <ViewToggle
          valor={modo}
          onChange={(v) => setModo(v)}
          opcoes={[
            { valor: 'dm', label: '🎲 Visão do DM', labelCurto: '🎲 DM' },
            { valor: 'jogadores', label: '👀 Prévia do grupo', labelCurto: '👀 Prévia' },
          ]}
        />
      </header>

      <SelosDaMesa />

      <Abas abas={abas} atual={abaAtual} onEscolher={setAba} campaign={dados} />

      {abaAtual === 'mural' && <MuralTab campaign={dados} update={update} visaoJogador={visaoJogador} />}
      {abaAtual === 'grupo' && <GrupoTab campaign={campaign} update={update} />}
      {abaAtual === 'tela' && <TelaDoMestreTab campaign={campaign} />}
      {abaAtual === 'estrada' && <EstradaTab campaign={dados} update={update} visaoJogador={visaoJogador} />}
      {abaAtual === 'historia' && <HistoriaTab campaign={dados} update={update} visaoJogador={visaoJogador} />}
      {abaAtual === 'sessoes' && <SessoesTab campaign={dados} update={update} visaoJogador={visaoJogador} />}
      {abaAtual === 'npcs' && <NpcsTab campaign={campaign} update={update} />}
      {abaAtual === 'codex' && <CodexTab campaign={dados} update={update} visaoJogador={visaoJogador} />}
      {abaAtual === 'handouts' && <HandoutsTab campaign={dados} update={update} visaoJogador={visaoJogador} />}
      {abaAtual === 'reputacao' && <ReputacaoTab campaign={dados} update={update} visaoJogador={visaoJogador} />}
    </div>
  )
}

/**
 * Campanha vista por quem joga: só leitura, alimentada pela projeção que o DM
 * publica. Nada de abas de DM — elas não existem nesta tela.
 */
function CampanhaDoJogador({ mesaId }: { mesaId: string }) {
  const remota = useEstadoMesa<Campaign>(mesaId, CHAVES_MESA.campanhaPub)
  const [aba, setAba] = useState<Aba>('mural')

  const campaign: Campaign | null = remota ? { ...campanhaVazia(), ...remota } : null
  const abas = ABAS.filter((a) => !a.soDm)
  const abaAtual = abas.some((a) => a.id === aba) ? aba : abas[0].id
  const nada: UpdateFn = () => {}

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        <span className="text-3xl">📖</span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl text-parchment-50 sm:text-3xl">
            {campaign?.nome || 'A campanha'}
          </h1>
          <p className="mt-1 text-xs text-parchment-200/60 sm:text-sm">
            O que o seu DM compartilhou com o grupo.
          </p>
        </div>
      </header>

      <SelosDaMesa />

      {remota === undefined ? (
        <div className="card p-10 text-center text-sm text-parchment-200/60">Carregando a campanha…</div>
      ) : !campaign ? (
        <div className="card p-10 text-center text-sm text-parchment-200/60">
          O seu DM ainda não publicou nada desta campanha. Assim que ele escrever, aparece aqui.
        </div>
      ) : (
        <>
          <Abas abas={abas} atual={abaAtual} onEscolher={setAba} campaign={campaign} />
          {abaAtual === 'mural' && <MuralTab campaign={campaign} update={nada} visaoJogador />}
          {abaAtual === 'estrada' && <EstradaTab campaign={campaign} update={nada} visaoJogador />}
          {abaAtual === 'historia' && <HistoriaTab campaign={campaign} update={nada} visaoJogador />}
          {abaAtual === 'sessoes' && <SessoesTab campaign={campaign} update={nada} visaoJogador />}
          {abaAtual === 'codex' && <CodexTab campaign={campaign} update={nada} visaoJogador />}
          {abaAtual === 'handouts' && <HandoutsTab campaign={campaign} update={nada} visaoJogador />}
          {abaAtual === 'reputacao' && <ReputacaoTab campaign={campaign} update={nada} visaoJogador />}
        </>
      )}
    </div>
  )
}

function Abas({
  abas,
  atual,
  onEscolher,
  campaign,
}: {
  abas: typeof ABAS
  atual: Aba
  onEscolher: (a: Aba) => void
  campaign: Campaign
}) {
  const naoLidas = campaign.atualizacoes.filter((a) => a.publicado).length
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-white/10 pb-px">
      {abas.map((a) => (
        <button
          key={a.id}
          onClick={() => onEscolher(a.id)}
          className={`flex items-center gap-2 rounded-t-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
            atual === a.id
              ? 'bg-white/5 text-parchment-50 ring-1 ring-white/10'
              : 'text-parchment-200/60 hover:text-parchment-50'
          }`}
        >
          <span>{a.icon}</span>
          {a.label}
          {a.id === 'grupo' && campaign.party.length > 0 && (
            <span className="rounded-full bg-dragon-500/30 px-1.5 text-xs">{campaign.party.length}</span>
          )}
          {a.id === 'mural' && naoLidas > 0 && (
            <span className="rounded-full bg-dragon-500/30 px-1.5 text-xs">{naoLidas}</span>
          )}
        </button>
      ))}
    </div>
  )
}

type UpdateFn = (patch: Partial<Campaign>) => void

// ---------------------------------------------------------------------------
// Mural — a primeira tela que o grupo abre entre uma sessão e outra
// ---------------------------------------------------------------------------
function MuralTab({
  campaign,
  update,
  visaoJogador,
}: {
  campaign: Campaign
  update: UpdateFn
  visaoJogador: boolean
}) {
  const lista = ordenarAtualizacoes(campaign.atualizacoes)

  function patch(id: string, p: Partial<Campaign['atualizacoes'][number]>) {
    update({ atualizacoes: campaign.atualizacoes.map((a) => (a.id === id ? { ...a, ...p } : a)) })
  }
  function remover(id: string) {
    update({ atualizacoes: campaign.atualizacoes.filter((a) => a.id !== id) })
  }

  return (
    <div className="space-y-4">
      {/* Onde paramos */}
      <div className="card border-dragon-500/30 bg-dragon-500/5 p-5">
        <p className="panel-title mb-2">📍 Onde paramos</p>
        {visaoJogador ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-parchment-100">
            {campaign.ondeParamos || 'O DM ainda não escreveu o resumo da última sessão.'}
          </p>
        ) : (
          <>
            <TextArea
              value={campaign.ondeParamos}
              onChange={(v) => update({ ondeParamos: v })}
              rows={4}
              placeholder="Vocês fugiram da cripta com o medalhão, mas Ireena ficou para trás…"
            />
            <p className="mt-2 text-xs text-parchment-200/50">
              Duas ou três frases. É o que o grupo lê para lembrar tudo antes da próxima sessão.
            </p>
          </>
        )}
      </div>

      {/* Recados */}
      {!visaoJogador && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn-primary"
            onClick={() => update({ atualizacoes: [novaAtualizacao(), ...campaign.atualizacoes] })}
          >
            ＋ Novo recado
          </button>
          <p className="text-xs text-parchment-200/50">
            Rascunhos ficam só com você até marcar <b>Publicar</b>.
          </p>
        </div>
      )}

      {lista.length === 0 ? (
        <VazioAviso
          texto={
            visaoJogador
              ? 'Nenhum recado do DM por enquanto.'
              : 'Avise o grupo do horário da próxima sessão, de uma reviravolta, de uma recompensa…'
          }
        />
      ) : (
        <div className="space-y-3">
          {lista.map((a) =>
            visaoJogador ? (
              <article
                key={a.id}
                className={`card p-5 ${a.fixado ? 'border-dragon-500/40 bg-dragon-500/5' : ''}`}
              >
                <p className="panel-title">
                  {a.fixado && '📌 '}
                  {dataCurta(a.criadoEm)}
                </p>
                <h3 className="font-display text-lg text-parchment-50">{a.titulo || 'Recado'}</h3>
                {a.texto && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-parchment-100">{a.texto}</p>
                )}
              </article>
            ) : (
              <div key={a.id} className={`card p-5 ${a.publicado ? '' : 'opacity-70'}`}>
                <div className="mb-3 flex flex-wrap items-end gap-3">
                  <Field label="Título" className="flex-1">
                    <TextField
                      value={a.titulo}
                      onChange={(v) => patch(a.id, { titulo: v })}
                      placeholder="Próxima sessão: quinta, 20h"
                    />
                  </Field>
                  <button
                    onClick={() => remover(a.id)}
                    className="self-end px-2 py-2 text-parchment-200/40 hover:text-dragon-400"
                    aria-label="Remover recado"
                  >
                    ✕
                  </button>
                </div>
                <TextArea
                  value={a.texto}
                  onChange={(v) => patch(a.id, { texto: v })}
                  rows={3}
                  placeholder="O que o grupo precisa saber…"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex cursor-pointer items-center gap-1.5 text-parchment-200/80">
                    <input
                      type="checkbox"
                      checked={a.publicado}
                      onChange={(e) => patch(a.id, { publicado: e.target.checked })}
                    />
                    {a.publicado ? 'Publicado' : 'Rascunho'}
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-parchment-200/80">
                    <input
                      type="checkbox"
                      checked={a.fixado}
                      onChange={(e) => patch(a.id, { fixado: e.target.checked })}
                    />
                    📌 Fixar no topo
                  </label>
                  <span className="ml-auto text-parchment-200/40">{dataCurta(a.criadoEm)}</span>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grupo
// ---------------------------------------------------------------------------
function GrupoTab({ campaign, update }: { campaign: Campaign; update: UpdateFn }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [mostrarLocais, setMostrarLocais] = useState(false)

  const locais = useMemo(() => {
    const naParty = new Set(campaign.party.map((c) => c.nome.toLowerCase()))
    return loadCharacters().filter((c) => !naParty.has(c.nome.toLowerCase()))
  }, [campaign.party, mostrarLocais])

  async function importarArquivos(files: FileList) {
    const novos: Character[] = []
    for (const f of Array.from(files)) {
      try {
        novos.push(parseImportedCharacter(await f.text()))
      } catch {
        alert(`Não consegui ler "${f.name}". Precisa ser uma ficha exportada pelo Grimório (.json).`)
      }
    }
    if (novos.length) update({ party: [...campaign.party, ...novos] })
  }

  function adicionarLocal(char: Character) {
    // snapshot com novo id para não vincular à ficha original
    update({ party: [...campaign.party, { ...char, id: uid() }] })
  }

  function remover(id: string) {
    update({ party: campaign.party.filter((c) => c.id !== id) })
    if (aberto === id) setAberto(null)
  }

  return (
    <div className="space-y-4">
      <FichasDaMesa />

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => fileRef.current?.click()}>
          ⬆ Importar fichas dos jogadores
        </button>
        <button className="btn-ghost" onClick={() => setMostrarLocais((v) => !v)}>
          {mostrarLocais ? 'Ocultar' : '＋ Adicionar'} fichas deste navegador
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) importarArquivos(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <p className="text-xs text-parchment-200/50">
        Cada jogador exporta a ficha (botão <b>Exportar</b> na ficha) e te envia o arquivo
        <b> .json</b>. Você importa aqui — pode selecionar vários de uma vez.
      </p>

      {mostrarLocais && (
        <SectionCard title="Fichas salvas neste navegador">
          {locais.length === 0 ? (
            <p className="text-sm text-parchment-200/50">Nenhuma ficha local disponível para adicionar.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {locais.map((c) => (
                <li key={c.id}>
                  <button className="chip hover:border-dragon-400/60" onClick={() => adicionarLocal(c)}>
                    ＋ {c.nome || 'Sem nome'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {campaign.party.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl">🛡️</div>
          <h3 className="mt-3 text-xl text-parchment-50">Nenhum aventureiro na mesa ainda</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-parchment-200/60">
            Importe as fichas que seus jogadores exportaram para montar o grupo.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaign.party.map((c) => (
            <PartyCard key={c.id} char={c} onOpen={() => setAberto(c.id)} onRemove={() => remover(c.id)} />
          ))}
        </div>
      )}

      {aberto && (
        <Modal onClose={() => setAberto(null)}>
          <CharacterReadonly char={campaign.party.find((c) => c.id === aberto)!} />
        </Modal>
      )}
    </div>
  )
}

/**
 * Fichas que os jogadores enviaram pela mesa. Chegam sozinhas e continuam
 * chegando: quando alguém sobe de nível ou gasta PV, o card atualiza aqui.
 */
function FichasDaMesa() {
  const { mesa, souDm } = useMesa()
  const [fichas, setFichas] = useState<FichaDaMesa[]>([])
  const [aberta, setAberta] = useState<string | null>(null)

  const mesaId = mesa && souDm ? mesa.id : null

  useEffect(() => {
    if (!mesaId) {
      setFichas([])
      return
    }
    const recarregar = () => void listarFichasDaMesa(mesaId).then(setFichas)
    recarregar()
    return assinarFichasDaMesa(mesaId, recarregar)
  }, [mesaId])

  if (!mesaId) return null

  return (
    <SectionCard
      title={`☁️ Fichas do grupo (${fichas.length})`}
      hint="Enviadas pelos jogadores da mesa. Atualizam sozinhas — você não precisa importar nada."
    >
      {fichas.length === 0 ? (
        <p className="text-sm text-parchment-200/60">
          Ninguém enviou ficha ainda. Cada jogador abre a ficha dele e toca em <b>Enviar para a mesa</b>.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fichas.map((f) => (
            <button
              key={f.linhaId}
              className="card p-4 text-left transition hover:border-arcane-400/40"
              onClick={() => setAberta(f.linhaId)}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-arcane-600/30">
                  {f.ficha.avatarUrl ? (
                    <img src={f.ficha.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    '🧙'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-parchment-50">{f.ficha.nome || 'Sem nome'}</p>
                  <p className="truncate text-xs text-parchment-200/60">{f.donoNome}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="chip">Nível {f.ficha.nivel}</span>
                <span className="chip">CA {armorClass(f.ficha)}</span>
                <span className="chip">
                  PV {f.ficha.pvAtual}/{f.ficha.pvMax}
                </span>
                <span className="chip">Perc.P. {passivePerception(f.ficha)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {aberta && (
        <Modal onClose={() => setAberta(null)}>
          <CharacterReadonly char={fichas.find((f) => f.linhaId === aberta)!.ficha} />
        </Modal>
      )}
    </SectionCard>
  )
}

function PartyCard({ char, onOpen, onRemove }: { char: Character; onOpen: () => void; onRemove: () => void }) {
  return (
    <div className="card group relative p-5">
      <button className="block w-full text-left" onClick={onOpen}>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-arcane-600/30 text-lg">
            {char.avatarUrl ? <img src={char.avatarUrl} alt="" className="h-full w-full object-cover" /> : '🧙'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-parchment-50">{char.nome || 'Sem nome'}</p>
            <p className="truncate text-xs text-parchment-200/60">
              {char.jogador ? `Jogador: ${char.jogador}` : [char.especie, char.classe].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="chip">Nível {char.nivel}</span>
          <span className="chip">CA {armorClass(char)}</span>
          <span className="chip">PV {char.pvAtual}/{char.pvMax}</span>
          <span className="chip">Perc.P. {passivePerception(char)}</span>
        </div>
        <p className="mt-3 text-xs text-arcane-400">Ver ficha completa →</p>
      </button>
      <button
        onClick={onRemove}
        className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs text-parchment-200/40 opacity-0 transition hover:bg-dragon-500/20 hover:text-dragon-400 group-hover:opacity-100"
        aria-label="Remover do grupo"
      >
        ✕
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela do Mestre (referência rápida)
// ---------------------------------------------------------------------------
function TelaDoMestreTab({ campaign }: { campaign: Campaign }) {
  if (campaign.party.length === 0) {
    return <VazioAviso texto="Importe fichas na aba Grupo para ver a referência rápida do DM aqui." />
  }
  return (
    <SectionCard
      title="Referência rápida do grupo"
      hint="Os números que o DM mais consulta. Percepções passivas são ótimas para decidir o que o grupo nota sem rolar dados."
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left panel-title">
              <th className="sticky left-0 bg-ink-800/80 px-2 py-2">Personagem</th>
              <th className="px-2 py-2 text-center">CA</th>
              <th className="px-2 py-2 text-center">PV</th>
              <th className="px-2 py-2 text-center" title="Percepção passiva">Perc.</th>
              <th className="px-2 py-2 text-center" title="Investigação passiva">Invest.</th>
              <th className="px-2 py-2 text-center" title="Intuição passiva">Intuição</th>
              {ABILITIES.map((a) => (
                <th key={a.key} className="px-2 py-2 text-center" title={`Salvaguarda de ${a.nome}`}>{a.abrev}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaign.party.map((c) => (
              <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="sticky left-0 bg-ink-800/80 px-2 py-2">
                  <div className="font-medium text-parchment-50">{c.nome || 'Sem nome'}</div>
                  <div className="text-[11px] text-parchment-200/50">{[c.classe, `Nv ${c.nivel}`].filter(Boolean).join(' · ')}</div>
                </td>
                <td className="px-2 py-2 text-center tabular-nums">{armorClass(c)}</td>
                <td className="px-2 py-2 text-center tabular-nums">{c.pvAtual}/{c.pvMax}</td>
                <td className="px-2 py-2 text-center tabular-nums font-semibold text-parchment-50">{passivePerception(c)}</td>
                <td className="px-2 py-2 text-center tabular-nums">{passiveSkill(c, 'investigacao')}</td>
                <td className="px-2 py-2 text-center tabular-nums">{passiveSkill(c, 'intuicao')}</td>
                {ABILITIES.map((a) => (
                  <td key={a.key} className="px-2 py-2 text-center tabular-nums text-parchment-200/80">
                    {fmtMod(saveBonus(c, a.key))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-parchment-200/50">
        Dica: quando um jogador estiver distraído, use a <b>Percepção passiva</b> dele em vez de pedir uma rolagem.
      </p>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// História
// ---------------------------------------------------------------------------
function HistoriaTab({ campaign, update, visaoJogador }: { campaign: Campaign; update: UpdateFn; visaoJogador: boolean }) {
  if (visaoJogador) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Sinopse">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-parchment-100">
            {campaign.sinopse || 'O DM ainda não escreveu a sinopse.'}
          </p>
        </SectionCard>
        <SectionCard title="Arco atual">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-parchment-100">
            {campaign.arcoAtual || 'Nenhum objetivo registrado ainda.'}
          </p>
        </SectionCard>
      </div>
    )
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title="Sinopse" hint="A premissa da campanha, visível para todos. Ex: 'O grupo investiga desaparecimentos em Vallaki.'">
        <TextArea value={campaign.sinopse} onChange={(v) => update({ sinopse: v })} rows={8} placeholder="Do que se trata a sua campanha?" />
      </SectionCard>
      <SectionCard title="Arco atual" hint="O que está acontecendo agora — o objetivo imediato do grupo.">
        <TextArea value={campaign.arcoAtual} onChange={(v) => update({ arcoAtual: v })} rows={8} placeholder="Qual é a missão atual?" />
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sessões
// ---------------------------------------------------------------------------
function SessoesTab({ campaign, update, visaoJogador }: { campaign: Campaign; update: UpdateFn; visaoJogador: boolean }) {
  if (visaoJogador) {
    return campaign.sessoes.length === 0 ? (
      <VazioAviso texto="Nenhuma sessão registrada ainda." />
    ) : (
      <div className="space-y-4">
        {campaign.sessoes.map((s) => (
          <div key={s.id} className="card p-5">
            <p className="panel-title">{s.data || 'Sessão'}</p>
            <h3 className="font-display text-lg text-parchment-50">{s.titulo || 'Sem título'}</h3>
            {s.resumo && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-parchment-100">{s.resumo}</p>}
          </div>
        ))}
      </div>
    )
  }
  function add() {
    update({ sessoes: [novaSessao(), ...campaign.sessoes] })
  }
  function patch(id: string, p: Partial<Campaign['sessoes'][number]>) {
    update({ sessoes: campaign.sessoes.map((s) => (s.id === id ? { ...s, ...p } : s)) })
  }
  function remover(id: string) {
    update({ sessoes: campaign.sessoes.filter((s) => s.id !== id) })
  }
  return (
    <div className="space-y-4">
      <button className="btn-primary" onClick={add}>＋ Nova sessão</button>
      {campaign.sessoes.length === 0 ? (
        <VazioAviso texto="Registre o que aconteceu em cada sessão para todos acompanharem a história." />
      ) : (
        campaign.sessoes.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="mb-3 flex flex-wrap gap-3">
              <Field label="Data / Nº" className="w-40">
                <TextField value={s.data} onChange={(v) => patch(s.id, { data: v })} placeholder="20/07 — Sessão 3" />
              </Field>
              <Field label="Título" className="flex-1">
                <TextField value={s.titulo} onChange={(v) => patch(s.id, { titulo: v })} placeholder="A queda da torre" />
              </Field>
              <button onClick={() => remover(s.id)} className="self-end px-2 py-2 text-parchment-200/40 hover:text-dragon-400" aria-label="Remover sessão">✕</button>
            </div>
            <TextArea value={s.resumo} onChange={(v) => patch(s.id, { resumo: v })} rows={4} placeholder="O que aconteceu nesta sessão…" />
          </div>
        ))
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------
function NpcsTab({ campaign, update }: { campaign: Campaign; update: UpdateFn }) {
  function add() {
    update({ npcs: [...campaign.npcs, novoNpc()] })
  }
  function patch(id: string, p: Partial<Campaign['npcs'][number]>) {
    update({ npcs: campaign.npcs.map((n) => (n.id === id ? { ...n, ...p } : n)) })
  }
  function remover(id: string) {
    update({ npcs: campaign.npcs.filter((n) => n.id !== id) })
  }
  return (
    <div className="space-y-4">
      <button className="btn-primary" onClick={add}>＋ Novo NPC</button>
      {campaign.npcs.length === 0 ? (
        <VazioAviso texto="Cadastre personagens do mundo: aliados, vilões, comerciantes, contatos." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaign.npcs.map((n) => (
            <div key={n.id} className="card p-5">
              <div className="mb-3 flex gap-3">
                <Field label="Nome" className="flex-1">
                  <TextField value={n.nome} onChange={(v) => patch(n.id, { nome: v })} placeholder="Ismark Kolyanovich" />
                </Field>
                <Field label="Papel" className="w-32">
                  <TextField value={n.papel} onChange={(v) => patch(n.id, { papel: v })} placeholder="Aliado" />
                </Field>
                <button onClick={() => remover(n.id)} className="self-end px-2 py-2 text-parchment-200/40 hover:text-dragon-400" aria-label="Remover NPC">✕</button>
              </div>
              <Field label="Descrição">
                <TextArea value={n.descricao} onChange={(v) => patch(n.id, { descricao: v })} rows={2} placeholder="Aparência, personalidade, o que o grupo sabe…" />
              </Field>
              <div className="mt-3">
                <Field label="Notas secretas (só o DM vê)" hint="Segredos, motivações ocultas, reviravoltas planejadas.">
                  <TextArea value={n.notasSecretas} onChange={(v) => patch(n.id, { notasSecretas: v })} rows={2} placeholder="🤫" />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Utilitários de UI
// ---------------------------------------------------------------------------
function VazioAviso({ texto }: { texto: string }) {
  return (
    <div className="card p-8 text-center text-sm text-parchment-200/60">{texto}</div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card my-8 w-full max-w-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-end">
          <button className="btn-ghost" onClick={onClose}>Fechar ✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

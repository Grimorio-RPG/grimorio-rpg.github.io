import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharacters } from '../hooks/useCharacters'
import { novaFicha } from '../lib/character'
import { parseImportedCharacter } from '../lib/storage'
import type { ImportResumo } from '../lib/ddbImport'
import { abilityMod, armorClass, fmtMod } from '../lib/calc'
import type { Character } from '../types'
import { useMesa, useSessao } from '../hooks/useSync'
import { idsCompartilhados } from '../components/mesa-ui'
import type { FichaDaMesa } from '../lib/sync/personagens'
import { assinarFichasDaMesa, listarFichasDaMesa } from '../lib/sync/personagens'
import CharacterReadonly from '../components/CharacterReadonly'
import { Modal } from '../components/layout-ui'

export default function CharactersPage() {
  const { characters, save, remove, refresh } = useCharacters()
  const { mesa } = useMesa()
  const compartilhadas = idsCompartilhados()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const [importandoPdf, setImportandoPdf] = useState(false)
  const [preview, setPreview] = useState<{ char: Character; resumo: ImportResumo } | null>(null)

  async function importarPdf(file: File) {
    setImportandoPdf(true)
    // O leitor de PDF é pesado (~1 MB): carregado só quando o usuário importa.
    let modulo: typeof import('../lib/ddbImport')
    try {
      modulo = await import('../lib/ddbImport')
    } catch (e) {
      console.error(e)
      setImportandoPdf(false)
      alert('O leitor de PDF não está disponível nesta versão do app (ele é carregado à parte). Rode o app completo para importar fichas do D&D Beyond.')
      return
    }
    try {
      setPreview(await modulo.importarFichaDdb(file))
    } catch (e) {
      console.error(e)
      alert('Não consegui ler este PDF. Ele precisa ser a ficha exportada pelo D&D Beyond (menu do personagem → Export → PDF).')
    } finally {
      setImportandoPdf(false)
    }
  }

  function criar() {
    const ficha = novaFicha()
    save(ficha)
    navigate(`/fichas/${ficha.id}`)
  }

  async function importar(file: File) {
    try {
      const text = await file.text()
      const char = parseImportedCharacter(text)
      save(char)
      refresh()
    } catch {
      alert('Não consegui ler esse arquivo. Ele precisa ser uma ficha exportada pelo Grimório (.json).')
    }
  }

  return (
    <div>
      <PageHeader
        titulo="Suas fichas"
        subtitulo="Crie personagens pelas regras de D&D 5.5e (2024). Amigável para quem está começando."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => navigate('/fichas/novo')}>
          ✨ Criar com assistente
        </button>
        <button className="btn-ghost" onClick={criar}>
          + Ficha em branco
        </button>
        <button className="btn-ghost" onClick={() => pdfRef.current?.click()} disabled={importandoPdf}>
          {importandoPdf ? '⏳ Lendo PDF…' : '🐉 Importar do D&D Beyond (PDF)'}
        </button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          ⬆ Importar ficha (.json)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importar(f)
            e.target.value = ''
          }}
        />
        <input
          ref={pdfRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importarPdf(f)
            e.target.value = ''
          }}
        />
      </div>

      {preview && (
        <ImportPreview
          resumo={preview.resumo}
          onCancel={() => setPreview(null)}
          onConfirm={() => {
            save(preview.char)
            const id = preview.char.id
            setPreview(null)
            navigate(`/fichas/${id}`)
          }}
        />
      )}

      {characters.length === 0 ? (
        <EmptyState onCreate={() => navigate('/fichas/novo')} />
      ) : (
        <>
          {mesa && <h2 className="mb-3 panel-title">Minhas fichas</h2>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((c) => (
              <CharacterCard
                key={c.id}
                char={c}
                naMesa={mesa ? compartilhadas.includes(c.id) : false}
                onOpen={() => navigate(`/fichas/${c.id}`)}
                onDelete={() => {
                  if (confirm(`Apagar a ficha de ${c.nome || 'sem nome'}? Isso não pode ser desfeito.`)) remove(c.id)
                }}
              />
            ))}
          </div>
        </>
      )}

      <FichasDoGrupo />
    </div>
  )
}

/**
 * Fichas dos outros jogadores da mesa.
 *
 * Elas viviam escondidas dentro de Campanha → Grupo, que é um painel de DM —
 * mas ficha é assunto da aba Fichas, e o jogador também quer ver o grupo dele.
 * Aqui aparecem abaixo das suas, separadas por uma linha.
 */
function FichasDoGrupo() {
  const { mesa } = useMesa()
  const { conta } = useSessao()
  const [fichas, setFichas] = useState<FichaDaMesa[]>([])
  const [aberta, setAberta] = useState<FichaDaMesa | null>(null)

  useEffect(() => {
    if (!mesa) {
      setFichas([])
      return
    }
    const recarregar = () => void listarFichasDaMesa(mesa.id).then(setFichas)
    recarregar()
    return assinarFichasDaMesa(mesa.id, recarregar)
  }, [mesa?.id])

  // As minhas já aparecem em cima; aqui só o resto do grupo.
  const dosOutros = fichas.filter((f) => f.donoId !== conta?.id)
  if (!mesa || dosOutros.length === 0) return null

  return (
    <section className="mt-8 border-t border-white/10 pt-6">
      <h2 className="mb-1 panel-title">Grupo de {mesa.nome}</h2>
      <p className="mb-3 text-xs text-parchment-200/60">
        Fichas que os outros jogadores enviaram. Atualizam sozinhas — você vê o PV e o nível mudarem.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dosOutros.map((f) => (
          <button
            key={f.linhaId}
            type="button"
            onClick={() => setAberta(f)}
            className="card p-4 text-left transition hover:ring-1 hover:ring-arcane-400/40"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-arcane-600/30 text-xl">
                {f.ficha.avatarUrl ? (
                  <img src={f.ficha.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  '🧙'
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg text-parchment-50">
                  {f.ficha.nome || 'Sem nome'}
                </p>
                <p className="truncate text-xs text-parchment-200/60">por {f.donoNome}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              <span className="chip">{f.ficha.classe || '—'} {f.ficha.nivel}</span>
              <span className="chip">CA {armorClass(f.ficha)}</span>
              <span className="chip">
                PV {f.ficha.pvAtual}/{f.ficha.pvMax}
              </span>
            </div>
          </button>
        ))}
      </div>

      {aberta && (
        <Modal
          titulo={`${aberta.ficha.nome || 'Ficha'} — ${aberta.donoNome}`}
          largura="max-w-4xl"
          onClose={() => setAberta(null)}
        >
          <CharacterReadonly char={aberta.ficha} />
        </Modal>
      )}
    </section>
  )
}

function CharacterCard({
  char,
  onOpen,
  onDelete,
  naMesa = false,
}: {
  char: Character
  onOpen: () => void
  onDelete: () => void
  naMesa?: boolean
}) {
  return (
    <div
      className={`card group relative overflow-hidden p-5 transition hover:ring-1 hover:ring-dragon-500/40 ${
        naMesa ? 'ring-1 ring-emerald-400/40' : ''
      }`}
    >
      {/* Qual ficha está em jogo nesta mesa: quem tem várias precisa saber de
          relance qual delas o grupo está vendo. */}
      {naMesa && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-300">
          ✓ nesta mesa
        </span>
      )}
      <button className="block w-full text-left" onClick={onOpen}>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-arcane-600/30 text-lg">
            {char.avatarUrl ? (
              <img src={char.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>🧙</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-parchment-50">{char.nome || 'Sem nome'}</p>
            <p className="truncate text-xs text-parchment-200/60">
              {[char.especie, char.classe].filter(Boolean).join(' · ') || 'Personagem em branco'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 text-xs">
          <span className="chip">Nível {char.nivel}</span>
          <span className="chip">CA {armorClass(char)}</span>
          <span className="chip">PV {char.pvMax}</span>
          <span className="chip">FOR {fmtMod(abilityMod(char.atributos.for))}</span>
        </div>
      </button>
      <button
        onClick={onDelete}
        className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs text-parchment-200/40 opacity-0 transition hover:bg-dragon-500/20 hover:text-dragon-400 group-hover:opacity-100"
        aria-label="Apagar ficha"
      >
        ✕
      </button>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-4 p-12 text-center">
      <div className="text-5xl">🗡️</div>
      <div>
        <h3 className="text-xl text-parchment-50">Nenhuma ficha ainda</h3>
        <p className="mt-1 max-w-sm text-sm text-parchment-200/60">
          Comece criando seu primeiro herói. Vamos te guiar por atributos,
          perícias e combate com dicas em cada etapa.
        </p>
      </div>
      <button className="btn-primary" onClick={onCreate}>
        + Criar meu primeiro personagem
      </button>
    </div>
  )
}

function ImportPreview({
  resumo,
  onCancel,
  onConfirm,
}: {
  resumo: ImportResumo
  onCancel: () => void
  onConfirm: () => void
}) {
  const linhas: [string, string][] = [
    ['Nome', resumo.nome],
    ['Classe', resumo.origem || `${resumo.classe} ${resumo.nivel}`],
    ['Espécie', resumo.especie || '—'],
    ['Antecedente', resumo.antecedente || '—'],
    ['Perícias proficientes', String(resumo.pericias)],
    ['Ataques', String(resumo.ataques)],
    ['Magias', String(resumo.magias)],
    ['Itens no inventário', String(resumo.itens)],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="card my-8 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl text-parchment-50">🐉 Ficha lida do D&D Beyond</h2>
        <p className="mt-1 text-sm text-parchment-200/60">Confira o que encontrei antes de criar a ficha. Você poderá ajustar tudo depois.</p>
        <dl className="mt-4 divide-y divide-white/5">
          {linhas.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-1.5 text-sm">
              <dt className="text-parchment-200/60">{k}</dt>
              <dd className="text-right font-medium text-parchment-50">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" onClick={onConfirm}>✓ Criar ficha</button>
        </div>
      </div>
    </div>
  )
}

function PageHeader({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl text-parchment-50">{titulo}</h1>
      <p className="mt-1 max-w-2xl text-sm text-parchment-200/60">{subtitulo}</p>
    </div>
  )
}

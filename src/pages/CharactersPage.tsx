import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharacters } from '../hooks/useCharacters'
import { novaFicha } from '../lib/character'
import { parseImportedCharacter } from '../lib/storage'
import type { ImportResumo } from '../lib/ddbImport'
import type { Character } from '../types'
import { useMesa, useSessao } from '../hooks/useSync'
import { idsCompartilhados } from '../components/mesa-ui'
import type { FichaDaMesa } from '../lib/sync/personagens'
import { assinarFichasDaMesa, idsCompartilhadosNaMesa, listarFichasDaMesa } from '../lib/sync/personagens'
import CharacterReadonly from '../components/CharacterReadonly'
import { Modal } from '../components/layout-ui'
import { FichaCard } from '../components/ficha-card'

export default function CharactersPage() {
  const { characters, save, remove, refresh } = useCharacters()
  const { mesa } = useMesa()
  // Cache local primeiro para a tela não piscar, e a verdade da nuvem em
  // seguida — é ela que vale noutro aparelho.
  const [compartilhadas, setCompartilhadas] = useState<string[]>(() => idsCompartilhados())
  useEffect(() => {
    if (!mesa) return
    void idsCompartilhadosNaMesa(mesa.id).then(setCompartilhadas)
  }, [mesa?.id])
  // A ficha em jogo vem primeiro: numa lista de cinco personagens, o que
  // importa agora é o que está na mesa de hoje.
  const minhas = useMemo(() => {
    const emJogo = (c: Character) => (mesa && compartilhadas.includes(c.id) ? 0 : 1)
    return [...characters].sort((a, b) => emJogo(a) - emJogo(b) || b.updatedAt - a.updatedAt)
  }, [characters, mesa, compartilhadas.join(',')])
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
            {minhas.map((c) => (
              <FichaCard
                key={c.id}
                char={c}
                emJogo={!!mesa && compartilhadas.includes(c.id)}
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
          <FichaCard
            key={f.linhaId}
            char={f.ficha}
            autor={f.donoNome}
            onOpen={() => setAberta(f)}
          />
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

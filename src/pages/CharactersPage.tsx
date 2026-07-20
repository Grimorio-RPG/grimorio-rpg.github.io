import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharacters } from '../hooks/useCharacters'
import { novaFicha } from '../lib/character'
import { parseImportedCharacter } from '../lib/storage'
import { abilityMod, armorClass, fmtMod } from '../lib/calc'
import type { Character } from '../types'

export default function CharactersPage() {
  const { characters, save, remove, refresh } = useCharacters()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

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
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          ⬆ Importar ficha
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
      </div>

      {characters.length === 0 ? (
        <EmptyState onCreate={() => navigate('/fichas/novo')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <CharacterCard
              key={c.id}
              char={c}
              onOpen={() => navigate(`/fichas/${c.id}`)}
              onDelete={() => {
                if (confirm(`Apagar a ficha de ${c.nome || 'sem nome'}? Isso não pode ser desfeito.`)) remove(c.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CharacterCard({
  char,
  onOpen,
  onDelete,
}: {
  char: Character
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div className="card group relative overflow-hidden p-5 transition hover:ring-1 hover:ring-dragon-500/40">
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

function PageHeader({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl text-parchment-50">{titulo}</h1>
      <p className="mt-1 max-w-2xl text-sm text-parchment-200/60">{subtitulo}</p>
    </div>
  )
}

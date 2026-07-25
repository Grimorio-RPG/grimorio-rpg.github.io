import { useEffect, useRef, useState } from 'react'
import { apagarTudo, baixarBackup, lerBackup, restaurarBackup, type Backup, type ResumoBackup } from '../lib/backup'
import { usoDeArmazenamento } from '../lib/store'
import { PageHeader } from '../components/layout-ui'

export default function DataPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uso, setUso] = useState<{ usadoMB: number; totalMB: number } | null>(null)
  const [pendente, setPendente] = useState<{ backup: Backup; resumo: ResumoBackup } | null>(null)

  useEffect(() => {
    usoDeArmazenamento().then(setUso)
  }, [])

  async function escolherArquivo(file: File) {
    try {
      setPendente(lerBackup(await file.text()))
    } catch {
      alert('Este arquivo não é um backup do Grimório. Use o arquivo gerado pelo botão "Baixar backup".')
    }
  }

  async function confirmarRestauracao() {
    if (!pendente) return
    await restaurarBackup(pendente.backup)
    setPendente(null)
    location.reload()
  }

  return (
    <div>
      <PageHeader
        icon="💾"
        titulo="Dados & Backup"
        subtitulo="Seus dados ficam neste dispositivo. Faça backup para não perder nada e para levar a mesa para outro aparelho."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Backup */}
        <section className="card p-5">
          <h2 className="mb-2 text-lg text-parchment-100">Backup completo</h2>
          <p className="mb-4 text-sm text-parchment-200/60">
            Gera um único arquivo com <b>tudo</b>: personagens, campanha, bestiário,
            batalha em andamento, mapa e histórico de rolagens.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={baixarBackup}>⬇ Baixar backup</button>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>⬆ Restaurar backup</button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) escolherArquivo(f)
              e.target.value = ''
            }}
          />
          <p className="mt-3 text-xs text-parchment-200/50">
            Dica: faça um backup ao fim de cada sessão. Restaurar <b>substitui</b> os dados atuais.
          </p>
        </section>

        {/* Armazenamento */}
        <section className="card p-5">
          <h2 className="mb-2 text-lg text-parchment-100">Armazenamento</h2>
          {uso ? (
            <>
              <p className="text-sm text-parchment-200/70">
                Usando <b className="text-parchment-50">{uso.usadoMB} MB</b>
                {uso.totalMB > 0 && <> de aproximadamente <b className="text-parchment-50">{uso.totalMB} MB</b> disponíveis</>}.
              </p>
              {uso.totalMB > 0 && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="hpbar bg-arcane-500"
                    style={{ width: `${Math.min(100, (uso.usadoMB / uso.totalMB) * 100)}%` }}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-parchment-200/60">Seu navegador não informa o espaço usado.</p>
          )}
          <p className="mt-3 text-xs text-parchment-200/50">
            Os dados agora ficam no banco do navegador (IndexedDB), com espaço bem maior
            que o limite antigo de ~5 MB — mapas e fotos de criaturas caem sem aperto.
          </p>
        </section>

        {/* Zona de risco */}
        <section className="card border-dragon-400/30 p-5 md:col-span-2">
          <h2 className="mb-2 text-lg text-parchment-100">Apagar tudo</h2>
          <p className="mb-4 text-sm text-parchment-200/60">
            Remove todos os personagens, criaturas, campanha, mapa e histórico deste dispositivo.
            Não dá para desfazer — baixe um backup antes.
          </p>
          <button
            className="btn-ghost text-dragon-400 hover:bg-dragon-500/15"
            onClick={async () => {
              if (!confirm('Apagar TODOS os dados do Grimório neste dispositivo? Isso não pode ser desfeito.')) return
              if (!confirm('Confirmando: você já baixou um backup? Esta ação apaga tudo.')) return
              await apagarTudo()
              location.reload()
            }}
          >
            🗑 Apagar todos os dados
          </button>
        </section>
      </div>

      {/* Confirmação de restauração */}
      {pendente && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={() => setPendente(null)}>
          <div className="card gv-fade my-8 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl text-parchment-50">Restaurar este backup?</h2>
            <p className="mt-1 text-sm text-parchment-200/60">
              Os dados atuais deste dispositivo serão <b>substituídos</b>.
            </p>
            <dl className="mt-4 divide-y divide-white/5 text-sm">
              {([
                ['Criado em', pendente.resumo.criadoEm ? new Date(pendente.resumo.criadoEm).toLocaleString('pt-BR') : '—'],
                ['Personagens', String(pendente.resumo.personagens)],
                ['Criaturas', String(pendente.resumo.criaturas)],
                ['NPCs', String(pendente.resumo.npcs)],
                ['Sessões', String(pendente.resumo.sessoes)],
                ['Campanha', pendente.resumo.temCampanha ? 'sim' : 'não'],
                ['Mapa', pendente.resumo.temMapa ? 'sim' : 'não'],
                ['Batalha', pendente.resumo.temBatalha ? 'sim' : 'não'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-1.5">
                  <dt className="text-parchment-200/60">{k}</dt>
                  <dd className="text-right font-medium text-parchment-50">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setPendente(null)}>Cancelar</button>
              <button className="btn-primary" onClick={confirmarRestauracao}>Restaurar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, nuvemConfigurada } from './config'

// O cliente é carregado sob demanda: quem usa o app em modo local nunca baixa
// a biblioteca do Supabase.

let clientePromise: Promise<SupabaseClient | null> | null = null

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!nuvemConfigurada) return Promise.resolve(null)
  if (!clientePromise) {
    clientePromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            // PKCE: o retorno do login Google vem por ?code= na URL, não por
            // #access_token=. Evita conflito com o HashRouter, que usa o # para rotas.
            flowType: 'pkce',
          },
        }),
      )
      .catch(() => null)
  }
  return clientePromise
}

// Cliente Supabase público para acesso anônimo (sem persistência de sessão)
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Cliente público para formulários e páginas que não requerem autenticação
export const publicSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false, // Não persistir sessão
    autoRefreshToken: false, // Não atualizar token automaticamente
    detectSessionInUrl: false, // Não detectar sessão na URL
    storage: undefined, // Sem storage local
  },
})

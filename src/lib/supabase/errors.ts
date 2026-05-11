/**
 * Utilitários pra extrair erros de chamadas ao Supabase.
 * Equivalente Supabase de src/lib/pocketbase/errors.ts do Skip canonical.
 */
import type { PostgrestError, AuthError } from '@supabase/supabase-js'

type SupabaseError = PostgrestError | AuthError | Error | { message?: string; code?: string } | null | undefined

/**
 * Retorna a mensagem amigável de qualquer tipo de erro do Supabase.
 */
export function getErrorMessage(err: SupabaseError): string {
  if (!err) return 'Erro desconhecido'
  if (typeof err === 'string') return err
  if ('message' in err && err.message) return err.message
  return 'Erro desconhecido'
}

/**
 * Tenta extrair erros por campo (mimética da API do PB extractFieldErrors).
 * Supabase Postgres devolve `details` opcional e mensagens livres — esta
 * função aplica heurísticas simples para mapear pra `Record<string, string>`.
 */
export function extractFieldErrors(err: SupabaseError): Record<string, string> {
  const out: Record<string, string> = {}
  if (!err || typeof err === 'string') return out

  const e = err as PostgrestError & { details?: string; hint?: string }
  const msg = e.message || ''
  const details = e.details || ''

  // Padrão "duplicate key value violates unique constraint \"<name>\""
  const dupMatch = msg.match(/duplicate key value violates unique constraint ["']?(\w+)["']?/i)
  if (dupMatch) {
    const fieldGuess = dupMatch[1].replace(/_key$|_idx$/, '').split('_').pop() || dupMatch[1]
    out[fieldGuess] = 'Já existe um registro com este valor'
    return out
  }

  // Padrão "null value in column \"<col>\" violates not-null constraint"
  const nullMatch = msg.match(/null value in column ["']?(\w+)["']?/i)
  if (nullMatch) {
    out[nullMatch[1]] = 'Campo obrigatório'
    return out
  }

  // Padrão "new row for relation \"<t>\" violates check constraint \"<c>\""
  const checkMatch = msg.match(/violates check constraint ["']?(\w+)["']?/i)
  if (checkMatch) {
    out._global = `Valor inválido: ${details || checkMatch[1]}`
    return out
  }

  // Auth-specific
  if (msg.includes('Invalid login credentials')) {
    out._global = 'E-mail ou senha inválidos'
    return out
  }
  if (msg.includes('User already registered')) {
    out.email = 'Este e-mail já está cadastrado'
    return out
  }

  out._global = msg
  return out
}

/**
 * Retorna true se o erro é de RLS (Row Level Security).
 */
export function isRlsError(err: SupabaseError): boolean {
  if (!err || typeof err === 'string') return false
  const e = err as PostgrestError
  return e.code === '42501' || (e.message || '').toLowerCase().includes('row-level security')
}

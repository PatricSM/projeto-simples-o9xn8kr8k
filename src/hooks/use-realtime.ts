/**
 * Hook pra subscribe em mudanças de uma tabela Supabase em tempo real.
 * Equivalente Supabase de use-realtime.ts (que no Skip canonical usa PB).
 *
 * Uso:
 *   useRealtime('campaigns', (payload) => {
 *     // refetch ou update local state
 *   })
 */
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type RealtimeCallback = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
type Event = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export function useRealtime(
  table: string,
  callback: RealtimeCallback,
  options: { event?: Event; filter?: string; enabled?: boolean } = {},
) {
  const { event = '*', filter, enabled = true } = options
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(`realtime:${table}:${filter || 'all'}`)
      // @ts-expect-error - Supabase typings narrow event union too aggressively
      .on(
        'postgres_changes',
        { event, schema: 'public', table, filter },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          callbackRef.current(payload)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, filter, enabled])
}

export default useRealtime

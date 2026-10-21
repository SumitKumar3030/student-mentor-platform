import { useEffect, useRef } from 'react'
import { sessionsApi } from '@/lib/api'
import { useRoomStore } from '@/store/roomStore'

const SNAPSHOT_INTERVAL_MS = 30_000 // every 30 seconds

export function useAutoSnapshot(sessionId: string | undefined, enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled || !sessionId) return

    const save = async () => {
      const { code, language } = useRoomStore.getState()
      if (!code) return

      try {
        await sessionsApi.snapshot(sessionId, language, code)
        console.log('💾 snapshot saved')
      } catch (err) {
        console.warn('snapshot failed:', err)
      }
    }

    intervalRef.current = setInterval(save, SNAPSHOT_INTERVAL_MS)

    // Save immediately on unmount (user navigated away)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      save()
    }
  }, [sessionId, enabled])
}
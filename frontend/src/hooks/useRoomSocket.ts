import { useEffect, useCallback, useRef } from 'react'
import { connectSocket } from '@/lib/socket'
import { useRoomStore } from '@/store/roomStore'

interface UseRoomSocketArgs {
  sessionId: string
  userId: string
  name: string
  role: 'mentor' | 'student'
  enabled: boolean
  onSessionEnded?: () => void
}

export function useRoomSocket({
  sessionId,
  userId,
  name,
  role,
  enabled,
  onSessionEnded,
}: UseRoomSocketArgs) {
  const socketRef = useRef(connectSocket())

  useEffect(() => {
    if (!enabled) return
    const socket = socketRef.current

    if (!socket.connected) socket.connect()

    const handleConnect = () => {
      socket.emit('join_room', { sessionId, userId, name, role })
    }

    if (socket.connected) handleConnect()
    else socket.on('connect', handleConnect)

    socket.on('code_update', ({ code }: { code: string }) => {
      useRoomStore.getState().setCode(code)
    })

    socket.on('language_update', ({ language, code }: { language: string; code: string }) => {
      useRoomStore.setState({ language })
      useRoomStore.getState().setCode(code)
    })

        socket.on('cursor_update', (data: { userId: string; name: string; position: { lineNumber: number; column: number } }) => {
      useRoomStore.getState().setRemoteCursor(data)
    })

    socket.on('user_left', ({ userId: leftId }: { userId: string }) => {
      useRoomStore.getState().clearRemoteCursor(leftId)
    })

    socket.on('session_ended', () => {
      onSessionEnded?.()
    })

    return () => {
      socket.off('connect', handleConnect)
      socket.off('code_update')
      socket.off('language_update')
      socket.off('cursor_update')
      socket.off('user_left')
      socket.off('session_ended')
    }
  }, [enabled, sessionId, userId, name, role, onSessionEnded])

  const emitCodeChange = useCallback((code: string) => {
    socketRef.current.emit('code_change', { sessionId, code })
  }, [sessionId])

  const emitCursorMove = useCallback((position: { lineNumber: number; column: number }) => {
    socketRef.current.emit('cursor_move', { sessionId, userId, name, position })
  }, [sessionId, userId, name])

  const emitLanguageChange = useCallback((language: string, code: string) => {
    socketRef.current.emit('language_change', { sessionId, language, code })
  }, [sessionId])

  return { emitCodeChange, emitCursorMove, emitLanguageChange }
}
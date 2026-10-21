import { useEffect, useCallback } from 'react'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { useRoomStore } from '@/store/roomStore'
import type { Socket } from 'socket.io-client'

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
  const setCode = useRoomStore((s) => s.setCode)
  const setLanguage = useRoomStore((s) => s.setLanguage)
  const setRemoteCursor = useRoomStore((s) => s.setRemoteCursor)
  const clearRemoteCursor = useRoomStore((s) => s.clearRemoteCursor)

  useEffect(() => {
    if (!enabled) return

    const socket: Socket = connectSocket()

    socket.emit('join_room', { sessionId, userId, name, role })

    const handleCodeUpdate = ({ code }: { code: string }) => {
      setCode(code)
    }

    const handleLanguageUpdate = ({
      language,
      code,
    }: {
      language: string
      code: string
    }) => {
      useRoomStore.setState({ language })
      setCode(code)
    }

    const handleCursorUpdate = (data: {
      userId: string
      name: string
      position: { lineNumber: number; column: number }
    }) => {
      setRemoteCursor(data)
    }

    const handleUserLeft = ({ userId: leftId }: { userId: string }) => {
      clearRemoteCursor(leftId)
    }

    const handleSessionEnded = () => {
      onSessionEnded?.()
    }

    socket.on('code_update', handleCodeUpdate)
    socket.on('language_update', handleLanguageUpdate)
    socket.on('cursor_update', handleCursorUpdate)
    socket.on('user_left', handleUserLeft)
    socket.on('session_ended', handleSessionEnded)

    return () => {
      socket.off('code_update', handleCodeUpdate)
      socket.off('language_update', handleLanguageUpdate)
      socket.off('cursor_update', handleCursorUpdate)
      socket.off('user_left', handleUserLeft)
      socket.off('session_ended', handleSessionEnded)
      // ⚠️ DO NOT call clearAllRemoteCursors() here — causes infinite loop
      disconnectSocket()
    }
  }, [
    enabled,
    sessionId,
    userId,
    name,
    role,
    setCode,
    setLanguage,
    setRemoteCursor,
    clearRemoteCursor,
    onSessionEnded,
  ])

  const emitCodeChange = useCallback(
    (code: string) => {
      const socket = connectSocket()
      socket.emit('code_change', { sessionId, code })
    },
    [sessionId]
  )

  const emitCursorMove = useCallback(
    (position: { lineNumber: number; column: number }) => {
      const socket = connectSocket()
      socket.emit('cursor_move', { sessionId, userId, name, position })
    },
    [sessionId, userId, name]
  )

  const emitLanguageChange = useCallback(
    (language: string, code: string) => {
      const socket = connectSocket()
      socket.emit('language_change', { sessionId, language, code })
    },
    [sessionId]
  )

  return { emitCodeChange, emitCursorMove, emitLanguageChange }
}
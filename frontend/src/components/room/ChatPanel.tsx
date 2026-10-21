import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { connectSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  userId: string
  name: string
  content: string
  createdAt: string
}

interface Props {
  sessionId: string
}

export default function ChatPanel({ sessionId }: Props) {
  const { user, profile } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load existing messages
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('load messages error:', error)
        return
      }

      if (data) {
        // Fetch profile names in one shot
        const userIds = [...new Set(data.map((m) => m.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)

        const nameMap = new Map((profiles || []).map((p) => [p.id, p.name]))

        setMessages(
          data.map((m) => ({
            id: m.id,
            userId: m.user_id,
            name: nameMap.get(m.user_id) || 'Unknown',
            content: m.content,
            createdAt: m.created_at,
          }))
        )
      }
    }

    load()
  }, [sessionId])

  // Listen for incoming messages
  useEffect(() => {
    const socket = connectSocket()

    const handler = (msg: {
      id: string
      sessionId: string
      userId: string
      name: string
      content: string
      createdAt: string
    }) => {
      // Avoid duplicates
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    }

    socket.on('chat_message', handler)
    return () => {
      socket.off('chat_message', handler)
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() || !user) return

    const socket = connectSocket()
    socket.emit('chat_message', {
      sessionId,
      userId: user.id,
      name: profile?.name || 'User',
      content: input.trim(),
    })

    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Chat</h3>
        <span className="text-[10px] uppercase text-neutral-500">Live</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-xs text-neutral-600 py-8">
            No messages yet — say hi 👋
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.userId === user?.id
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] text-neutral-500 mb-1 px-1">
                {isMine ? 'You' : msg.name}
              </div>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm wrap-break-word ${
                  isMine
                    ? 'bg-violet-600 text-white'
                    : 'bg-neutral-800 text-neutral-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-neutral-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
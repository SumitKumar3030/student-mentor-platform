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
  const [aiTyping, setAiTyping] = useState(false)
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

  // Listen for incoming messages & AI typing
  useEffect(() => {
    const socket = connectSocket()

    const handleMessage = (msg: {
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

    const handleAiTyping = ({ isTyping }: { isTyping: boolean }) => {
      setAiTyping(isTyping)
    }

    socket.on('chat_message', handleMessage)
    socket.on('ai_typing', handleAiTyping)

    return () => {
      socket.off('chat_message', handleMessage)
      socket.off('ai_typing', handleAiTyping)
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiTyping])

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
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
        <h3 className="text-sm font-semibold text-white">Chat</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">Live</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-xs text-neutral-600 py-8">
            No messages yet — say hi 👋 <br/>
            <span className="text-[10px] mt-2 block">Tip: Type <span className="text-brand-400 font-mono">@AI</span> to ask the assistant</span>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.userId === user?.id
          const isAI = msg.userId === 'ai-mentor-id'

          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`text-[10px] mb-1 px-1 font-medium ${isAI ? 'text-brand-400' : 'text-neutral-500'}`}>
                {isMine ? 'You' : msg.name}
              </div>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm wrap-break-word ${
                  isMine
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : isAI 
                      ? 'bg-brand-500/10 border border-brand-500/20 text-neutral-200 rounded-bl-sm'
                      : 'bg-neutral-800 text-neutral-100 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        
        {aiTyping && (
          <div className="flex flex-col items-start">
            <div className="text-[10px] text-brand-400 mb-1 px-1 font-medium">✨ AI Mentor</div>
            <div className="bg-brand-500/10 border border-brand-500/20 text-brand-300 px-3 py-2 rounded-xl rounded-bl-sm text-sm flex gap-1 items-center">
              <span className="animate-pulse">Thinking</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
              <span className="animate-bounce delay-300">.</span>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-neutral-800 bg-neutral-900/50">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type @AI to ask the assistant..."
            className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-colors text-white"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
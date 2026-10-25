import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { sessionsApi, type HistorySession } from '@/lib/api'
import { toast } from 'sonner'
import { LogOut, Video, Users, Copy, Loader2, X, Play, Clock } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile, user, signOut } = useAuthStore()

  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [code, setCode] = useState('')
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false)
  const [createdSession, setCreatedSession] = useState<{ id: string; code: string; joinToken: string } | null>(null)
  
  // History State
    const [history, setHistory] = useState<HistorySession[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Load History on mount
  useEffect(() => {
    if (!user) return
    const loadHistory = async () => {
      try {
        const data = await sessionsApi.history(user.id)
        setHistory(data)
      } catch {
        console.error('Failed to load history')
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [user])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!sessionTitle.trim()) {
      toast.error('Please enter a session title')
      return
    }

    setCreating(true)
    try {
      const session = await sessionsApi.create(user.id, sessionTitle, 'javascript', 60)
      setCreatedSession({ id: session.id, code: session.code, joinToken: session.joinToken })
      setShowCreateModal(false)
      setShowShareModal(true)
      setSessionTitle('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!user) return
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      toast.error('Enter a valid 6-digit code')
      return
    }

    setJoining(true)
    try {
      const session = await sessionsApi.resolve(code)
      const result = await sessionsApi.join(session.id, user.id)
      toast.success('Joined session')
      navigate(`/room/${result.id}`)
        } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to join session')
    } finally {
      setJoining(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  const joinLink = createdSession ? `${window.location.origin}/join/${createdSession.code}` : ''

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Top Nav */}
      <nav className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold">
            <span className="text-white">Code</span>
            <span className="text-violet-400">Mentor</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">{profile?.name || user?.email}</span>
            <button
              onClick={async () => { await signOut(); navigate('/login') }}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-neutral-400">Start a new session or join one with a code.</p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:border-violet-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
              <Video className="text-violet-400" size={24} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Start a Session</h2>
            <p className="text-neutral-400 text-sm mb-6">You'll become the mentor. Get a code + link to share.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition-colors"
            >
              Start Session
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:border-violet-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
              <Users className="text-violet-400" size={24} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Join a Session</h2>
            <p className="text-neutral-400 text-sm mb-6">Enter the 6-digit code from your mentor.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="flex-1 px-3 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-center text-lg tracking-[0.3em] font-mono focus:border-violet-500 outline-none"
                maxLength={6}
              />
              <button
                onClick={handleJoin}
                disabled={joining || code.length !== 6}
                className="px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg font-medium transition-colors"
              >
                {joining ? <Loader2 size={18} className="animate-spin" /> : 'Join'}
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
          
          {loadingHistory ? (
            <div className="text-neutral-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              No past sessions found.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div key={session.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{session.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-1">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(session.startedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="uppercase text-violet-400 font-semibold">{session.role}</span>
                      <span>•</span>
                      {session.role === 'mentor' ? (
                        <span>Student: {session.studentName || 'None'}</span>
                      ) : (
                        <span>Mentor: {session.mentorName}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* If user is Mentor AND recording exists */}
                    {session.role === 'mentor' && session.recording ? (
                      <button
                       onClick={() => navigate(`/watch/${session.recording?.share_token}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Play size={16} /> Watch Recording
                      </button>
                    ) : null}
                    
                    {session.role === 'mentor' && !session.recording ? (
                       <span className="text-xs text-neutral-500 italic px-2">No recording</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-1 hover:bg-neutral-800 rounded-lg">
              <X size={18} />
            </button>
            <h3 className="text-xl font-semibold mb-4">Name your session</h3>
            <form onSubmit={handleCreateSubmit}>
              <input
                type="text"
                autoFocus
                placeholder="e.g. React Hooks Debugging"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-3 py-3 bg-neutral-800 border border-neutral-700 rounded-lg mb-6 focus:border-violet-500 outline-none"
              />
              <button
                type="submit"
                disabled={creating || !sessionTitle.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg font-medium flex justify-center items-center"
              >
                {creating ? <Loader2 className="animate-spin" size={18} /> : 'Create Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && createdSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 p-1 hover:bg-neutral-800 rounded-lg">
              <X size={18} />
            </button>
            <h3 className="text-xl font-semibold mb-1">Session ready!</h3>
            <p className="text-neutral-400 text-sm mb-6">Share with your student to join.</p>
            
            <div className="mb-4">
              <label className="block text-xs text-neutral-400 mb-2 font-medium">🔗 LINK</label>
              <div className="flex gap-2">
                <input readOnly value={joinLink} className="flex-1 px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-mono truncate" />
                <button onClick={() => copyToClipboard(joinLink, 'Link')} className="px-3 bg-violet-600 hover:bg-violet-500 rounded-lg"><Copy size={16} /></button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs text-neutral-400 mb-2 font-medium">🔢 CODE</label>
              <div className="flex gap-2">
                <input readOnly value={createdSession.code} className="flex-1 px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-center text-xl tracking-[0.4em] font-mono font-semibold" />
                <button onClick={() => copyToClipboard(createdSession.code, 'Code')} className="px-3 bg-violet-600 hover:bg-violet-500 rounded-lg"><Copy size={16} /></button>
              </div>
            </div>

            <button onClick={() => navigate(`/room/${createdSession.id}`)} className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium">
              Enter Room →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
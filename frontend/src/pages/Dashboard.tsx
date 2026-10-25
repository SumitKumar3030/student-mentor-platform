import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { sessionsApi } from '@/lib/api'
import { toast } from 'sonner'
import { 
  LogOut, Video, Users, Copy, Loader2, X, Play, Clock, 
  Settings, LayoutDashboard, History, Plus, Calendar, 
  CheckCircle2, MonitorPlay
} from 'lucide-react'
import PairPulseLogo from '@/components/PairPulseLogo'

type HistorySession = {
  id: string;
  title: string;
  code: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  role: string;
  mentorName: string;
  studentName: string | null;
  recording: { share_token: string; duration_seconds: number } | null;
}

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
  const [stats, setStats] = useState({ totalSessions: 0, totalMinutes: 0, totalRecordings: 0, role: 'Student' })
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    if (!user) return
    const loadHistory = async () => {
      try {
        const data = await sessionsApi.history(user.id)
        setHistory(data.sessions)
        setStats(data.stats)
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
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex">
      
      {/* 🛠️ SIDEBAR */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900/50 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <PairPulseLogo className="w-7 h-7 mr-2" />
          <span className="text-lg font-bold text-white tracking-tight">PairPulse</span>
        </div>
        
        <div className="p-4 flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-brand-500/10 text-brand-400 rounded-lg text-sm font-medium">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg text-sm font-medium transition-colors">
            <History size={18} /> History
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg text-sm font-medium transition-colors">
            <Settings size={18} /> Settings
          </button>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={async () => { await signOut(); navigate('/login') }} className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-sm font-medium transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-neutral-800 bg-[#0a0a0a]">
          <div>
            <h1 className="text-xl font-semibold text-white">{greeting}, {profile?.name?.split(' ')[0] || 'there'} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-500/20"
            >
              <Plus size={16} /> Start Session
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-neutral-400 mb-3">
                  <Video size={16} className="text-brand-400" /> <span className="text-xs font-medium uppercase tracking-wider">Total Sessions</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-neutral-400 mb-3">
                  <Clock size={16} className="text-brand-400" /> <span className="text-xs font-medium uppercase tracking-wider">Time Spent</span>
                </div>
                <p className="text-3xl font-bold text-white">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-neutral-400 mb-3">
                  <MonitorPlay size={16} className="text-brand-400" /> <span className="text-xs font-medium uppercase tracking-wider">Recordings</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalRecordings}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-neutral-400 mb-3">
                  <CheckCircle2 size={16} className="text-brand-400" /> <span className="text-xs font-medium uppercase tracking-wider">Account Type</span>
                </div>
                <p className="text-xl font-bold text-white mt-1">{stats.role}</p>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-white mb-1">Join a Session</h3>
                  <p className="text-sm text-neutral-400 mb-4">Enter the 6-digit code shared by your mentor.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="flex-1 px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-center text-lg tracking-[0.3em] font-mono focus:border-brand-500 outline-none"
                    maxLength={6}
                  />
                  <button
                    onClick={handleJoin}
                    disabled={joining || code.length !== 6}
                    className="px-6 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-lg font-medium transition-colors text-white"
                  >
                    {joining ? <Loader2 size={18} className="animate-spin" /> : 'Join'}
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-brand-900/40 to-neutral-900 border border-brand-500/20 rounded-xl p-6 flex flex-col items-start justify-center relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl" />
                <h3 className="font-semibold text-white mb-1 z-10">Become a Mentor</h3>
                <p className="text-sm text-neutral-400 mb-4 z-10">Create a room, share your screen, and start teaching.</p>
                <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors z-10">
                  Create Session
                </button>
              </div>
            </div>

            {/* History Box (Scrollable) */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
              <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                <h3 className="font-semibold text-white">Recent Sessions</h3>
                <span className="text-xs text-neutral-500">{history.length} sessions</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {loadingHistory ? (
                  <div className="h-full flex items-center justify-center text-neutral-500 gap-2">
                    <Loader2 className="animate-spin" size={18} /> Loading history...
                  </div>
                ) : history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                    <Calendar size={32} className="mb-3 opacity-50" />
                    <p>No past sessions found.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {history.map((session) => (
                      <div key={session.id} className="group flex items-center justify-between p-3 hover:bg-neutral-800/50 rounded-lg transition-colors border border-transparent hover:border-neutral-800">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${session.role === 'mentor' ? 'bg-brand-500/10 text-brand-400' : 'bg-neutral-800 text-neutral-400'}`}>
                            {session.role === 'mentor' ? <Video size={18} /> : <Users size={18} />}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{session.title}</p>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                              <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className={session.role === 'mentor' ? 'text-brand-400 font-medium' : 'text-neutral-400 font-medium'}>
                                {session.role}
                              </span>
                              <span>•</span>
                              <span>{session.role === 'mentor' ? `Student: ${session.studentName || 'None'}` : `Mentor: ${session.mentorName}`}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {session.role === 'mentor' && session.recording && (
                            <button
                              onClick={() => navigate(`/watch/${session.recording?.share_token}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-md text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Play size={12} /> Watch
                            </button>
                          )}
                          {session.status === 'active' ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded">Live</span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-800 px-2 py-1 rounded">Ended</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-1 hover:bg-neutral-800 rounded-lg text-neutral-400">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center mb-6">
              <Video className="text-brand-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Start a new session</h3>
            <p className="text-sm text-neutral-400 mb-6">Give your session a name so you can find it in your history later.</p>
            <form onSubmit={handleCreateSubmit}>
              <input
                type="text"
                autoFocus
                placeholder="e.g. React Hooks Debugging"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-3 py-3 bg-neutral-950 border border-neutral-800 rounded-lg mb-6 focus:border-brand-500 outline-none text-white"
              />
              <button
                type="submit"
                disabled={creating || !sessionTitle.trim()}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-lg font-medium flex justify-center items-center text-white"
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
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 p-1 hover:bg-neutral-800 rounded-lg text-neutral-400">
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle2 className="text-green-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-1">Session ready!</h3>
            <p className="text-neutral-400 text-sm mb-6">Share with your student to join.</p>
            
            <div className="mb-4">
              <label className="block text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">Join Link</label>
              <div className="flex gap-2">
                <input readOnly value={joinLink} className="flex-1 px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono truncate text-neutral-300" />
                <button onClick={() => copyToClipboard(joinLink, 'Link')} className="px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"><Copy size={16} /></button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">Session Code</label>
              <div className="flex gap-2">
                <input readOnly value={createdSession.code} className="flex-1 px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-center text-xl tracking-[0.4em] font-mono font-semibold text-white" />
                <button onClick={() => copyToClipboard(createdSession.code, 'Code')} className="px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"><Copy size={16} /></button>
              </div>
            </div>

            <button onClick={() => navigate(`/room/${createdSession.id}`)} className="w-full py-3 bg-brand-600 hover:bg-brand-500 rounded-lg font-medium text-white transition-colors">
              Enter Room →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
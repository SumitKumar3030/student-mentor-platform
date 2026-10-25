import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Play } from 'lucide-react'

interface RecordingData {
  id: string
  videoUrl: string
  durationSeconds: number
  createdAt: string
}

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export default function WatchRecording() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [recording, setRecording] = useState<RecordingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    const fetchRecording = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recordings/watch/${token}`)
        const data = await res.json()

        if (!res.ok) throw new Error(data.error || 'Failed to load recording')

        setRecording(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recording')
      } finally {
        setLoading(false)
      }
    }

    fetchRecording()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-violet-400 mx-auto mb-4" />
          <p className="text-neutral-400">Loading recording...</p>
        </div>
      </div>
    )
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-semibold mb-2 text-white">Link Invalid</h1>
          <p className="text-neutral-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-lg font-bold">
            <span className="text-white">Code</span>
            <span className="text-violet-400">Mentor</span>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-violet-500/10 text-violet-300 rounded-md uppercase tracking-wider">
          Shared Recording
        </span>
      </header>

      {/* Main Video Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          {/* Video Player */}
          <div className="bg-black rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden aspect-video relative">
            <video
              src={recording.videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>

          {/* Meta Info */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div>
              <h1 className="text-lg font-semibold">Mentorship Session Recording</h1>
              <p className="text-sm text-neutral-400">
                Recorded on {new Date(recording.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-400">
              <div className="flex items-center gap-1.5">
                <Play size={14} />
                <span>{Math.floor(recording.durationSeconds / 60)} min {recording.durationSeconds % 60} sec</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
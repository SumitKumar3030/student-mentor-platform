import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  startedAt: string
  durationMinutes: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SessionTimer({ startedAt, durationMinutes }: Props) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const end = new Date(startedAt).getTime() + durationMinutes * 60 * 1000

    const tick = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000))
      setRemaining(left)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startedAt, durationMinutes])

  const isLow = remaining < 5 * 60 // under 5 min
  const isCritical = remaining < 60 // under 1 min

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono ${
        isCritical
          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
          : isLow
          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
      }`}
    >
      <Clock size={14} />
      <span>{formatTime(remaining)}</span>
    </div>
  )
}
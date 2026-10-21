import { Circle, Square } from 'lucide-react'

interface Props {
  isRecording: boolean
  recordingDuration: number
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function RecordingControls({
  isRecording,
  recordingDuration,
  onStart,
  onStop,
  disabled,
}: Props) {
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-sm">
        <Circle size={12} className="text-red-500 fill-red-500 animate-pulse" />
        <span className="font-mono text-red-400 font-semibold">
          {formatDuration(recordingDuration)}
        </span>
        <button
          onClick={onStop}
          className="ml-2 px-2 py-0.5 bg-red-600 hover:bg-red-500 rounded text-xs font-medium transition-colors flex items-center gap-1"
        >
          <Square size={10} className="fill-white" />
          Stop
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onStart}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-700 rounded-lg text-sm transition-colors"
      title="Start recording (saved to session history)"
    >
      <Circle size={12} className="text-red-500" />
      Record
    </button>
  )
}
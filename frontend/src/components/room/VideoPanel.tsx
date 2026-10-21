import { useEffect, useRef } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff } from 'lucide-react'

interface Props {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isConnected: boolean
  isMuted: boolean
  isCameraOff: boolean
  isScreenSharing: boolean
  onToggleMute: () => void
  onToggleCamera: () => void
  onToggleScreenShare: () => void
  role: 'mentor' | 'student'
  permissionError: string | null
}

export default function VideoPanel({
  localStream,
  remoteStream,
  isConnected,
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  role,
  permissionError,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

 // Attach local stream
useEffect(() => {
  const video = localVideoRef.current
  if (video && localStream) {
    video.srcObject = localStream
    video.play().catch(() => {/* autoplay blocked */})
  }
}, [localStream])

// Attach remote stream — also re-run when isConnected changes
// because <video> only renders when isConnected is true
useEffect(() => {
  const video = remoteVideoRef.current
  if (video && remoteStream) {
    video.srcObject = remoteStream
    video.play().catch(() => {/* autoplay blocked */})
  }
}, [remoteStream, isConnected])

  if (permissionError) {
    return (
      <div className="h-full flex items-center justify-center p-4 bg-neutral-900 border-b border-neutral-800">
        <div className="text-center">
          <div className="text-4xl mb-2">🚫</div>
          <p className="text-sm text-red-400 mb-2">Camera access failed</p>
          <p className="text-xs text-neutral-500 max-w-50">{permissionError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-3 bg-neutral-900 border-b border-neutral-800">
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Self video */}
        <div className="flex-1 bg-neutral-950 rounded-lg border border-neutral-800 relative overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCameraOff || isScreenSharing ? 'hidden' : ''}`}
          />

          {(isCameraOff || isScreenSharing) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center">
                {isScreenSharing ? (
                  <Monitor size={24} className="text-violet-400" />
                ) : (
                  <VideoOff size={24} className="text-neutral-500" />
                )}
              </div>
            </div>
          )}

          <span className="absolute bottom-2 left-2 text-[10px] uppercase font-semibold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded backdrop-blur">
            You ({role})
          </span>

          {isMuted && (
            <div className="absolute top-2 right-2 p-1 bg-red-500/80 rounded">
              <MicOff size={12} className="text-white" />
            </div>
          )}
        </div>

        {/* Remote video */}
        <div className="flex-1 bg-neutral-950 rounded-lg border border-neutral-800 relative overflow-hidden">
          {isConnected && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center mb-2">
                <VideoOff size={24} className="text-neutral-600" />
              </div>
              <p className="text-xs text-neutral-500">
                {role === 'mentor' ? 'Waiting for student...' : 'Waiting for mentor...'}
              </p>
            </div>
          )}

          <span className="absolute bottom-2 left-2 text-[10px] uppercase font-semibold bg-neutral-700/70 text-neutral-300 px-2 py-0.5 rounded backdrop-blur">
            {isConnected ? (role === 'mentor' ? 'Student' : 'Mentor') : 'Waiting'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <button
          onClick={onToggleMute}
          className={`p-2.5 rounded-full transition-colors ${
            isMuted
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-neutral-800 hover:bg-neutral-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`p-2.5 rounded-full transition-colors ${
            isCameraOff
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-neutral-800 hover:bg-neutral-700'
          }`}
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
        </button>

        <button
          onClick={onToggleScreenShare}
          className={`p-2.5 rounded-full transition-colors ${
            isScreenSharing
              ? 'bg-violet-600 hover:bg-violet-500'
              : 'bg-neutral-800 hover:bg-neutral-700'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
        </button>

        <div className="ml-2 flex items-center gap-1.5 text-[10px]">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-neutral-600'
            }`}
          />
          <span className="text-neutral-500">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  )
}
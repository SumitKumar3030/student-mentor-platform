import { useEffect, useRef } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff } from 'lucide-react'

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
  onEndSession?: () => void
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
  onEndSession,
  role,
  permissionError,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream, isConnected])

  if (permissionError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-neutral-900 border-b border-neutral-800">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <VideoOff size={32} className="text-red-400" />
        </div>
        <p className="text-white font-medium mb-1">Camera Access Failed</p>
        <p className="text-xs text-neutral-400 text-center max-w-[250px]">{permissionError}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col p-2 md:p-3 bg-neutral-900 border-b border-neutral-800 relative">
      
      {/* Video Grid */}
      <div className="flex-1 flex gap-2 md:gap-3 min-h-0">
        
        {/* Self Video */}
        <div className="flex-1 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden group">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOff || isScreenSharing ? 'opacity-0' : 'opacity-100'}`}
          />

          {(isCameraOff || isScreenSharing) && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                {isScreenSharing ? <Monitor size={20} className="text-brand-400" /> : <VideoOff size={20} className="text-neutral-500" />}
              </div>
            </div>
          )}

          {/* Name Tag */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              You ({role})
              {isMuted && <MicOff size={10} className="text-red-400" />}
            </span>
          </div>
        </div>

        {/* Remote Video */}
        <div className="flex-1 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden">
          {isConnected && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-2 animate-pulse">
                <VideoOff size={20} className="text-neutral-600" />
              </div>
              <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">
                Waiting...
              </p>
            </div>
          )}

          {isConnected && remoteStream && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {role === 'mentor' ? 'Student' : 'Mentor'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="mt-3 flex items-center justify-between px-2">
        
        {/* Connection Status */}
        <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-full border border-neutral-800">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
            {isConnected ? 'Connected' : 'Connecting'}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={onToggleMute}
            className={`p-2.5 rounded-xl transition-all ${
              isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <button
            onClick={onToggleCamera}
            className={`p-2.5 rounded-xl transition-all ${
              isCameraOff ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            {isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
          </button>

          <button
            onClick={onToggleScreenShare}
            className={`p-2.5 rounded-xl transition-all ${
              isScreenSharing ? 'bg-brand-500/20 text-brand-400 hover:bg-brand-500/30' : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
          </button>
          
          {onEndSession && (
            <button
              onClick={onEndSession}
              className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all ml-1"
            >
              <PhoneOff size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
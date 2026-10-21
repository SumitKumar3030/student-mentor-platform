import { useCallback, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

interface UseRecordingArgs {
  sessionId: string
  userId: string
}

interface UseRecordingResult {
  isRecording: boolean
  recordingDuration: number
  startRecording: (localStream: MediaStream, remoteStream: MediaStream) => Promise<void>
  stopRecording: () => Promise<void>
  error: string | null
}

export function useRecording({ sessionId, userId }: UseRecordingArgs): UseRecordingResult {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const drawLoopRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Stop canvas loop
    if (drawLoopRef.current) {
      cancelAnimationFrame(drawLoopRef.current)
      drawLoopRef.current = null
    }

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' })
          chunksRef.current = []

          const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)

          // Upload via multipart
          const formData = new FormData()
          formData.append('video', blob, 'recording.webm')
          formData.append('sessionId', sessionId)
          formData.append('userId', userId)
          formData.append('durationSeconds', String(durationSeconds))

          const uploadRes = await fetch(`${API_URL}/api/recordings/upload`, {
            method: 'POST',
            body: formData,
          })

          if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => ({}))
            throw new Error(err.error || 'Upload failed')
          }

          const result = await uploadRes.json()
          console.log('✅ Recording uploaded:', result)
        } catch (err) {
          console.error('upload error:', err)
          setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
          setIsRecording(false)
          setRecordingDuration(0)
          recorderRef.current = null
          canvasRef.current = null

          // Cleanup audio context
          if (audioCtxRef.current) {
            audioCtxRef.current.close()
            audioCtxRef.current = null
          }

          resolve()
        }
      }

      recorder.stop()
    })
  }, [sessionId, userId])

  const startRecording = useCallback(
    async (localStream: MediaStream, remoteStream: MediaStream) => {
      if (isRecording) return
      setError(null)

      try {
        // ---- CANVAS COMPOSITION (side-by-side video) ----
        const canvas = document.createElement('canvas')
        canvas.width = 1280
        canvas.height = 720
        canvasRef.current = canvas
        const ctx = canvas.getContext('2d')!

        // Hidden video elements to draw frames from
        const localVideo = document.createElement('video')
        localVideo.srcObject = localStream
        localVideo.muted = true
        localVideo.play()

        const remoteVideo = document.createElement('video')
        remoteVideo.srcObject = remoteStream
        remoteVideo.muted = true
        remoteVideo.play()

        // Draw loop — composite both streams side-by-side
        const draw = () => {
          // Background
          ctx.fillStyle = '#0a0a0a'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Local (left)
          if (localVideo.videoWidth > 0) {
            ctx.drawImage(localVideo, 0, 0, canvas.width / 2, canvas.height)
          }

          // Remote (right)
          if (remoteVideo.videoWidth > 0) {
            ctx.drawImage(
              remoteVideo,
              canvas.width / 2,
              0,
              canvas.width / 2,
              canvas.height
            )
          }

          // Labels
          ctx.fillStyle = 'rgba(139, 92, 246, 0.9)'
          ctx.fillRect(16, canvas.height - 44, 80, 28)
          ctx.fillRect(canvas.width / 2 + 16, canvas.height - 44, 100, 28)

          ctx.fillStyle = 'white'
          ctx.font = 'bold 14px sans-serif'
          ctx.fillText('YOU', 32, canvas.height - 25)
          ctx.fillText('PEER', canvas.width / 2 + 32, canvas.height - 25)

          drawLoopRef.current = requestAnimationFrame(draw)
        }
        draw()

        // ---- AUDIO MIXING ----
        const audioCtx = new AudioContext()
        audioCtxRef.current = audioCtx
        const dest = audioCtx.createMediaStreamDestination()

        if (localStream.getAudioTracks().length > 0) {
          const src = audioCtx.createMediaStreamSource(localStream)
          src.connect(dest)
        }
        if (remoteStream.getAudioTracks().length > 0) {
          const src = audioCtx.createMediaStreamSource(remoteStream)
          src.connect(dest)
        }

        // ---- COMBINE CANVAS + AUDIO INTO ONE STREAM ----
        const mixed = new MediaStream()
        canvas.captureStream(24).getVideoTracks().forEach((t) => mixed.addTrack(t))
        dest.stream.getAudioTracks().forEach((t) => mixed.addTrack(t))

        // ---- RECORDER ----
        const recorder = new MediaRecorder(mixed, {
          mimeType: 'video/webm;codecs=vp8,opus',
          videoBitsPerSecond: 800_000, // 800 kbps — low for free storage
          audioBitsPerSecond: 64_000,
        })

        recorderRef.current = recorder
        chunksRef.current = []

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.start(1000) // chunk every 1s
        startTimeRef.current = Date.now()
        setIsRecording(true)
        setRecordingDuration(0)

        // Timer for UI
        timerRef.current = setInterval(() => {
          setRecordingDuration(Math.round((Date.now() - startTimeRef.current) / 1000))
        }, 1000)

        console.log('🔴 Recording started')
      } catch (err) {
        console.error('start recording error:', err)
        setError(err instanceof Error ? err.message : 'Failed to start recording')
        setIsRecording(false)
      }
    },
    [isRecording]
  )

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    error,
  }
}
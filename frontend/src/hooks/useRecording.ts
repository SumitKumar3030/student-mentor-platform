import { useCallback, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

interface UseRecordingArgs {
  sessionId: string
  userId: string
}

export function useRecording({ sessionId, userId }: UseRecordingArgs) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    if (timerRef.current) clearInterval(timerRef.current)

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' })
          chunksRef.current = []
          const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)

          // Upload
          const formData = new FormData()
          formData.append('video', blob, 'recording.webm')
          formData.append('sessionId', sessionId)
          formData.append('userId', userId)
          formData.append('durationSeconds', String(durationSeconds))

          const uploadRes = await fetch(`${API_URL}/api/recordings/upload`, {
            method: 'POST',
            body: formData,
          })

          if (!uploadRes.ok) throw new Error('Upload failed')
        } catch (err) {
          console.error('upload error:', err)
          setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
          setIsRecording(false)
          setRecordingDuration(0)
          recorderRef.current = null
          
          // Stop screen tracks
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop())
            screenStreamRef.current = null
          }
          resolve()
        }
      }
      recorder.stop()
    })
  }, [sessionId, userId])

  const startRecording = useCallback(async () => {
    if (isRecording) return
    setError(null)

    try {
      // 🔥 ASK USER TO SHARE THEIR SCREEN/TAB
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" }, // Prompts for browser tab
        audio: true, // Captures system audio if the user shares a tab with audio
      })
      
      screenStreamRef.current = displayStream

      // Try to get the microphone audio to mix with screen
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStream.getAudioTracks().forEach(track => displayStream.addTrack(track))
      } catch {
        console.warn("No mic access for recording, recording screen only.")
      }

      const recorder = new MediaRecorder(displayStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2_500_000, // 2.5 Mbps for high quality (code needs to be readable)
      })

      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(1000)
      startTimeRef.current = Date.now()
      setIsRecording(true)
      setRecordingDuration(0)

      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.round((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      // If user clicks "Stop Sharing" in the browser UI, stop the recorder too
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording()
      }

    } catch (err) {
      console.error('start recording error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start recording')
      setIsRecording(false)
    }
  }, [isRecording, stopRecording])

  return { isRecording, recordingDuration, startRecording, stopRecording, error }
}
import { Router } from 'express'
import multer from 'multer'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase.js'

const router = Router()

// Multer: memory storage, 100 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
})

function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

// ============================================
// POST /api/recordings/upload
// Multipart: video file + sessionId + userId + durationSeconds
// ============================================
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No video file' })

    const { sessionId, userId, durationSeconds } = req.body as {
      sessionId: string
      userId: string
      durationSeconds: string
    }

    if (!sessionId || !userId) {
      return res.status(400).json({ error: 'sessionId and userId are required' })
    }

    // Verify session exists and user is a participant
    const { data: session, error: sessErr } = await supabase
      .from('sessions')
      .select('id, mentor_id, student_id')
      .eq('id', sessionId)
      .maybeSingle()

    if (sessErr || !session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (session.mentor_id !== userId && session.student_id !== userId) {
      return res.status(403).json({ error: 'Not a participant in this session' })
    }

    // Build storage path: sessionId/recordingId.webm
    const recordingId = nanoid()
    const storagePath = `${sessionId}/${recordingId}.webm`
    const shareToken = nanoid(24)

    // Upload to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from('recordings')
      .upload(storagePath, file.buffer, {
        contentType: 'video/webm',
        upsert: false,
      })

    if (uploadErr) {
      console.error('storage upload error:', uploadErr)
      return res.status(500).json({ error: uploadErr.message })
    }

    // Insert DB row
    const { data: recording, error: dbErr } = await supabase
      .from('recordings')
      .insert({
        session_id: sessionId,
        recorded_by: userId,
        storage_path: storagePath,
        share_token: shareToken,
        duration_seconds: parseInt(durationSeconds || '0', 10),
        size_bytes: file.size,
        mime_type: 'video/webm',
        status: 'ready',
      })
      .select()
      .single()

    if (dbErr) {
      console.error('recording db insert error:', dbErr)
      // Cleanup orphaned storage file
      await supabase.storage.from('recordings').remove([storagePath])
      return res.status(500).json({ error: dbErr.message })
    }

    return res.json({
      id: recording.id,
      shareToken: recording.share_token,
      watchUrl: `/watch/${recording.share_token}`,
      sizeBytes: recording.size_bytes,
      durationSeconds: recording.duration_seconds,
    })
  } catch (err: unknown) {
    console.error('upload threw:', err)
    return res.status(500).json({ error: getMessage(err) })
  }
})

// ============================================
// GET /api/recordings/session/:sessionId
// List recordings for a session
// ============================================
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params

    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    return res.json(
      (data || []).map((r) => ({
        id: r.id,
        shareToken: r.share_token,
        watchUrl: `/watch/${r.share_token}`,
        durationSeconds: r.duration_seconds,
        sizeBytes: r.size_bytes,
        status: r.status,
        createdAt: r.created_at,
      }))
    )
  } catch (err: unknown) {
    return res.status(500).json({ error: getMessage(err) })
  }
})

export default router
import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { generateUniqueCode, generateJoinToken } from '../lib/codes.js'
import { z } from 'zod'

function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

const router = Router()

// ============================================
// Validation schemas
// ============================================
const createSchema = z.object({
  language: z.string().min(1).default('javascript'),
  durationMinutes: z.number().int().min(5).max(180).default(60),
})

// ============================================
// POST /api/sessions/create
// Mentor creates a session
// ============================================
router.post('/create', async (req, res) => {
  try {
    // TODO: In production, replace with JWT auth middleware.
    // For dev, we trust the userId sent in the body.
    const userId = req.body.userId as string | undefined
    if (!userId) {
      return res.status(401).json({ error: 'userId is required' })
    }

    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }

    const { language, durationMinutes } = parsed.data

    const code = await generateUniqueCode()
    const joinToken = generateJoinToken()

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        code,
        join_token: joinToken,
        mentor_id: userId,
        language,
        duration_minutes: durationMinutes,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('create session error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.json({
      id: data.id,
      code: data.code,
      joinToken: data.join_token,
      language: data.language,
      durationMinutes: data.duration_minutes,
    })
  } catch (err: any) {
    console.error('create session threw:', err)
    return res.status(500).json({ error: err.message })
  }
})

// ============================================
// GET /api/sessions/resolve/:slug
// Resolve code OR token → session info (no join yet)
// ============================================
router.get('/resolve/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const isCode = /^\d{6}$/.test(slug)

    let query = supabase
      .from('sessions')
      .select('id, code, join_token, mentor_id, student_id, language, status, duration_minutes, started_at')
      .eq('status', 'active')

    query = isCode
      ? query.eq('code', slug)
      : query.eq('join_token', slug)

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('resolve error:', error)
      return res.status(500).json({ error: error.message })
    }

    if (!data) {
      return res.status(404).json({ error: 'Session not found or has ended' })
    }

    return res.json({
      id: data.id,
      code: data.code,
      joinToken: data.join_token,
      mentorId: data.mentor_id,
      studentId: data.student_id,
      language: data.language,
      status: data.status,
      durationMinutes: data.duration_minutes,
      startedAt: data.started_at,
    })
  } catch (err: any) {
    console.error('resolve threw:', err)
    return res.status(500).json({ error: err.message })
  }
})

// ============================================
// POST /api/sessions/:id/join
// Student joins a session
// ============================================
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.body.userId as string | undefined
    if (!userId) {
      return res.status(401).json({ error: 'userId is required' })
    }

    // Fetch session
    const { data: session, error: fetchErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr) {
      console.error('join fetch error:', fetchErr)
      return res.status(500).json({ error: fetchErr.message })
    }

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session has ended' })
    }

    // Mentor clicking their own link → just let them in
    if (session.mentor_id === userId) {
      return res.json({ id: session.id, role: 'mentor' })
    }

    // Someone else already joined
    if (session.student_id && session.student_id !== userId) {
      return res.status(400).json({ error: 'Session is already full' })
    }

    // Idempotent join
    if (session.student_id === userId) {
      return res.json({ id: session.id, role: 'student' })
    }

    // Claim as student
    const { error: updateErr } = await supabase
      .from('sessions')
      .update({ student_id: userId })
      .eq('id', id)
      .is('student_id', null) // guard against race

    if (updateErr) {
      console.error('join update error:', updateErr)
      return res.status(500).json({ error: updateErr.message })
    }

    return res.json({ id: session.id, role: 'student' })
  } catch (err: any) {
    console.error('join threw:', err)
    return res.status(500).json({ error: err.message })
  }
})

// ============================================
// POST /api/sessions/:id/end
// End a session (mentor only)
// ============================================
router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.body.userId as string | undefined
    const { language, code } = (req.body || {}) as { language?: string; code?: string }

    if (!userId) return res.status(401).json({ error: 'userId is required' })

    // Save final snapshot if code provided
    if (language && typeof code === 'string') {
      const { error: snapErr } = await supabase
        .from('code_snapshots')
        .insert({ session_id: id, language, code })

      if (snapErr) console.error('final snapshot error:', snapErr)
    }

    // Mark session ended
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', id)
      .eq('mentor_id', userId)

    if (error) {
      console.error('end session error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.json({ ok: true })
  } catch (err: unknown) {
    return res.status(500).json({ error: getMessage(err) })
  }
})

// ============================================
// POST /api/sessions/:id/snapshot
// Save current code state
// ============================================
router.post('/:id/snapshot', async (req, res) => {
  try {
    const { id } = req.params
    const { language, code } = req.body as { language: string; code: string }

    if (!language || typeof code !== 'string') {
      return res.status(400).json({ error: 'language and code are required' })
    }

    const { error } = await supabase
      .from('code_snapshots')
      .insert({ session_id: id, language, code })

    if (error) {
      console.error('snapshot insert error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.json({ ok: true })
  } catch (err: unknown) {
    return res.status(500).json({ error: getMessage(err) })
  }
})

// ============================================
// POST /api/sessions/:id/end
// (already exists — but now also saves final snapshot)
// ============================================


export default router
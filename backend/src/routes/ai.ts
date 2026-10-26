import { Router } from 'express'
import { explainCode } from '../lib/ai.js'

const router = Router()

router.post('/explain', async (req, res) => {
  try {
    const { code, language } = req.body
    if (!code) return res.status(400).json({ error: 'Code is required' })

    const explanation = await explainCode(code, language || 'javascript')
    return res.json({ explanation })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to explain code' })
  }
})

export default router
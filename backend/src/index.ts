import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import sessionsRouter from './routes/sessions.js'
import { setupSocket } from './socket/index.js'
import recordingsRouter from './routes/recordings.js'


const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/sessions', sessionsRouter)

app.use('/api/recordings', recordingsRouter)

const server = createServer(app)

// 🔌 Attach Socket.IO
setupSocket(server)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
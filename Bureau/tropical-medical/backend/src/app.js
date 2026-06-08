require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const authRoutes           = require('./routes/auth.routes')
const patientRoutes        = require('./routes/patient.routes')
const medecinRoutes        = require('./routes/medecin.routes')
const receptionnisteRoutes = require('./routes/receptionniste.routes')
const pharmacienRoutes     = require('./routes/pharmacien.routes')
const adminRoutes          = require('./routes/admin.routes')
const notifRoutes          = require('./routes/notifications.routes')
const messagerieRoutes     = require('./routes/messagerie.routes')
const { demarrerCron }     = require('./cron')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})

// Rendre io accessible depuis les contrôleurs
app.set('io', io)

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/patient',  patientRoutes)
app.use('/api/medecin',         medecinRoutes)
app.use('/api/receptionniste',  receptionnisteRoutes)
app.use('/api/pharmacien',      pharmacienRoutes)
app.use('/api/admin',           adminRoutes)
app.use('/api/notifications',  notifRoutes)
app.use('/api/messagerie',     messagerieRoutes)
app.use('/api/medecins', require('./middlewares/auth'), (req, res, next) => {
  require('./controllers/patient.controller').listeMedecins(req, res, next)
})

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }))

// 404 API
app.use('/api/{*path}', (_req, res) => res.status(404).json({ message: 'Route introuvable' }))

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const { userId, role } = socket.handshake.query
  if (userId) {
    socket.join(`user:${userId}`)
    if (role) socket.join(`role:${role}`)
  }

  socket.on('disconnect', () => {
    // nettoyage automatique par socket.io
  })
})

// ── Démarrage ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Tropical Medical API — port ${PORT} (${process.env.NODE_ENV})`)
  demarrerCron(io)
})

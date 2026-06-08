const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

const INCLUDE_PROFIL = {
  medecin: true,
  patient: true,
  preferences: true,
}

function sanitize(utilisateur) {
  const { mot_de_passe, ...safe } = utilisateur
  return safe
}

async function connexion(req, res) {
  try {
    const { email, mot_de_passe } = req.body

    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Email et mot de passe requis' })
    }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: INCLUDE_PROFIL,
    })

    if (!utilisateur || !utilisateur.actif) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }

    const valide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe)
    if (!valide) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }

    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )

    return res.json({ token, utilisateur: sanitize(utilisateur) })
  } catch (err) {
    console.error('[auth.connexion]', err)
    return res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function me(req, res) {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: req.user.id },
      include: INCLUDE_PROFIL,
    })

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur introuvable' })
    }

    return res.json(sanitize(utilisateur))
  } catch (err) {
    console.error('[auth.me]', err)
    return res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function changerMotDePasse(req, res) {
  try {
    const { ancien, nouveau } = req.body

    if (!ancien || !nouveau) {
      return res.status(400).json({ message: 'Anciens et nouveau mot de passe requis' })
    }
    if (nouveau.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 6 caractères' })
    }

    const utilisateur = await prisma.utilisateur.findUnique({ where: { id: req.user.id } })
    const valide = await bcrypt.compare(ancien, utilisateur.mot_de_passe)
    if (!valide) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' })
    }

    const hash = await bcrypt.hash(nouveau, 10)
    await prisma.utilisateur.update({
      where: { id: req.user.id },
      data: { mot_de_passe: hash },
    })

    return res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (err) {
    console.error('[auth.changerMotDePasse]', err)
    return res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = { connexion, me, changerMotDePasse }

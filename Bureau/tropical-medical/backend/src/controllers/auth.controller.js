const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const sign = (user) =>
  jwt.sign({ id: user.id_util, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

exports.register = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, mot_de_passe, role } = req.body;
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const user = await prisma.utilisateur.create({
      data: { nom, prenom, telephone, email, mot_de_passe: hash, role },
    });
    res.status(201).json({ token: sign(user), user: { ...user, mot_de_passe: undefined } });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ message: 'Email déjà utilisé' });
    res.status(500).json({ message: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    const user = await prisma.utilisateur.findUnique({
      where: { email },
      include: { medecin: true, patient: true },
    });
    if (!user || !(await bcrypt.compare(mot_de_passe, user.mot_de_passe)))
      return res.status(401).json({ message: 'Identifiants incorrects' });
    if (!user.actif) return res.status(403).json({ message: 'Compte désactivé' });
    const { mot_de_passe: _, ...safe } = user;
    res.json({ token: sign(user), user: safe });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id_util: req.user.id },
      include: { medecin: true, patient: true },
      omit: { mot_de_passe: true },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { ancien, nouveau } = req.body;
    const user = await prisma.utilisateur.findUnique({ where: { id_util: req.user.id } });
    if (!(await bcrypt.compare(ancien, user.mot_de_passe)))
      return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
    await prisma.utilisateur.update({
      where: { id_util: req.user.id },
      data: { mot_de_passe: await bcrypt.hash(nouveau, 10) },
    });
    res.json({ message: 'Mot de passe modifié' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

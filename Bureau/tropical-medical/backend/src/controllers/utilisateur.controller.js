const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const users = await prisma.utilisateur.findMany({
      omit: { mot_de_passe: true },
      orderBy: { nom: 'asc' },
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id_util: +req.params.id },
      omit: { mot_de_passe: true },
      include: { medecin: true, patient: true },
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, mot_de_passe, role, specialite, service } = req.body;
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const user = await prisma.utilisateur.create({
      data: {
        nom, prenom, telephone, email, mot_de_passe: hash, role,
        ...(role === 'medecin' && specialite
          ? { medecin: { create: { specialite, service } } }
          : {}),
        ...(role === 'patient'
          ? { patient: { create: {} } }
          : {}),
      },
      include: { medecin: true, patient: true },
      omit: { mot_de_passe: true },
    });
    res.status(201).json(user);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ message: 'Email déjà utilisé' });
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, actif } = req.body;
    const user = await prisma.utilisateur.update({
      where: { id_util: +req.params.id },
      data: { nom, prenom, telephone, email, actif },
      omit: { mot_de_passe: true },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.toggleActif = async (req, res) => {
  try {
    const user = await prisma.utilisateur.findUnique({ where: { id_util: +req.params.id } });
    const updated = await prisma.utilisateur.update({
      where: { id_util: +req.params.id },
      data: { actif: !user.actif },
      omit: { mot_de_passe: true },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

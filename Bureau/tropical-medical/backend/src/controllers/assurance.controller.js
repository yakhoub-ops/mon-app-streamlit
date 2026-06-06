const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const list = await prisma.assurance.findMany({ orderBy: { nom: 'asc' } });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const a = await prisma.assurance.findUnique({ where: { id_assurance: +req.params.id } });
    if (!a) return res.status(404).json({ message: 'Assurance introuvable' });
    res.json(a);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const a = await prisma.assurance.create({ data: req.body });
    res.status(201).json(a);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const a = await prisma.assurance.update({ where: { id_assurance: +req.params.id }, data: req.body });
    res.json(a);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.assurance.delete({ where: { id_assurance: +req.params.id } });
    res.json({ message: 'Supprimée' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

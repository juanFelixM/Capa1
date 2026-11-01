const prisma = require('../db');

const actualizarPerfil = async (req, res) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  if (nombre.length > 100) {
    return res.status(400).json({ error: 'El nombre no puede superar los 100 caracteres' });
  }

  try {
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { nombre },
      select: { id: true, nombre: true, email: true, rol: true }
    });

    res.json(usuarioActualizado);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = { actualizarPerfil };

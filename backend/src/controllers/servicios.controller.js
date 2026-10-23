const prisma = require('../db');

const listarServicios = async (req, res) => {
  try {
    const servicios = await prisma.servicio.findMany();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerServicio = async (req, res) => {
  const { id } = req.params;
  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: parseInt(id, 10) }
    });
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json(servicio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearServicio = async (req, res) => {
  const { nombre, descripcion, duracion, precio } = req.body;
  try {
    const nuevoServicio = await prisma.servicio.create({
      data: {
        nombre,
        descripcion,
        duracion: parseInt(duracion, 10),
        precio: parseFloat(precio)
      }
    });
    res.status(201).json(nuevoServicio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editarServicio = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, duracion, precio } = req.body;
  try {
    const servicioActualizado = await prisma.servicio.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(duracion !== undefined && { duracion: parseInt(duracion, 10) }),
        ...(precio !== undefined && { precio: parseFloat(precio) })
      }
    });
    res.json(servicioActualizado);
  } catch (error) {
    res.status(404).json({ error: 'Servicio no encontrado' });
  }
};

const eliminarServicio = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.servicio.delete({
      where: { id: parseInt(id, 10) }
    });
    res.json({ mensaje: 'Servicio eliminado correctamente' });
  } catch (error) {
    res.status(404).json({ error: 'Servicio no encontrado' });
  }
};

module.exports = {
  listarServicios,
  obtenerServicio,
  crearServicio,
  editarServicio,
  eliminarServicio
};

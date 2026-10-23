const prisma = require('../db');

const esFechaPasada = (fechaStr, horaStr) => {
  if (!fechaStr) return true;
  const ahora = new Date();
  const partesFecha = fechaStr.split('-').map(Number);
  if (partesFecha.length !== 3 || partesFecha.some(isNaN)) return true;

  const [anio, mes, dia] = partesFecha;
  if (horaStr && /^\d{1,2}:\d{2}$/.test(horaStr.trim())) {
    const [horas, minutos] = horaStr.trim().split(':').map(Number);
    const fechaHoraReserva = new Date(anio, mes - 1, dia, horas, minutos, 0, 0);
    return fechaHoraReserva < ahora;
  }

  const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const fechaReserva = new Date(anio, mes - 1, dia);
  return fechaReserva < hoyInicio;
};

const crearReserva = async (req, res) => {
  const { servicioId, fecha, hora } = req.body;
  const usuarioId = req.usuario.id;

  if (!servicioId || !fecha || !hora) {
    return res.status(400).json({ error: 'Servicio, fecha y hora son obligatorios' });
  }

  if (esFechaPasada(fecha, hora)) {
    return res.status(400).json({ error: 'No se puede reservar en una fecha u hora pasada' });
  }

  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: parseInt(servicioId, 10) }
    });

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const nuevaReserva = await prisma.reserva.create({
      data: {
        fecha: String(fecha).trim(),
        hora: String(hora).trim(),
        estado: 'pendiente',
        usuarioId,
        servicioId: servicio.id
      },
      include: {
        servicio: true,
        usuario: { select: { id: true, nombre: true, email: true } }
      }
    });

    res.status(201).json(nuevaReserva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verMisReservas = async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      where: { usuarioId: req.usuario.id },
      include: { servicio: true },
      orderBy: { id: 'desc' }
    });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verTodasReservas = async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: {
        servicio: true,
        usuario: { select: { id: true, nombre: true, email: true, rol: true } }
      },
      orderBy: { id: 'desc' }
    });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cambiarEstadoReserva = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['pendiente', 'completada', 'cancelada'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado invalido. Debe ser pendiente, completada o cancelada' });
  }

  try {
    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const actualizada = await prisma.reserva.update({
      where: { id: reserva.id },
      data: { estado },
      include: {
        servicio: true,
        usuario: { select: { id: true, nombre: true, email: true } }
      }
    });

    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cancelarReserva = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.usuarioId !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar una reserva de otro usuario' });
    }

    if (reserva.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden cancelar reservas con estado pendiente' });
    }

    const cancelada = await prisma.reserva.update({
      where: { id: reserva.id },
      data: { estado: 'cancelada' },
      include: { servicio: true }
    });

    res.json(cancelada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearReserva,
  verMisReservas,
  verTodasReservas,
  cambiarEstadoReserva,
  cancelarReserva
};

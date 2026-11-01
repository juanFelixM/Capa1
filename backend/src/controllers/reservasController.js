const prisma = require('../db');

const validarReserva = (servicioId, fecha, hora) => {
  if (!servicioId || !fecha || !hora) {
    return 'Servicio, fecha y hora son obligatorios';
  }

  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [horas, minutos] = hora.split(':').map(Number);

  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
  const horaValida = /^\d{1,2}:\d{2}$/.test(hora) && horas <= 23 && minutos <= 59;
  const servicioValido = !Number.isNaN(parseInt(servicioId, 10));

  if (!fechaValida || !horaValida || !servicioValido) {
    return 'El servicio, la fecha (AAAA-MM-DD) o la hora (HH:MM) no tienen un formato valido';
  }

  const fechaHoraReserva = new Date(anio, mes - 1, dia, horas, minutos);
  if (fechaHoraReserva < new Date()) {
    return 'La fecha y hora de la reserva deben ser futuras';
  }

  return null;
};

const crearReserva = async (req, res) => {
  const fecha = String(req.body.fecha ?? '').trim();
  const hora = String(req.body.hora ?? '').trim();
  const servicioId = parseInt(req.body.servicioId, 10);
  const usuarioId = req.usuario.id;

  const error = validarReserva(req.body.servicioId, fecha, hora);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const servicio = await prisma.servicio.findUnique({ where: { id: servicioId } });

    if (!servicio) {
      return res.status(404).json({ error: 'El servicio no existe' });
    }

    if (!servicio.activo) {
      return res.status(400).json({ error: 'El servicio no se encuentra activo y no admite nuevas reservas' });
    }

    const duplicada = await prisma.reserva.findFirst({
      where: { usuarioId, servicioId, fecha, estado: 'pendiente' }
    });

    if (duplicada) {
      return res.status(409).json({ error: 'Ya tienes una reserva activa para este servicio en esa fecha' });
    }

    const nuevaReserva = await prisma.reserva.create({
      data: { fecha, hora, estado: 'pendiente', usuarioId, servicioId },
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

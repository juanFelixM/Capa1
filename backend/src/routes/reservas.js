const { Router } = require('express');
const {
  crearReserva,
  verMisReservas,
  verTodasReservas,
  cambiarEstadoReserva,
  cancelarReserva
} = require('../controllers/reservasController');
const { verificarToken } = require('../middlewares/auth');
const esAdmin = require('../middlewares/esAdmin');

const router = Router();

router.use(verificarToken);

router.post('/', crearReserva);
router.get('/mis-reservas', verMisReservas);
router.get('/', esAdmin, verTodasReservas);
router.put('/:id/estado', esAdmin, cambiarEstadoReserva);
router.delete('/:id', cancelarReserva);

module.exports = router;

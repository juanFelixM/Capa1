const { Router } = require('express');
const {
  listarServicios,
  crearServicio,
  editarServicio,
  eliminarServicio
} = require('../controllers/servicios.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);

router.get('/', listarServicios);
router.post('/', soloAdmin, crearServicio);
router.put('/:id', soloAdmin, editarServicio);
router.delete('/:id', soloAdmin, eliminarServicio);

module.exports = router;

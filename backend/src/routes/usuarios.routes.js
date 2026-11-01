const { Router } = require('express');
const { actualizarPerfil } = require('../controllers/usuariosController');
const { verificarToken } = require('../middlewares/auth');

const router = Router();

router.put('/perfil', verificarToken, actualizarPerfil);

module.exports = router;

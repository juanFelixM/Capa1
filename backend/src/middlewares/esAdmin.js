const esAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido: requiere rol de admin' });
  }
  next();
};

module.exports = esAdmin;
module.exports.esAdmin = esAdmin;
module.exports.soloAdmin = esAdmin;

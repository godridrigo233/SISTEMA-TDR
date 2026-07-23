const { Router } = require('express');
const {
  getMisNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} = require('../controllers/notificaciones.controller');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.use(verifyToken);

router.get('/', getMisNotificaciones);
router.put('/leer-todas', marcarTodasLeidas);
router.put('/:id/leer', marcarLeida);

module.exports = router;

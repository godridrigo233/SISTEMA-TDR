const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

const {
  getLocadores,
  getLocadorById,
  getLocadorByDni,
  createLocador,
  updateLocador,
  deleteLocador
} = require('../controllers/locadores.controller');

router.use(verifyToken);

router.get('/', getLocadores);
router.get('/dni/:numero_documento', getLocadorByDni);   // 🔥 nuevo método
router.get('/:id', getLocadorById);         // 🔥 buscar por id
router.post('/', requireRole('CONTRATANTE', 'ADMINISTRADOR'), createLocador);
router.put('/:id', requireRole('CONTRATANTE', 'ADMINISTRADOR'), updateLocador);
router.delete('/:id', requireRole('ADMINISTRADOR'), deleteLocador);
module.exports = router;
const express = require('express');
const router = express.Router();

const {
  getLocadores,
  getLocadorById,
  getLocadorByDni,
  createLocador,
  updateLocador,
  deleteLocador
} = require('../controllers/locadores.controller');

router.get('/', getLocadores);
router.get('/dni/:numero_documento', getLocadorByDni);   // 🔥 nuevo método
router.get('/:id', getLocadorById);         // 🔥 buscar por id
router.post('/', createLocador);
router.put('/:id', updateLocador);
router.delete('/:id', deleteLocador);
module.exports = router;
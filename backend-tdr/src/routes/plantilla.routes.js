const express = require('express');
const router = express.Router();
const plantillaController = require('../controllers/plantilla.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', plantillaController.getPlantilla);
router.put('/', requireRole('ADMINISTRATIVO'), plantillaController.updatePlantilla);

module.exports = router;
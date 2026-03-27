const express = require('express');
const router = express.Router();
const plantillaController = require('../controllers/plantilla.controller');

router.get('/', plantillaController.getPlantilla);
router.put('/', plantillaController.updatePlantilla);

module.exports = router;
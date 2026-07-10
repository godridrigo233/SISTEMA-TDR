// src/routes/contratantes.routes.js
const { Router } = require('express');
const {
  getMiPerfil,
  upsertMiPerfil,
  getTodos,
  crearContratante,   // ← nuevo
} = require('../controllers/contratantes.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

router.use(verifyToken);

router.get('/',    requireRole('ADMINISTRADOR'), getTodos);   // admin: ver todos
router.get('/me',  getMiPerfil);        // contratante: ver su perfil
router.put('/me',  upsertMiPerfil);     // contratante: actualizar perfil
router.post('/',   requireRole('ADMINISTRADOR'), crearContratante);   // admin: crear nuevo contratante

module.exports = router;
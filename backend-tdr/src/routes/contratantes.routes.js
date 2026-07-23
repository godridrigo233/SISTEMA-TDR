// src/routes/contratantes.routes.js
const { Router } = require('express');
const {
  getMiPerfil,
  upsertMiPerfil,
  cambiarPassword,
  getTodos,
  crearContratante,
  getPorId,
  actualizarContratante,
} = require('../controllers/contratantes.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

router.use(verifyToken);

router.get('/',    requireRole('ADMINISTRADOR'), getTodos);   // admin: ver todos
router.get('/me',  getMiPerfil);        // contratante: ver su perfil
router.put('/me',  upsertMiPerfil);     // contratante: actualizar perfil
router.put('/me/password', cambiarPassword); // cualquier usuario: cambiar contraseña
router.post('/',   requireRole('ADMINISTRADOR'), crearContratante);   // admin: crear nuevo contratante
router.get('/:id', requireRole('ADMINISTRADOR'), getPorId);              // admin: ver perfil de otro
router.put('/:id', requireRole('ADMINISTRADOR'), actualizarContratante); // admin: editar perfil de otro

module.exports = router;
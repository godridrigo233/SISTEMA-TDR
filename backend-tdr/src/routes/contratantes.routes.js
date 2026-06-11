// src/routes/contratantes.routes.js
const { Router } = require('express');
const {
  getMiPerfil,
  upsertMiPerfil,
  getTodos,
  crearContratante,   // ← nuevo
} = require('../controllers/contratantes.controller');

const router = Router();

router.get('/',    getTodos);           // admin: ver todos
router.get('/me',  getMiPerfil);        // contratante: ver su perfil
router.put('/me',  upsertMiPerfil);     // contratante: actualizar perfil
router.post('/',   crearContratante);   // admin: crear nuevo contratante

module.exports = router;
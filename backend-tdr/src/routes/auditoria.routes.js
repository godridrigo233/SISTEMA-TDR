const { Router } = require('express');
const { getAuditoria } = require('../controllers/auditoria.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = Router();

router.use(verifyToken);
router.get('/', requireRole('ADMINISTRADOR'), getAuditoria);

module.exports = router;

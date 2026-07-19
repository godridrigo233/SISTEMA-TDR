const express = require("express");
const router = express.Router();
const tdrController = require("../controllers/tdrs.controller");
const upload = require("../multer");
const { verifyToken, requireRole } = require("../middleware/auth");

router.use(verifyToken);

// 🔥 CREAR TDR CON ARCHIVOS
router.post(
  "/",
  requireRole('CONTRATANTE'),
  upload.fields([
    { name: "dniFile", maxCount: 1 },
    { name: "rnpFile", maxCount: 1 },
    { name: "rucFile", maxCount: 1 },
    { name: "cvFile", maxCount: 1 }
  ]),
  tdrController.createTdr
);
 // 👇 AGREGA ESTA RUTA PARA EL PUT (Actualizar) 👇
router.put('/:id', requireRole('CONTRATANTE'), upload.fields([
    { name: 'cvFile', maxCount: 1 },
    { name: 'dniFile', maxCount: 1 },
    { name: 'rnpFile', maxCount: 1 },
    { name: 'rucFile', maxCount: 1 }
]), tdrController.updateTdr);
router.put('/:id/validar', requireRole('ADMINISTRADOR', 'ADMINISTRATIVO'), tdrController.validarTdr);
router.delete('/:id', requireRole('CONTRATANTE'), tdrController.deleteTdr);
// LISTAR
router.get("/", tdrController.getTdrs);

//  POR LOCADOR
router.get("/locador/:locadorId", tdrController.getTdrsByLocador);

//  POR ID
router.get("/:id", tdrController.getTdrById);

module.exports = router;
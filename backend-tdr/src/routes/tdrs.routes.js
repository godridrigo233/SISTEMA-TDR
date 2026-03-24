const express = require("express");
const router = express.Router();
const tdrController = require("../controllers/tdrs.controller");
const upload = require("../multer");

// 🔥 CREAR TDR CON ARCHIVOS
router.post(
  "/",
  upload.fields([
    { name: "dniFile", maxCount: 1 },
    { name: "rnpFile", maxCount: 1 },
    { name: "rucFile", maxCount: 1 },
    { name: "cvFile", maxCount: 1 }
  ]),
  tdrController.createTdr
);
 // 👇 AGREGA ESTA RUTA PARA EL PUT (Actualizar) 👇
router.put('/:id', upload.fields([
    { name: 'cvFile', maxCount: 1 },
    { name: 'dniFile', maxCount: 1 },
    { name: 'rnpFile', maxCount: 1 },
    { name: 'rucFile', maxCount: 1 }
]), tdrController.updateTdr);
router.put('/:id/validar', tdrController.validarTdr);
// LISTAR
router.get("/", tdrController.getTdrs);

//  POR LOCADOR
router.get("/locador/:locadorId", tdrController.getTdrsByLocador);

//  POR ID
router.get("/:id", tdrController.getTdrById);

module.exports = router;
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const oportunidadeController = require("../controllers/oportunidade.controller");

// Rotas para o CRUD de oportunidades
router.post("/", auth, oportunidadeController.createOportunidade);
router.get("/", oportunidadeController.getAllOportunidades);
router.get("/admin/all", auth, oportunidadeController.getAllOportunidades);
router.get("/:id", auth, oportunidadeController.getOportunidadeById);
router.put("/:id", auth, oportunidadeController.updateOportunidade);
router.delete("/:id", auth, oportunidadeController.deleteOportunidade);

module.exports = router;

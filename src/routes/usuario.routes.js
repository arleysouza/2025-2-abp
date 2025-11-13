const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuario.controller");
const auth = require("../middlewares/auth");

// Listar usuários
router.get("/", auth, usuarioController.listUsuarios);

// Criar usuário
router.post("/", auth, usuarioController.createUsuario);

// Atualiza e-mail e/ou senha do usuário autenticado
router.put("/me", auth, usuarioController.updateMe);

// Alternativa para desenvolvimento: atualizar informando o id na rota
router.put("/:id", auth, usuarioController.updateMe);

// Excluir usuário
router.delete("/:id", auth, usuarioController.deleteUsuario);

module.exports = router;

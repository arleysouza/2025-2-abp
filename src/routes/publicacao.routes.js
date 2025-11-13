const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const auth = require("../middlewares/auth");
const publicacaoController = require("../controllers/publicacao.controller");

// Configuração do multer para salvar imagens em /uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Formato de imagem inválido. Use PNG ou JPEG."));
    }
    cb(null, true);
  },
});

// Rotas para o CRUD de publicações
router.post(
  "/",
  auth,
  upload.single("imagem"),
  publicacaoController.createPublicacao,
);
router.get("/", publicacaoController.getAllPublicacoes);
router.get("/admin/all", auth, publicacaoController.getAllPublicacoes);
router.get("/:id", auth, publicacaoController.getPublicacaoById);
router.put(
  "/:id",
  auth,
  upload.single("imagem"),
  publicacaoController.updatePublicacao,
);
router.delete("/:id", auth, publicacaoController.deletePublicacao);

module.exports = router;

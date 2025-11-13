const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middlewares/auth");
const router = express.Router();
const noticiaController = require("../controllers/noticia.controller");

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

// Rotas para o CRUD de notícias
router.post(
  "/",
  auth,
  upload.single("imagem"),
  noticiaController.createNoticia,
);
router.get("/", noticiaController.getAllNoticias);
router.get("/admin/all", auth, noticiaController.getAllNoticiasAdmin);
// Detalhe por ID (proteção via auth, para uso no admin)
router.get("/:id", auth, noticiaController.getNoticiaById);
router.put(
  "/:id",
  auth,
  upload.single("imagem"),
  noticiaController.updateNoticia,
);
router.delete("/:id", auth, noticiaController.deleteNoticia);

module.exports = router;

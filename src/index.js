// Importa o framework Express para criar e gerenciar o servidor web
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
// Carrega as variáveis de ambiente o mais cedo possível
dotenv.config();
const rotas = require("./routes");

// Cria uma instância do aplicativo Express
const app = express();

// Middleware para permitir o envio de dados em formato JSON no corpo das requisições
app.use(express.json());

// Lê a variável PORT definida no arquivo .env
const port = process.env.PORT;

// Inicia o servidor na porta definida e exibe uma mensagem no console
app.listen(port, function () {
  console.log(`Servidor rodando na porta ${port}`);
});

// Servir imagens estáticas da pasta uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/login", function (_req, res) {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

const auth = require("./middlewares/auth");
const authPage = auth.page || auth;
// Páginas de gestão (protegidas)
app.get("/admin/noticias", authPage, function (_req, res) {
  res.sendFile(path.join(__dirname, "..", "public", "noticias-manage.html"));
});
app.get("/admin/publicacoes", authPage, function (_req, res) {
  res.sendFile(path.join(__dirname, "..", "public", "publicacoes-manage.html"));
});
app.get("/admin/oportunidades", authPage, function (_req, res) {
  res.sendFile(
    path.join(__dirname, "..", "public", "oportunidades-manage.html"),
  );
});
// Página de gestão de usuários (protegida)
app.get("/admin/usuarios", authPage, function (_req, res) {
  res.sendFile(path.join(__dirname, "..", "public", "usuarios-manage.html"));
});
// Servir arquivos estáticos (HTML/CSS/JS) da pasta public (um nível acima de src)
app.use(express.static(path.join(__dirname, "..", "public")));

// Usando as rotas
app.use("/api", rotas);

// Middleware para rotas não encontradas: redireciona ao login
app.use(function (_req, res) {
  res.redirect(302, "/login");
});

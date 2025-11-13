const jwt = require("jsonwebtoken");

function getSecret() {
  return process.env.JWT_SECRET || "dev-secret-change-me";
}

function readTokenFromCookie(req) {
  const raw = req.headers?.cookie;
  if (!raw) return null;
  const parts = raw.split(";");
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k && k.trim() === "token") return decodeURIComponent(v || "").trim();
  }
  return null;
}

function extractToken(req) {
  let token = null;
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (header && typeof header === "string") {
    const parts = header.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }
  if (!token) {
    token = readTokenFromCookie(req);
  }
  return token;
}

function attachUser(req, payload, token) {
  req.user = {
    idusuario: payload.sub,
    mail: payload.mail,
    iat: payload.iat,
    exp: payload.exp,
    token,
  };
}

function auth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Token ausente" });
    }
    const payload = jwt.verify(token, getSecret());
    attachUser(req, payload, token);
    return next();
  } catch (err) {
    console.warn("Auth middleware: token inválido.", err);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

function authPage(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new Error("missing token");
    }
    const payload = jwt.verify(token, getSecret());
    attachUser(req, payload, token);
    return next();
  } catch (err) {
    console.warn("Auth page middleware: redirecionando para login.", err);
    return res.redirect(302, "/login");
  }
}

module.exports = auth;
module.exports.page = authPage;

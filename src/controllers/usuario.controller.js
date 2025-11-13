const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret-change-me";
}

// Atualiza e-mail e/ou senha do usuário atual a partir do token (req.user)
// Body: { mail?: string, senha?: string }
async function updateMe(req, res) {
  try {
    const authUserId = req.user?.idusuario || null;
    const userId = authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { mail, senha } = req.body || {};
    if (!mail && !senha) {
      return res
        .status(400)
        .json({ error: "Informe ao menos um campo: mail ou senha" });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (mail) {
      const trimmed = String(mail).trim();
      if (!trimmed) {
        return res.status(400).json({ error: "E-mail inválido" });
      }
      fields.push(`mail = $${idx++}`);
      values.push(trimmed);
    }

    if (senha) {
      const str = String(senha);
      if (str.length < 6) {
        return res
          .status(400)
          .json({ error: "A senha deve ter pelo menos 6 caracteres" });
      }
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(str, saltRounds);
      fields.push(`senha = $${idx++}`);
      values.push(senhaHash);
    }

    values.push(userId);
    const sql = `UPDATE usuarios SET ${fields.join(", ")} WHERE idusuario = $${idx} RETURNING idusuario, mail`;
    const result = await pool.query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json({
      message: "Dados atualizados com sucesso",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
}

// Login: verifica mail e senha; retorna dados básicos do usuário.
async function login(req, res) {
  try {
    const { mail, senha } = req.body || {};
    if (!mail || !senha) {
      return res.status(400).json({ error: "Informe e-mail e senha" });
    }

    const result = await pool.query(
      "SELECT idusuario, mail, senha FROM usuarios WHERE mail = $1 LIMIT 1",
      [String(mail).trim()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = result.rows[0];
    const stored = user.senha || "";
    const isBcrypt = /^\$2[aby]\$/.test(stored);

    let ok = false;
    if (isBcrypt) {
      ok = await bcrypt.compare(String(senha), stored);
    } else {
      // Compatibilidade com seed em texto puro
      ok = String(senha) === stored;
    }

    if (!ok) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { sub: user.idusuario, mail: user.mail },
      getJwtSecret(),
      { expiresIn: "1h" },
    );

    return res.status(200).json({
      message: "Login efetuado com sucesso",
      token,
      usuario: { idusuario: user.idusuario, mail: user.mail },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro ao efetuar login" });
  }
}

// Criar um novo usuário (senha armazenada com hash)
async function createUsuario(req, res) {
  try {
    const { mail, senha } = req.body || {};
    if (!mail || !senha) {
      return res.status(400).json({ error: "Informe e-mail e senha" });
    }

    const email = String(mail).trim();
    if (!email) {
      return res.status(400).json({ error: "E-mail inválido" });
    }
    if (String(senha).length < 6) {
      return res
        .status(400)
        .json({ error: "A senha deve ter pelo menos 6 caracteres" });
    }

    const exists = await pool.query(
      "SELECT 1 FROM usuarios WHERE mail = $1 LIMIT 1",
      [email],
    );
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }

    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(String(senha), saltRounds);
    const result = await pool.query(
      "INSERT INTO usuarios (mail, senha) VALUES ($1, $2) RETURNING idusuario, mail",
      [email, senhaHash],
    );

    return res.status(201).json({
      message: "Usuário criado com sucesso",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

// Listar usuários (apenas id e e-mail)
async function listUsuarios(_req, res) {
  try {
    const result = await pool.query(
      "SELECT idusuario, mail FROM usuarios ORDER BY idusuario ASC",
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return res.status(500).json({ error: "Erro ao listar usuários" });
  }
}

// Excluir um usuário (usa req.user ou req.params.id como fallback)
async function deleteUsuario(req, res) {
  try {
    const authUserId = req.user?.idusuario || null;
    const paramId = req.params?.id || null;
    const targetId = paramId ?? authUserId;

    if (!targetId) {
      return res
        .status(400)
        .json({ error: "Informe o usuário a ser excluído" });
    }

    const idNumber = Number(targetId);
    if (!Number.isInteger(idNumber) || idNumber <= 0) {
      return res.status(400).json({ error: "ID de usuário inválido" });
    }

    const result = await pool.query(
      "DELETE FROM usuarios WHERE idusuario = $1 RETURNING idusuario, mail",
      [idNumber],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json({
      message: "Usuário excluído com sucesso",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return res.status(500).json({ error: "Erro ao excluir usuário" });
  }
}

module.exports = {
  login,
  updateMe,
  createUsuario,
  deleteUsuario,
  listUsuarios,
};

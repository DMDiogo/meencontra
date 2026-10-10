// src/middlewares/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // garante que as envs estão carregadas

export const autenticarAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    // espera "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Formato de token inválido. Use: 'Authorization: Bearer <token>'" });
    }

    const token = parts[1];

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET não definido no .env");
      return res.status(500).json({ message: "Configuração do servidor incompleta" });
    }

    // log para debug (remover em produção se quiser)
    console.log("Token recebido (primeiros 20 chars):", token.slice(0, 20), "...");

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: payload.id, username: payload.username };
    return next();
  } catch (err) {
    console.error("Erro no middleware de autenticação:", err && err.message ? err.message : err);
    // se for erro de jwt (token expirado ou inválido) retorna 401
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
};

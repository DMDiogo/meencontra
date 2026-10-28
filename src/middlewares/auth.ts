import type { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import jwt, { type JwtPayload } from "jsonwebtoken";

dotenv.config();

type AdminToken = JwtPayload & { id: number; username: string };

export const autenticarAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      res.status(401).json({ message: "Token não fornecido" });
      return;
    }

    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      res.status(401).json({ message: "Formato de token inválido. Use: 'Authorization: Bearer <token>'" });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET não definido no .env");
      res.status(500).json({ message: "Configuração do servidor incompleta" });
      return;
    }

    const payload = jwt.verify(parts[1], secret) as AdminToken;
    req.admin = { id: payload.id, username: payload.username };
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Erro no middleware de autenticação:", message);
    res.status(401).json({ message: "Token inválido ou expirado" });
  }
};

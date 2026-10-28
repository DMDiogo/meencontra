import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

type AdminToken = JwtPayload & { id: number; username: string };

export const autenticarAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "Acesso negado. Token não fornecido." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    res.status(401).json({ message: "Acesso negado. Token não fornecido." });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as AdminToken;
    req.admin = { id: decoded.id, username: decoded.username };
    next();
  } catch {
    res.status(403).json({ message: "Token inválido ou expirado" });
  }
};

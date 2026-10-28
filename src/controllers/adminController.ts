import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma/client.js";

export const loginAdmin = async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  try {
    if (!username || !password) {
      res.status(400).json({ message: "Utilizador e senha são obrigatórios" });
      return;
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      res.status(404).json({ message: "Admin não encontrado" });
      return;
    }

    const senhaValida = await bcrypt.compare(password, admin.password);
    if (!senhaValida) {
      res.status(401).json({ message: "Senha inválida" });
      return;
    }

    res.status(200).json({ message: "Login realizado com sucesso" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro no servidor";
    res.status(500).json({ message: "Erro no servidor", error: message });
  }
};

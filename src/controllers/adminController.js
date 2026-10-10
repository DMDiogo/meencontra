import prisma from "../prisma/client.js";
import bcrypt from "bcryptjs";

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return res.status(404).json({ message: "Admin não encontrado" });

    const senhaValida = await bcrypt.compare(password, admin.password);
    if (!senhaValida) return res.status(401).json({ message: "Senha inválida" });

    res.status(200).json({ message: "Login realizado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor", error: error.message });
  }
};

import jwt from "jsonwebtoken";

export const autenticarAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Se não houver cabeçalho Authorization
  if (!authHeader) {
    return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
  }

  // O token vem no formato: "Bearer token_aqui"
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // verifica se é válido
    req.admin = decoded; // guarda os dados do admin
    next(); // segue para a rota
  } catch (error) {
    return res.status(403).json({ message: "Token inválido ou expirado" });
  }
};

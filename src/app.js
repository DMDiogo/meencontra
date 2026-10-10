// src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import empresaRoutes from "./routes/empresaRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

// --- Configurações de diretórios ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middlewares globais ---
app.use(express.json()); // Lê JSON do corpo das requisições
app.use(cors()); // Habilita CORS para acesso do frontend

// --- Servir arquivos estáticos (imagens) ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Rotas principais ---
app.use("/api/empresas", empresaRoutes); // CRUD de empresas
app.use("/api/admin", adminRoutes); // Login de administrador

// --- Rota de teste ---
app.get("/", (req, res) => {
  res.send("🚀 Servidor 'Me Encontra Lá' está online!");
});

export default app;

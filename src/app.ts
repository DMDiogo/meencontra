import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import adminRoutes from "./routes/adminRoutes.js";
import empresaRoutes from "./routes/empresaRoutes.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/empresas", empresaRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (_req, res) => {
  res.send("Servidor Me Encontra está online.");
});

export default app;

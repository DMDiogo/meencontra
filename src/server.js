import express from "express";
import empresaRoutes from "./routes/empresaRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webDist = path.join(__dirname, "../web/dist");
const indexHtml = path.join(webDist, "index.html");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/empresas", empresaRoutes);
app.use("/api/admin", adminRoutes);

if (fs.existsSync(indexHtml)) {
  app.use(express.static(webDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(indexHtml);
  });
} else {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res
      .status(503)
      .type("text/plain")
      .send("Frontend React ainda não foi compilado. Na pasta find corre: npm run build:web");
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Me Encontra (React) em http://localhost:${PORT}`);
  if (!fs.existsSync(indexHtml)) {
    console.log("Aviso: web/dist em falta. Corre npm run build:web");
  }
});

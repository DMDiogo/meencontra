import express from "express";
import {
  atualizarEmpresa,
  criarEmpresa,
  eliminarEmpresa,
  listarEmpresas,
} from "../controllers/empresaControllers.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get("/", listarEmpresas);
router.post("/", upload.array("fotos", 5), criarEmpresa);
router.put("/:id", upload.array("fotos", 5), atualizarEmpresa);
router.delete("/:id", eliminarEmpresa);

export default router;

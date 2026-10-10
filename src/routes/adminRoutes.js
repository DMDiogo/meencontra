import express from "express";
import { loginAdmin } from "../controllers/adminController.js";

const router = express.Router();

router.post("/login", loginAdmin); // Só login permitido

export default router;

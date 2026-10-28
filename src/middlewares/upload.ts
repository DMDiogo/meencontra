import type { Request } from "express";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => cb(null, "uploads/"),
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export default multer({ storage });

import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { asFotoList } from "../lib/fotos.js";
import prisma from "../prisma/client.js";

function uploadedFiles(req: Request): Express.Multer.File[] {
  if (!req.files) return [];
  return Array.isArray(req.files) ? req.files : [];
}

export const listarEmpresas = async (_req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresa.findMany();
    res.json(empresas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar empresas" });
  }
};

export const criarEmpresa = async (req: Request, res: Response) => {
  try {
    const { nome, negocio, localizacao, biografia } = req.body as {
      nome?: string;
      negocio?: string;
      localizacao?: string;
      biografia?: string;
    };
    const fotos = uploadedFiles(req).map((f) => f.filename);

    const empresa = await prisma.empresa.create({
      data: {
        nome: nome ?? "",
        negocio: negocio ?? "",
        localizacao: localizacao ?? "",
        biografia: biografia ?? "",
        fotos,
      },
    });

    res.json(empresa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar empresa" });
  }
};

export const atualizarEmpresa = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, negocio, localizacao, biografia } = req.body as {
      nome?: string;
      negocio?: string;
      localizacao?: string;
      biografia?: string;
    };

    const empresaExistente = await prisma.empresa.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!empresaExistente) {
      res.status(404).json({ message: "Empresa não encontrada" });
      return;
    }

    let fotos = asFotoList(empresaExistente.fotos);
    const files = uploadedFiles(req);

    if (files.length > 0) {
      fotos.forEach((f) => {
        const caminho = path.join("uploads", f);
        if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
      });
      fotos = files.map((f) => f.filename);
    }

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: parseInt(id, 10) },
      data: { nome, negocio, localizacao, biografia, fotos },
    });

    res.json(empresaAtualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao atualizar empresa" });
  }
};

export const eliminarEmpresa = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresa.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!empresa) {
      res.status(404).json({ message: "Empresa não encontrada" });
      return;
    }

    asFotoList(empresa.fotos).forEach((f) => {
      const caminho = path.join("uploads", f);
      if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
    });

    await prisma.empresa.delete({ where: { id: parseInt(id, 10) } });

    res.json({ message: "Empresa eliminada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao eliminar empresa" });
  }
};

import prisma from "../prisma/client.js";
import fs from "fs";
import path from "path";

export const listarEmpresas = async (req, res) => {
  try {
    const empresas = await prisma.empresa.findMany();
    res.json(empresas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar empresas" });
  }
};

export const criarEmpresa = async (req, res) => {
  try {
    const { nome, negocio, localizacao, biografia } = req.body;
    const fotos = req.files ? req.files.map(f => f.filename) : [];

    const empresa = await prisma.empresa.create({
      data: { nome, negocio, localizacao, biografia, fotos },
    });

    res.json(empresa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar empresa" });
  }
};

export const atualizarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, negocio, localizacao, biografia } = req.body;

    const empresaExistente = await prisma.empresa.findUnique({
      where: { id: parseInt(id) },
    });

    if (!empresaExistente)
      return res.status(404).json({ message: "Empresa não encontrada" });

    let fotos = empresaExistente.fotos || [];

    if (req.files && req.files.length > 0) {
      fotos.forEach(f => {
        const caminho = path.join("uploads", f);
        if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
      });
      fotos = req.files.map(f => f.filename);
    }

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: parseInt(id) },
      data: { nome, negocio, localizacao, biografia, fotos },
    });

    res.json(empresaAtualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao atualizar empresa" });
  }
};

export const eliminarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresa.findUnique({
      where: { id: parseInt(id) },
    });

    if (!empresa)
      return res.status(404).json({ message: "Empresa não encontrada" });

    if (empresa.fotos && empresa.fotos.length > 0) {
      empresa.fotos.forEach(f => {
        const caminho = path.join("uploads", f);
        if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
      });
    }

    await prisma.empresa.delete({ where: { id: parseInt(id) } });

    res.json({ message: "Empresa eliminada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao eliminar empresa" });
  }
};

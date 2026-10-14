import { ASSETS } from "./assets";
import type { Destaque, Empresa, PriceLevel } from "./types";

export const DEMO_EMPRESAS: Empresa[] = [
  {
    id: "demo-1",
    nome: "Restaurante Saboroso",
    negocio: "Restaurantes",
    localizacao: "Luanda",
    biografia: "Ambiente moderno, especialidade em mariscos frescos. Recomenda-se reserva aos fins de semana.",
    fotos: [ASSETS.restaurante],
    tags: ["Reserva", "Almoço"],
    preco: "Akz 2.500 • prato médio",
    priceLevel: "mid",
    rating: 4.8,
    reviews: 120,
    isDemo: true,
  },
  {
    id: "demo-2",
    nome: "Café do Porto",
    negocio: "Restaurantes",
    localizacao: "Santo António",
    biografia: "Especializado em pratos de peixe, petiscos e ambiente descontraído para refeições em família.",
    fotos: [ASSETS.restaurante],
    tags: ["Café", "Jantar"],
    preco: "Akz 2.100 • menu do dia",
    priceLevel: "mid",
    rating: 4.7,
    reviews: 92,
    isDemo: true,
  },
  {
    id: "demo-3",
    nome: "Barbearia Elite",
    negocio: "Serviços",
    localizacao: "Talatona",
    biografia: "Profissionais experientes e atendimento rápido. Aberto até às 20:00.",
    fotos: [ASSETS.barbearia],
    tags: ["Walk-in", "Estudantes"],
    preco: "Akz 1.200 • corte",
    priceLevel: "low",
    rating: 4.6,
    reviews: 48,
    isDemo: true,
  },
  {
    id: "demo-4",
    nome: "Loja de Móveis Modernos",
    negocio: "Mobília",
    localizacao: "Viana",
    biografia: "Peças premium em madeira maciça. Visual moderno e acabamento de alta qualidade.",
    fotos: [ASSETS.moveis],
    tags: ["Entrega", "Garantia 2 anos"],
    preco: "Akz 95.000",
    priceLevel: "high",
    rating: 4.9,
    reviews: 34,
    isDemo: true,
  },
  {
    id: "demo-5",
    nome: "Hotel Luanda Palace",
    negocio: "Hotéis",
    localizacao: "Luanda",
    biografia: "Quartos confortáveis com vista para a cidade. Excelente localização central.",
    fotos: [ASSETS.hotel],
    tags: ["Pequeno-almoço", "Estacionamento"],
    preco: "Akz 15.000 / noite",
    priceLevel: "mid",
    rating: 4.7,
    reviews: 210,
    isDemo: true,
  },
  {
    id: "demo-6",
    nome: "Hotel Vista Mar",
    negocio: "Hotéis",
    localizacao: "Morreira",
    biografia: "Vista panorâmica para o mar, piscina e atendimento premium para fins de semana e estadias prolongadas.",
    fotos: [ASSETS.hotel],
    tags: ["Piscina", "Vista para o mar"],
    preco: "Akz 18.500 / noite",
    priceLevel: "high",
    rating: 4.9,
    reviews: 165,
    isDemo: true,
  },
];

export const DESTAQUES: Destaque[] = [
  { nome: "Mar à Beira", meta: "Peixe • Luanda", rating: 4.7, reviews: 120, img: ASSETS.mar },
  { nome: "Hotel Solare", meta: "Talatona • Hotel", rating: 4.6, reviews: 89, img: ASSETS.hotelMini },
  { nome: "Loja Móveis Select", meta: "Viana • Móveis", rating: 4.8, reviews: 34, img: ASSETS.mobilia },
  { nome: "Verde Sabor", meta: "Tradicional • Luanda", rating: 4.5, reviews: 76, img: ASSETS.hotel },
  { nome: "Churrascaria Tropical", meta: "Churrasco • Lubango", rating: 4.6, reviews: 54, img: ASSETS.mob2 },
];

export function normalizeEmpresa(e: Partial<Empresa> & { nome: string; id: Empresa["id"] }): Empresa {
  const negocio = e.negocio || "Serviços";
  const fotos = Array.isArray(e.fotos) ? e.fotos.map(String) : [];
  return {
    id: e.id,
    nome: e.nome,
    negocio,
    localizacao: e.localizacao || "",
    biografia: e.biografia || "",
    fotos,
    tags: e.tags || [negocio],
    preco: e.preco || "Consultar preço",
    priceLevel: e.priceLevel || guessPrice(negocio),
    rating: e.rating || 4.5,
    reviews: e.reviews || 0,
    isDemo: Boolean(e.isDemo),
  };
}

function guessPrice(negocio: string): PriceLevel {
  const n = negocio.toLowerCase();
  if (n.includes("hotel")) return "high";
  if (n.includes("móv") || n.includes("mobil")) return "high";
  if (n.includes("barbe") || n.includes("serviço")) return "low";
  return "mid";
}

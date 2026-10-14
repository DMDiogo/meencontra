export type PriceLevel = "low" | "mid" | "high";
export type EmpresaStatus = "pendente" | "publicada" | "suspensa";

export type Empresa = {
  id: number | string;
  nome: string;
  negocio: string;
  localizacao: string;
  biografia: string;
  fotos: string[];
  tags: string[];
  preco: string;
  priceLevel: PriceLevel;
  rating: number | null;
  reviews: number;
  isDemo: boolean;
  status?: EmpresaStatus;
};

export type Destaque = {
  nome: string;
  meta: string;
  rating: number;
  reviews: number;
  img: string;
};

export type TipoConta = "cliente" | "proprietario";

export type DadosConta = {
  tipo: TipoConta;
  nome: string;
  email: string;
  password: string;
};

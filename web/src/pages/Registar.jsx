import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import CriarConta from "../components/CriarConta";

// Ligar ao teu backend aqui. Deve criar a conta com o tipo ("cliente" | "proprietario").
async function criarConta({ tipo, nome, email, password }) {
  throw new Error("A criação de conta ainda não está ligada ao servidor.");
}

export default function Registar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // /registar?tipo=proprietario já abre com o tipo escolhido
  const t = params.get("tipo");
  const tipoInicial = t === "cliente" || t === "proprietario" ? t : null;

  useEffect(() => {
    document.title = "Criar conta · Me Encontra";
  }, []);

  async function handleSubmit(dados) {
    await criarConta(dados);
    navigate(dados.tipo === "proprietario" ? "/admin" : "/", { replace: true });
  }

  return (
    <AuthLayout width="max-w-xl">
      <CriarConta onSubmit={handleSubmit} tipoInicial={tipoInicial} />
      <div className="mt-7 border-t border-slate-100 pt-6 text-center text-slate-600">
        Já tens conta?{" "}
        <Link to="/login" className="font-semibold text-brand-mid hover:underline">
          Entrar
        </Link>
      </div>
    </AuthLayout>
  );
}
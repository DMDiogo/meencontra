import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import CriarConta from "../components/CriarConta";
import { signUp } from "../lib/auth";
import type { DadosConta, TipoConta } from "../lib/types";

export default function Registar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // /registar?tipo=proprietario já abre com o tipo escolhido
  const t = params.get("tipo");
  const tipoInicial: TipoConta | null = t === "cliente" || t === "proprietario" ? t : null;

  useEffect(() => {
    document.title = "Criar conta · Me Encontra";
  }, []);

  async function handleSubmit(dados: DadosConta) {
    const { profile, needsConfirmation } = await signUp({
      email: dados.email,
      password: dados.password,
      nome: dados.nome,
      role: dados.tipo === "proprietario" ? "dono" : "cliente",
    });
    if (needsConfirmation) {
      navigate("/login", {
        replace: true,
        state: { message: "Conta criada. Confirma o email antes de iniciar sessão." },
      });
      return;
    }
    navigate(profile?.role === "dono" ? "/proprietario" : "/", { replace: true });
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
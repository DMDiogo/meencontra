import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ProprietarioDashboard, { type ConfigEmpresa, type NovaEmpresa } from "../components/admin/ProprietarioDashboard";
import * as api from "../lib/api";
import { criarEmpresa, listarMinhasEmpresas } from "../lib/api";
import { getCurrentProfile, signOut, type Profile } from "../lib/auth";
import type { Empresa } from "../lib/types";

export default function Proprietario() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadOwnerPage() {
      try {
        const current = await getCurrentProfile();
        if (!active) return;
        setProfile(current?.profile || null);
        if (current?.profile.role === "dono") {
          const lista = await listarMinhasEmpresas();
          if (active) setEmpresas(lista);
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os dados do proprietário.");
        }
      } finally {
        if (active) setCheckingAccess(false);
      }
    }
    void loadOwnerPage();
    return () => {
      active = false;
    };
  }, []);

  async function criar(dados: NovaEmpresa, fotos: File[]) {
    // criarEmpresa espera um FormData (usa formData.getAll internamente)
    const formData = new FormData();
    (Object.keys(dados) as (keyof NovaEmpresa)[]).forEach((k) => {
      if (dados[k]) formData.append(k, dados[k]);
    });
    // A ordem importa: a 1.ª foto é a principal (cartão da Home), as seguintes (até 4) vão para a página da empresa.
    fotos.forEach((foto) => formData.append("fotos", foto));
    await criarEmpresa(formData);
    setEmpresas(await listarMinhasEmpresas());
  }

  async function salvar(id: number | string, dados: ConfigEmpresa) {
    // Precisa de uma função atualizarEmpresa em lib/api.ts (PATCH /api/empresas/:id)
    const fn = (api as unknown as Record<string, unknown>).atualizarEmpresa;
    if (typeof fn !== "function") {
      throw new Error("Falta a função atualizarEmpresa em lib/api.ts.");
    }
    // Tal como criarEmpresa, atualizarEmpresa espera um FormData (usa formData.getAll internamente)
    const formData = new FormData();
    (Object.keys(dados) as (keyof ConfigEmpresa)[]).forEach((k) => {
      if (k === "horario_funcionamento") {
        formData.append(k, JSON.stringify(dados[k])); // o horário vai como JSON (coluna jsonb)
      } else {
        formData.append(k, dados[k] as string); // vazio também é enviado, para permitir limpar o campo
      }
    });
    await (fn as (id: number | string, dados: FormData) => Promise<unknown>)(id, formData);
    setEmpresas(await listarMinhasEmpresas());
  }

  async function logout() {
    if (!confirm("Deseja realmente terminar a sessão?")) return;
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível terminar a sessão.");
    }
  }

  if (checkingAccess) return <div className="p-8 text-center text-slate-600">A validar sessão...</div>;
  if (loadError && !profile) {
    return (
      <div role="alert" className="mx-auto mt-12 max-w-xl rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
        {loadError}
      </div>
    );
  }
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role === "admin") return <Navigate to="/admin" replace />;
  if (profile.role !== "dono") return <Navigate to="/" replace />;
  if (loadError) {
    return (
      <div role="alert" className="mx-auto mt-12 max-w-xl rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
        {loadError}
      </div>
    );
  }

  return (
    <ProprietarioDashboard
      nomeOrganizacao={empresas[0]?.nome || ""}
      nomeProprietario={profile.nome}
      empresas={empresas}
      onCriarEmpresa={criar}
      onSalvarEmpresa={salvar}
      onLogout={logout}
    />
  );
}
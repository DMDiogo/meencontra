import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ProprietarioDashboard from "../components/admin/ProprietarioDashboard";
import { listarEmpresas } from "../lib/api";
import { getCurrentProfile, signOut, type Profile } from "../lib/auth";
import type { Empresa } from "../lib/types";

export default function Proprietario() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
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
          const empresas = await listarEmpresas();
          if (active) setEmpresa(empresas[0] || null);
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
      nomeOrganizacao={empresa?.nome || ""}
      nomeProprietario={profile.nome}
      onLogout={logout}
    />
  );
}
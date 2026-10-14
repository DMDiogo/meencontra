import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Infra from "../components/admin/Infra";
import Overview from "../components/admin/Overview";
import Plans from "../components/admin/Plans";
import Tenants from "../components/admin/Tenants";
import { Icon } from "../components/admin/ui";
import { listarEmpresas } from "../lib/api";
import { ASSETS } from "../lib/assets";
import { getCurrentProfile, signOut, type Profile } from "../lib/auth";
import type { Empresa } from "../lib/types";

type PageId = "visao-geral" | "tenants" | "planos" | "infra";

const ADMIN_NAV: { id: PageId; label: string; icon: string }[] = [
  { id: "visao-geral", label: "Visão Geral da Plataforma", icon: "monitoring" },
  { id: "tenants", label: "Gestão de Empresas", icon: "corporate_fare" },
  { id: "planos", label: "Gestão de Planos & Assinaturas", icon: "payments" },
  { id: "infra", label: "Infraestrutura & Cluster", icon: "lan" },
];

function SidebarBody({ page, onPick }: { page: PageId; onPick: (p: PageId) => void }) {
  return (
    <>
      <div className="flex flex-col">
        <div className="h-16 px-space-lg flex items-center justify-between bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-space-sm">
            <img src={ASSETS.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none">Me Encontra</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">Painel de Gestão</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
            Admin
          </span>
        </div>

        <div className="px-space-lg pt-space-lg pb-space-xs">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Painel Administrativo
          </p>
        </div>

        <nav className="flex flex-col gap-1 px-space-sm">
          {ADMIN_NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onPick(n.id)}
              className={`flex items-center gap-space-md px-space-md py-space-sm rounded-lg text-left transition-colors ${
                page === n.id
                  ? "bg-surface-container-highest text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon name={n.icon} className="text-[20px]" />
              <span className="font-label-lg text-label-lg">{n.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-space-md bg-surface-container-lowest m-space-sm rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Escopo de Acesso</span>
          <span className="flex h-2 w-2 rounded-full bg-primary-container" />
        </div>
        <div className="w-full flex items-center justify-between px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface text-left">
          <div className="flex items-center gap-space-sm">
            <Icon name="domain" className="text-[18px] text-tertiary" />
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">
                Visão do Administrador
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Todas as empresas
              </span>
            </div>
          </div>
          <Icon name="verified_user" className="text-[18px] text-on-surface-variant" />
        </div>
      </div>
    </>
  );
}

export default function Admin() {
  const navigate = useNavigate();

  const [page, setPage] = useState<PageId>("visao-geral");
  const [drawer, setDrawer] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function refresh() {
    try {
      const data = await listarEmpresas();
      setEmpresas(data);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar as empresas.");
    }
  }

  useEffect(() => {
    let active = true;
    async function loadAdminPage() {
      try {
        const current = await getCurrentProfile();
        if (!active) return;
        setProfile(current?.profile || null);
        if (current?.profile.role === "admin") {
          const data = await listarEmpresas();
          if (active) setEmpresas(data);
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os dados.");
      } finally {
        if (active) setCheckingAccess(false);
      }
    }
    void loadAdminPage();
    return () => {
      active = false;
    };
  }, []);

  function flash(text: string) {
    setToast(text);
    setTimeout(() => setToast(""), 3500);
  }

  async function logout() {
    if (confirm("Deseja realmente terminar a sessão?")) {
      try {
        await signOut();
        navigate("/login", { replace: true });
      } catch (error) {
        flash(error instanceof Error ? error.message : "Não foi possível terminar a sessão.");
      }
    }
  }

  function pick(p: PageId) {
    setPage(p);
    setDrawer(false);
  }

  if (checkingAccess) {
    return <div className="p-8 text-center text-slate-600">A validar sessão...</div>;
  }
  if (loadError && !profile) {
    return (
      <div role="alert" className="mx-auto mt-12 max-w-xl rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
        {loadError}
      </div>
    );
  }
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role === "dono") return <Navigate to="/proprietario" replace />;
  if (profile.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-72 overflow-y-auto bg-surface-container-low z-50 hidden lg:flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <SidebarBody page={page} onPick={pick} />
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button className="absolute inset-0 bg-inverse-surface/40" onClick={() => setDrawer(false)} aria-label="Fechar menu" />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-surface-container-low flex flex-col justify-between shadow-xl">
            <SidebarBody page={page} onPick={pick} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-xl gap-space-md">
          <div className="flex items-center gap-space-md flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="lg:hidden w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              aria-label="Abrir menu"
            >
              <Icon name="menu" className="text-[20px]" />
            </button>
            <div className="relative w-full">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (page !== "tenants") setPage("tenants");
                }}
                className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]"
                placeholder="Buscar empresas, negócios, localizações..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            <div className="hidden md:flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
              </span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">Sessão ativa</span>
              <span className="text-outline-variant font-label-sm text-label-sm">•</span>
              <span className="font-label-sm text-label-sm text-primary font-semibold">{empresas.length} empresas</span>
            </div>

            <div className="relative">
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <Icon name="notifications" className="text-[20px]" />
              </button>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error" />
            </div>

            <div className="flex items-center gap-space-md pl-space-sm">
              <div className="hidden sm:flex flex-col text-right">
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">{profile.nome}</span>
                <span className="font-label-sm text-label-sm text-primary leading-tight font-medium">
                  {profile.role === "admin" ? "Administrador" : "Proprietário"}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Icon name="person" className="text-on-primary text-[18px]" />
              </div>
              <button
                type="button"
                onClick={logout}
                title="Terminar sessão"
                className="w-10 h-10 rounded-lg bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <Icon name="logout" className="text-[20px]" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative pt-16 bg-surface min-h-screen">
          <div className="flex flex-col w-full">
            {loadError ? (
              <p role="alert" className="mx-space-xl mt-space-lg px-space-md py-space-sm rounded-lg bg-error-container text-on-error-container font-label-lg text-label-lg">
                {loadError}
              </p>
            ) : null}

            {page === "tenants" && (
              <Tenants
                empresas={empresas}
                query={query}
                setQuery={setQuery}
                refresh={refresh}
                flash={flash}
                isAdmin
              />
            )}
            {page === "planos" && <Plans flash={flash} />}
            {page === "infra" && <Infra flash={flash} />}
            {page === "visao-geral" && (
              <Overview
                empresas={empresas}
                isAdmin
                onManage={() => setPage("tenants")}
                flash={flash}
              />
            )}
          </div>
        </main>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[90] bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl shadow-xl max-w-md">
          <div className="flex items-start gap-space-md">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 text-on-primary">
              <Icon name="check_circle" className="text-[18px]" />
            </div>
            <p className="font-label-md text-label-md font-semibold self-center">{toast}</p>
            <button type="button" onClick={() => setToast("")} className="text-inverse-on-surface hover:text-white">
              <Icon name="close" className="text-[16px]" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
import { Building2, LogOut, Menu, PenSquare, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { atualizarEmpresa, criarEmpresa, eliminarEmpresa, listarEmpresas, photoUrl } from "../lib/api";
import { ASSETS } from "../lib/assets";
import { clearAdminSession, isAdminLoggedIn } from "../lib/auth";

const TABS = [
  { id: "cadastrar", label: "Cadastrar empresa", icon: Plus },
  { id: "atualizar", label: "Atualizar empresa", icon: PenSquare },
  { id: "eliminar", label: "Eliminar empresa", icon: Trash2 },
  { id: "todos", label: "Ver todas", icon: Building2 },
];

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("cadastrar");
  const [menu, setMenu] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [msg, setMsg] = useState("");
  const [zoom, setZoom] = useState("");
  const loggedIn = isAdminLoggedIn();

  async function refresh() {
    try {
      const data = await listarEmpresas();
      setEmpresas(Array.isArray(data) ? data : []);
    } catch {
      setEmpresas([]);
    }
  }

  useEffect(() => {
    if (loggedIn) refresh();
  }, [loggedIn]);

  if (!loggedIn) return <Navigate to="/login" replace />;

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3500);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-56 shrink-0 flex-col bg-gradient-to-b from-brand-mid to-brand p-4 text-white md:flex">
        <img src={ASSETS.logo} alt="" className="mb-2 h-10 w-10 rounded-lg object-cover ring-1 ring-white/40" />
        <h1 className="mb-6 text-sm font-semibold">Painel Admin</h1>
        <nav className="space-y-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium ${
                tab === t.id ? "bg-white text-brand-mid" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-lg border p-1.5 md:hidden" onClick={() => setMenu(true)}>
              <Menu size={18} />
            </button>
            <h2 className="text-sm font-semibold text-brand-dark sm:text-base">Bem-vindo, Administrador</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
            onClick={() => {
              if (confirm("Deseja realmente terminar a sessão?")) {
                clearAdminSession();
                navigate("/login");
              }
            }}
          >
            <LogOut size={16} /> Sair
          </button>
        </header>

        {menu ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-gradient-to-b from-brand-mid to-brand p-6 text-white">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="font-bold">Painel Admin</h1>
                <button onClick={() => setMenu(false)}>
                  <X />
                </button>
              </div>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id);
                    setMenu(false);
                  }}
                  className="mb-2 flex w-full items-center gap-3 rounded-xl bg-white/10 px-4 py-3"
                >
                  <t.icon size={18} /> {t.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {msg ? <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 font-medium text-emerald-800">{msg}</p> : null}
          {tab === "cadastrar" && <Cadastrar onDone={refresh} flash={flash} />}
          {tab === "atualizar" && <Atualizar empresas={empresas} onDone={refresh} flash={flash} />}
          {tab === "eliminar" && <Eliminar empresas={empresas} onDone={refresh} flash={flash} />}
          {tab === "todos" && <Todos empresas={empresas} onZoom={setZoom} />}
        </main>
      </div>

      {zoom ? (
        <button className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setZoom("")}>
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-xl" />
        </button>
      ) : null}
    </div>
  );
}

function FileInputs() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <input key={n} type="file" name="fotos" accept="image/*" className="w-full text-sm" />
      ))}
    </div>
  );
}

function Cadastrar({ onDone, flash }) {
  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await criarEmpresa(new FormData(form));
      form.reset();
      flash("Empresa cadastrada com sucesso!");
      onDone();
    } catch (err) {
      flash(err.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-3 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-brand-dark">Cadastrar nova empresa</h3>
      <input name="nome" required placeholder="Nome" className="w-full rounded-xl border px-4 py-3" />
      <textarea name="biografia" rows={4} placeholder="Biografia" className="w-full rounded-xl border px-4 py-3" />
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="localizacao" placeholder="Localização" className="rounded-xl border px-4 py-3" />
        <input name="negocio" placeholder="Negócio" className="rounded-xl border px-4 py-3" />
      </div>
      <p className="font-medium">Fotos (até 5)</p>
      <FileInputs />
      <button className="rounded-xl bg-brand px-5 py-3 font-semibold text-white">Salvar</button>
    </form>
  );
}

function Atualizar({ empresas, onDone, flash }) {
  const [id, setId] = useState("");
  const selected = empresas.find((e) => String(e.id) === String(id));

  async function onSubmit(e) {
    e.preventDefault();
    if (!id) return flash("Selecione uma empresa primeiro.");
    const fd = new FormData(e.target);
    try {
      await atualizarEmpresa(id, fd);
      flash("Empresa atualizada com sucesso!");
      onDone();
    } catch (err) {
      flash(err.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-4">
      <h3 className="text-base font-semibold text-brand-dark">Atualizar empresa</h3>
      <select value={id} onChange={(e) => setId(e.target.value)} className="w-full rounded-xl border bg-white px-4 py-3">
        <option value="">-- selecione --</option>
        {empresas.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </select>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow">
          <input name="nome" key={id + "n"} defaultValue={selected?.nome || ""} required placeholder="Nome" className="w-full rounded-xl border px-4 py-3" />
          <input name="negocio" key={id + "neg"} defaultValue={selected?.negocio || ""} placeholder="Negócio" className="w-full rounded-xl border px-4 py-3" />
          <input name="localizacao" key={id + "l"} defaultValue={selected?.localizacao || ""} placeholder="Localização" className="w-full rounded-xl border px-4 py-3" />
          <textarea name="biografia" key={id + "b"} defaultValue={selected?.biografia || ""} rows={5} placeholder="Biografia" className="w-full rounded-xl border px-4 py-3" />
        </div>
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow">
          <p className="font-medium">Fotos atuais</p>
          <div className="flex flex-wrap gap-2">
            {(selected?.fotos || []).map((f) => (
              <img key={f} src={photoUrl([f])} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ))}
          </div>
          <p className="font-medium">Substituir / adicionar fotos</p>
          <FileInputs />
          <button className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-white">Atualizar</button>
        </div>
      </div>
    </form>
  );
}

function Eliminar({ empresas, onDone, flash }) {
  async function remove(id) {
    if (!confirm("Deseja realmente eliminar esta empresa?")) return;
    try {
      await eliminarEmpresa(id);
      flash("Empresa eliminada com sucesso.");
      onDone();
    } catch (err) {
      flash(err.message);
    }
  }

  if (!empresas.length) return <p className="text-slate-500">Nenhuma empresa cadastrada.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <h3 className="text-base font-semibold text-brand-dark">Eliminar empresas</h3>
      {empresas.map((e) => (
        <div key={e.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow sm:flex-row sm:items-center">
          <img src={photoUrl(e.fotos)} alt="" className="h-20 w-20 rounded-lg object-cover" />
          <div className="flex-1">
            <p className="font-semibold">{e.nome}</p>
            <p className="text-sm text-slate-500">
              {e.negocio} • {e.localizacao}
            </p>
          </div>
          <button type="button" onClick={() => remove(e.id)} className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white">
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}

function Todos({ empresas, onZoom }) {
  if (!empresas.length) return <p className="text-slate-500">Nenhuma empresa cadastrada.</p>;
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-brand-dark">Empresas cadastradas</h3>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {empresas.map((e) => (
          <article key={e.id} className="rounded-2xl bg-white p-5 shadow">
            <h4 className="text-lg font-bold">{e.nome}</h4>
            <p className="mt-2 text-sm text-slate-600">{e.biografia}</p>
            <p className="mt-2 text-sm">
              <strong>Localização:</strong> {e.localizacao}
            </p>
            <p className="text-sm">
              <strong>Negócio:</strong> {e.negocio}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(e.fotos || []).map((f) => (
                <button key={f} type="button" onClick={() => onZoom(photoUrl([f]))}>
                  <img src={photoUrl([f])} alt="" className="h-16 w-16 rounded-lg object-cover" />
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

import { useMemo, useState, type FormEvent } from "react";
import {
  atualizarEmpresa,
  atualizarEstadoEmpresa,
  criarEmpresa,
  eliminarEmpresa,
  photoUrl,
} from "../../lib/api";
import type { Empresa, EmpresaStatus } from "../../lib/types";
import { Bar, Icon, Modal, inputCls, labelCls } from "./ui";

const PAGE_SIZE = 7;
const MAX_FOTOS = 5;

type Props = {
  empresas: Empresa[];
  query: string;
  setQuery: (v: string) => void;
  refresh: () => void | Promise<void>;
  flash: (m: string) => void;
  isAdmin: boolean;
};

function exportCsv(rows: Empresa[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["id", "nome", "negocio", "localizacao", "biografia", "fotos"];
  const lines = rows.map((e) =>
    [e.id, e.nome, e.negocio, e.localizacao, e.biografia, (e.fotos || []).length].map(esc).join(","),
  );
  const blob = new Blob(["\ufeff" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "empresas.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function pageItems(cur: number, total: number): (number | "…")[] {
  const set = new Set([1, total, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

function unique(values: (string | undefined | null)[]): string[] {
  return [...new Set(values.map((v) => (v || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export default function Tenants({ empresas, query, setQuery, refresh, flash, isAdmin }: Props) {
  const [negocioF, setNegocioF] = useState("all");
  const [localF, setLocalF] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ empresa: Empresa | null } | null>(null);
  const [zoom, setZoom] = useState("");

  const negocios = useMemo(() => unique(empresas.map((e) => e.negocio)), [empresas]);
  const locais = useMemo(() => unique(empresas.map((e) => e.localizacao)), [empresas]);

  const total = empresas.length;
  const totalFotos = empresas.reduce((s, e) => s + (e.fotos?.length || 0), 0);
  const comFotos = empresas.filter((e) => (e.fotos?.length || 0) > 0).length;
  const comBio = empresas.filter((e) => (e.biografia || "").trim()).length;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = empresas.filter((e) => {
      if (negocioF !== "all" && (e.negocio || "").trim() !== negocioF) return false;
      if (localF !== "all" && (e.localizacao || "").trim() !== localF) return false;
      if (!q) return true;
      return [e.nome, e.negocio, e.localizacao, e.biografia, String(e.id)].some((v) => (v || "").toLowerCase().includes(q));
    });
    return [...list].sort((a, b) => {
      if (sort === "nome") return (a.nome || "").localeCompare(b.nome || "");
      if (sort === "fotos") return (b.fotos?.length || 0) - (a.fotos?.length || 0);
      const na = Number(a.id);
      const nb = Number(b.id);
      return Number.isFinite(na) && Number.isFinite(nb) ? nb - na : 0;
    });
  }, [empresas, query, negocioF, localF, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  async function remove(e: Empresa) {
    if (!confirm(`Deseja realmente eliminar "${e.nome}"?`)) return;
    try {
      await eliminarEmpresa(e.id);
      flash("Empresa eliminada com sucesso.");
      await refresh();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Erro inesperado");
    }
  }

  async function changeStatus(empresa: Empresa, status: EmpresaStatus) {
    try {
      await atualizarEstadoEmpresa(empresa.id, status);
      flash("Estado de publicação atualizado.");
      await refresh();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Erro inesperado");
    }
  }

  const kpis = [
    {
      label: "Total de Empresas",
      icon: "apartment",
      iconBox: "bg-primary-fixed text-on-primary-fixed-variant",
      value: String(total),
      hint: "cadastradas",
      hintIcon: "arrow_upward",
      hintCls: "text-primary",
      bar: "bg-primary-container",
      p: total ? 100 : 0,
    },
    {
      label: "Fotos Publicadas",
      icon: "photo_library",
      iconBox: "bg-surface-container-high text-primary",
      value: String(totalFotos),
      hint: `${total ? (totalFotos / total).toFixed(1) : "0"} por empresa`,
      hintIcon: "image",
      hintCls: "text-on-surface-variant",
      bar: "bg-primary-container",
      p: total ? (totalFotos / (total * MAX_FOTOS)) * 100 : 0,
    },
    {
      label: "Localizações",
      icon: "location_on",
      iconBox: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      value: String(locais.length),
      hint: "locais distintos",
      hintIcon: "pin_drop",
      hintCls: "text-tertiary",
      bar: "bg-tertiary-container",
      p: pct(locais.length),
    },
    {
      label: "Negócios / Categorias",
      icon: "category",
      iconBox: "bg-secondary-fixed text-on-secondary-fixed-variant",
      value: String(negocios.length),
      hint: "categorias distintas",
      hintIcon: "label",
      hintCls: "text-primary",
      bar: "bg-primary",
      p: pct(negocios.length),
    },
  ];

  return (
    <>
      <div className="px-space-xl pt-space-xl pb-space-lg flex flex-col gap-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-sm mb-1">
              <span className="font-code-sm text-code-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium tracking-wide uppercase">
                Catálogo de Empresas
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              <span className="font-code-sm text-code-sm text-on-surface-variant">{total} registos ativos</span>
            </div>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile sm:font-headline-xl sm:text-headline-xl text-on-surface tracking-tight">
              Gestão de Empresas
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mt-1">
              Cadastre, atualize e elimine as empresas publicadas na plataforma, com biografia, localização, negócio e até 5 fotos.
            </p>
          </div>
          <div className="flex items-center gap-space-md self-start lg:self-center flex-wrap">
            <button
              type="button"
              onClick={() => exportCsv(filtered)}
              className="flex items-center gap-space-sm px-space-md py-2.5 rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-colors shadow-sm font-label-lg text-label-lg"
            >
              <Icon name="file_download" className="text-[18px]" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setModal({ empresa: null })}
              className="flex items-center gap-space-sm px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary hover:opacity-95 transition-all shadow-md hover:shadow-lg font-label-lg text-label-lg"
            >
              <Icon name="add_circle" className="text-[20px]" />
              <span>+ Cadastrar Empresa</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {kpis.map((k) => (
            <div key={k.label} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{k.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.iconBox}`}>
                  <Icon name={k.icon} className="text-[18px]" />
                </div>
              </div>
              <div className="mt-space-md flex items-baseline justify-between">
                <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">{k.value}</span>
                <span className={`font-code-sm text-code-sm flex items-center gap-0.5 ${k.hintCls}`}>
                  <Icon name={k.hintIcon} className="text-[14px]" />
                  {k.hint}
                </span>
              </div>
              <div className="mt-3">
                <Bar pct={k.p} cls={k.bar} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-space-xl mb-space-lg">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col lg:flex-row gap-space-md items-stretch lg:items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-9 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
              placeholder="Filtrar por nome, negócio, localização ou ID..."
              type="text"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            {[
              { v: negocioF, set: setNegocioF, all: "Negócio: Todos", opts: negocios },
              { v: localF, set: setLocalF, all: "Localização: Todas", opts: locais },
            ].map((f) => (
              <div key={f.all} className="relative">
                <select
                  value={f.v}
                  onChange={(e) => {
                    f.set(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none bg-surface-container-low text-on-surface font-label-sm text-label-sm px-3 py-2.5 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer font-medium max-w-[200px]"
                >
                  <option value="all">{f.all}</option>
                  {f.opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]" />
              </div>
            ))}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-surface-container-low text-on-surface font-label-sm text-label-sm px-3 py-2.5 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer font-medium"
              >
                <option value="recent">Ordenar: Mais Recentes</option>
                <option value="nome">Nome (A–Z)</option>
                <option value="fotos">Mais Fotos</option>
              </select>
              <Icon name="sort" className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]" />
            </div>
            <button
              type="button"
              title="Atualizar lista"
              onClick={() => refresh()}
              className="w-10 h-10 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
            >
              <Icon name="sync" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-space-xl mb-space-xl">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-surface-container-low/60 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-3.5 px-space-lg">Empresa &amp; Identificador</th>
                  <th className="py-3.5 px-space-md">Negócio</th>
                  <th className="py-3.5 px-space-md">Localização</th>
                  <th className="py-3.5 px-space-md">Fotos</th>
                  <th className="py-3.5 px-space-md">Publicação</th>
                  <th className="py-3.5 px-space-lg text-right">Ações de Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/40 font-body-sm text-body-sm">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-space-2xl px-space-lg text-center text-on-surface-variant">
                      Nenhuma empresa encontrada.
                    </td>
                  </tr>
                ) : null}
                {rows.map((e) => {
                  const nFotos = e.fotos?.length || 0;
                  const p = (nFotos / MAX_FOTOS) * 100;
                  return (
                    <tr key={e.id} className="hover:bg-surface-container-low/40 transition-colors group">
                      <td className="py-space-md px-space-lg">
                        <div className="flex items-center gap-space-md">
                          <button
                            type="button"
                            onClick={() => nFotos && setZoom(photoUrl([e.fotos[0]]))}
                            className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary overflow-hidden shadow-sm flex-shrink-0"
                          >
                            {nFotos ? (
                              <img src={photoUrl([e.fotos[0]])} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Icon name="storefront" className="text-[22px]" />
                            )}
                          </button>
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">{e.nome}</span>
                            <span className="font-code-sm text-code-sm text-on-surface-variant">ID: #{String(e.id)}</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 max-w-xs truncate">
                              {e.biografia || "Sem biografia"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md">
                        {isAdmin ? (
                          <select
                            aria-label={`Estado de publicação de ${e.nome}`}
                            value={e.status || "pendente"}
                            onChange={(event) => changeStatus(e, event.target.value as EmpresaStatus)}
                            className="rounded-lg border border-surface-container-high bg-surface-container-low px-2 py-1.5 font-label-sm text-label-sm text-on-surface"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="publicada">Publicada</option>
                            <option value="suspensa">Suspensa</option>
                          </select>
                        ) : (
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {e.status === "publicada" ? "Publicada" : e.status === "suspensa" ? "Suspensa" : "Pendente"}
                          </span>
                        )}
                      </td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                          <Icon name="work" className="text-[12px]" /> {e.negocio || "—"}
                        </span>
                      </td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface">
                          <Icon name="location_on" className="text-[16px] text-on-surface-variant" />
                          {e.localizacao || "—"}
                        </span>
                      </td>
                      <td className="py-space-md px-space-md">
                        <div className="flex flex-col gap-1 w-32">
                          <div className="flex justify-between font-label-sm text-label-sm text-on-surface">
                            <span className="font-semibold text-primary">{nFotos}</span>
                            <span className="text-on-surface-variant">/ {MAX_FOTOS} fotos</span>
                          </div>
                          <Bar pct={p} />
                          <span className="font-code-sm text-code-sm text-on-surface-variant">{Math.round(p)}% do limite</span>
                        </div>
                      </td>
                      <td className="py-space-md px-space-lg text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setModal({ empresa: e })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-highest text-primary hover:bg-primary-fixed hover:text-on-primary-fixed-variant transition-colors font-label-sm text-label-sm font-semibold shadow-sm"
                          >
                            <Icon name="edit" className="text-[16px]" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            title="Eliminar empresa"
                            onClick={() => remove(e)}
                            className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-error-container text-on-surface-variant hover:text-error flex items-center justify-center transition-colors"
                          >
                            <Icon name="delete" className="text-[16px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-space-md bg-surface-container-low/40 flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Exibindo <span className="font-semibold text-on-surface">{filtered.length ? start + 1 : 0}</span> a{" "}
              <span className="font-semibold text-on-surface">{start + rows.length}</span> de{" "}
              <span className="font-semibold text-on-surface">{filtered.length}</span> empresas cadastradas
            </span>
            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                disabled={cur <= 1}
                onClick={() => setPage(cur - 1)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm transition-colors shadow-sm disabled:opacity-50"
              >
                Anterior
              </button>
              {pageItems(cur, pages).map((n, i) =>
                n === "…" ? (
                  <span key={`gap-${i}`} className="text-on-surface-variant font-label-sm px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-label-sm font-label-sm flex items-center justify-center shadow-sm transition-colors ${
                      n === cur
                        ? "bg-primary-container text-on-primary font-semibold"
                        : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={cur >= pages}
                onClick={() => setPage(cur + 1)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container text-label-sm font-label-sm transition-colors shadow-sm disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-space-xl pb-space-2xl grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        <div className="lg:col-span-2 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center flex-shrink-0">
              <Icon name="photo_camera" className="text-[24px]" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Publicação &amp; Fotos</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 leading-relaxed">
                Cada empresa aceita até <strong className="text-on-surface">5 fotos</strong>. Na edição, as fotos enviadas são aplicadas à empresa, e a
                eliminação pede sempre confirmação antes de remover o registo.
              </p>
            </div>
          </div>
          <div className="mt-space-lg pt-space-md flex flex-wrap items-center gap-space-lg">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
              <Icon name="image" className="text-[16px] text-primary" />
              <span>Máximo de 5 fotos por empresa</span>
            </div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
              <Icon name="verified_user" className="text-[16px] text-primary" />
              <span>Eliminação com confirmação</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Qualidade do Catálogo</span>
              <Icon name="fact_check" className="text-[18px] text-primary" />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Completude dos cadastros publicados:</p>
          </div>
          <div className="my-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between font-label-sm text-label-sm">
              <span className="text-on-surface">Empresas com fotos</span>
              <span className="font-semibold text-on-surface">
                {comFotos} / {total} ({Math.round(pct(comFotos))}%)
              </span>
            </div>
            <Bar pct={pct(comFotos)} h="h-2" />
            <div className="flex items-center justify-between font-label-sm text-label-sm mt-1">
              <span className="text-on-surface">Empresas com biografia</span>
              <span className="font-semibold text-on-surface">
                {comBio} / {total} ({Math.round(pct(comBio))}%)
              </span>
            </div>
            <Bar pct={pct(comBio)} cls="bg-tertiary-container" h="h-2" />
          </div>
          <button
            type="button"
            onClick={() => setModal({ empresa: null })}
            className="w-full py-2 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-center font-label-sm text-label-sm font-semibold transition-colors"
          >
            Cadastrar nova empresa →
          </button>
        </div>
      </div>

      {modal ? (
        <EmpresaModal
          empresa={modal.empresa}
          onClose={() => setModal(null)}
          onSaved={async (msg) => {
            setModal(null);
            flash(msg);
            await refresh();
          }}
        />
      ) : null}

      {zoom ? (
        <button className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-6" onClick={() => setZoom("")}>
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-xl" />
        </button>
      ) : null}
    </>
  );
}

function EmpresaModal({
  empresa,
  onClose,
  onSaved,
}: {
  empresa: Empresa | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    setSaving(true);
    setError("");
    try {
      if (empresa) await atualizarEmpresa(String(empresa.id), fd);
      else await criarEmpresa(fd);
      onSaved(empresa ? "Empresa atualizada com sucesso!" : "Empresa cadastrada com sucesso!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setSaving(false);
    }
  }

  return (
    <Modal
      icon={empresa ? "edit_square" : "domain_add"}
      title={empresa ? "Atualizar Empresa" : "Cadastrar Nova Empresa"}
      subtitle={empresa ? "Edite os dados e as fotos da empresa" : "Dados principais e fotos da empresa"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="p-space-xl flex flex-col gap-space-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className={labelCls}>Nome da Empresa</label>
            <input name="nome" required defaultValue={empresa?.nome || ""} className={inputCls} placeholder="Ex: Padaria Sol Nascente" type="text" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Negócio</label>
            <input name="negocio" defaultValue={empresa?.negocio || ""} className={inputCls} placeholder="Ex: Padaria" type="text" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Localização</label>
            <input name="localizacao" defaultValue={empresa?.localizacao || ""} className={inputCls} placeholder="Ex: Talatona, Luanda" type="text" />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className={labelCls}>Biografia</label>
            <textarea
              name="biografia"
              rows={4}
              defaultValue={empresa?.biografia || ""}
              placeholder="Conte brevemente sobre a empresa"
              className="w-full px-3 py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
        </div>

        <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-md">
          <span className={labelCls}>{empresa ? "Fotos (adicionar ou substituir)" : "Fotos (até 5)"}</span>
          {empresa && empresa.fotos?.length ? (
            <div className="flex flex-wrap gap-2">
              {empresa.fotos.map((f) => (
                <img key={f} src={photoUrl([f])} alt="" className="h-14 w-14 rounded-lg object-cover shadow-sm" />
              ))}
            </div>
          ) : null}
          {empresa ? (
            <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <input type="checkbox" name="substituir_fotos" className="accent-primary" />
              Substituir todas as fotos existentes pelas novas
            </label>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <input
                key={n}
                type="file"
                name="fotos"
                accept="image/*"
                className="w-full font-body-sm text-body-sm text-on-surface-variant bg-surface-container-lowest rounded-lg p-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-primary-fixed file:px-3 file:py-1 file:font-label-sm file:text-on-primary-fixed-variant"
              />
            ))}
          </div>
        </div>

        {error ? (
          <p className="px-space-md py-space-sm rounded-lg bg-error-container text-on-error-container font-label-lg text-label-lg">{error}</p>
        ) : null}

        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high font-label-md text-label-md text-on-surface transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-space-lg py-2 rounded-lg bg-primary-container hover:opacity-95 text-on-primary font-label-md text-label-md font-semibold transition-all shadow-md disabled:opacity-60"
          >
            {saving ? "A guardar..." : empresa ? "Guardar Alterações" : "Salvar Empresa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
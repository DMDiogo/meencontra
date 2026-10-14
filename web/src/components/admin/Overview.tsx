import { useEffect, useMemo, useState } from "react";
import type { Empresa } from "../../lib/types";
import { Bar, Icon } from "./ui";

const MAX_FOTOS = 5;

const STATUS = {
  publicada: { label: "Publicada", badge: "bg-primary-fixed text-on-primary-fixed", dot: "bg-primary" },
  pendente: { label: "Pendente", badge: "bg-tertiary-fixed text-on-tertiary-fixed-variant", dot: "bg-tertiary" },
  suspensa: { label: "Suspensa", badge: "bg-error-container text-error", dot: "bg-error" },
} as const;

function statusOf(e: Empresa) {
  const s = String(e.status) as keyof typeof STATUS;
  return STATUS[s] ?? STATUS.pendente;
}

const nFotos = (e: Empresa) => e.fotos?.length || 0;
const isPub = (e: Empresa) => String(e.status) === "publicada";
const pct = (n: number, total: number) => (total ? (n / total) * 100 : 0);

function topBy(list: Empresa[], pick: (e: Empresa) => string | undefined | null, n: number) {
  const m = new Map<string, number>();
  for (const e of list) {
    const k = (pick(e) || "").trim();
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}

function names(list: Empresa[], max = 2) {
  const shown = list.slice(0, max).map((e) => e.nome).join(", ");
  return list.length > max ? `${shown} e mais ${list.length - max}` : shown;
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span>
      Atualizado em tempo real •{" "}
      {now.toLocaleString("pt-PT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

function Donut({ pub, pend, susp, total }: { pub: number; pend: number; susp: number; total: number }) {
  const path = "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";
  const a = pct(pub, total);
  const b = pct(pend, total);
  const c = pct(susp, total);
  return (
    <svg className="w-44 h-44 -rotate-90" viewBox="0 0 36 36">
      <path className="text-surface-container" d={path} fill="none" stroke="currentColor" strokeWidth="3.5" />
      {a > 0 && (
        <path className="text-primary-container" d={path} fill="none" stroke="currentColor" strokeDasharray={`${a}, 100`} strokeLinecap="round" strokeWidth="3.8" />
      )}
      {b > 0 && (
        <path className="text-tertiary-container" d={path} fill="none" stroke="currentColor" strokeDasharray={`${b}, 100`} strokeDashoffset={-a} strokeLinecap="round" strokeWidth="3.8" />
      )}
      {c > 0 && (
        <path className="text-error" d={path} fill="none" stroke="currentColor" strokeDasharray={`${c}, 100`} strokeDashoffset={-(a + b)} strokeLinecap="round" strokeWidth="3.8" />
      )}
    </svg>
  );
}

type Props = {
  empresas: Empresa[];
  isAdmin: boolean;
  onManage: () => void;
  flash: (m: string) => void;
};

export default function Overview({ empresas, isAdmin, onManage, flash }: Props) {
  const [dim, setDim] = useState<"localizacao" | "negocio">("localizacao");

  const m = useMemo(() => {
    const total = empresas.length;
    const pub = empresas.filter(isPub).length;
    const pend = empresas.filter((e) => String(e.status) === "pendente").length;
    const susp = empresas.filter((e) => String(e.status) === "suspensa").length;
    const fotos = empresas.reduce((s, e) => s + nFotos(e), 0);
    const semFotos = empresas.filter((e) => nFotos(e) === 0);
    const pendentes = empresas.filter((e) => String(e.status) === "pendente");
    const locais = topBy(empresas, (e) => e.localizacao, 1000);
    const negocios = topBy(empresas, (e) => e.negocio, 1000);
    const dist = Array.from({ length: MAX_FOTOS + 1 }, (_, n) => {
      const l = empresas.filter((e) => nFotos(e) === n);
      const p = l.filter(isPub).length;
      return { n, total: l.length, pub: p, other: l.length - p };
    });
    const recentes = [...empresas]
      .sort((a, b) => {
        const na = Number(a.id);
        const nb = Number(b.id);
        return Number.isFinite(na) && Number.isFinite(nb) ? nb - na : 0;
      })
      .slice(0, 5);
    return { total, pub, pend, susp, fotos, semFotos, pendentes, locais, negocios, dist, recentes };
  }, [empresas]);

  const ranking = (dim === "localizacao" ? m.locais : m.negocios).slice(0, 6);
  const rankMax = ranking[0]?.[1] || 1;
  const distinct = dim === "localizacao" ? m.locais.length : m.negocios.length;
  const maxD = Math.max(1, ...m.dist.map((d) => d.total));

  function exportMetrics() {
    const rows: [string, string | number][] = [
      ["Empresas visíveis", m.total],
      ["Publicadas", m.pub],
      ["Pendentes", m.pend],
      ["Suspensas", m.susp],
      ["Fotos publicadas", m.fotos],
      ["Empresas sem fotos", m.semFotos.length],
      ["Localizações distintas", m.locais.length],
      ["Negócios distintos", m.negocios.length],
    ];
    const csv = "\ufeff" + ["metrica,valor", ...rows.map(([k, v]) => `"${k}",${v}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "metricas.csv";
    a.click();
    URL.revokeObjectURL(url);
    flash("Métricas exportadas.");
  }

  const kpis = [
    { label: "Empresas Visíveis", icon: "domain", box: "bg-surface-container text-tertiary", value: m.total, unit: "empresas", subIcon: "photo_camera", sub: `${m.total - m.semFotos.length} com fotos`, subCls: "text-primary", bar: "bg-primary-container", p: pct(m.total - m.semFotos.length, m.total), valueCls: "text-on-surface" },
    { label: "Publicadas", icon: "public", box: "bg-primary-fixed text-on-primary-fixed", value: m.pub, unit: "", subIcon: "trending_up", sub: `${Math.round(pct(m.pub, m.total))}% do catálogo`, subCls: "text-primary", bar: "bg-primary-container", p: pct(m.pub, m.total), valueCls: "text-on-surface" },
    { label: "Pendentes", icon: "pending_actions", box: "bg-secondary-container text-on-secondary-fixed-variant", value: m.pend, unit: "", subIcon: "schedule", sub: "aguardam aprovação", subCls: "text-on-surface-variant", bar: "bg-tertiary-container", p: pct(m.pend, m.total), valueCls: "text-on-surface" },
    { label: "Suspensas", icon: "block", box: "bg-error-container text-error", value: m.susp, unit: "", subIcon: "info", sub: "fora do catálogo público", subCls: "text-on-surface-variant", bar: "bg-error", p: pct(m.susp, m.total), valueCls: m.susp ? "text-error" : "text-on-surface" },
    { label: "Fotos Publicadas", icon: "photo_library", box: "bg-surface-container-high text-primary", value: m.fotos, unit: "fotos", subIcon: "image", sub: `${m.total ? (m.fotos / m.total).toFixed(1) : "0.0"} por empresa`, subCls: "text-on-surface-variant", bar: "bg-primary-container", p: pct(m.fotos, m.total * MAX_FOTOS), valueCls: "text-on-surface" },
  ];

  const alerts = [
    {
      icon: "warning",
      box: m.pend ? "bg-error-container text-error" : "bg-surface-container text-on-surface-variant",
      title: "Aguardando Aprovação",
      tag: `${m.pend} ${m.pend === 1 ? "empresa" : "empresas"}`,
      tagCls: m.pend ? "bg-error-container text-error" : "bg-surface-container text-on-surface-variant",
      text: m.pend ? names(m.pendentes) : "Nenhuma empresa pendente",
    },
    {
      icon: "no_photography",
      box: "bg-surface-container text-tertiary",
      title: "Empresas sem Fotos",
      tag: String(m.semFotos.length),
      tagCls: "bg-surface-container text-on-surface",
      text: m.semFotos.length ? names(m.semFotos) : "Todas as empresas têm fotos",
    },
    {
      icon: "location_on",
      box: "bg-surface-container-high text-on-surface-variant",
      title: "Cobertura do Catálogo",
      tag: `${m.locais.length} locais • ${m.negocios.length} negócios`,
      tagCls: "bg-surface-container text-on-surface",
      text: m.locais[0] ? `Maior concentração: ${m.locais[0][0]} (${m.locais[0][1]})` : "Sem localizações cadastradas",
    },
  ];

  return (
    <div className="flex flex-col w-full p-space-xl gap-space-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg bg-surface-container-lowest p-space-xl rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-space-xs z-10">
          <div className="flex items-center gap-space-md flex-wrap">
            <span className="font-headline-lg text-headline-lg text-on-surface">Visão Geral da Plataforma</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Catálogo Sincronizado
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 flex-wrap">
            <Icon name="schedule" className="text-[16px] text-primary" />
            <Clock />
            <span className="text-outline-variant">•</span>
            <span className="font-code-sm text-code-sm text-secondary">{isAdmin ? "Visão de Administrador" : "Visão de Proprietário"}</span>
          </p>
        </div>
        <div className="flex items-center gap-space-md flex-wrap z-10">
          <button
            type="button"
            onClick={exportMetrics}
            className="flex items-center gap-space-sm px-space-lg py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-all duration-150 font-label-lg text-label-lg shadow-sm"
          >
            <Icon name="file_download" className="text-[18px] text-on-surface-variant" />
            Exportar Métricas
          </button>
          <button
            type="button"
            onClick={onManage}
            className="flex items-center gap-space-sm px-space-lg py-2.5 rounded-lg bg-primary hover:bg-on-primary-container text-on-primary transition-all duration-150 font-label-lg text-label-lg shadow-md shadow-primary/20"
          >
            <Icon name="add_business" className="text-[18px]" />
            Gerir Empresas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-space-md">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">{k.label}</span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.box}`}>
                <Icon name={k.icon} className="text-[18px]" />
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className={`font-headline-lg text-headline-lg tracking-tight ${k.valueCls}`}>
                {k.value} {k.unit ? <span className="font-label-lg text-label-lg text-on-surface-variant">{k.unit}</span> : null}
              </div>
              <div className={`flex items-center gap-1.5 font-label-sm text-label-sm ${k.subCls}`}>
                <Icon name={k.subIcon} className="text-[16px]" />
                <span>{k.sub}</span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs">
              <Bar pct={k.p} cls={k.bar} h="h-2" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {alerts.map((a) => (
          <div key={a.title} className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.box}`}>
              <Icon name={a.icon} className="text-[20px]" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-headline-sm text-headline-sm text-on-surface">{a.title}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${a.tagCls}`}>{a.tag}</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{a.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <div className="lg:col-span-8 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mb-space-lg">
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md text-on-surface">
                Empresas por {dim === "localizacao" ? "Localização" : "Negócio"}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Ranking das {dim === "localizacao" ? "localizações" : "categorias"} com mais empresas</span>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-low p-1 rounded-lg">
              {(
                [
                  ["localizacao", "Localização"],
                  ["negocio", "Negócio"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDim(id)}
                  className={`px-space-md py-1 rounded font-label-sm text-label-sm ${
                    dim === id ? "bg-surface-container-lowest shadow-sm text-on-surface font-semibold" : "text-on-surface-variant hover:text-on-surface font-medium"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-space-md min-h-[16rem] justify-center">
            {ranking.length === 0 ? (
              <p className="text-center font-body-md text-body-md text-on-surface-variant">Sem dados para mostrar.</p>
            ) : (
              ranking.map(([label, count], i) => (
                <div key={label} className="flex items-center gap-space-md">
                  <span className="w-6 font-code-sm text-code-sm text-on-surface-variant">#{i + 1}</span>
                  <span className="w-40 shrink-0 truncate font-label-lg text-label-lg text-on-surface">{label}</span>
                  <div className="flex-1 bg-surface-container-low h-3 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${(count / rankMax) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-code-sm text-code-sm font-semibold text-on-surface">{count}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-space-xl mt-space-lg pt-space-md bg-surface-container-low px-space-md py-space-sm rounded-lg flex-wrap">
            <div className="flex items-center gap-space-sm">
              <span className="w-3 h-3 rounded bg-primary" />
              <span className="font-label-sm text-label-sm text-on-surface">Empresas cadastradas</span>
            </div>
            <div className="ml-auto font-label-sm text-label-sm text-on-surface-variant">
              {dim === "localizacao" ? "Localizações" : "Negócios"} distintos: <strong className="text-on-surface">{distinct}</strong>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md text-on-surface">Estado das Empresas</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Publicação no catálogo</span>
            </div>
            <Icon name="sensors" className="text-primary text-[20px]" />
          </div>
          <div className="flex items-center justify-center my-space-md relative">
            <Donut pub={m.pub} pend={m.pend} susp={m.susp} total={m.total} />
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-headline-xl text-headline-xl text-on-surface leading-none">{m.total}</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mt-1">Empresas</span>
            </div>
          </div>
          <div className="flex flex-col gap-space-sm pt-space-xs">
            {[
              { label: "Publicadas", dot: "bg-primary-container", n: m.pub, cls: "text-on-surface" },
              { label: "Pendentes de aprovação", dot: "bg-tertiary-container", n: m.pend, cls: "text-on-surface" },
              { label: "Suspensas", dot: "bg-error", n: m.susp, cls: "text-error" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-space-sm">
                  <span className={`w-3 h-3 rounded-full ${r.dot}`} />
                  <span className="font-label-md text-label-md text-on-surface">{r.label}</span>
                </div>
                <span className={`font-code-sm text-code-sm font-semibold ${r.cls}`}>
                  {r.n} ({Math.round(pct(r.n, m.total))}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-on-surface">Cobertura de Fotos por Empresa</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Quantas empresas têm 0, 1, 2… até 5 fotos, separadas por estado de publicação</span>
          </div>
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-primary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Publicadas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-primary-fixed-dim" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Pendentes / Suspensas</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-space-md items-end h-44 pt-space-md">
          {m.dist.map((d) => (
            <div key={d.n} className="flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full max-w-[48px] flex flex-col items-center gap-1 h-full justify-end">
                {d.total ? (
                  <div className="w-full flex flex-col justify-end gap-1" style={{ height: `${(d.total / maxD) * 100}%` }}>
                    {d.other ? <div className="w-full bg-primary-fixed-dim rounded-t" style={{ flex: d.other }} /> : null}
                    {d.pub ? <div className="w-full bg-primary rounded-b" style={{ flex: d.pub }} /> : null}
                  </div>
                ) : (
                  <div className="w-full h-1 bg-surface-container rounded" />
                )}
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-center">
                {d.n} {d.n === 1 ? "foto" : "fotos"} <span className="font-code-sm text-code-sm text-on-surface font-semibold">({d.total})</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-space-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-on-surface">Últimas Empresas Cadastradas</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Registos mais recentes e o respetivo estado de publicação</span>
          </div>
          <button
            type="button"
            onClick={onManage}
            className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container font-label-md text-label-md text-on-surface transition-colors"
          >
            Ver Todas as Empresas
          </button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="py-space-md px-space-xl">Empresa</th>
                <th className="py-space-md px-space-md">Negócio</th>
                <th className="py-space-md px-space-md">Localização</th>
                <th className="py-space-md px-space-md">Fotos</th>
                <th className="py-space-md px-space-xl text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
              {m.recentes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-space-2xl px-space-xl text-center text-on-surface-variant">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              ) : null}
              {m.recentes.map((e) => {
                const st = statusOf(e);
                return (
                  <tr key={e.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-space-md px-space-xl">
                      <div className="flex items-center gap-space-md">
                        <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed font-headline-sm flex items-center justify-center font-bold">
                          {(e.nome || "?").trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold">{e.nome}</span>
                          <span className="font-code-sm text-code-sm text-on-surface-variant">empresa_{String(e.id)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">{e.negocio || "—"}</span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <Icon name="location_on" className="text-[16px] text-tertiary" />
                        <span>{e.localizacao || "—"}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md font-label-lg text-label-lg font-semibold text-on-surface">
                      {nFotos(e)} <span className="font-normal text-on-surface-variant">/ {MAX_FOTOS}</span>
                    </td>
                    <td className="py-space-md px-space-xl text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${st.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-space-lg bg-surface-container-low">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Mostrando {m.recentes.length} de {m.total} empresas visíveis para a tua conta.
          </span>
        </div>
      </div>
    </div>
  );
}
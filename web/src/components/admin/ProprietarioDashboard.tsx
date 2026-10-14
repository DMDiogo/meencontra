import { useState } from "react";
import { Icon } from "./ui";

const HOURS: [string, string, number][] = [
  ["08h", "1.1k", 25],
  ["09h", "1.9k", 45],
  ["10h", "2.8k", 65],
  ["11h", "3.1k", 72],
  ["12h", "2.4k", 56],
  ["13h", "3.2k", 75],
  ["14h", "4.2k", 100],
  ["15h", "4.1k", 98],
  ["16h", "3.8k", 90],
  ["17h", "3.0k", 70],
  ["18h", "2.1k", 50],
  ["19h", "1.5k", 35],
  ["20h", "0.9k", 22],
];

const DELIVERY = [
  { icon: "outgoing_mail", iconCls: "text-on-surface-variant", label: "Enviadas (100%)", value: "34.820", bar: "bg-secondary", w: 100, danger: false },
  { icon: "done_all", iconCls: "text-primary", label: "Entregues (99.2%)", value: "34.540", bar: "bg-primary-container", w: 99.2, danger: false },
  { icon: "visibility", iconCls: "text-tertiary", label: "Lidas / Visualizadas (88.4%)", value: "30.780", bar: "bg-tertiary-container", w: 88.4, danger: false },
  { icon: "error", iconCls: "text-error", label: "Falhas / Bloqueios (0.8%)", value: "280", bar: "bg-error", w: 0.8, danger: true },
];

const DEPARTMENTS = [
  { name: "Vendas / Comercial", chats: 205, pct: 48, dot: "bg-primary-container" },
  { name: "Suporte Técnico N2", chats: 137, pct: 32, dot: "bg-tertiary" },
  { name: "Financeiro & Cobrança", chats: 60, pct: 14, dot: "bg-secondary" },
  { name: "Cancelamento / Retenção", chats: 26, pct: 6, dot: "bg-error" },
];

const AGENTS = [
  {
    name: "Matheus Silva",
    title: "Senior Specialist",
    photo:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSYARwx1D-QjOqjQ3DvFyk1kTq4tD7-dKKlBQ_Yr7dK5LXRdgfyZY9S1ERldOszZ-vT9BZvRTUGyNLgXjQ9JMusnb44DQPone_dmrn-k8VHk0S9nrmj-L8yNk10cxaovXZ47Sz4SnR6Sm2clAxsSwSwgJfSjNaUJ7hLa14UD_q9UifOP8LaOXfHDPJaRPmyrMhCma-_iKIOrihmYovPiiVejHmeH6InTom1BAHUC1-N4LdoCk1GVuS",
    dept: "Vendas / Comercial",
    deptCls: "bg-primary-fixed/40 text-on-primary-fixed",
    chats: 94,
    tma: "06m 10s",
    first: "0m 52s",
    csat: "4.9",
    reviews: 112,
    status: "Em Atendimento",
    statusCls: "bg-primary-fixed text-on-primary-fixed",
    dot: "bg-primary-container",
  },
  {
    name: "Amanda Ferreira",
    title: "Tech Lead N2",
    photo:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAlhHuqYAO3DFelsbVt_cZXFtIdjqTXq4t3xQBPtuLs1t_E2kXLrA2jrXmd3Am-RcTkUb4a-SL83lqUhWn15A0qZQrBITRnL6WVgbBRGxwhvdxNVrnltpyzF6EthkDxYmyMIGcB3ZI_C0no8fqx1hXWUiaaoQJKU0bRUe-RulBbQeyu7Eaqg12COc-1hGpDOCu31Oc8nswGfVhMY7fr-zRJx9VJNi23PEsYjbxrPhGspGEACi82Uqe",
    dept: "Suporte Técnico N2",
    deptCls: "bg-surface-container-high text-tertiary",
    chats: 82,
    tma: "09m 45s",
    first: "1m 15s",
    csat: "4.8",
    reviews: 98,
    status: "Online (Fila Aberta)",
    statusCls: "bg-primary-fixed-dim text-on-primary-fixed",
    dot: "bg-primary-container",
  },
  {
    name: "Lucas Duarte",
    title: "Analista Financeiro",
    photo:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbwp9qvcS-U8rOpCqR4WFW1fmy-H17ZNrjWiwcth_-93sqkQhNg1PdPsHsrUo7xDpiYsu_ifc701idAfSqCEmKmSF_CapnBne9p_rpQhryVw8p3Pa_77JQrsk7eaYGHWChPy8O7M6byg-cLKNCvDjPVNG7i5kc2doWGg-rjuafwT0iICmRRt07M4znn3qkdGQZAMvfuDLEEA7PJP0uz4O3gbD1_UcMhKIE6-AX5x6xcDYucqvzRJbB",
    dept: "Financeiro & Cobrança",
    deptCls: "bg-surface-container text-on-surface-variant",
    chats: 58,
    tma: "07m 30s",
    first: "1m 40s",
    csat: "4.7",
    reviews: 64,
    status: "Pausa Regulamentar",
    statusCls: "bg-surface-container-high text-on-surface-variant",
    dot: "bg-secondary",
  },
  {
    name: "Camila Rocha",
    title: "Gestora de Retenção",
    photo:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuASRop3ekUWNoNMp7L1aViu1XwNnSqBmQdKVfIsos_TEuhBwK-O88rWf-szo6xit4zs06gLu1hhxNuJZdJMjikynuaCuGCS5EIZeDWo2D4dWZIYhuU6cG6LfsoZ73gJxZeuY1Zs-tz4sw8aSmE3XJY_c5u5h6cl3nP_M8EVl8fLapAgjdLsgAT44ugdebzzaXpBuiddqhDxtYGUL4xNyDNhzf-rag2dCqk0tRolJjgDce95JPlv1nln",
    dept: "Cancelamento / Retenção",
    deptCls: "bg-error-container text-on-error-container",
    chats: 39,
    tma: "11m 20s",
    first: "1m 08s",
    csat: "4.9",
    reviews: 45,
    status: "Em Atendimento",
    statusCls: "bg-primary-fixed text-on-primary-fixed",
    dot: "bg-primary-container",
  },
];

const NAV: { icon: string; label: string; badge?: string; badgeCls?: string }[] = [
  { icon: "dashboard", label: "Dashboard & Visão Geral" },
  { icon: "devices", label: "Conexões & Instâncias", badge: "3 Online", badgeCls: "bg-primary-fixed-dim text-on-primary-fixed" },
  { icon: "chat", label: "Live Chat & Atendimento", badge: "14 pendentes", badgeCls: "bg-error-container text-on-error-container" },
  { icon: "smart_toy", label: "Automação & Chatbot" },
  { icon: "campaign", label: "Disparos em Massa" },
  { icon: "contacts", label: "Contatos & CRM" },
];

const PERIODS = ["Hoje", "Últimos 7 dias", "Este Mês"];

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

function download(name: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function SidebarBody({ nomeOrganizacao, nomeProprietario }: { nomeOrganizacao: string; nomeProprietario: string }) {
  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="p-space-lg flex items-center gap-space-sm bg-surface-container-lowest">
          <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center">
            <Icon name="forum" className="text-on-primary-fixed text-[22px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface">OmniFlow</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">WhatsApp Suite</span>
          </div>
        </div>

        <div className="px-space-lg pb-space-md">
          <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Organização</span>
              <span className="px-space-xs py-[2px] rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">Plano Pro</span>
            </div>
            <div className="flex items-center justify-between cursor-pointer">
              <span className="font-label-lg text-label-lg text-on-surface truncate pr-space-xs">{nomeOrganizacao || "Minha organização"}</span>
              <Icon name="unfold_more" className="text-on-surface-variant text-[18px]" />
            </div>
          </div>
        </div>

        <nav className="flex-1 px-space-md space-y-space-xs overflow-y-auto">
          {NAV.map((n, i) => (
            <a
              key={n.label}
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors ${
                i === 0
                  ? "bg-primary-container text-on-primary font-label-lg"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <div className="flex items-center gap-space-md">
                <Icon name={n.icon} className="text-[20px]" />
                <span className="font-body-md text-body-md">{n.label}</span>
              </div>
              {n.badge ? (
                <span className={`px-space-xs py-[2px] rounded-full font-label-sm text-label-sm ${n.badgeCls}`}>{n.badge}</span>
              ) : null}
            </a>
          ))}
        </nav>
      </div>

      <div className="p-space-md bg-surface-container-low flex flex-col gap-space-sm">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-space-sm text-on-surface-variant hover:text-on-surface px-space-sm py-space-xs font-label-md text-label-md transition-colors"
        >
          <Icon name="help" className="text-[18px]" />
          Ajuda & Documentação
        </a>
        <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Icon name="person" className="text-on-primary text-[18px]" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-2 ring-surface-container-lowest" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface truncate">{nomeProprietario || "Proprietário"}</span>
              <span className="font-label-sm text-label-sm text-primary truncate">Disponível (Online)</span>
            </div>
          </div>
          <Icon name="more_vert" className="text-on-surface-variant text-[18px] cursor-pointer hover:text-on-surface" />
        </div>
      </div>
    </>
  );
}

export default function ProprietarioDashboard({
  nomeOrganizacao,
  nomeProprietario,
  onLogout,
}: {
  nomeOrganizacao: string;
  nomeProprietario: string;
  onLogout?: () => void;
}) {
  const [period, setPeriod] = useState(PERIODS[0]);
  const [instance, setInstance] = useState("all");
  const [instanceOpen, setInstanceOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [filter, setFilter] = useState("");

  const agents = AGENTS.filter((a) => a.name.toLowerCase().includes(filter.trim().toLowerCase()));
  const instanceLabel = instance === "all" ? "Todas as 3 instâncias" : `Instância 0${instance}`;

  function exportReport() {
    download("relatorio-atendimento.csv", [
      ["Indicador", "Valor"],
      ["Conversas Ativas", "428"],
      ["Conversas no mês", "8650"],
      ["Volume de Mensagens", "56210"],
      ["SLA / Primeira resposta", "1m 45s"],
      ["Instâncias online", "3 / 3"],
      ...DEPARTMENTS.map((d) => [d.name, String(d.chats)]),
    ]);
  }

  function exportRanking() {
    download("ranking-atendentes.csv", [
      ["Atendente", "Departamento", "Chats Hoje", "TMA Médio", "1ª Resposta", "CSAT", "Avaliações", "Status"],
      ...agents.map((a) => [a.name, a.dept, String(a.chats), a.tma, a.first, a.csat, String(a.reviews), a.status]),
    ]);
  }

  return (
    // fixed inset-0: ocupa a janela inteira e ignora qualquer padding/centragem do layout pai
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-surface font-body-md text-body-md text-on-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 hidden lg:flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <SidebarBody nomeOrganizacao={nomeOrganizacao} nomeProprietario={nomeProprietario} />
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button className="absolute inset-0 bg-inverse-surface/40" onClick={() => setDrawer(false)} aria-label="Fechar menu" />
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface-container-lowest flex flex-col justify-between shadow-xl">
            <SidebarBody nomeOrganizacao={nomeOrganizacao} nomeProprietario={nomeProprietario} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-xl">
          <div className="flex items-center gap-space-lg flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="lg:hidden p-space-xs rounded-lg hover:bg-surface-container text-on-surface-variant"
              aria-label="Abrir menu"
            >
              <Icon name="menu" className="text-[22px]" />
            </button>
            <div className="flex items-center w-full px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface-variant focus-within:bg-surface-container-lowest focus-within:shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <Icon name="search" className="text-[20px] text-on-surface-variant mr-space-sm" />
              <input
                className="w-full bg-transparent border-0 outline-none font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant"
                placeholder="Buscar conversas, números, tags ou contatos..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="hidden md:flex items-center gap-space-xs px-space-sm py-[4px] rounded-full bg-surface-container-low">
              <span className="w-2 h-2 rounded-full bg-primary-container" />
              <span className="font-label-sm text-label-sm text-on-surface">Baileys: Online</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">• 99.8% SLA</span>
            </div>
            <button
              type="button"
              className="hidden sm:flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors"
            >
              <Icon name="sync_alt" className="text-[16px]" />
              <span className="font-label-sm text-label-sm">Turno Ativo</span>
            </button>
            <div className="relative cursor-pointer p-space-xs rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors">
              <Icon name="notifications" className="text-[22px]" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
              <Icon name="person" className="text-on-primary text-[18px]" />
            </div>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                title="Terminar sessão"
                aria-label="Terminar sessão"
                className="p-space-xs rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
              >
                <Icon name="logout" className="text-[22px]" />
              </button>
            ) : null}
          </div>
        </header>

        <main className="relative pt-16 bg-surface min-h-screen w-full px-space-xl py-space-lg">
          <div className="flex flex-col w-full gap-space-xl">
            {/* Cabeçalho Executivo e Barra de Controles Rápidos */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-sm">
                  <span className="px-space-xs py-[2px] rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm uppercase tracking-wide">
                    Telemetria em Tempo Real
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                    Sync: agora mesmo
                  </span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Dashboard Executivo de Atendimento</h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                  Acompanhamento em tempo real de mensagens, SLA da equipe e tráfego de instâncias WhatsApp
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-space-sm bg-surface-container-lowest p-space-xs rounded-xl shadow-sm">
                <div className="flex items-center bg-surface-container-low p-1 rounded-lg text-on-surface-variant font-label-md text-label-md">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`px-space-md py-1 rounded transition-colors ${
                        period === p ? "bg-surface-container-lowest text-primary font-semibold shadow-xs" : "hover:text-on-surface"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setInstanceOpen((o) => !o)}
                    className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors"
                  >
                    <Icon name="cell_tower" className="text-[18px] text-primary" />
                    <span>{instanceLabel}</span>
                    <Icon name="expand_more" className="text-[16px] text-on-surface-variant" />
                  </button>
                  {instanceOpen ? (
                    <>
                      <button className="fixed inset-0 z-10 cursor-default" onClick={() => setInstanceOpen(false)} aria-label="Fechar" />
                      <div className="absolute left-0 top-full mt-1 z-20 min-w-full rounded-lg bg-surface-container-lowest shadow-lg py-1">
                        {[
                          ["all", "Todas as 3 instâncias"],
                          ["1", "Instância 01"],
                          ["2", "Instância 02"],
                          ["3", "Instância 03"],
                        ].map(([v, l]) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setInstance(v);
                              setInstanceOpen(false);
                            }}
                            className={`w-full text-left whitespace-nowrap px-space-md py-2 font-label-md text-label-md hover:bg-surface-container-low ${
                              instance === v ? "text-primary" : "text-on-surface"
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={exportReport}
                  className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-sm"
                >
                  <Icon name="file_download" className="text-[18px]" />
                  <span>Exportar Relatório PDF/XLS</span>
                </button>
              </div>
            </div>

            {/* 4 KPIs de Alto Destaque */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-lg">
              {/* Card 1: Conversas Ativas */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase">Conversas Ativas</span>
                    <div className="flex items-baseline gap-space-xs mt-space-xs">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">428</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">hoje</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-on-primary-fixed">
                    <Icon name="forum" className="text-[22px]" />
                  </div>
                </div>
                <div className="mt-space-md pt-space-md flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                    <span>
                      No Mês: <strong className="text-on-surface font-semibold">8.650</strong>
                    </span>
                    <span className="flex items-center text-primary font-semibold font-label-sm text-label-sm bg-primary-fixed/30 px-1.5 py-0.5 rounded">
                      <Icon name="trending_up" className="text-[14px]" /> +14% vs mês ant.
                    </span>
                  </div>
                  <div className="w-full h-8 flex items-end">
                    <svg className="w-full h-8 text-primary-container" fill="none" preserveAspectRatio="none" viewBox="0 0 160 32">
                      <path d="M0 24 Q 20 28, 40 18 T 80 12 T 120 16 T 160 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
                      <path d="M0 24 Q 20 28, 40 18 T 80 12 T 120 16 T 160 4 L 160 32 L 0 32 Z" fill="currentColor" fillOpacity="0.12" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2: Volume de Mensagens */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase">Volume de Mensagens</span>
                    <div className="flex items-baseline gap-space-xs mt-space-xs">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold">56.210</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">total</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
                    <Icon name="swap_vert" className="text-[22px]" />
                  </div>
                </div>
                <div className="mt-space-md pt-space-md flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="flex items-center gap-1 text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-primary-container" /> Enviadas: 34.820 (62%)
                    </span>
                    <span className="flex items-center gap-1 text-on-surface-variant">
                      <span className="w-2 h-2 rounded-full bg-tertiary-container" /> Recebidas: 21.390 (38%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden flex">
                    <div className="bg-primary-container h-full transition-all duration-500" style={{ width: "62%" }} />
                    <div className="bg-tertiary-container h-full transition-all duration-500" style={{ width: "38%" }} />
                  </div>
                </div>
              </div>

              {/* Card 3: SLA & Tempo de Resposta */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase">SLA &amp; Resposta Rápida</span>
                    <div className="flex items-baseline gap-space-xs mt-space-xs">
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold whitespace-nowrap">1m 45s</span>
                      <span className="px-space-xs py-[2px] rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">Excelente</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                    <Icon name="timer" className="text-[22px]" />
                  </div>
                </div>
                <div className="mt-space-md pt-space-md flex flex-col gap-1 text-on-surface-variant font-body-sm text-body-sm">
                  <div className="flex items-center justify-between">
                    <span>Meta 1ª Resposta:</span>
                    <span className="text-on-surface font-semibold">&lt; 3min 00s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>TMA Médio de Conversa:</span>
                    <span className="text-on-surface font-semibold">8m 12s</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Status da API WhatsApp */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase">Status da API WhatsApp</span>
                    <div className="flex items-center gap-space-xs mt-space-xs">
                      <span className="w-3 h-3 rounded-full bg-primary-fixed-dim ring-4 ring-primary-fixed/40" />
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Online &amp; Saudável</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold shadow-xs">
                    3 / 3 Instâncias
                  </span>
                </div>
                <div className="mt-space-md pt-space-md flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex items-center justify-between">
                    <span>Latência de Handshake:</span>
                    <span className="font-code-sm text-code-sm text-on-surface font-semibold">24ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quedas registradas (24h):</span>
                    <span className="text-primary font-semibold">0 incidentes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Gráfica e Distribuições Operacionais */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-7 rounded-xl bg-surface-container-lowest p-space-xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                  <div className="flex flex-col">
                    <h2 className="font-headline-md text-headline-md text-on-surface">Volume de Mensagens por Hora do Dia</h2>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Pico operacional concentrado entre as 14h e as 16h</span>
                  </div>
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <span className="w-3 h-3 rounded bg-primary-container" /> Volume Horário
                    </span>
                    <span className="flex items-center gap-1 ml-space-sm whitespace-nowrap">
                      <span className="w-3 h-1 bg-tertiary" /> Tendência Média
                    </span>
                  </div>
                </div>

                <div className="w-full flex-1 min-h-[220px] flex flex-col justify-end pt-space-md">
                  {/* 13 colunas (08h–20h). A zona da barra ocupa o espaço entre os rótulos, para a altura em % ser proporcional. */}
                  <div className="grid gap-2 items-end h-44 w-full" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
                    {HOURS.map(([hour, value, h]) => {
                      const peak = hour === "14h" || hour === "15h";
                      return (
                        <div key={hour} className="flex flex-col items-center gap-1 group h-full justify-end relative">
                          <span
                            className={`font-label-sm text-label-sm ${
                              peak ? "text-primary font-bold" : "opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant"
                            }`}
                          >
                            {value}
                          </span>
                          <div className="w-full flex-1 min-h-0 flex items-end">
                            <div
                              className={`w-full rounded-t transition-all ${
                                peak ? "bg-primary-container shadow-sm" : "bg-surface-container-high group-hover:bg-primary-container"
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          </div>
                          <span className={`font-label-sm text-label-sm ${peak ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>{hour}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                  <span className="flex items-center gap-1 text-primary">
                    <Icon name="info" className="text-[16px]" />
                    Capacidade operacional máxima suporta até 12k msgs/hora sem fila.
                  </span>
                  <span className="font-code-sm text-code-sm">Janela: 08:00 - 20:00 (GMT-3)</span>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                {/* Status de Entrega Global */}
                <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Status de Entrega Global</h3>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Ciclo de vida das mensagens enviadas hoje</span>
                    </div>
                    <button type="button" className="text-tertiary hover:underline font-label-sm text-label-sm flex items-center gap-0.5 whitespace-nowrap">
                      Logs Detalhados <Icon name="chevron_right" className="text-[14px]" />
                    </button>
                  </div>
                  <div className="space-y-space-sm">
                    {DELIVERY.map((d) => (
                      <div key={d.label} className="flex flex-col gap-1">
                        <div className="flex justify-between font-label-md text-label-md">
                          <span className={`flex items-center gap-1 ${d.danger ? "text-error" : "text-on-surface-variant"}`}>
                            <Icon name={d.icon} className={`text-[16px] ${d.iconCls}`} />
                            {d.label}
                          </span>
                          <span className={`font-semibold ${d.danger ? "text-error" : "text-on-surface"}`}>{d.value}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                          <div className={`h-full ${d.bar}`} style={{ width: `${d.w}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="w-full py-1.5 mt-space-xs rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-sm text-label-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <Icon name="report" className="text-[16px]" /> Ver relatórios de falha e números inválidos
                  </button>
                </div>

                {/* Distribuição por Departamento */}
                <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Atendimentos por Departamento</h3>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">428 chats ativos</span>
                  </div>
                  <div className="space-y-space-sm">
                    {DEPARTMENTS.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <div className={`w-2.5 h-2.5 rounded-full ${d.dot}`} />
                          <span className="font-body-md text-body-md text-on-surface">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-space-sm">
                          <span className="font-label-md text-label-md text-on-surface font-semibold">{d.chats} chats</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">{d.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Performance por Atendente */}
            <div className="rounded-xl bg-surface-container-lowest shadow-sm flex flex-col overflow-hidden">
              <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest">
                <div className="flex flex-col">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Performance por Atendente</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Classificação individual da equipe e índices de satisfação em tempo real</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <div className="flex items-center bg-surface-container-low px-space-sm py-1 rounded-lg text-on-surface-variant">
                    <Icon name="search" className="text-[18px] mr-1" />
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="bg-transparent border-0 outline-none font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant w-36"
                      placeholder="Filtrar operador..."
                      type="text"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={exportRanking}
                    title="Exportar Ranking"
                    className="p-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <Icon name="download" className="text-[20px]" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                      <th className="py-space-md px-space-lg font-semibold">Atendente</th>
                      <th className="py-space-md px-space-md font-semibold">Departamento</th>
                      <th className="py-space-md px-space-md font-semibold text-center">Chats Hoje</th>
                      <th className="py-space-md px-space-md font-semibold text-center">TMA Médio</th>
                      <th className="py-space-md px-space-md font-semibold text-center">1ª Resposta</th>
                      <th className="py-space-md px-space-md font-semibold text-center">CSAT</th>
                      <th className="py-space-md px-space-lg font-semibold text-right">Status Atual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container font-body-md text-body-md text-on-surface">
                    {agents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-space-2xl px-space-lg text-center text-on-surface-variant">
                          Nenhum operador encontrado.
                        </td>
                      </tr>
                    ) : null}
                    {agents.map((a) => (
                      <tr key={a.name} className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-space-md px-space-lg">
                          <div className="flex items-center gap-space-md">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-container shrink-0">
                              {/* iniciais ficam por baixo e só aparecem se a foto não carregar */}
                              <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high text-primary font-label-lg text-label-lg font-semibold">
                                {initials(a.name)}
                              </div>
                              <img
                                className="relative w-full h-full object-cover"
                                alt={a.name}
                                src={a.photo}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-label-lg text-label-lg font-semibold text-on-surface">{a.name}</span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">{a.title}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-medium whitespace-nowrap ${a.deptCls}`}>{a.dept}</span>
                        </td>
                        <td className="py-space-md px-space-md text-center font-semibold">{a.chats}</td>
                        <td className="py-space-md px-space-md text-center font-code-sm text-code-sm">{a.tma}</td>
                        <td className="py-space-md px-space-md text-center font-code-sm text-code-sm text-primary font-semibold">{a.first}</td>
                        <td className="py-space-md px-space-md text-center">
                          <div className="flex items-center justify-center gap-0.5 text-amber-500">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            <span className="font-label-md text-label-md font-bold text-on-surface ml-1">{a.csat}</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">({a.reviews})</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-lg text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold whitespace-nowrap ${a.statusCls}`}>
                            <span className={`w-2 h-2 rounded-full ${a.dot}`} />
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-space-lg py-space-sm bg-surface-container-low flex flex-col sm:flex-row items-center justify-between text-on-surface-variant font-body-sm text-body-sm gap-2">
                <span>Exibindo {agents.length} atendentes em turno ativo de 12 cadastrados</span>
                <div className="flex items-center gap-space-xs">
                  <button type="button" className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high transition-colors font-label-sm text-label-sm">
                    Anterior
                  </button>
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">1</span>
                  <button type="button" className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high transition-colors font-label-sm text-label-sm">
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
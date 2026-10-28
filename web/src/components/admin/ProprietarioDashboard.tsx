import { useEffect, useMemo, useRef, useState, type FormEvent, type MutableRefObject, type ReactNode } from "react";
import { ASSETS } from "../../lib/assets";
import { Icon } from "./ui";

/* ───────────────────────── Tipos ───────────────────────── */

type DiaKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export type DiaHorario = {
  ativo: boolean;
  abre: string;
  fecha: string;
  pausa: boolean;
  pausa_inicio: string;
  pausa_fim: string;
};
export type Horario = Record<DiaKey, DiaHorario>;

/** Campos usados pelo painel. Tudo o que não for obrigatório é opcional, para aceitar o teu tipo Empresa. */
export type EmpresaView = {
  id: number | string;
  nome: string;
  negocio?: string | null;
  localizacao?: string | null;
  biografia?: string | null;
  status?: string | null;
  telefone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  horario_funcionamento?: unknown;
  created_at?: string | null;
};

export type NovaEmpresa = {
  nome: string;
  negocio: string;
  localizacao: string;
  biografia: string;
  telefone: string;
  email: string;
  website: string;
  instagram: string;
};

/** O que a página "Configurações da Empresa" guarda. */
export type ConfigEmpresa = NovaEmpresa & { horario_funcionamento: Horario };

const VAZIO: NovaEmpresa = {
  nome: "",
  negocio: "",
  localizacao: "",
  biografia: "",
  telefone: "",
  email: "",
  website: "",
  instagram: "",
};

/** 1 foto principal (cartão da Home) + 4 fotos extra (página da empresa). */
const MAX_FOTOS = 5;
const MAX_FOTO_MB = 5;

type View = "resumo" | "empresas" | "config";

const NAV: { id: View; icon: string; label: string }[] = [
  { id: "resumo", icon: "dashboard", label: "Dashboard & Visão Geral" },
  { id: "empresas", icon: "storefront", label: "Minhas Empresas" },
  { id: "config", icon: "settings", label: "Configurações da Empresa" },
];

const INPUT =
  "w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary-container";
const TIME =
  "px-space-sm py-1 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm outline-none focus:ring-2 focus:ring-primary-container";
const FUSO = "Africa/Luanda (UTC+01:00)";

/* ───────────────────────── Estado das empresas ───────────────────────── */

const REJEITADO = /rejeit|recus|suspens|inativ|bloque|arquiv/i;
type Tipo = "pendente" | "negativo" | "ativo" | "neutro";

function tipoStatus(s?: string | null): Tipo {
  const v = (s || "").trim();
  if (!v) return "neutro";
  if (v.toLowerCase() === "pendente") return "pendente";
  if (REJEITADO.test(v)) return "negativo";
  return "ativo";
}

const BADGE: Record<Tipo, string> = {
  pendente: "bg-tertiary-fixed text-on-tertiary-fixed",
  negativo: "bg-error-container text-on-error-container",
  ativo: "bg-primary-fixed text-on-primary-fixed",
  neutro: "bg-surface-container text-on-surface-variant",
};
const DOT: Record<Tipo, string> = {
  pendente: "bg-tertiary",
  negativo: "bg-error",
  ativo: "bg-primary-container",
  neutro: "bg-outline",
};

function rotulo(s?: string | null) {
  const v = (s || "").replace(/_/g, " ").trim();
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "—";
}

function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

function dataCurta(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

/* ───────────────────────── Horário ───────────────────────── */

const DIAS: { key: DiaKey; label: string }[] = [
  { key: "seg", label: "Segunda-feira" },
  { key: "ter", label: "Terça-feira" },
  { key: "qua", label: "Quarta-feira" },
  { key: "qui", label: "Quinta-feira" },
  { key: "sex", label: "Sexta-feira" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

const DIA_UTIL: DiaHorario = { ativo: true, abre: "08:00", fecha: "18:00", pausa: true, pausa_inicio: "12:00", pausa_fim: "13:30" };
const DIA_SABADO: DiaHorario = { ativo: true, abre: "08:00", fecha: "12:00", pausa: false, pausa_inicio: "12:00", pausa_fim: "13:30" };
const DIA_FECHADO: DiaHorario = { ativo: false, abre: "08:00", fecha: "18:00", pausa: false, pausa_inicio: "12:00", pausa_fim: "13:30" };

const HORARIO_INICIAL: Horario = {
  seg: DIA_UTIL,
  ter: DIA_UTIL,
  qua: DIA_UTIL,
  qui: DIA_UTIL,
  sex: DIA_UTIL,
  sab: DIA_SABADO,
  dom: DIA_FECHADO,
};

function lerHorario(raw: unknown): { horario: Horario; definido: boolean } {
  let v = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      v = null;
    }
  }
  if (!v || typeof v !== "object") return { horario: HORARIO_INICIAL, definido: false };
  const src = v as Record<string, Partial<DiaHorario> | undefined>;
  const horario = {} as Horario;
  DIAS.forEach(({ key }) => {
    horario[key] = { ...DIA_FECHADO, ...(src[key] || {}) };
  });
  return { horario, definido: true };
}

function toMin(s: string) {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function validarHorario(h: Horario): string {
  for (const { key, label } of DIAS) {
    const d = h[key];
    if (!d.ativo) continue;
    if (!d.abre || !d.fecha || toMin(d.abre) >= toMin(d.fecha)) return `${label}: a hora de abertura tem de ser anterior à de fecho.`;
    if (d.pausa) {
      const ok = toMin(d.abre) < toMin(d.pausa_inicio) && toMin(d.pausa_inicio) < toMin(d.pausa_fim) && toMin(d.pausa_fim) < toMin(d.fecha);
      if (!ok) return `${label}: confirme as horas da pausa.`;
    }
  }
  return "";
}

function abertoAgora(h: Horario) {
  const agora = new Date();
  const ordem: DiaKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const d = h[ordem[agora.getDay()]];
  if (!d.ativo) return false;
  const m = agora.getHours() * 60 + agora.getMinutes();
  if (m < toMin(d.abre) || m >= toMin(d.fecha)) return false;
  if (d.pausa && m >= toMin(d.pausa_inicio) && m < toMin(d.pausa_fim)) return false;
  return true;
}

function textoDia(d: DiaHorario) {
  if (!d.ativo) return "Fechado";
  return d.pausa ? `${d.abre}–${d.pausa_inicio} · ${d.pausa_fim}–${d.fecha}` : `${d.abre}–${d.fecha}`;
}

function paraConfig(e: EmpresaView): ConfigEmpresa {
  return {
    nome: e.nome || "",
    negocio: e.negocio || "",
    localizacao: e.localizacao || "",
    biografia: e.biografia || "",
    telefone: e.telefone || "",
    email: e.email || "",
    website: e.website || "",
    instagram: e.instagram || "",
    horario_funcionamento: lerHorario(e.horario_funcionamento).horario,
  };
}

/* ───────────────────────── Fotos (modal Nova Empresa) ───────────────────────── */

function FotoSlot({
  index,
  file,
  disabled,
  onPick,
  onClear,
}: {
  index: number;
  file: File | null;
  disabled: boolean;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const principal = index === 0;

  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div className={`flex flex-col gap-space-xs ${principal ? "col-span-2" : ""}`}>
      <div className="flex items-center gap-space-xs">
        <span className="font-label-sm text-label-sm text-on-surface-variant">{principal ? "Foto principal" : `Foto ${index + 1}`}</span>
        {principal ? (
          <span className="px-space-xs py-[1px] rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">Cartão da Home</span>
        ) : null}
      </div>
      <div className="relative aspect-[4/3] rounded-lg bg-surface-container-low overflow-hidden">
        {url ? (
          <>
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onClear}
              title="Remover foto"
              aria-label="Remover foto"
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-inverse-surface/70 text-inverse-on-surface flex items-center justify-center hover:bg-inverse-surface"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            title={disabled ? "Adicione primeiro a foto anterior" : "Adicionar foto"}
            className="w-full h-full flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="add_a_photo" className={principal ? "text-[28px]" : "text-[22px]"} />
            <span className="font-label-sm text-label-sm">{principal ? "Adicionar foto principal" : "Adicionar"}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/* ───────────────────────── Menu lateral ───────────────────────── */

function SidebarBody({
  nomeOrganizacao,
  nomeProprietario,
  view,
  onGo,
  total,
  empresas,
  ativaId,
  onSelect,
}: {
  nomeOrganizacao: string;
  nomeProprietario: string;
  view: View;
  onGo: (id: View) => void;
  total: number;
  empresas: EmpresaView[];
  ativaId: string;
  onSelect: (id: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const varias = empresas.length > 1;
  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="p-space-lg flex items-center gap-space-sm bg-surface-container-lowest">
          <img src={ASSETS.logo} alt="" className="w-9 h-9 rounded-lg object-cover" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface">Me Encontra</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Painel de Gestão</span>
          </div>
        </div>

        <div className="px-space-lg pb-space-md relative">
          <button
            type="button"
            disabled={!varias}
            onClick={() => setAberto((o) => !o)}
            className="w-full text-left p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-xs enabled:hover:bg-surface-container transition-colors disabled:cursor-default"
          >
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Empresa ativa</span>
              <span className="px-space-xs py-[2px] rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">Dono</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg text-on-surface truncate pr-space-xs">{nomeOrganizacao || "Minha organização"}</span>
              {varias ? <Icon name="unfold_more" className="text-on-surface-variant text-[18px]" /> : null}
            </div>
          </button>
          {aberto && varias ? (
            <>
              <button className="fixed inset-0 z-10 cursor-default" onClick={() => setAberto(false)} aria-label="Fechar" />
              <div className="absolute left-space-lg right-space-lg top-full z-20 rounded-lg bg-surface-container-lowest shadow-lg py-1 max-h-64 overflow-y-auto">
                {empresas.map((e) => {
                  const ativa = String(e.id) === ativaId;
                  return (
                    <button
                      key={String(e.id)}
                      type="button"
                      onClick={() => {
                        onSelect(String(e.id));
                        setAberto(false);
                      }}
                      className={`w-full text-left px-space-md py-2 font-label-md text-label-md hover:bg-surface-container-low flex items-center justify-between gap-space-sm ${
                        ativa ? "text-primary" : "text-on-surface"
                      }`}
                    >
                      <span className="truncate">{e.nome}</span>
                      {ativa ? <Icon name="check" className="text-[16px]" /> : null}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <nav className="flex-1 px-space-md space-y-space-xs overflow-y-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onGo(n.id)}
              className={`w-full flex items-center justify-between px-space-md py-space-sm rounded-lg text-left transition-colors ${
                view === n.id
                  ? "bg-primary-container text-on-primary font-label-lg"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <div className="flex items-center gap-space-md">
                <Icon name={n.icon} className="text-[20px]" />
                <span className="font-body-md text-body-md">{n.label}</span>
              </div>
              {n.id === "empresas" ? (
                <span className="px-space-xs py-[2px] rounded-full bg-primary-fixed-dim text-on-primary-fixed font-label-sm text-label-sm">{total}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-space-md bg-surface-container-low flex flex-col gap-space-sm">
        <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Icon name="person" className="text-on-primary text-[18px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface truncate">{nomeProprietario || "Proprietário"}</span>
              <span className="font-label-sm text-label-sm text-primary truncate">Proprietário</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────────────────── Cabeçalho de página ───────────────────────── */

function Cabecalho({
  tag,
  extra,
  titulo,
  sub,
  children,
}: {
  tag: string;
  extra?: string;
  titulo: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center gap-space-sm">
          <span className="px-space-xs py-[2px] rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm uppercase tracking-wider">{tag}</span>
          {extra ? (
            <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              {extra}
            </span>
          ) : null}
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface">{titulo}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">{sub}</p>
      </div>
      {children ? <div className="flex items-center gap-space-md shrink-0">{children}</div> : null}
    </section>
  );
}

/* ───────────────────────── Página: Configurações da Empresa ───────────────────────── */

function ConfiguracoesEmpresa({
  empresas,
  empresaId,
  onSelect,
  dirtyRef,
  onSalvar,
  onNova,
  notify,
}: {
  empresas: EmpresaView[];
  empresaId: string;
  onSelect: (id: string) => void;
  dirtyRef: MutableRefObject<boolean>;
  onSalvar: (id: number | string, dados: ConfigEmpresa) => Promise<void>;
  onNova: () => void;
  notify: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<ConfigEmpresa | null>(null);
  const [aba, setAba] = useState("horario");
  const [erro, setErro] = useState("");
  const [guardando, setGuardando] = useState(false);

  const empresa = empresas.find((e) => String(e.id) === empresaId) ?? empresas[0];
  const base = useMemo(() => (empresa ? paraConfig(empresa) : null), [empresa]);
  const definido = empresa ? lerHorario(empresa.horario_funcionamento).definido : false;
  const chave = `${empresa?.id ?? ""}|${base ? JSON.stringify(base) : ""}`;

  useEffect(() => {
    setDraft(base);
    setErro("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const alterado = !!(draft && base && JSON.stringify(draft) !== JSON.stringify(base));
  useEffect(() => {
    dirtyRef.current = alterado;
    return () => {
      dirtyRef.current = false;
    };
  }, [alterado, dirtyRef]);

  if (!empresa || !draft || !base) {
    return (
      <div className="flex flex-col gap-space-xl">
        <Cabecalho
          tag="Configurações"
          titulo="Configurações da Empresa"
          sub="Gira o horário de funcionamento, o perfil público e os contactos de cada empresa."
        />
        <div className="rounded-xl bg-surface-container-lowest p-space-2xl shadow-sm flex flex-col items-center gap-space-sm text-center text-on-surface-variant">
          <Icon name="storefront" className="text-[32px] text-primary" />
          <span>Crie a primeira empresa para poder configurá-la.</span>
          <button
            type="button"
            onClick={onNova}
            className="px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-label-sm text-label-sm transition-colors"
          >
            Criar empresa
          </button>
        </div>
      </div>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  const podeGuardar = (dirty || !definido) && !guardando;
  const horario = draft.horario_funcionamento;
  const aberto = abertoAgora(horario);
  const estado = tipoStatus(empresa.status);

  function upd<K extends keyof NovaEmpresa>(k: K, v: string) {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  }
  function updDia(k: DiaKey, patch: Partial<DiaHorario>) {
    setDraft((d) => (d ? { ...d, horario_funcionamento: { ...d.horario_funcionamento, [k]: { ...d.horario_funcionamento[k], ...patch } } } : d));
  }
  function irPara(id: string) {
    setAba(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function guardar() {
    if (!draft || !empresa) return;
    if (!draft.nome.trim()) {
      setErro("O nome da empresa é obrigatório.");
      irPara("perfil");
      return;
    }
    const h = validarHorario(draft.horario_funcionamento);
    if (h) {
      setErro(h);
      irPara("horario");
      return;
    }
    setGuardando(true);
    setErro("");
    try {
      await onSalvar(empresa.id, { ...draft, nome: draft.nome.trim() });
      notify("Configurações guardadas com sucesso.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível guardar as alterações.");
    } finally {
      setGuardando(false);
    }
  }

  const TABS = [
    { id: "horario", icon: "schedule", label: "1. Horário & Funcionamento" },
    { id: "perfil", icon: "badge", label: "2. Perfil da Empresa" },
    { id: "contactos", icon: "contact_phone", label: "3. Contactos & Redes" },
  ];

  return (
    <div className="flex flex-col w-full gap-space-xl">
      <Cabecalho
        tag="Configurações"
        extra={`Empresa: ${empresa.nome}`}
        titulo="Configurações da Empresa"
        sub="Gira o horário de funcionamento, o perfil público e os contactos de cada empresa."
      >
        {empresas.length > 1 ? (
          <select
            value={String(empresa.id)}
            onChange={(e) => onSelect(e.target.value)}
            className="px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg outline-none cursor-pointer"
            aria-label="Empresa a configurar"
          >
            {empresas.map((e) => (
              <option key={String(e.id)} value={String(e.id)}>
                {e.nome}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          onClick={guardar}
          disabled={!podeGuardar}
          className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-lg text-label-lg flex items-center gap-space-xs shadow-sm disabled:opacity-60"
        >
          <Icon name="save" className="text-[18px]" />
          {guardando ? "A guardar..." : "Salvar Alterações"}
        </button>
      </Cabecalho>

      {empresas.length > 1 ? (
        <div className="flex items-start gap-space-sm px-space-md py-space-sm rounded-lg bg-tertiary-fixed/40 text-on-surface-variant font-body-sm text-body-sm">
          <Icon name="info" className="text-[18px] text-tertiary" />
          <span>
            As alterações abaixo aplicam-se apenas a <strong className="text-on-surface">{empresa.nome}</strong>. Para configurar outra
            empresa, escolha-a no seletor acima ou no menu lateral.
          </span>
        </div>
      ) : null}

      {/* Tabs de navegação rápida */}
      <div className="bg-surface-container-lowest rounded-xl p-space-xs shadow-sm flex flex-wrap items-center gap-space-xs overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => irPara(t.id)}
            className={`px-space-md py-space-sm rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs transition-colors ${
              aba === t.id ? "bg-primary-container text-on-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            <Icon name={t.icon} className="text-[18px]" />
            {t.label}
          </button>
        ))}
      </div>

      {/* SEÇÃO 1: HORÁRIO */}
      <section id="horario" className="flex flex-col gap-space-lg scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <Icon name="schedule" className="text-[20px]" />
            </div>
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Horário de Funcionamento</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Defina os dias e horas em que a empresa está aberta ao público.</p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
            <Icon name="public" className="text-[16px] text-primary" />
            Fuso Horário: {FUSO}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm">
              <span className="font-label-lg text-label-lg text-on-surface">Programação Semanal</span>
              {!definido ? (
                <span className="font-label-sm text-label-sm text-tertiary bg-tertiary-fixed px-space-xs py-[2px] rounded">Ainda não guardado</span>
              ) : (
                <span className="font-code-sm text-code-sm text-on-surface-variant bg-surface-container-low px-space-xs py-[2px] rounded">Guardado</span>
              )}
            </div>

            {!definido ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Esta empresa ainda não tem horário guardado. Os valores abaixo são uma sugestão inicial — ajuste e guarde.
              </p>
            ) : null}

            <div className="flex flex-col gap-space-xs divide-y divide-surface-container">
              {DIAS.map(({ key, label }) => {
                const d = horario[key];
                return (
                  <div
                    key={key}
                    className={`pt-space-sm pb-space-xs flex flex-col md:flex-row md:items-center justify-between gap-space-sm ${d.ativo ? "" : "opacity-60"}`}
                  >
                    <div className="flex items-center gap-space-md min-w-[160px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          checked={d.ativo}
                          onChange={(e) => updDia(key, { ativo: e.target.checked })}
                          className="sr-only peer"
                          type="checkbox"
                          aria-label={`${label} aberto`}
                        />
                        <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container" />
                      </label>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface">{label}</span>
                        <span className={`font-label-sm text-label-sm ${d.ativo ? "text-primary" : "text-error"}`}>
                          {d.ativo ? (d.pausa ? "Aberto com pausa" : "Aberto") : "Fechado"}
                        </span>
                      </div>
                    </div>

                    {d.ativo ? (
                      <div className="flex items-center flex-wrap gap-space-xs">
                        <input className={TIME} type="time" value={d.abre} onChange={(e) => updDia(key, { abre: e.target.value })} />
                        <span className="text-on-surface-variant font-label-sm text-label-sm">às</span>
                        {d.pausa ? (
                          <>
                            <input className={TIME} type="time" value={d.pausa_inicio} onChange={(e) => updDia(key, { pausa_inicio: e.target.value })} />
                            <button
                              type="button"
                              title="Remover pausa"
                              onClick={() => updDia(key, { pausa: false })}
                              className="px-space-xs py-[2px] rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm hover:opacity-80"
                            >
                              Almoço
                            </button>
                            <input className={TIME} type="time" value={d.pausa_fim} onChange={(e) => updDia(key, { pausa_fim: e.target.value })} />
                            <span className="text-on-surface-variant font-label-sm text-label-sm">às</span>
                            <input className={TIME} type="time" value={d.fecha} onChange={(e) => updDia(key, { fecha: e.target.value })} />
                          </>
                        ) : (
                          <>
                            <input className={TIME} type="time" value={d.fecha} onChange={(e) => updDia(key, { fecha: e.target.value })} />
                            <button
                              type="button"
                              title="Adicionar pausa"
                              onClick={() => updDia(key, { pausa: true })}
                              className="px-space-xs py-[2px] rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high"
                            >
                              Sem intervalo
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="px-space-sm py-1 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm italic">Fechado neste dia</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pré-visualização */}
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md uppercase">
                <Icon name="visibility" className="text-[18px]" />
                Perfil Público
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Como o horário aparece</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Pré-visualização do que os clientes veem no perfil da empresa.</p>
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
                {DIAS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-space-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{label.replace("-feira", "")}</span>
                    <span className={`font-code-sm text-code-sm ${horario[key].ativo ? "text-on-surface" : "text-error"}`}>{textoDia(horario[key])}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-space-xs flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${aberto ? "bg-primary-container" : "bg-error"}`} />
                {aberto ? "Aberto agora" : "Fechado agora"}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">segundo a hora deste dispositivo</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: PERFIL */}
      <section id="perfil" className="flex flex-col gap-space-lg scroll-mt-24">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
            <Icon name="badge" className="text-[20px]" />
          </div>
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Perfil da Empresa</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Informação principal que identifica a empresa no diretório.</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Dados Gerais</h3>
            <div className="flex items-center gap-space-sm">
              <span className={`inline-flex items-center gap-1.5 px-space-sm py-[3px] rounded-full font-label-sm text-label-sm font-semibold ${BADGE[estado]}`}>
                <span className={`w-2 h-2 rounded-full ${DOT[estado]}`} />
                {rotulo(empresa.status)}
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">Criada em {dataCurta(empresa.created_at)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-xs md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Nome da empresa *</label>
              <input className={INPUT} value={draft.nome} onChange={(e) => upd("nome", e.target.value)} />
            </div>
            <div className="flex flex-col gap-space-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Tipo de negócio</label>
              <input className={INPUT} value={draft.negocio} onChange={(e) => upd("negocio", e.target.value)} placeholder="Ex.: Restaurante, Farmácia..." />
            </div>
            <div className="flex flex-col gap-space-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Localização</label>
              <input className={INPUT} value={draft.localizacao} onChange={(e) => upd("localizacao", e.target.value)} placeholder="Bairro, cidade..." />
            </div>
            <div className="flex flex-col gap-space-xs md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Biografia</label>
              <textarea
                className={`${INPUT} min-h-[110px] resize-y`}
                value={draft.biografia}
                onChange={(e) => upd("biografia", e.target.value)}
                placeholder="Conte brevemente a história e o que a empresa oferece."
              />
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: CONTACTOS */}
      <section id="contactos" className="flex flex-col gap-space-lg scroll-mt-24">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
            <Icon name="contact_phone" className="text-[20px]" />
          </div>
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Contactos & Redes</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Como os clientes podem falar com a empresa.</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {(
            [
              { k: "telefone", label: "Telefone", icon: "call", ph: "+244 ...", type: "tel" },
              { k: "email", label: "E-mail", icon: "mail", ph: "contacto@empresa.com", type: "email" },
              { k: "website", label: "Website", icon: "language", ph: "https://...", type: "url" },
              { k: "instagram", label: "Instagram", icon: "alternate_email", ph: "@empresa", type: "text" },
            ] as const
          ).map((c) => (
            <div key={c.k} className="flex flex-col gap-space-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">{c.label}</label>
              <div className="flex items-center bg-surface-container-low rounded-lg px-space-md py-space-sm focus-within:ring-2 focus-within:ring-primary-container">
                <Icon name={c.icon} className="text-[18px] text-on-surface-variant mr-space-xs" />
                <input
                  className="bg-transparent border-0 outline-none w-full font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant"
                  type={c.type}
                  value={draft[c.k]}
                  onChange={(e) => upd(c.k, e.target.value)}
                  placeholder={c.ph}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {erro ? (
        <p role="alert" className="px-space-md py-space-sm rounded-lg bg-error-container text-on-error-container font-label-lg text-label-lg">
          {erro}
        </p>
      ) : null}

      {/* Barra de ações fixa */}
      <div className="sticky bottom-4 z-30 bg-surface-container-lowest/90 backdrop-blur-md rounded-xl p-space-md shadow-lg flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
          <Icon name={dirty || !definido ? "edit_note" : "check_circle"} className="text-[20px] text-primary" />
          <span>
            {dirty || !definido
              ? "Tem alterações por guardar."
              : `Todas as configurações estão sincronizadas com ${empresa.nome}.`}
          </span>
        </div>
        <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => {
              setDraft(base);
              setErro("");
            }}
            disabled={!dirty || guardando}
            className="px-space-md py-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-colors disabled:opacity-60"
          >
            Descartar Edições
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={!podeGuardar}
            className="px-space-xl py-space-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg transition-colors shadow-sm flex items-center gap-space-xs disabled:opacity-60"
          >
            <Icon name="save" className="text-[18px]" />
            Salvar Todas as Configurações
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Componente principal ───────────────────────── */

export default function ProprietarioDashboard({
  nomeOrganizacao,
  nomeProprietario,
  empresas,
  onCriarEmpresa,
  onSalvarEmpresa,
  onLogout,
}: {
  nomeOrganizacao: string;
  nomeProprietario: string;
  empresas: EmpresaView[];
  /** `fotos` vem pela ordem: a primeira é a principal (cartão da Home), as outras até 4 vão para a página da empresa. */
  onCriarEmpresa: (dados: NovaEmpresa, fotos: File[]) => Promise<void>;
  onSalvarEmpresa: (id: number | string, dados: ConfigEmpresa) => Promise<void>;
  onLogout?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [drawer, setDrawer] = useState(false);
  const [view, setView] = useState<View>("resumo");
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<NovaEmpresa>(VAZIO);
  const [fotos, setFotos] = useState<(File | null)[]>(() => Array(MAX_FOTOS).fill(null));
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState("");
  const [selId, setSelId] = useState("");
  const dirtyRef = useRef(false);

  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0 });
  }, [view]);

  const total = empresas.length;
  const ativa = empresas.find((e) => String(e.id) === selId) ?? empresas[0];
  const ativaId = ativa ? String(ativa.id) : "";
  const pendentes = empresas.filter((e) => tipoStatus(e.status) === "pendente").length;
  const ativas = empresas.filter((e) => tipoStatus(e.status) === "ativo").length;

  const ordenadas = useMemo(() => [...empresas].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")), [empresas]);
  const recente = ordenadas[0];

  const porStatus = useMemo(() => {
    const m = new Map<string, number>();
    empresas.forEach((e) => {
      const k = (e.status || "").trim();
      if (k) m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()]
      .map(([status, n]) => ({ status, n, pct: Math.round((n / (empresas.length || 1)) * 100) }))
      .sort((a, b) => b.n - a.n);
  }, [empresas]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter((e) => [e.nome, e.negocio, e.localizacao].some((v) => (v || "").toLowerCase().includes(q)));
  }, [empresas, busca]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  function goTo(id: View) {
    setView(id);
    setDrawer(false);
  }

  function selecionar(id: string) {
    if (id === ativaId) return;
    if (view === "config" && dirtyRef.current && !window.confirm("Tem alterações por guardar nesta empresa. Descartar e mudar de empresa?")) return;
    setSelId(id);
  }

  function abrirModal() {
    setForm(VAZIO);
    setFotos(Array(MAX_FOTOS).fill(null));
    setErro("");
    setModal(true);
  }

  function set<K extends keyof NovaEmpresa>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function escolherFoto(i: number, file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErro("Escolha um ficheiro de imagem (JPG, PNG, WebP...).");
      return;
    }
    if (file.size > MAX_FOTO_MB * 1024 * 1024) {
      setErro(`Cada foto pode ter no máximo ${MAX_FOTO_MB} MB.`);
      return;
    }
    setErro("");
    setFotos((prev) => prev.map((f, idx) => (idx === i ? file : f)));
  }

  /** Remove e puxa as seguintes para cima, para nunca haver "buracos" (a 1.ª é sempre a principal). */
  function removerFoto(i: number) {
    setFotos((prev) => {
      const resto = prev.filter((_, idx) => idx !== i);
      while (resto.length < MAX_FOTOS) resto.push(null);
      return resto;
    });
  }

  async function submeter(e: FormEvent) {
    e.preventDefault();
    const dados: NovaEmpresa = {
      nome: form.nome.trim(),
      negocio: form.negocio.trim(),
      localizacao: form.localizacao.trim(),
      biografia: form.biografia.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      instagram: form.instagram.trim(),
    };
    if (!dados.nome) {
      setErro("Indique o nome da empresa.");
      return;
    }
    const arquivos = fotos.filter((f): f is File => f !== null);
    setEnviando(true);
    setErro("");
    try {
      await onCriarEmpresa(dados, arquivos);
      setModal(false);
      notify(`Empresa "${dados.nome}" criada com sucesso.`);
      goTo("empresas");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a empresa.");
    } finally {
      setEnviando(false);
    }
  }

  const sidebar = (
    <SidebarBody
      nomeOrganizacao={ativa?.nome || nomeOrganizacao}
      nomeProprietario={nomeProprietario}
      view={view}
      onGo={goTo}
      total={total}
      empresas={empresas}
      ativaId={ativaId}
      onSelect={selecionar}
    />
  );

  const botaoNova = (
    <button
      type="button"
      onClick={abrirModal}
      className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-lg text-label-lg flex items-center gap-space-xs shadow-sm"
    >
      <Icon name="add_business" className="text-[18px]" />
      Nova Empresa
    </button>
  );

  return (
    // fixed inset-0: ocupa a janela inteira e ignora qualquer padding/centragem do layout pai
    <div
      ref={rootRef}
      className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-surface font-body-md text-body-md text-on-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 hidden lg:flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        {sidebar}
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button className="absolute inset-0 bg-inverse-surface/40" onClick={() => setDrawer(false)} aria-label="Fechar menu" />
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface-container-lowest flex flex-col justify-between shadow-xl">{sidebar}</aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-xl">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="lg:hidden p-space-xs rounded-lg hover:bg-surface-container text-on-surface-variant"
            aria-label="Abrir menu"
          >
            <Icon name="menu" className="text-[22px]" />
          </button>
          <div className="flex items-center gap-space-md ml-auto">
            <button
              type="button"
              onClick={abrirModal}
              className="hidden sm:flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors"
            >
              <Icon name="add_business" className="text-[16px]" />
              <span className="font-label-sm text-label-sm">Nova Empresa</span>
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
            {/* ═══════════ VISÃO GERAL ═══════════ */}
            {view === "resumo" ? (
              <>
                <Cabecalho
                  tag="Visão Geral"
                  extra={`${total} ${total === 1 ? "empresa" : "empresas"}`}
                  titulo="Dashboard do Proprietário"
                  sub="Acompanhe num só lugar o estado das suas empresas."
                >
                  {botaoNova}
                </Cabecalho>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-lg">
                  <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface-variant uppercase">Total de Empresas</span>
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold mt-space-xs">{total}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">registadas na sua conta</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-on-primary-fixed">
                      <Icon name="storefront" className="text-[22px]" />
                    </div>
                  </div>

                  <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface-variant uppercase">Ativas</span>
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold mt-space-xs">{ativas}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">com perfil aprovado</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                      <Icon name="verified" className="text-[22px]" />
                    </div>
                  </div>

                  <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface-variant uppercase">Pendentes</span>
                      <span className="font-headline-xl text-headline-xl text-on-surface font-bold mt-space-xs">{pendentes}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">a aguardar aprovação</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
                      <Icon name="hourglass_top" className="text-[22px]" />
                    </div>
                  </div>

                  <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex items-start justify-between gap-space-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface-variant uppercase">Última Criada</span>
                      <span className="font-headline-md text-headline-md text-on-surface font-bold mt-space-xs truncate">{recente ? recente.nome : "—"}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{recente ? dataCurta(recente.created_at) : "Ainda sem empresas"}</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
                      <Icon name="event" className="text-[22px]" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                  <div className="lg:col-span-5 rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Empresas por Estado</h3>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{total} no total</span>
                    </div>
                    {porStatus.length === 0 ? (
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Quando criar a primeira empresa, a distribuição por estado aparece aqui.</p>
                    ) : (
                      <div className="space-y-space-sm">
                        {porStatus.map((s) => {
                          const tipo = tipoStatus(s.status);
                          return (
                            <div key={s.status} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-space-sm">
                                  <div className={`w-2.5 h-2.5 rounded-full ${DOT[tipo]}`} />
                                  <span className="font-body-md text-body-md text-on-surface">{rotulo(s.status)}</span>
                                </div>
                                <div className="flex items-center gap-space-sm">
                                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                                    {s.n} {s.n === 1 ? "empresa" : "empresas"}
                                  </span>
                                  <span className="font-label-sm text-label-sm text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container">{s.pct}%</span>
                                </div>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                                <div className={`h-full ${DOT[tipo]}`} style={{ width: `${s.pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-7 rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Empresas Recentes</h3>
                      <button
                        type="button"
                        onClick={() => goTo("empresas")}
                        className="text-tertiary hover:underline font-label-sm text-label-sm flex items-center gap-0.5"
                      >
                        Ver todas <Icon name="chevron_right" className="text-[14px]" />
                      </button>
                    </div>
                    {ordenadas.length === 0 ? (
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Ainda não criou nenhuma empresa.</p>
                    ) : (
                      <div className="flex flex-col divide-y divide-surface-container">
                        {ordenadas.slice(0, 4).map((e) => {
                          const tipo = tipoStatus(e.status);
                          return (
                            <div key={e.id} className="py-space-sm flex items-center justify-between gap-space-md">
                              <div className="flex items-center gap-space-md min-w-0">
                                <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-label-md text-label-md font-semibold shrink-0">
                                  {iniciais(e.nome)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-label-lg text-label-lg text-on-surface truncate">{e.nome}</span>
                                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                    {[e.negocio, e.localizacao].filter(Boolean).join(" · ") || "Sem detalhes"}
                                  </span>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 px-space-sm py-[3px] rounded-full font-label-sm text-label-sm font-semibold whitespace-nowrap ${BADGE[tipo]}`}>
                                <span className={`w-2 h-2 rounded-full ${DOT[tipo]}`} />
                                {rotulo(e.status)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {/* ═══════════ MINHAS EMPRESAS ═══════════ */}
            {view === "empresas" ? (
              <>
                <Cabecalho
                  tag="Gestão de Empresas"
                  extra={`${total} ${total === 1 ? "empresa" : "empresas"}`}
                  titulo="Minhas Empresas"
                  sub="Crie empresas e consulte os dados de perfil, contacto e estado de cada uma."
                >
                  {botaoNova}
                </Cabecalho>

                <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-sm flex-1 max-w-md bg-surface-container-lowest px-space-md py-space-xs rounded-lg shadow-sm">
                      <Icon name="search" className="text-[18px] text-on-surface-variant" />
                      <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="bg-transparent border-0 outline-none w-full font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant"
                        placeholder="Filtrar por nome, negócio ou localização..."
                        type="text"
                      />
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      A mostrar {filtradas.length} de {total}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[860px]">
                      <thead className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <tr>
                          <th className="py-space-md px-space-lg">Empresa</th>
                          <th className="py-space-md px-space-md">Negócio</th>
                          <th className="py-space-md px-space-md">Contacto</th>
                          <th className="py-space-md px-space-md">Estado</th>
                          <th className="py-space-md px-space-md">Criada em</th>
                          <th className="py-space-md px-space-lg text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container text-body-sm font-body-sm text-on-surface">
                        {filtradas.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-space-2xl px-space-lg text-center">
                              <div className="flex flex-col items-center gap-space-sm text-on-surface-variant">
                                <Icon name="storefront" className="text-[32px] text-primary" />
                                <span>{total === 0 ? "Ainda não criou nenhuma empresa." : "Nenhuma empresa encontrada."}</span>
                                {total === 0 ? (
                                  <button
                                    type="button"
                                    onClick={abrirModal}
                                    className="px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-label-sm text-label-sm transition-colors"
                                  >
                                    Criar a primeira empresa
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                        {filtradas.map((e) => {
                          const tipo = tipoStatus(e.status);
                          return (
                            <tr key={e.id} className="hover:bg-surface-container/50 transition-colors">
                              <td className="py-space-md px-space-lg">
                                <div className="flex items-center gap-space-md">
                                  <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-label-md text-label-md font-semibold shrink-0">
                                    {iniciais(e.nome)}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-label-lg text-label-lg text-on-surface truncate">{e.nome}</span>
                                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-xs flex items-center gap-1">
                                      {e.localizacao ? (
                                        <>
                                          <Icon name="location_on" className="text-[14px]" />
                                          {e.localizacao}
                                        </>
                                      ) : (
                                        "Sem localização"
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-space-md px-space-md">
                                {e.negocio ? (
                                  <span className="px-space-xs py-[2px] rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">{e.negocio}</span>
                                ) : (
                                  <span className="text-on-surface-variant">-</span>
                                )}
                              </td>
                              <td className="py-space-md px-space-md">
                                <div className="flex flex-col font-code-sm text-code-sm text-on-surface-variant">
                                  {e.telefone || e.email || e.website || e.instagram ? (
                                    <>
                                      {e.telefone ? <span>{e.telefone}</span> : null}
                                      {e.email ? <span className="truncate max-w-[220px]">{e.email}</span> : null}
                                      {e.website ? <span className="truncate max-w-[220px]">{e.website}</span> : null}
                                      {e.instagram ? <span>{e.instagram}</span> : null}
                                    </>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-space-md px-space-md">
                                <span className={`inline-flex items-center gap-1.5 px-space-sm py-[3px] rounded-full font-label-sm text-label-sm font-semibold whitespace-nowrap ${BADGE[tipo]}`}>
                                  <span className={`w-2 h-2 rounded-full ${DOT[tipo]}`} />
                                  {rotulo(e.status)}
                                </span>
                              </td>
                              <td className="py-space-md px-space-md text-on-surface-variant font-code-sm text-code-sm whitespace-nowrap">{dataCurta(e.created_at)}</td>
                              <td className="py-space-md px-space-lg text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelId(String(e.id));
                                    goTo("config");
                                  }}
                                  title="Configurar empresa"
                                  className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                                >
                                  <Icon name="settings" className="text-[18px]" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}

            {/* ═══════════ CONFIGURAÇÕES DA EMPRESA ═══════════ */}
            {view === "config" ? (
              <ConfiguracoesEmpresa
                empresas={empresas}
                empresaId={ativaId}
                onSelect={selecionar}
                dirtyRef={dirtyRef}
                onSalvar={onSalvarEmpresa}
                onNova={abrirModal}
                notify={notify}
              />
            ) : null}
          </div>
        </main>
      </div>

      {/* Modal: criar empresa */}
      {modal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-space-lg">
          <button className="absolute inset-0 bg-inverse-surface/40" onClick={() => !enviando && setModal(false)} aria-label="Fechar" />
          <form
            onSubmit={submeter}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface-container-lowest p-space-xl shadow-xl flex flex-col gap-space-lg"
          >
            <div className="flex items-start justify-between gap-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <Icon name="add_business" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">Nova Empresa</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">A empresa fica publicada na página inicial.</p>
                </div>
              </div>
              <button type="button" onClick={() => setModal(false)} disabled={enviando} className="p-1 rounded hover:bg-surface-container text-on-surface-variant" aria-label="Fechar">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Nome da empresa *</label>
              <input className={INPUT} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Padaria Central" autoFocus />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Tipo de negócio</label>
                <input className={INPUT} value={form.negocio} onChange={(e) => set("negocio", e.target.value)} placeholder="Ex.: Restaurante, Farmácia..." />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Localização</label>
                <input className={INPUT} value={form.localizacao} onChange={(e) => set("localizacao", e.target.value)} placeholder="Bairro, cidade..." />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Telefone</label>
                <input className={INPUT} value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="+244 ..." type="tel" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">E-mail</label>
                <input className={INPUT} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contacto@empresa.com" type="email" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Website</label>
                <input className={INPUT} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." type="url" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Instagram</label>
                <input className={INPUT} value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@empresa" />
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Biografia</label>
              <textarea
                className={`${INPUT} min-h-[96px] resize-y`}
                value={form.biografia}
                onChange={(e) => set("biografia", e.target.value)}
                placeholder="Conte brevemente a história e o que a empresa oferece."
              />
            </div>

            {/* Fotos: 1 principal + 4 extra */}
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Fotos (opcional)</label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {fotos.filter(Boolean).length} / {MAX_FOTOS}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                A <strong className="text-on-surface">foto principal</strong> aparece no cartão da página inicial. As outras 4 aparecem na página da empresa.
                Sem fotos, é usada a imagem padrão. Máximo {MAX_FOTO_MB} MB por foto.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-space-md">
                {fotos.map((f, i) => (
                  <FotoSlot
                    key={i}
                    index={i}
                    file={f}
                    disabled={i > 0 && !fotos[i - 1]}
                    onPick={(file) => escolherFoto(i, file)}
                    onClear={() => removerFoto(i)}
                  />
                ))}
              </div>
            </div>

            {erro ? (
              <p role="alert" className="px-space-md py-space-sm rounded-lg bg-error-container text-on-error-container font-label-lg text-label-lg">
                {erro}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-space-sm">
              <button
                type="button"
                onClick={() => setModal(false)}
                disabled={enviando}
                className="px-space-md py-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-space-xl py-space-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg transition-colors shadow-sm flex items-center gap-space-xs disabled:opacity-60"
              >
                <Icon name="save" className="text-[18px]" />
                {enviando ? "A criar..." : "Criar Empresa"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

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
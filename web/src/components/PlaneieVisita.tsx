import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/* ───────────────────────── Tipos (iguais aos de EmpresaDetalhe) ───────────────────────── */

type DiaKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
export type DiaHorario = { ativo: boolean; abre: string; fecha: string; pausa: boolean; pausa_inicio: string; pausa_fim: string };
export type Horario = Record<DiaKey, DiaHorario>;

type Ymd = { y: number; m: number; d: number }; // m: 0-11

const ORDEM_JS: DiaKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const NOMES_DIA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES_A_FRENTE = 11; // até 12 meses a partir de hoje

/* ───────────────────────── Utilitários ───────────────────────── */

function toMin(s: string) {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function textoDia(d: DiaHorario) {
  if (!d.ativo) return "Fechado";
  return d.pausa ? `${d.abre}–${d.pausa_inicio} · ${d.pausa_fim}–${d.fecha}` : `${d.abre}–${d.fecha}`;
}

/** Data e hora de Luanda, independentemente do fuso do dispositivo. */
function hojeLuanda(): Ymd & { minutos: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Luanda",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: g("year"), m: g("month") - 1, d: g("day"), minutos: g("hour") * 60 + g("minute") };
}

function diaSemana(p: Ymd) {
  return new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay();
}

function cmp(a: Ymd, b: Ymd) {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

function somarMeses(p: { y: number; m: number }, n: number) {
  const t = p.y * 12 + p.m + n;
  return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
}

function somarDias(p: Ymd, n: number): Ymd {
  const dt = new Date(Date.UTC(p.y, p.m, p.d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
}

function fmt(p: Ymd, opts: Intl.DateTimeFormatOptions) {
  return new Date(Date.UTC(p.y, p.m, p.d)).toLocaleDateString("pt-PT", { ...opts, timeZone: "UTC" });
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function abertoEm(d: DiaHorario, minutos: number) {
  if (!d.ativo) return false;
  if (minutos < toMin(d.abre) || minutos >= toMin(d.fecha)) return false;
  if (d.pausa && minutos >= toMin(d.pausa_inicio) && minutos < toMin(d.pausa_fim)) return false;
  return true;
}

/** Texto com a próxima abertura a partir do dia/hora indicados (ou null se nunca abrir). */
function proximaAbertura(h: Horario, dia: Ymd, minutos: number | null): string | null {
  const d = h[ORDEM_JS[diaSemana(dia)]];
  if (minutos !== null && d.ativo) {
    if (minutos < toMin(d.abre)) return `Abre às ${d.abre}`;
    if (d.pausa && minutos >= toMin(d.pausa_inicio) && minutos < toMin(d.pausa_fim)) return `Reabre às ${d.pausa_fim}`;
  }
  for (let i = 1; i <= 7; i++) {
    const p = somarDias(dia, i);
    const dd = h[ORDEM_JS[diaSemana(p)]];
    if (dd.ativo) return `Abre ${i === 1 ? "amanhã" : NOMES_DIA[diaSemana(p)]} às ${dd.abre}`;
  }
  return null;
}

/* ───────────────────────── Calendário (um mês) ───────────────────────── */

function Mes({
  ano,
  mes,
  hoje,
  sel,
  horario,
  onPick,
}: {
  ano: number;
  mes: number;
  hoje: Ymd;
  sel: Ymd;
  horario: Horario;
  onPick: (p: Ymd) => void;
}) {
  const primeiro = new Date(Date.UTC(ano, mes, 1)).getUTCDay();
  const n = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  const celulas: (number | null)[] = [...Array<null>(primeiro).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 border-b border-slate-200 pb-2 text-center text-xs text-slate-500">
        {SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 pt-2">
        {celulas.map((d, i) => {
          if (d === null) return <span key={`v${i}`} />;
          const p: Ymd = { y: ano, m: mes, d };
          const passado = cmp(p, hoje) < 0;
          const selecionado = cmp(p, sel) === 0;
          const aberto = horario[ORDEM_JS[(primeiro + d - 1) % 7]].ativo;
          return (
            <button
              key={d}
              type="button"
              disabled={passado}
              onClick={() => onPick(p)}
              aria-pressed={selecionado}
              aria-label={`${cap(fmt(p, { weekday: "long", day: "numeric", month: "long" }))}${aberto ? ", aberto" : ", fechado"}`}
              className={`mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                selecionado
                  ? "bg-brand-dark font-semibold text-white"
                  : passado
                    ? "cursor-not-allowed text-slate-300"
                    : "text-slate-900 hover:bg-brand-soft"
              }`}
            >
              <span>{d}</span>
              <span
                className={`mt-0.5 h-[3px] w-4 rounded-full ${
                  !passado && aberto ? (selecionado ? "bg-emerald-300" : "bg-emerald-600") : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Componente ───────────────────────── */

export default function PlaneieVisita({ horario }: { horario: Horario }) {
  const [hoje] = useState(hojeLuanda);
  const [sel, setSel] = useState<Ymd>({ y: hoje.y, m: hoje.m, d: hoje.d });
  const [vista, setVista] = useState({ y: hoje.y, m: hoje.m });
  const [aberto, setAberto] = useState(false);
  const [hora, setHora] = useState("");

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto]);

  const direita = somarMeses(vista, 1);
  const podeVoltar = vista.y * 12 + vista.m > hoje.y * 12 + hoje.m;
  const podeAvancar = vista.y * 12 + vista.m < hoje.y * 12 + hoje.m + MESES_A_FRENTE;

  const resultado = useMemo(() => {
    const dow = diaSemana(sel);
    const d = horario[ORDEM_JS[dow]];
    const ehHoje = cmp(sel, hoje) === 0;
    const minutos = hora ? toMin(hora) : ehHoje ? hoje.minutos : null;
    const quando = hora ? `às ${hora}` : "agora";

    let ok: boolean;
    let chip: string;
    if (minutos === null) {
      ok = d.ativo;
      chip = d.ativo ? "Aberto neste dia" : "Fechado neste dia";
    } else {
      ok = abertoEm(d, minutos);
      chip = ok ? `Aberto ${quando}` : `Fechado ${quando}`;
    }
    const nota = ok ? null : proximaAbertura(horario, sel, minutos);
    return {
      titulo: cap(fmt(sel, { weekday: "long", day: "numeric", month: "long" })),
      ok,
      chip,
      horas: textoDia(d),
      nota,
    };
  }, [horario, sel, hora, hoje]);

  function escolher(p: Ymd) {
    setSel(p);
  }

  const nenhumDia = ORDEM_JS.every((k) => !horario[k].ativo);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-brand-dark">Planeie a sua visita</h3>
      <p className="mt-1 text-sm text-slate-500">Escolha o dia (e, se quiser, a hora) para ver se a empresa está aberta.</p>

      {/* Campos */}
      <div className="relative mt-4">
        <div className="grid overflow-hidden rounded-xl border border-slate-300 sm:grid-cols-12">
          <button
            type="button"
            onClick={() => setAberto((o) => !o)}
            aria-expanded={aberto}
            className={`flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 sm:col-span-7 ${
              aberto ? "bg-slate-50 ring-2 ring-inset ring-brand-dark" : ""
            }`}
          >
            <CalendarDays size={20} className="shrink-0 text-slate-700" />
            <span className="flex flex-col leading-tight">
              <span className="text-xs text-slate-500">Data da visita</span>
              <span className="text-sm font-semibold text-slate-900">{cap(fmt(sel, { weekday: "short", day: "numeric", month: "short" }))}</span>
            </span>
          </button>

          <label className="flex items-center gap-3 border-t border-slate-300 px-4 py-3 sm:col-span-5 sm:border-l sm:border-t-0">
            <Clock size={20} className="shrink-0 text-slate-700" />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-xs text-slate-500">Hora (opcional)</span>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
              />
            </span>
            {hora ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setHora("");
                }}
                aria-label="Limpar hora"
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            ) : null}
          </label>
        </div>

        {/* Calendário */}
        {aberto ? (
          <>
            <button type="button" aria-label="Fechar calendário" className="fixed inset-0 z-10 cursor-default" onClick={() => setAberto(false)} />
            <div
              role="dialog"
              aria-label="Escolher data"
              className="absolute left-0 top-full z-20 mt-3 w-full max-w-full rounded-2xl border border-slate-100 bg-white shadow-xl md:w-[44rem]"
            >
              <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 text-base font-semibold text-slate-900">
                <CalendarDays size={20} /> Escolher data
              </div>

              <div className="px-5 pt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={!podeVoltar}
                    onClick={() => setVista((v) => somarMeses(v, -1))}
                    aria-label="Mês anterior"
                    className="rounded-full p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="grid flex-1 grid-cols-1 text-center text-sm font-semibold text-slate-900 md:grid-cols-2 md:gap-10">
                    <span>{cap(fmt({ y: vista.y, m: vista.m, d: 1 }, { month: "long", year: "numeric" }))}</span>
                    <span className="hidden md:block">{cap(fmt({ y: direita.y, m: direita.m, d: 1 }, { month: "long", year: "numeric" }))}</span>
                  </div>
                  <button
                    type="button"
                    disabled={!podeAvancar}
                    onClick={() => setVista((v) => somarMeses(v, 1))}
                    aria-label="Mês seguinte"
                    className="rounded-full p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="grid gap-10 md:grid-cols-2">
                  <Mes ano={vista.y} mes={vista.m} hoje={hoje} sel={sel} horario={horario} onPick={escolher} />
                  <div className="hidden md:block">
                    <Mes ano={direita.y} mes={direita.m} hoje={hoje} sel={sel} horario={horario} onPick={escolher} />
                  </div>
                </div>

                <p className="mt-4 flex items-center gap-2 pb-4 text-sm text-slate-600">
                  <span className="h-[3px] w-6 rounded-full bg-emerald-600" /> Dias em que a empresa está aberta
                </p>
              </div>

              <div className="flex justify-end border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="rounded-full bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand"
                >
                  Ver horário
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Resultado */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-base font-semibold text-slate-900">{resultado.titulo}</span>
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium ${
              resultado.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${resultado.ok ? "bg-emerald-500" : "bg-red-500"}`} />
            {resultado.chip}
          </span>
        </div>
        <div className="sm:text-right">
          <p className={`text-xl font-semibold ${resultado.ok || resultado.horas !== "Fechado" ? "text-slate-900" : "text-red-600"}`}>{resultado.horas}</p>
          {resultado.nota ? <p className="mt-1 text-sm text-slate-500">{resultado.nota}</p> : null}
          {nenhumDia ? <p className="mt-1 text-sm text-slate-500">Esta empresa não tem dias de funcionamento definidos.</p> : null}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Horário semanal definido pela empresa (hora de Luanda, UTC+01:00). Feriados e dias especiais podem ser diferentes — confirme com a empresa.
      </p>
    </div>
  );
}
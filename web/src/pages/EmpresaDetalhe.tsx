import {
  ArrowLeft,
  AtSign,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Images,
  Mail,
  MapPin,
  Phone,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PlaneieVisita from "../components/PlaneieVisita";
import Preloader from "../components/Preloader";
import { listarEmpresasPublicadas, photoUrl } from "../lib/api";
import { PLACEHOLDER_PHOTO, onImgError } from "../lib/images";
import type { Empresa } from "../lib/types";

/* ───────────────────────── Tipos ───────────────────────── */

type DiaKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
type DiaHorario = { ativo: boolean; abre: string; fecha: string; pausa: boolean; pausa_inicio: string; pausa_fim: string };
type Horario = Record<DiaKey, DiaHorario>;

/** Campos que a página usa e que podem ainda não estar no teu tipo Empresa. */
type Extra = {
  telefone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  horario_funcionamento?: unknown;
  created_at?: string | null;
};
type Detalhe = Empresa & Extra;

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
const ORDEM_JS: DiaKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const DIA_FECHADO: DiaHorario = { ativo: false, abre: "08:00", fecha: "18:00", pausa: false, pausa_inicio: "12:00", pausa_fim: "13:30" };

/** Devolve o horário guardado, ou null se a empresa ainda não definiu nenhum. */
function lerHorario(raw: unknown): Horario | null {
  let v = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      v = null;
    }
  }
  if (!v || typeof v !== "object") return null;
  const src = v as Record<string, Partial<DiaHorario> | undefined>;
  const h = {} as Horario;
  DIAS.forEach(({ key }) => {
    h[key] = { ...DIA_FECHADO, ...(src[key] || {}) };
  });
  return h;
}

function toMin(s: string) {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function textoDia(d: DiaHorario) {
  if (!d.ativo) return "Fechado";
  return d.pausa ? `${d.abre}–${d.pausa_inicio} · ${d.pausa_fim}–${d.fecha}` : `${d.abre}–${d.fecha}`;
}

/** Dia da semana e minutos do dia em Luanda, independentemente do fuso do dispositivo. */
function agoraEmLuanda() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Luanda",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { hojeKey: ORDEM_JS[dow < 0 ? 0 : dow], minutos: Number(get("hour")) * 60 + Number(get("minute")) };
}

function estadoAgora(h: Horario) {
  const { hojeKey, minutos } = agoraEmLuanda();
  const d = h[hojeKey];
  let aberto = d.ativo && minutos >= toMin(d.abre) && minutos < toMin(d.fecha);
  if (aberto && d.pausa && minutos >= toMin(d.pausa_inicio) && minutos < toMin(d.pausa_fim)) aberto = false;
  return { hojeKey, hoje: d, aberto };
}

/* ───────────────────────── Utilitários ───────────────────────── */

function foto(e: Empresa): string {
  return photoUrl(e.fotos || []) || PLACEHOLDER_PHOTO;
}

function resumo(e: Empresa, sep = " • "): string {
  return [e.negocio, e.localizacao].filter(Boolean).join(sep);
}

function comProtocolo(v: string) {
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function semProtocolo(v: string) {
  return v.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function instagramHandle(v: string) {
  return v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, "");
}

function membroDesde(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
}

const card = "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm";

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-brand-dark">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">{icon}</span>
      {children}
    </h2>
  );
}

/* ───────────────────────── Página ───────────────────────── */

export default function EmpresaDetalhe() {
  const { id = "" } = useParams();
  const [lista, setLista] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewer, setViewer] = useState<number | null>(null);
  const [aba, setAba] = useState("sobre");
  const [toast, setToast] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    setViewer(null);
  }, [id]);

  useEffect(() => {
    let ativo = true;
    listarEmpresasPublicadas()
      .then((d) => {
        if (ativo) setLista(d);
      })
      .catch((error: unknown) => {
        if (ativo) setLoadError(error instanceof Error ? error.message : "Não foi possível carregar a empresa.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const empresa = lista.find((e) => String(e.id) === id) as Detalhe | undefined;

  const imagens = useMemo(() => {
    const urls = empresa ? (empresa.fotos || []).map((f) => photoUrl([f])).filter(Boolean) : [];
    return urls.length ? urls : [PLACEHOLDER_PHOTO];
  }, [empresa]);
  const temFotos = empresa ? (empresa.fotos || []).length > 0 : false;

  const outras = useMemo(() => {
    if (!empresa) return [];
    const mesmo = (e: Empresa) => Number((e.negocio || "") === (empresa.negocio || ""));
    return lista
      .filter((e) => String(e.id) !== String(empresa.id))
      .sort((a, b) => mesmo(b) - mesmo(a))
      .slice(0, 4);
  }, [lista, empresa]);

  useEffect(() => {
    if (empresa) document.title = `${empresa.nome} · Me Encontra`;
  }, [empresa]);

  // Destaca a aba da secção que está à vista
  useEffect(() => {
    if (!empresa) return;
    const els = ["sobre", "horario", "contactos", "localizacao"]
      .map((i) => document.getElementById(i))
      .filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setAba(en.target.id)),
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [empresa]);

  // Teclado no visualizador de fotos
  useEffect(() => {
    if (viewer === null) return;
    const n = imagens.length;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setViewer(null);
      else if (e.key === "ArrowRight") setViewer((v) => (v === null ? v : (v + 1) % n));
      else if (e.key === "ArrowLeft") setViewer((v) => (v === null ? v : (v - 1 + n) % n));
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [viewer, imagens.length]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  async function partilhar() {
    if (!empresa) return;
    const payload = { title: empresa.nome, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch {
        /* ignore */
      }
    } else {
      await navigator.clipboard.writeText(`${empresa.nome} — ${window.location.href}`);
      showToast("Link copiado.");
    }
  }

  function irPara(secao: string) {
    setAba(secao);
    document.getElementById(secao)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Preloader show />
        <Header />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold text-brand-dark">Empresa não encontrada</h1>
          <p className="mt-3 text-slate-600">{loadError || "Esta empresa não existe ou já não está publicada."}</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-base font-semibold text-white hover:bg-brand-mid"
          >
            <ArrowLeft size={18} /> Voltar à página inicial
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Dados derivados ── */
  const telefone = (empresa.telefone || "").trim();
  const email = (empresa.email || "").trim();
  const website = (empresa.website || "").trim();
  const instagram = (empresa.instagram || "").trim();
  const temContactos = Boolean(telefone || email || website || instagram);
  const horario = lerHorario(empresa.horario_funcionamento);
  const estado = horario ? estadoAgora(horario) : null;
  const desde = membroDesde(empresa.created_at);
  const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${empresa.nome} ${empresa.localizacao || ""}`.trim())}`;

  const smalls = imagens.slice(1, 5);
  const s = smalls.length;
  const bigCls = s > 0 ? "sm:col-span-2 sm:row-span-2" : "";
  const smallCls = (i: number) => (s === 1 ? "sm:col-span-2 sm:row-span-2" : s === 2 ? "sm:col-span-2" : s === 3 && i === 0 ? "sm:col-span-2" : "");

  const tabs = [
    { id: "sobre", label: "Sobre" },
    ...(horario ? [{ id: "horario", label: "Horário" }] : []),
    ...(temContactos ? [{ id: "contactos", label: "Contactos" }] : []),
    { id: "localizacao", label: "Localização" },
  ];

  const contactos: { icon: ReactNode; label: string; valor: string; href: string }[] = [
    ...(telefone ? [{ icon: <Phone size={18} />, label: "Telefone", valor: telefone, href: `tel:${telefone.replace(/[^\d+]/g, "")}` }] : []),
    ...(email ? [{ icon: <Mail size={18} />, label: "E-mail", valor: email, href: `mailto:${email}` }] : []),
    ...(website ? [{ icon: <Globe size={18} />, label: "Website", valor: semProtocolo(website), href: comProtocolo(website) }] : []),
    ...(instagram
      ? [{ icon: <AtSign size={18} />, label: "Instagram", valor: `@${instagramHandle(instagram)}`, href: `https://instagram.com/${instagramHandle(instagram)}` }]
      : []),
  ];

  const ctaPrincipal = telefone
    ? { label: "Ligar", icon: <Phone size={18} />, href: `tel:${telefone.replace(/[^\d+]/g, "")}` }
    : email
      ? { label: "Enviar e-mail", icon: <Mail size={18} />, href: `mailto:${email}` }
      : null;

  return (
    <div className="min-h-screen">
      <Header />

      {/* TOPO */}
      <section className="bg-gradient-to-b from-brand-soft to-white">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-6 sm:px-6 lg:px-10">
          <nav aria-label="Navegação" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <Link to="/" className="hover:text-brand-mid hover:underline">
              Início
            </Link>
            <ChevronRight size={14} />
            {empresa.negocio ? (
              <>
                <span>{empresa.negocio}</span>
                <ChevronRight size={14} />
              </>
            ) : null}
            <span className="text-slate-700">{empresa.nome}</span>
          </nav>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-brand-dark sm:text-4xl lg:text-[2.75rem]">{empresa.nome}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                {empresa.negocio ? (
                  <span className="rounded-lg bg-brand-soft px-3 py-1 font-medium text-brand-mid">{empresa.negocio}</span>
                ) : null}
                {estado ? (
                  <span
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 font-medium ${
                      estado.aberto ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${estado.aberto ? "bg-emerald-500" : "bg-red-500"}`} />
                    {estado.aberto ? "Aberto agora" : "Fechado agora"}
                  </span>
                ) : null}
                {empresa.localizacao ? (
                  <a
                    href={mapaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 underline underline-offset-2 hover:text-brand-mid"
                  >
                    <MapPin size={16} /> {empresa.localizacao}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={partilhar}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Share2 size={17} /> Partilhar
              </button>
              {ctaPrincipal ? (
                <a
                  href={ctaPrincipal.href}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-mid"
                >
                  {ctaPrincipal.icon} {ctaPrincipal.label}
                </a>
              ) : null}
            </div>
          </div>

          {/* GALERIA */}
          <div className="relative mt-6">
            <div
              className={`grid h-[16rem] gap-2 overflow-hidden rounded-2xl sm:h-[24rem] lg:h-[29rem] ${
                s > 0 ? "sm:grid-cols-4 sm:grid-rows-2" : ""
              }`}
            >
              <button type="button" onClick={() => setViewer(0)} className={`group relative block h-full w-full overflow-hidden bg-slate-100 ${bigCls}`}>
                <img
                  src={imagens[0]}
                  onError={onImgError}
                  alt={`Foto principal de ${empresa.nome}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
              {smalls.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setViewer(i + 1)}
                  className={`group relative hidden h-full w-full overflow-hidden bg-slate-100 sm:block ${smallCls(i)}`}
                >
                  <img
                    src={src}
                    onError={onImgError}
                    alt={`Foto ${i + 2} de ${empresa.nome}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
            {temFotos && imagens.length > 1 ? (
              <button
                type="button"
                onClick={() => setViewer(0)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow-md hover:bg-white"
              >
                <Images size={17} /> Ver as {imagens.length} fotos
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* BARRA DE SECÇÕES */}
      <div className="sticky top-[4.25rem] z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link to="/" className="hidden shrink-0 items-center gap-1 py-3 text-sm text-slate-500 hover:text-brand-mid md:inline-flex">
            <ArrowLeft size={16} /> Todas as empresas
          </Link>
          <nav aria-label="Secções" className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => irPara(t.id)}
                className={`whitespace-nowrap border-b-2 px-3 py-3.5 text-sm transition-colors ${
                  aba === t.id ? "border-brand font-semibold text-brand-dark" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          {ctaPrincipal ? (
            <a
              href={ctaPrincipal.href}
              className="hidden h-10 shrink-0 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-mid sm:inline-flex"
            >
              {ctaPrincipal.icon} {ctaPrincipal.label}
            </a>
          ) : null}
        </div>
      </div>

      {/* CONTEÚDO */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {/* SOBRE */}
            <section id="sobre" className={`${card} scroll-mt-32`}>
              <SectionTitle icon={<MapPin size={18} />}>Sobre</SectionTitle>
              {empresa.biografia ? (
                <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">{empresa.biografia}</p>
              ) : (
                <p className="text-base text-slate-500">Esta empresa ainda não adicionou uma descrição.</p>
              )}
              <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
                {empresa.negocio ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Negócio</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">{empresa.negocio}</dd>
                  </div>
                ) : null}
                {empresa.localizacao ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Localização</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-800">{empresa.localizacao}</dd>
                  </div>
                ) : null}
                {desde ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">No Me Encontra desde</dt>
                    <dd className="mt-1 text-sm font-medium capitalize text-slate-800">{desde}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {/* HORÁRIO */}
            {horario && estado ? (
              <section id="horario" className={`${card} scroll-mt-32`}>
                <SectionTitle icon={<Clock size={18} />}>Horário de funcionamento</SectionTitle>

                {/* NOVO: calendário para planear a visita */}
                <PlaneieVisita horario={horario} />

                <h3 className="mb-2 mt-8 text-base font-semibold text-slate-800">Horário semanal</h3>
                <ul className="divide-y divide-slate-100">
                  {DIAS.map(({ key, label }) => {
                    const hoje = key === estado.hojeKey;
                    const d = horario[key];
                    return (
                      <li
                        key={key}
                        className={`flex items-center justify-between gap-4 px-3 py-2.5 text-sm ${hoje ? "rounded-lg bg-brand-soft font-semibold text-brand-dark" : "text-slate-700"}`}
                      >
                        <span className="flex items-center gap-2">
                          {label}
                          {hoje ? <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">Hoje</span> : null}
                        </span>
                        <span className={d.ativo ? "" : "text-red-600"}>{textoDia(d)}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-slate-400">Horário de Luanda (UTC+01:00).</p>
              </section>
            ) : null}

            {/* CONTACTOS */}
            {temContactos ? (
              <section id="contactos" className={`${card} scroll-mt-32`}>
                <SectionTitle icon={<Phone size={18} />}>Contactos e redes</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  {contactos.map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.label === "Website" || c.label === "Instagram" ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 hover:border-brand/30 hover:bg-brand-soft/50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">{c.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">{c.label}</span>
                        <span className="block truncate text-sm font-medium text-slate-800">{c.valor}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {/* LOCALIZAÇÃO */}
            <section id="localizacao" className={`${card} scroll-mt-32`}>
              <SectionTitle icon={<MapPin size={18} />}>Localização</SectionTitle>
              {empresa.localizacao ? (
                <>
                  <p className="flex items-start gap-2 text-base text-slate-700">
                    <MapPin size={20} className="mt-0.5 shrink-0 text-brand" /> {empresa.localizacao}
                  </p>
                  <a
                    href={mapaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <ExternalLink size={16} /> Abrir no Google Maps
                  </a>
                </>
              ) : (
                <p className="text-base text-slate-500">Esta empresa ainda não indicou a localização.</p>
              )}
            </section>
          </div>

          {/* LATERAL */}
          <aside className="lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-36">
              <div className={card}>
                <h3 className="text-base font-semibold text-brand-dark">Informação rápida</h3>
                {estado ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className={`flex items-center gap-2 text-sm font-semibold ${estado.aberto ? "text-emerald-700" : "text-red-700"}`}>
                      <span className={`h-2 w-2 rounded-full ${estado.aberto ? "bg-emerald-500" : "bg-red-500"}`} />
                      {estado.aberto ? "Aberto agora" : "Fechado agora"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Hoje: {textoDia(estado.hoje)}</p>
                  </div>
                ) : null}

                {contactos.length ? (
                  <ul className="mt-4 space-y-2">
                    {contactos.map((c) => (
                      <li key={c.label}>
                        <a
                          href={c.href}
                          target={c.label === "Website" || c.label === "Instagram" ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-brand-soft"
                        >
                          <span className="text-brand">{c.icon}</span>
                          <span className="truncate">{c.valor}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Esta empresa ainda não adicionou contactos.</p>
                )}

                <div className="mt-5 flex flex-col gap-2">
                  {ctaPrincipal ? (
                    <a
                      href={ctaPrincipal.href}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-mid"
                    >
                      {ctaPrincipal.icon} {ctaPrincipal.label}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={partilhar}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <Share2 size={17} /> Partilhar esta empresa
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* OUTRAS EMPRESAS */}
        {outras.length > 0 ? (
          <section className="mt-14">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">Outras empresas que pode gostar</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {outras.map((o) => (
                <div key={o.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <Link to={`/empresa/${o.id}`} tabIndex={-1} aria-hidden="true">
                    <img src={foto(o)} onError={onImgError} alt="" loading="lazy" className="h-32 w-full object-cover" />
                  </Link>
                  <div className="p-3">
                    <Link to={`/empresa/${o.id}`} className="block truncate font-semibold text-slate-900 hover:text-brand hover:underline">
                      {o.nome}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{resumo(o)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />

      {/* VISUALIZADOR DE FOTOS */}
      {viewer !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fotografias de ${empresa.nome}`}
          className="fixed inset-0 z-[70] flex flex-col bg-black/90"
          onClick={() => setViewer(null)}
        >
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm">
              {viewer + 1} / {imagens.length}
            </span>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setViewer(null)}
              className="rounded-full p-2 hover:bg-white/10"
            >
              <X size={22} />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
            <img
              src={imagens[viewer]}
              onError={onImgError}
              onClick={(e) => e.stopPropagation()}
              alt=""
              className="max-h-full max-w-full rounded-xl object-contain"
            />
            {imagens.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewer((viewer - 1 + imagens.length) % imagens.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow hover:bg-white"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Foto seguinte"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewer((viewer + 1) % imagens.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow hover:bg-white"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
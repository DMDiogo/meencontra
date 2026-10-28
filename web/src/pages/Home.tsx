import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Empresa } from "../lib/types";
import { Link, useNavigate } from "react-router-dom";
import EmpresaCard from "../components/EmpresaCard";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Modal from "../components/Modal";
import Preloader from "../components/Preloader";
import { listarEmpresasPublicadas, photoUrl } from "../lib/api";
import { ASSETS } from "../lib/assets";
import { PATTERN_LIGHT, PLACEHOLDER_PHOTO, onImgError } from "../lib/images";

const fieldClass =
  "h-12 rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

function irParaExplorar() {
  document.getElementById("explorar")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Foto principal da empresa; sem fotos, usa a imagem padrão. */
function foto(e: Empresa): string {
  return photoUrl(e.fotos || []) || PLACEHOLDER_PHOTO;
}

/** "Negócio • Localização", ignorando o que estiver em branco. */
function resumo(e: Empresa, sep = " • "): string {
  return [e.negocio, e.localizacao].filter(Boolean).join(sep);
}

/** Endereço da página da empresa. */
function paginaDe(e: Empresa): string {
  return `/empresa/${e.id}`;
}

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadError, setLoadError] = useState("");
  const [q, setQ] = useState("");
  const [local, setLocal] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listarEmpresasPublicadas()
      .then(setEmpresas)
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Não foi possível carregar as empresas.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return empresas.filter((e) => {
      const hay = `${e.nome} ${e.negocio || ""} ${e.localizacao || ""} ${e.biografia || ""}`.toLowerCase();
      const matchesQ = !q.trim() || hay.includes(q.toLowerCase());
      const matchesLocal = !local || (e.localizacao || "").toLowerCase().includes(local.toLowerCase());
      const matchesCat = categoria === "Todos" || (e.negocio || "").toLowerCase() === categoria.toLowerCase();
      return matchesQ && matchesLocal && matchesCat;
    });
  }, [empresas, q, local, categoria]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  async function share(empresa: Empresa) {
    // Partilha o link da página da própria empresa (e não o da página inicial)
    const url = `${window.location.origin}${paginaDe(empresa)}`;
    const payload = { title: empresa.nome, url };
    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch {
        /* ignore */
      }
    } else {
      await navigator.clipboard.writeText(`${empresa.nome} — ${url}`);
      showToast("Link copiado.");
    }
  }

  const heroFotos = empresas.slice(0, 3);
  const categories = [...new Set(empresas.map((empresa) => (empresa.negocio || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const locations = [...new Set(empresas.map((empresa) => (empresa.localizacao || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  const selectClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  const Filters = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100 bg-white p-5">
        <h3 className="mb-3 text-base font-semibold text-brand-dark">Filtrar por</h3>
        <label htmlFor="f-cat" className="mb-1 block text-sm text-slate-500">Categoria</label>
        <select id="f-cat" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${selectClass} mb-3`}>
          {["Todos", ...categories].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-800">Dica</h4>
        <p className="mt-1 text-sm text-slate-500">Busque por especialidade + local (ex: &quot;peixe Luanda&quot;).</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Preloader show={loading} />
      <Header />

      {/* HERO */}
      <section className="bg-gradient-to-b from-brand-soft to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:px-10 lg:py-16">
          <div className="lg:col-span-7">
            <h1 className="max-w-2xl text-balance text-4xl font-semibold leading-[1.12] tracking-tight text-brand-dark lg:text-[2.75rem]">
              Descubra empresas, serviços e móveis perto de si
            </h1>
            <p className="mt-4 max-w-lg text-pretty text-base text-slate-600 sm:text-lg">
              Procure empresas locais e conheça os seus serviços, localização e fotografias.
            </p>

            <div className="mt-7 rounded-2xl border border-white bg-white/90 p-4 shadow-md sm:p-5">
              <div className="grid gap-3 sm:grid-cols-12">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && irParaExplorar()}
                  aria-label="Pesquisar"
                  placeholder="Ex: Restaurante, Barbearia, Móveis..."
                  className={`${fieldClass} sm:col-span-6`}
                />
                <select
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  aria-label="Localidade"
                  className={`${fieldClass} sm:col-span-3`}
                >
                  <option value="">Localidades</option>
                  {locations.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={irParaExplorar}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-mid sm:col-span-3"
                >
                  <Search size={18} /> Procurar
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 4).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategoria(cat);
                        irParaExplorar();
                      }}
                      className="rounded-lg bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand-mid hover:bg-emerald-100"
                    >
                      <i className="fa-solid fa-store me-2 text-xs" />
                      {cat}
                    </button>
                  ))}
                </div>
                <small className="text-sm text-slate-500">
                  Resultados: <strong>{filtered.length}</strong>
                </small>
              </div>
            </div>
          </div>

          {/* Pré-visualização de resultados: miniaturas pequenas, nítidas e úteis */}
          {heroFotos.length > 0 && (
            <div className="relative hidden lg:col-span-5 lg:block">
              <div aria-hidden="true" className="absolute -inset-6 -z-0 rounded-[2rem] bg-emerald-100/50" />
              <div className="relative space-y-4">
                {heroFotos.map((d, i) => (
                  <div
                    key={d.id}
                    className={`flex items-center gap-4 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-emerald-100 ${
                      i === 0 ? "mr-10" : i === 1 ? "ml-10" : "mr-4"
                    }`}
                  >
                    <Link to={paginaDe(d)} tabIndex={-1} aria-hidden="true" className="shrink-0">
                      <img
                        src={foto(d)}
                        onError={onImgError}
                        alt=""
                        className="h-20 w-24 rounded-xl object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={paginaDe(d)}
                        className="block truncate font-semibold text-slate-900 hover:text-brand hover:underline"
                      >
                        {d.nome}
                      </Link>
                      <p className="truncate text-sm text-slate-500">{resumo(d)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* EXPLORAR */}
      <main id="explorar" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="hidden lg:sticky lg:top-24 lg:col-span-3 lg:block lg:self-start">{Filters}</aside>

          <section className="lg:col-span-9">
            <button
              type="button"
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal size={18} /> Filtros
            </button>

            <div className="mb-8">
              <h2 className="mb-3 text-xl font-semibold text-slate-800">Em destaque</h2>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Anterior"
                  className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-slate-50 sm:block"
                  onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Seguinte"
                  className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-slate-50 sm:block"
                  onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
                >
                  <ChevronRight size={18} />
                </button>
                <div ref={scrollRef} className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                  {empresas.map((d) => (
                    <div
                      key={d.id}
                      className="min-w-[14rem] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                    >
                      <Link to={paginaDe(d)} tabIndex={-1} aria-hidden="true">
                        <img src={foto(d)} onError={onImgError} alt="" loading="lazy" className="h-28 w-full object-cover" />
                      </Link>
                      <div className="p-3">
                        <Link
                          to={paginaDe(d)}
                          className="block font-semibold text-slate-900 hover:text-brand hover:underline"
                        >
                          {d.nome}
                        </Link>
                        <p className="text-xs text-slate-500">{resumo(d)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <p className="rounded-2xl bg-white p-10 text-center text-slate-500">A carregar empresas...</p>
            ) : loadError ? (
              <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
                {loadError}
              </p>
            ) : filtered.length === 0 ? (
              <p className="rounded-2xl bg-white p-10 text-center text-slate-500">
                Nenhum resultado. Ajuste a pesquisa ou os filtros.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {filtered.map((empresa) => (
                  <EmpresaCard
                    key={empresa.id}
                    empresa={empresa}
                    onVer={(e) => navigate(paginaDe(e))}
                    onShare={share}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">Como funciona</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            Com o <strong>Me Encontra</strong>, descobrir negócios locais nunca foi tão fácil.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              ["fa-solid fa-magnifying-glass", "1. Pesquisa", "Encontra restaurantes, lojas e serviços próximos de ti."],
              ["fa-solid fa-image", "2. Descobre", "Consulta informação e fotografias dos estabelecimentos."],
              ["fa-solid fa-location-dot", "3. Localiza", "Encontra o negócio e a sua localização no diretório."],
            ].map(([icon, t, d]) => (
              <div key={t} className="rounded-2xl bg-brand-soft p-7">
                <i className={`${icon} text-2xl text-brand`} />
                <h3 className="mt-3 text-lg font-semibold text-brand-dark">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA PROPRIETÁRIOS */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark to-brand text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: `url("${PATTERN_LIGHT}")`, backgroundSize: "64px 64px" }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Tens um negócio?</h2>
            <p className="mt-2 text-base text-emerald-50">
              Publica os dados e as fotografias do teu estabelecimento para aparecer no diretório.
            </p>
          </div>
          <Link
            to="/registar?tipo=proprietario"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-brand-dark shadow-md hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            Anunciar o meu negócio
          </Link>
        </div>
      </section>

      {/* APP */}
      <section className="bg-gradient-to-b from-brand-soft to-white py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 md:flex-row">
          <img
            src={ASSETS.logoApp}
            alt="App Me Encontra"
            className="max-w-[200px] rounded-2xl bg-white/50 object-contain"
          />
          <div>
            <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">
              Baixa o App <span className="text-brand">Me Encontra</span>
            </h2>
            <p className="mt-3 max-w-md text-base text-slate-600">Descobre restaurantes, lojas e serviços onde estiveres.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#" className="inline-flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-sm font-medium shadow-sm">
                <i className="fa-brands fa-google-play text-xl text-brand" />
                <span className="text-left leading-tight">
                  <span className="block text-[11px] font-normal text-slate-500">Disponível no</span>
                  Google Play
                </span>
              </a>
              <a href="#" className="inline-flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-sm font-medium shadow-sm">
                <i className="fa-brands fa-apple text-xl text-brand" />
                <span className="text-left leading-tight">
                  <span className="block text-[11px] font-normal text-slate-500">Disponível na</span>
                  App Store
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-10">
          <img
            src={ASSETS.logoMarca}
            alt="Me Encontra"
            loading="lazy"
            className="mx-auto w-full max-w-xl rounded-3xl object-cover shadow-lg ring-1 ring-emerald-100"
          />
          <div>
            <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">Sobre nós</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              O <strong>Me Encontra</strong> nasceu para facilitar a descoberta dos melhores restaurantes, serviços e
              estabelecimentos locais em Angola.
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Ligamos pessoas e empresas com uma experiência moderna, rápida e fiável.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-3 text-center">
              {[
                ["500+", "Restaurantes"],
                ["1.200+", "Utilizadores"],
                ["50+", "Cidades"],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="text-2xl font-bold text-brand">{n}</p>
                  <p className="text-sm text-slate-500">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-5 text-center sm:grid-cols-3">
              {[
                ["bi bi-bullseye", "Missão", "Conectar pessoas aos melhores restaurantes e experiências."],
                ["bi bi-eye", "Visão", "Ser a plataforma nº1 na descoberta de negócios locais em Angola."],
                ["bi bi-heart", "Valores", "Transparência, confiança, inovação e valorização local."],
              ].map(([icon, t, d]) => (
                <div key={t}>
                  <i className={`${icon} text-2xl text-brand`} />
                  <h4 className="mt-2 text-base font-semibold">{t}</h4>
                  <p className="mt-1 text-sm text-slate-500">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="mx-auto max-w-xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">Falar connosco</h2>
        <form
          className="mt-8 space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            showToast("Mensagem enviada. Entraremos em contacto.");
            e.currentTarget.reset();
          }}
        >
          <input required aria-label="Nome" placeholder="Nome" className={`${fieldClass} w-full`} />
          <input required type="email" aria-label="Email" placeholder="Email" className={`${fieldClass} w-full`} />
          <textarea
            required
            rows={4}
            aria-label="Mensagem"
            placeholder="Mensagem"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
          <button className="w-full rounded-xl bg-brand py-3 text-base font-semibold text-white hover:bg-brand-mid">
            Enviar
          </button>
        </form>
      </section>

      <Footer />

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros">
        <div className="p-5">{Filters}</div>
      </Modal>

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
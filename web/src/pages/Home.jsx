import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import EmpresaCard from "../components/EmpresaCard";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Modal from "../components/Modal";
import Preloader from "../components/Preloader";
import { listarEmpresas, photoUrl } from "../lib/api";
import { ASSETS } from "../lib/assets";
import { DESTAQUES, DEMO_EMPRESAS, normalizeEmpresa } from "../lib/demoData";
import { PATTERN_LIGHT, PLACEHOLDER_PHOTO, onImgError } from "../lib/images";

const CATEGORIAS = ["Todos", "Restaurantes", "Hotéis", "Mobília", "Serviços"];
const LOCAIS = ["", "Luanda", "Talatona", "Viana", "Benguela"];

const fieldClass =
  "h-12 rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

function irParaExplorar() {
  document.getElementById("explorar")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState(DEMO_EMPRESAS);
  const [fromApi, setFromApi] = useState(false);
  const [q, setQ] = useState("");
  const [local, setLocal] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [preco, setPreco] = useState("all");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [reserve, setReserve] = useState(null);
  const [rate, setRate] = useState(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    listarEmpresas()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEmpresas(data.map(normalizeEmpresa));
          setFromApi(true);
        }
      })
      .catch(() => {});
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = empresas.filter((e) => {
      const hay = `${e.nome} ${e.negocio} ${e.localizacao} ${e.biografia}`.toLowerCase();
      const matchesQ = !q.trim() || hay.includes(q.toLowerCase());
      const matchesLocal = !local || (e.localizacao || "").toLowerCase().includes(local.toLowerCase());
      const matchesCat =
        categoria === "Todos" || (e.negocio || "").toLowerCase().includes(categoria.toLowerCase().slice(0, 5));
      const matchesPrice = preco === "all" || e.priceLevel === preco;
      return matchesQ && matchesLocal && matchesCat && matchesPrice;
    });
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "price_low") {
      const map = { low: 1, mid: 2, high: 3 };
      list = [...list].sort((a, b) => map[a.priceLevel] - map[b.priceLevel]);
    }
    if (sort === "price_high") {
      const map = { low: 1, mid: 2, high: 3 };
      list = [...list].sort((a, b) => map[b.priceLevel] - map[a.priceLevel]);
    }
    return list;
  }, [empresas, q, local, categoria, preco, sort]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  async function share(empresa) {
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

  const heroFotos = DESTAQUES.slice(0, 3);

  const selectClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  const Filters = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100 bg-white p-5">
        <h3 className="mb-3 text-base font-semibold text-brand-dark">Filtrar por</h3>
        <label htmlFor="f-cat" className="mb-1 block text-sm text-slate-500">Categoria</label>
        <select id="f-cat" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${selectClass} mb-3`}>
          {CATEGORIAS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label htmlFor="f-preco" className="mb-1 block text-sm text-slate-500">Preço</label>
        <select id="f-preco" value={preco} onChange={(e) => setPreco(e.target.value)} className={`${selectClass} mb-3`}>
          <option value="all">Qualquer</option>
          <option value="low">Barato</option>
          <option value="mid">Médio</option>
          <option value="high">Caro</option>
        </select>
        <label htmlFor="f-sort" className="mb-1 block text-sm text-slate-500">Ordenar por</label>
        <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
          <option value="featured">Destaques</option>
          <option value="rating">Avaliação</option>
          <option value="price_low">Preço (baixo)</option>
          <option value="price_high">Preço (alto)</option>
        </select>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-800">Horários</h4>
        <p className="mt-1 text-sm text-slate-500">Veja estabelecimentos e horários de funcionamento.</p>
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
              Procure, compare avaliações, veja preços e reserve — tudo num só lugar.
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
                  {LOCAIS.filter(Boolean).map((l) => (
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
                  {[
                    ["Restaurantes", "fa-solid fa-utensils", "Restaurantes"],
                    ["Hotéis", "fa-solid fa-hotel", "Hotéis"],
                    ["Lojas", "fa-solid fa-store", "Mobília"],
                    ["Serviços", "fa-solid fa-hammer", "Serviços"],
                  ].map(([c, icon, cat]) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCategoria(cat);
                        irParaExplorar();
                      }}
                      className="rounded-lg bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand-mid hover:bg-emerald-100"
                    >
                      <i className={`${icon} me-2 text-xs`} />
                      {c}
                    </button>
                  ))}
                </div>
                <small className="text-sm text-slate-500">
                  Resultados: <strong>{filtered.length}</strong>
                  {fromApi ? " (da base de dados)" : " (exemplos)"}
                </small>
              </div>
            </div>
          </div>

          {/* Pré-visualização de resultados: miniaturas pequenas, nítidas e úteis */}
          {heroFotos.length > 0 && (
            <div className="relative hidden lg:col-span-5 lg:block" aria-hidden="true">
              <div className="absolute -inset-6 -z-0 rounded-[2rem] bg-emerald-100/50" />
              <div className="relative space-y-4">
                {heroFotos.map((d, i) => (
                  <div
                    key={d.nome}
                    className={`flex items-center gap-4 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-emerald-100 ${
                      i === 0 ? "mr-10" : i === 1 ? "ml-10" : "mr-4"
                    }`}
                  >
                    <img
                      src={d.img}
                      onError={onImgError}
                      alt=""
                      className="h-20 w-24 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{d.nome}</p>
                      <p className="truncate text-sm text-slate-500">{d.meta}</p>
                      <p className="mt-1 text-xs text-slate-500">{d.reviews} avaliações</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-amber-400 px-2 py-1 text-sm font-bold text-slate-900">
                      <Star size={13} fill="currentColor" /> {d.rating}
                    </span>
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
                  {DESTAQUES.map((d) => (
                    <div
                      key={d.nome}
                      className="min-w-[14rem] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                    >
                      <img src={d.img} onError={onImgError} alt="" loading="lazy" className="h-28 w-full object-cover" />
                      <div className="p-3">
                        <p className="font-semibold text-slate-900">{d.nome}</p>
                        <p className="text-xs text-slate-500">{d.meta}</p>
                        <p className="mt-2 text-sm">
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">{d.rating}</span>
                          <span className="ml-2 text-slate-500">{d.reviews} avaliações</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-2xl bg-white p-10 text-center text-slate-500">
                Nenhum resultado. Ajuste a pesquisa ou os filtros.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {filtered.map((empresa) => (
                  <EmpresaCard
                    key={empresa.id}
                    empresa={empresa}
                    onVer={setDetail}
                    onReservar={setReserve}
                    onClassificar={(e) => {
                      setRate(e);
                      setStars(0);
                      setComment("");
                    }}
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
              ["fa-solid fa-star", "2. Descobre", "Lê avaliações reais e vê fotos dos melhores locais."],
              ["fa-solid fa-calendar-check", "3. Reserva", "Faz a tua reserva diretamente pelo site, sem complicações."],
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
              Divulga o teu estabelecimento e recebe contactos e reservas de quem procura perto de ti.
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
                ["bi bi-eye", "Visão", "Ser a plataforma nº1 em reservas e descobertas em Angola."],
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
          onSubmit={(e) => {
            e.preventDefault();
            showToast("Mensagem enviada. Entraremos em contacto.");
            e.target.reset();
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

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} wide>
        {detail ? (
          <div className="grid md:grid-cols-2">
            <img
              src={photoUrl(detail.fotos) || PLACEHOLDER_PHOTO}
              onError={onImgError}
              alt=""
              className="h-56 w-full object-cover md:h-full"
            />
            <div className="p-6">
              <div className="flex justify-between gap-3 pr-8">
                <div>
                  <h3 className="text-xl font-bold">{detail.nome}</h3>
                  <p className="text-sm text-slate-500">
                    {detail.localizacao} · {detail.negocio}
                  </p>
                </div>
                <span className="inline-flex h-fit items-center gap-1 rounded-lg bg-amber-400 px-2 py-1 font-bold">
                  <Star size={14} /> {detail.rating}
                </span>
              </div>
              <p className="mt-4 text-slate-600">{detail.biografia}</p>
              <ul className="mt-4 space-y-1 text-sm text-slate-500">
                <li>Horário: 08:00 — 22:00</li>
                <li>Telefone: +244 9XX XXX XXX</li>
                <li>Endereço: {detail.localizacao}</li>
              </ul>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-mid"
                  onClick={() => {
                    setReserve(detail);
                    setDetail(null);
                  }}
                >
                  Reservar
                </button>
                <button type="button" className="rounded-xl border px-5 py-2.5" onClick={() => setDetail(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(reserve)} onClose={() => setReserve(null)} title={`Reservar — ${reserve?.nome || ""}`}>
        <form
          className="space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setReserve(null);
            showToast("Pedido de reserva enviado. Confirmaremos por telefone.");
          }}
        >
          <input required name="name" aria-label="Nome" placeholder="Nome" className="w-full rounded-xl border px-3 py-2.5" />
          <input name="phone" aria-label="Telefone" placeholder="Telefone" className="w-full rounded-xl border px-3 py-2.5" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" aria-label="Data" className="rounded-xl border px-3 py-2.5" />
            <input type="time" aria-label="Hora" className="rounded-xl border px-3 py-2.5" />
          </div>
          <input type="number" min="1" defaultValue={2} aria-label="Pessoas" className="w-full rounded-xl border px-3 py-2.5" />
          <button className="w-full rounded-xl bg-brand py-3 font-semibold text-white hover:bg-brand-mid">Enviar pedido</button>
        </form>
      </Modal>

      <Modal open={Boolean(rate)} onClose={() => setRate(null)} title="Classificar">
        {rate ? (
          <div className="p-5">
            <img
              src={photoUrl(rate.fotos) || PLACEHOLDER_PHOTO}
              onError={onImgError}
              alt=""
              className="mb-3 h-40 w-full rounded-xl object-cover"
            />
            <p className="mb-3 text-center font-semibold">{rate.nome}</p>
            <div className="mb-3 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setStars(n)} aria-label={`${n} estrelas`}>
                  <Star size={28} className={n <= stars ? "fill-amber-400 text-amber-400" : "text-amber-300"} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              aria-label="Comentário"
              placeholder="Escreva o seu comentário..."
              className="w-full rounded-xl border px-3 py-2.5"
            />
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-brand py-3 font-semibold text-white hover:bg-brand-mid"
              onClick={() => {
                if (!stars) return showToast("Escolha uma classificação.");
                if (!comment.trim()) return showToast("Escreva um comentário.");
                setRate(null);
                showToast("Avaliação enviada.");
              }}
            >
              Enviar avaliação
            </button>
          </div>
        ) : null}
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
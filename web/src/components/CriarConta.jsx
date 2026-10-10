import { AlertCircle, ArrowDown, Building2, Check, Eye, EyeOff, Loader2, Search, Store, User } from "lucide-react";
import { useRef, useState } from "react";

const TIPOS = [
  {
    id: "cliente",
    titulo: "Sou cliente",
    texto: "Quero encontrar estabelecimentos, guardar favoritos e escrever avaliações.",
    Icon: Search,
    botao: "Criar conta de cliente",
  },
  {
    id: "proprietario",
    titulo: "Sou proprietário",
    texto: "Quero divulgar o meu negócio e receber contactos ou reservas.",
    Icon: Store,
    botao: "Criar conta de proprietário",
  },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

function Seta() {
  return (
    <div className="flex justify-center py-2.5 text-slate-400" aria-hidden="true">
      <ArrowDown size={18} />
    </div>
  );
}

/**
 * onSubmit({ tipo, nome, email, password }) devolve uma Promise.
 * Se lançar erro, a mensagem aparece no formulário.
 */
export default function CriarConta({ onSubmit, tipoInicial = null }) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [form, setForm] = useState({ nome: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const atual = TIPOS.find((t) => t.id === tipo);

  function escolher(id) {
    const primeiraEscolha = !tipo;
    setTipo(id);
    // No telemóvel o formulário nasce fora do ecrã: levamos o utilizador até ele
    if (primeiraEscolha) {
      requestAnimationFrame(() =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setErro("");
    if (form.password.length < 8) {
      setErro("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ tipo, ...form, nome: form.nome.trim(), email: form.email.trim() });
    } catch (err) {
      const offline = /failed to fetch|network/i.test(err?.message || "");
      setErro(
        offline
          ? "Não foi possível ligar ao servidor. Verifica a tua ligação e tenta outra vez."
          : err?.message || "Não foi possível criar a conta. Tenta outra vez."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      {/* Criar conta */}
      <div className="rounded-2xl bg-emerald-50 px-4 py-7 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-sm">
          <User size={24} />
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Criar conta</h1>
        <p className="mt-1 text-slate-600">Uma conta para aceder à plataforma</p>
      </div>

      <Seta />

      {/* Cliente | Proprietário */}
      <div role="radiogroup" aria-label="Tipo de conta" className="grid gap-3 sm:grid-cols-2">
        {TIPOS.map(({ id, titulo, texto, Icon }) => {
          const ativo = tipo === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => escolher(id)}
              className={`relative flex flex-col rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 ${
                ativo
                  ? "border-brand bg-emerald-50/60 ring-1 ring-brand"
                  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
              }`}
            >
              <span
                className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border transition ${
                  ativo ? "border-brand bg-brand text-white" : "border-slate-300 text-transparent"
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-brand">
                <Icon size={22} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{titulo}</h2>
              <p className="mt-1 text-sm text-slate-600">{texto}</p>
              <p className="mt-4 text-sm font-medium text-slate-800">Nome, email, palavra-passe</p>
            </button>
          );
        })}
      </div>

      <Seta />

      {/* Registar estabelecimento (sempre visível, como no desenho) */}
      <div
        className={`rounded-2xl border p-5 transition ${
          tipo === "proprietario" ? "border-brand bg-emerald-50/50" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-brand">
            <Building2 size={20} />
          </span>
          <h3 className="text-lg font-bold text-slate-900">Registar estabelecimento</h3>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Disponível para quem quer divulgar um negócio. O proprietário preenche os dados comerciais
          depois de criar a conta.
        </p>
      </div>

      {/* Formulário: aparece depois de escolher */}
      <div ref={formRef}>
        {atual ? (
          <>
            <Seta />
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="nome" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nome
                </label>
                <input
                  id="nome"
                  required
                  autoComplete="name"
                  placeholder="O teu nome"
                  value={form.nome}
                  onChange={set("nome")}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="o-teu@email.com"
                  value={form.email}
                  onChange={set("email")}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Palavra-passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={set("password")}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {erro && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-mid focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> A criar conta...
                  </>
                ) : (
                  atual.botao
                )}
              </button>
            </form>
          </>
        ) : (
          <p className="mt-5 text-center text-sm text-slate-500">Escolhe o tipo de conta para continuar.</p>
        )}
      </div>
    </section>
  );
}
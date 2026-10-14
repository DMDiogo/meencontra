import { Building2, Search, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { PATTERN_LIGHT } from "../lib/images";

const BENEFICIOS = [
  { Icon: Search, texto: "Descobre empresas e serviços perto de ti" },
  { Icon: Building2, texto: "Consulta os dados e as fotografias dos negócios" },
  { Icon: Store, texto: "Publica o teu negócio no diretório" },
];

/**
 * Estrutura partilhada por Login e Registar: painel de marca + cartão do formulário.
 * `width` controla a largura do cartão (ex.: "max-w-md", "max-w-xl").
 */
import type { ReactNode } from "react";

export default function AuthLayout({ children, width = "max-w-md" }: { children: ReactNode; width?: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-dark to-brand text-white lg:sticky lg:top-0 lg:block lg:h-screen">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: `url("${PATTERN_LIGHT}")`, backgroundSize: "64px 64px" }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link
            to="/"
            className="relative flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <img src={ASSETS.logo} alt="" className="h-12 w-12 rounded-xl bg-white object-cover p-1" />
            <span className="text-2xl font-bold">Me Encontra</span>
          </Link>

          <div className="relative max-w-md">
            <h2 className="text-4xl font-bold leading-tight">Encontra o que precisas, perto de ti.</h2>
            <ul className="mt-8 space-y-4">
              {BENEFICIOS.map(({ Icon, texto }) => (
                <li key={texto} className="flex items-center gap-3 text-lg text-emerald-50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon size={20} />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-sm text-emerald-100">© {new Date().getFullYear()} Me Encontra</p>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className={`w-full ${width}`}>
          <Link
            to="/"
            className="mb-8 flex items-center justify-center gap-3 lg:hidden"
            aria-label="Me Encontra — página inicial"
          >
            <img src={ASSETS.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
            <span className="text-2xl font-bold text-brand-dark">Me Encontra</span>
          </Link>

          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9">{children}</div>

          <p className="mt-6 text-center text-sm">
            <Link to="/" className="text-slate-500 hover:text-brand-mid hover:underline">
              ← Voltar ao site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
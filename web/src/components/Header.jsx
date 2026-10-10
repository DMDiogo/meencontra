import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ASSETS } from "../lib/assets";

const links = [
  { to: "/", label: "Início" },
  { to: "/#explorar", label: "Explorar" },
  { to: "/#como-funciona", label: "Como funciona" },
  { to: "/#sobre", label: "Sobre nós" },
  { to: "/#contacto", label: "Falar connosco" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname, hash, key } = useLocation();

  // O React Router não faz scroll para #âncoras sozinho: fazemos aqui,
  // sem recarregar a página (antes, os <a href="/#..."> recarregavam tudo).
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const el = document.getElementById(hash.slice(1));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [hash, key]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const focus =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur transition-shadow ${
        scrolled ? "border-emerald-100 shadow-md" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/" className={`flex items-center gap-3 rounded-xl ${focus}`}>
          <img src={ASSETS.logo} alt="" className="h-11 w-11 rounded-xl object-cover" />
          <span className="text-lg font-bold text-brand-dark sm:text-xl">Me Encontra</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className={`rounded text-sm font-medium text-slate-600 hover:text-brand-mid ${focus}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {pathname !== "/login" && (
            <Link
              to="/login"
              className={`rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${focus}`}
            >
              Entrar
            </Link>
          )}
          {pathname !== "/registar" && (
            <Link
              to="/registar"
              className={`rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-mid ${focus}`}
            >
              Criar conta
            </Link>
          )}
        </div>

        <button
          type="button"
          className={`rounded-xl border border-slate-200 p-2 lg:hidden ${focus}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div className="space-y-2 border-t border-emerald-50 bg-white px-4 py-4 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50"
            >
              {l.label}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block rounded-lg border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700"
            >
              Entrar
            </Link>
            <Link
              to="/registar"
              onClick={() => setOpen(false)}
              className="block rounded-lg bg-brand px-3 py-2 text-center font-semibold text-white"
            >
              Criar conta
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
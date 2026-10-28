import { useEffect, useState } from "react";
import { ASSETS } from "../lib/assets";
import { PATTERN_LIGHT } from "../lib/images";

/** Animações próprias do preloader (não dependem da configuração do Tailwind). */
const CSS = `
@keyframes pl-ripple { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2.5); opacity: 0; } }
@keyframes pl-float  { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes pl-rise   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes pl-slide  { 0% { transform: translateX(-110%); } 100% { transform: translateX(260%); } }
@keyframes pl-dot    { 0%, 20% { opacity: .15; } 50%, 100% { opacity: 1; } }
@keyframes pl-drift  { from { background-position: 0 0; } to { background-position: 64px 64px; } }

.pl-ripple { animation: pl-ripple 2.4s ease-out infinite; }
.pl-float  { animation: pl-float 2.6s ease-in-out infinite; }
.pl-rise   { opacity: 0; animation: pl-rise .6s ease-out forwards; }
.pl-slide  { animation: pl-slide 1.5s ease-in-out infinite; }
.pl-dot    { animation: pl-dot 1.2s ease-in-out infinite; }
.pl-drift  { animation: pl-drift 14s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .pl-ripple, .pl-float, .pl-slide, .pl-dot, .pl-drift { animation: none; }
  .pl-rise { animation: none; opacity: 1; }
}
`;

const SAIDA_MS = 450;

export default function Preloader({ show }: { show: boolean }) {
  const [montado, setMontado] = useState(show);
  const [saindo, setSaindo] = useState(false);

  // Quando `show` passa a false, faz fade-out antes de desmontar
  useEffect(() => {
    if (show) {
      setMontado(true);
      setSaindo(false);
      return;
    }
    setSaindo(true);
    const t = window.setTimeout(() => setMontado(false), SAIDA_MS);
    return () => window.clearTimeout(t);
  }, [show]);

  // Bloqueia o scroll da página enquanto o preloader está visível
  useEffect(() => {
    if (!montado) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [montado]);

  if (!montado) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="A carregar"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-soft transition-opacity ease-out ${
        saindo ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${SAIDA_MS}ms` }}
    >
      <style>{CSS}</style>

      {/* Véu claro: tira a dureza do verde */}
      <div aria-hidden="true" className="absolute inset-0 bg-white/10" />

      {/* Padrão em movimento lento (discreto) */}
      <div
        aria-hidden="true"
        className="pl-drift absolute inset-0 opacity-25"
        style={{ backgroundImage: `url("${PATTERN_LIGHT}")`, backgroundSize: "64px 64px" }}
      />

      {/* Luz suave ao centro, atrás do logo */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 55% 45% at 50% 48%, rgba(255,255,255,.30), rgba(255,255,255,0) 70%)" }}
      />

      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Logo com ondas, como um "radar" a localizar */}
        <div className="relative">
          <span aria-hidden="true" className="pl-ripple absolute inset-0 rounded-2xl ring-2 ring-white/40" />
          <span aria-hidden="true" className="pl-ripple absolute inset-0 rounded-2xl ring-2 ring-white/30" style={{ animationDelay: "1.2s" }} />
          <div className="pl-float relative rounded-2xl bg-white p-2.5 shadow-lg ring-2 ring-white/30">
            <img src={ASSETS.logo} alt="Me Encontra" className="h-16 w-16 rounded-xl object-cover" />
          </div>
        </div>

        <p className="pl-rise mt-6 text-2xl font-semibold tracking-tight text-white" style={{ animationDelay: ".1s" }}>
          Me Encontra
        </p>
        <p className="pl-rise mt-1 text-sm text-emerald-50" style={{ animationDelay: ".25s" }}>
          Descubra negócios perto de si
        </p>

        {/* Barra de progresso indeterminada */}
        <div className="pl-rise mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-white/25" style={{ animationDelay: ".4s" }}>
          <div className="pl-slide h-full w-2/5 rounded-full bg-amber-300" />
        </div>

        <p className="pl-rise mt-3 text-xs tracking-wide text-emerald-50/90" style={{ animationDelay: ".5s" }}>
          A iniciar
          <span className="pl-dot" style={{ animationDelay: "0s" }}>.</span>
          <span className="pl-dot" style={{ animationDelay: ".2s" }}>.</span>
          <span className="pl-dot" style={{ animationDelay: ".4s" }}>.</span>
        </p>
      </div>
    </div>
  );
}
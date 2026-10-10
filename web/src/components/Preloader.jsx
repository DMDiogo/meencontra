import { ASSETS } from "../lib/assets";
import { PATTERN_LIGHT } from "../lib/images";

export default function Preloader({ show }) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-brand-soft"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{ backgroundImage: `url("${PATTERN_LIGHT}")`, backgroundSize: "64px 64px" }}
      />
      <div className="relative flex flex-col items-center">
        <div className="rounded-2xl bg-white p-2 shadow-lg ring-2 ring-white/25">
          <img src={ASSETS.logo} alt="Me Encontra" className="h-14 w-14 animate-pulse rounded-xl object-cover" />
        </div>
        <p className="mt-4 text-xl font-semibold tracking-tight text-white">Me Encontra</p>
        <p className="mt-0.5 text-sm text-emerald-50">A iniciar...</p>
        <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-white/25">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-300" />
        </div>
      </div>
    </div>
  );
}
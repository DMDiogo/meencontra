import { Link } from "react-router-dom";
import { ASSETS } from "../lib/assets";
import { PATTERN_LIGHT } from "../lib/images";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#00a859] to-[#007f3b] text-white">
      {/* faixa de cor no topo */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: `url("${PATTERN_LIGHT}")`, backgroundSize: "64px 64px" }}
      />

      <div className="relative mx-auto grid max-w-[90rem] gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-10">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <img src={ASSETS.logo} alt="" className="h-10 w-10 rounded-xl bg-white object-cover p-1" />
            <h4 className="text-xl font-bold">Me Encontra</h4>
          </div>
          <p className="max-w-sm text-emerald-50">
            Descobre empresas, restaurantes e serviços perto de ti.
          </p>
        </div>

        <nav aria-label="Links úteis">
          <h5 className="mb-3 font-semibold text-emerald-100">Links úteis</h5>
          <ul className="space-y-2 text-emerald-50">
            <li><Link to="/#sobre" className="hover:underline">Sobre nós</Link></li>
            <li><Link to="/#como-funciona" className="hover:underline">Ajuda</Link></li>
            <li><Link to="/#contacto" className="hover:underline">Contactar</Link></li>
            <li><Link to="/login" className="hover:underline">Área admin</Link></li>
          </ul>
        </nav>

        <div>
          <h5 className="mb-3 font-semibold text-emerald-100">Desenvolvimento</h5>
          <p className="text-emerald-50">
            Desenvolvido por{" "}
            <a
              href="https://ifraim-lopes-dev.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline decoration-amber-300 underline-offset-4"
            >
              Ifraim Lutonadio Lopes
            </a>
          </p>
        </div>
      </div>

      <div className="relative border-t border-white/15">
        <p className="mx-auto max-w-[90rem] px-4 py-4 text-sm text-emerald-100 sm:px-6 lg:px-10">
          © {new Date().getFullYear()} Me Encontra. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
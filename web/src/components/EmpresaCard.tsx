import { MapPin, Share2 } from "lucide-react";
import { photoUrl } from "../lib/api";
import { PLACEHOLDER_PHOTO, onImgError } from "../lib/images";
import type { Empresa } from "../lib/types";

type EmpresaCardProps = {
  empresa: Empresa;
  onVer: (empresa: Empresa) => void;
  onShare: (empresa: Empresa) => void;
};

export default function EmpresaCard({ empresa, onVer, onShare }: EmpresaCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative overflow-hidden">
        <img
          src={photoUrl(empresa.fotos) || PLACEHOLDER_PHOTO}
          onError={onImgError}
          alt={empresa.nome}
          loading="lazy"
          className="h-36 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-40"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        {empresa.localizacao && (
          <span className="absolute bottom-2 left-2.5 right-2.5 flex items-center gap-1 truncate text-xs font-medium text-white">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{empresa.localizacao}</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-slate-800">{empresa.nome}</h3>
            <p className="text-xs text-slate-500">{empresa.negocio}</p>
          </div>
          {empresa.preco ? (
            <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-mid">
              {empresa.preco}
            </span>
          ) : null}
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{empresa.biografia}</p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onVer(empresa)}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
          >
            Ver
          </button>
          <button
            type="button"
            onClick={() => onShare(empresa)}
            className="ml-auto rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
            aria-label="Partilhar"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
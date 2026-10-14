import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  wide?: boolean;
};

export default function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  const titleId = useId();

  // Fechar com Esc e bloquear o scroll da página por trás enquanto está aberto
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "Janela"}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-emerald-950/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className={`animate-sheet relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl ${
          wide ? "sm:max-w-4xl" : "sm:max-w-lg"
        }`}
      >
        {/* pega visual no telemóvel: indica que é uma folha que se fecha */}
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />

        {title ? (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-50 bg-white/95 px-5 py-4 backdrop-blur">
            <h3 id={titleId} className="text-lg font-semibold text-brand-dark">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-slate-600 shadow hover:bg-white"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
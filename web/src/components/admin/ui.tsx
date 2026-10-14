import type { ReactNode } from "react";

export function Icon({ name, className = "", title }: { name: string; className?: string; title?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} title={title}>
      {name}
    </span>
  );
}

export function Bar({ pct, cls = "bg-primary-container", h = "h-1.5" }: { pct: number; cls?: string; h?: string }) {
  return (
    <div className={`w-full bg-surface-container-high ${h} rounded-full overflow-hidden`}>
      <div className={`${cls} h-full rounded-full`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export const inputCls =
  "w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container";

export const labelCls = "font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold";

export function Modal({
  title,
  subtitle,
  icon,
  onClose,
  maxW = "max-w-2xl",
  children,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  onClose: () => void;
  maxW?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-surface-container-lowest w-full ${maxW} rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-space-xl py-space-lg bg-surface-container-low/60 flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
              <Icon name={icon} className="text-[20px]" />
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">{title}</h2>
              {subtitle ? <p className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
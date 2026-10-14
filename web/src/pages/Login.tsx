import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type LoginState = { message?: string };
import AuthLayout from "../components/AuthLayout";
import { signIn } from "../lib/auth";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LoginState | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Entrar · Me Encontra";
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErro("");
    try {
      const profile = await signIn(email.trim(), password);
      navigate(profile.role === "admin" ? "/admin" : profile.role === "dono" ? "/proprietario" : "/", {
        replace: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const offline = /failed to fetch|network/i.test(message);
      setErro(
        offline
          ? "Não foi possível ligar ao servidor. Verifica a tua ligação e tenta outra vez."
          : message || "Utilizador ou senha incorretos. Tenta novamente."
      );
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout width="max-w-md">
      <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>
      <p className="mt-1 text-slate-600">Acede à tua conta para continuar.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="teu@email.com"
            className={inputClass}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Senha
            </label>
            {/* Provisório: leva ao formulário de contacto até existir recuperação de senha */}
            <Link to="/#contacto" className="text-sm font-medium text-brand-mid hover:underline">
              Esqueceste a senha?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock") ?? false)}
              onBlur={() => setCapsOn(false)}
              required
              autoComplete="current-password"
              placeholder="A tua senha"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Esconder senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {capsOn && <p className="mt-1.5 text-sm font-medium text-amber-700">Caps Lock está ligado.</p>}
        </div>

        {state?.message && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {state.message}
          </p>
        )}

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
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-mid focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 size={20} className="animate-spin" /> A entrar...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <div className="mt-7 border-t border-slate-100 pt-6 text-center text-slate-600">
        Ainda não tens conta?{" "}
        <Link to="/registar" className="font-semibold text-brand-mid hover:underline">
          Criar conta
        </Link>
      </div>
    </AuthLayout>
  );
}
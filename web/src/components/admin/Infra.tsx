import { useState, type ReactNode } from "react";
import { Bar, Icon } from "./ui";

type Cat = "baileys" | "supabase" | "auth" | "errors";

const KPIS = [
  { label: "Cluster Health", icon: "dns", box: "bg-primary-fixed text-on-primary-fixed-variant", value: "6 / 6 Nós", valueCls: "text-on-surface", sub: "100% Uptime (48h)", subCls: "text-primary font-medium", pct: 100, bar: "bg-primary-container" },
  { label: "Uso Global CPU", icon: "memory", box: "bg-surface-container text-on-surface", value: "34.2%", valueCls: "text-on-surface", sub: "Balanceamento Round-Robin", subCls: "text-on-surface-variant truncate", pct: 34.2, bar: "bg-primary-container" },
  { label: "Alocação RAM Heap", icon: "developer_board", box: "bg-surface-container text-on-surface", value: "18.4 GB", valueCls: "text-on-surface", sub: "Capacidade 32.0 GB (57.5%)", subCls: "text-on-surface-variant", pct: 57.5, bar: "bg-primary-container" },
  { label: "WebSockets Abertos", icon: "hub", box: "bg-tertiary-fixed text-on-tertiary-fixed", value: "486", valueCls: "text-tertiary", sub: "Sockets Baileys ativos", subCls: "text-on-surface-variant", pct: 81, bar: "bg-tertiary-container" },
  { label: "Latência Média", icon: "network_ping", box: "bg-primary-fixed text-on-primary-fixed-variant", value: "21 ms", valueCls: "text-on-surface", sub: "Datacenter GRU São Paulo", subCls: "text-primary font-medium", pct: 21, bar: "bg-primary-container" },
  { label: "Pool PostgreSQL", icon: "database", box: "bg-surface-container text-on-surface", value: "42 / 100", valueCls: "text-on-surface", sub: "Query Latency: 4ms avg", subCls: "text-on-surface-variant", pct: 42, bar: "bg-primary-container" },
];

const NODES = [
  { n: "01", host: "ip-10-0-1-14.sa-east-1", conns: 82, lat: 19, cpu: 38, ram: "3.1 GB", ramPct: 58 },
  { n: "02", host: "ip-10-0-1-28.sa-east-1", conns: 84, lat: 22, cpu: 35, ram: "3.2 GB", ramPct: 60 },
  { n: "03", host: "ip-10-0-1-65.sa-east-1", conns: 80, lat: 18, cpu: 32, ram: "2.9 GB", ramPct: 54 },
  { n: "04", host: "ip-10-0-1-92.sa-east-1", conns: 85, lat: 25, cpu: 41, ram: "3.4 GB", ramPct: 64 },
  { n: "05", host: "ip-10-0-1-105.sa-east-1", conns: 78, lat: 20, cpu: 29, ram: "2.8 GB", ramPct: 52 },
  { n: "06", host: "ip-10-0-1-118.sa-east-1", conns: 77, lat: 21, cpu: 30, ram: "2.9 GB", ramPct: 54 },
];

const INFO = "bg-primary text-on-primary";
const WARN = "bg-secondary text-on-secondary";
const ERR = "bg-error text-on-error";

const LOGS: { cat: Cat; time: string; lvl: string; lvlCls: string; src: string; srcCls: string; msg: string; msgCls: string }[] = [
  { cat: "baileys", time: "15:42:01.812", lvl: "INFO", lvlCls: INFO, src: "[baileys-sock#84]", srcCls: "text-primary-fixed-dim", msg: "Handshake validado com sucesso. WhatsApp MultiDevice session: sess_c8192a01", msgCls: "text-inverse-on-surface" },
  { cat: "supabase", time: "15:41:58.330", lvl: "INFO", lvlCls: INFO, src: "[supabase-pool]", srcCls: "text-tertiary-fixed-dim", msg: "Connection keep-alive: pool tenant_acme_corp healthy, checkout duration 3ms", msgCls: "text-inverse-on-surface" },
  { cat: "baileys", time: "15:41:49.004", lvl: "WARN", lvlCls: WARN, src: "[baileys-sock#19]", srcCls: "text-primary-fixed-dim", msg: "Reconexão automática executada após jitter de rede. Tentativa 1/3 (Backoff: 200ms)", msgCls: "text-tertiary-fixed" },
  { cat: "auth", time: "15:41:33.208", lvl: "INFO", lvlCls: INFO, src: "[auth-service]", srcCls: "text-surface-container-highest", msg: "Token JWT renovado para tenant_id: 884b2c1f-90af-402a-923c", msgCls: "text-inverse-on-surface" },
  { cat: "auth", time: "15:40:55.918", lvl: "INFO", lvlCls: INFO, src: "[security-audit]", srcCls: "text-surface-container-highest", msg: "Ação de Impersonate registrada: Lucas Silveira acessou espaço 'OmniExpress Logística'", msgCls: "text-inverse-on-surface" },
  { cat: "errors", time: "15:40:12.115", lvl: "ERROR", lvlCls: ERR, src: "[webhook-dispatcher]", srcCls: "text-error-container", msg: "Falha ao entregar payload para https://api.client.com.br/hooks (HTTP 504 Gateway Timeout). Retry agendado", msgCls: "text-inverse-on-surface" },
  { cat: "baileys", time: "15:39:48.640", lvl: "INFO", lvlCls: INFO, src: "[baileys-sock#03]", srcCls: "text-primary-fixed-dim", msg: "Sync batch 120 mensagens processadas pelo dispatcher node-01 em 42ms", msgCls: "text-inverse-on-surface" },
  { cat: "supabase", time: "15:39:10.002", lvl: "INFO", lvlCls: INFO, src: "[supabase-rpc]", srcCls: "text-tertiary-fixed-dim", msg: "Function fn_calculate_tenant_quota executada com sucesso (tempo: 1.2ms)", msgCls: "text-inverse-on-surface" },
];

const FILTERS: { id: "all" | Cat; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "baileys", label: "WebSockets Baileys" },
  { id: "supabase", label: "Supabase / DB" },
  { id: "auth", label: "Autenticação & Impersonate" },
  { id: "errors", label: "Erros & Warnings" },
];

const AUDIT: { who: string; when: string; text: ReactNode; ip: string; tag: string; tagCls: string }[] = [
  { who: "Lucas Silveira", when: "Hoje, 15:40:55", text: <>Iniciou sessão de impersonation na conta da empresa <span className="font-medium text-primary">OmniExpress Logística</span>.</>, ip: "IP: 177.136.220.14", tag: "Autenticado (MFA)", tagCls: "text-primary" },
  { who: "Mariana Dias", when: "Hoje, 14:12:08", text: <>Alterou parâmetros de escala do <span className="font-medium text-tertiary">Nó GRU-Prod-04</span> (limite de sockets de 70 para 85).</>, ip: "IP: 189.102.54.89", tag: "Config Update", tagCls: "text-primary" },
  { who: "Sistema / Watchdog", when: "Hoje, 11:30:00", text: <>Executou garbage collection forçado de sockets órfãos no <span className="font-medium text-on-surface">GRU-Prod-01</span>.</>, ip: "IP: 127.0.0.1 (Internal RPC)", tag: "Auto-Recovery", tagCls: "text-tertiary" },
  { who: "Lucas Silveira", when: "Ontem, 19:44:11", text: <>Revogou chave API mestre de suporte para integração de webhook externa.</>, ip: "IP: 177.136.220.14", tag: "Token Revoke", tagCls: "text-error" },
];

export default function Infra({ flash }: { flash: (m: string) => void }) {
  const [filter, setFilter] = useState<"all" | Cat>("all");
  const [cleared, setCleared] = useState(false);
  const [hb, setHb] = useState("1.2s");
  const [refreshing, setRefreshing] = useState(false);

  function reload() {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setHb((Math.random() * 0.6 + 0.8).toFixed(1) + "s");
    }, 600);
  }

  function restart() {
    if (confirm("Tem certeza que deseja solicitar o restart graceful sequencial dos 6 nós do cluster? Nenhuma conexão será derrubada sem drain prévio.")) {
      flash("Demonstração: esta ação ainda não está ligada ao servidor.");
    }
  }

  const logs = cleared ? [] : LOGS.filter((l) => filter === "all" || l.cat === filter);

  return (
    <>
      <div className="px-space-xl py-space-lg flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm mb-1">
            <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Infraestrutura Crítica</span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">cluster.baileys.internal.net</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Monitoramento de Infraestrutura &amp; Baileys Cluster</h1>
          <div className="flex items-center gap-space-sm mt-1 flex-wrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
            </span>
            <span className="font-label-md text-label-md text-primary font-semibold">Todos os nós operacionais</span>
            <span className="text-outline-variant font-label-md text-label-md">•</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Heartbeat instantâneo <span className="font-code-sm text-code-sm text-on-surface font-semibold">{hb}</span>
            </span>
            <span className="text-outline-variant font-label-md text-label-md">•</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Região Primária: <span className="font-label-sm text-label-sm uppercase font-semibold text-tertiary">GRU São Paulo</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center px-space-md py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant">
            <Icon name="sync" className="text-[16px] mr-1 text-primary" />
            <span className="font-code-sm text-code-sm">Autoscale: ROUND-ROBIN</span>
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={refreshing}
            className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Icon name={refreshing ? "sync" : "refresh"} className={`text-[18px] ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Sincronizando..." : "Recarregar Métricas"}</span>
          </button>
          <button
            type="button"
            onClick={restart}
            className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg transition-all shadow-sm active:scale-95"
          >
            <Icon name="power_settings_new" className="text-[18px]" />
            <span>Reiniciar Nó Gracefully</span>
          </button>
        </div>
      </div>

      <div className="p-space-xl flex flex-col gap-space-2xl">
        <div>
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-space-sm">
              <Icon name="speed" className="text-primary text-[20px]" />
              <span className="font-headline-sm text-headline-sm text-on-surface">Métricas Globais do Cluster</span>
            </div>
            <span className="font-code-sm text-code-sm text-on-surface-variant">Janela: 48 Horas Contínuas</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md">
            {KPIS.map((k) => (
              <div key={k.label} className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-space-xs">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-semibold tracking-wider">{k.label}</span>
                  <div className={`p-1 rounded ${k.box}`}>
                    <Icon name={k.icon} className="text-[16px]" />
                  </div>
                </div>
                <div className="my-space-sm">
                  <div className={`font-headline-lg text-headline-lg font-bold tracking-tight ${k.valueCls}`}>{k.value}</div>
                  <div className={`font-body-sm text-body-sm mt-0.5 ${k.subCls}`}>{k.sub}</div>
                </div>
                <Bar pct={k.pct} cls={k.bar} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-space-md flex-wrap gap-space-sm">
            <div className="flex items-center gap-space-sm flex-wrap">
              <Icon name="lan" className="text-primary text-[20px]" />
              <span className="font-headline-sm text-headline-sm text-on-surface">Nós Dedicados do Cluster Baileys</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">6 instâncias ativas</span>
            </div>
            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-primary-container" /> Normal (&lt;70%)
              </div>
              <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-tertiary-container" /> Alerta (&gt;75%)
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
            {NODES.map((n) => (
              <div key={n.n} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between pb-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center font-code-sm text-code-sm font-bold text-on-surface">#{n.n}</div>
                    <div>
                      <span className="font-headline-sm text-headline-sm text-on-surface block leading-tight">GRU-Prod-{n.n}</span>
                      <span className="font-code-sm text-code-sm text-on-surface-variant">{n.host}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-label-sm text-label-sm font-bold">ONLINE</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm my-space-xs bg-surface-container-low rounded-lg p-space-md">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block">Instâncias Ativas</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{n.conns} Conexões</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block">Latência TCP</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{n.lat} ms</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between font-code-sm text-code-sm mb-1 text-on-surface-variant">
                      <span>CPU: {n.cpu}%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary-container h-full rounded-full" style={{ width: `${n.cpu}%` }} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between font-code-sm text-code-sm mb-1 text-on-surface-variant">
                      <span>RAM: {n.ram}</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary-container h-full rounded-full" style={{ width: `${n.ramPct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-xs">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Sync Baileys v6.7.8</span>
                  <button
                    type="button"
                    onClick={restart}
                    className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold transition-colors"
                  >
                    Reiniciar Nó
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-xl">
          <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-7 h-7 rounded bg-inverse-surface flex items-center justify-center text-inverse-on-surface">
                  <Icon name="terminal" className="text-[16px]" />
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Console de Logs em Tempo Real</span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant block">stdout/stderr agregados (Baileys, NestJS, Supabase RPC)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary-container animate-ping" />
                <span className="font-code-sm text-code-sm text-on-surface font-semibold">STREAM ATIVO</span>
                <button type="button" onClick={() => setCleared(true)} className="p-1 rounded hover:bg-surface-container text-on-surface-variant" title="Limpar visualização">
                  <Icon name="clear_all" className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-space-xs py-space-sm bg-surface-container-low px-space-md rounded-lg mb-space-md">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFilter(f.id);
                    setCleared(false);
                  }}
                  className={`px-space-md py-1 rounded-md font-label-md text-label-md transition-colors ${
                    filter === f.id
                      ? "text-on-primary bg-primary"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-inverse-surface text-inverse-on-surface rounded-xl p-space-md font-code-sm text-code-sm h-[400px] overflow-y-auto flex flex-col gap-1.5 shadow-inner select-text">
              {cleared ? (
                <div className="text-outline-variant font-code-sm italic p-2">
                  [Buffer de logs limpo na visualização local. Novos eventos surgirão automaticamente...]
                </div>
              ) : null}
              {logs.map((l) => (
                <div key={l.time} className="font-code-sm flex items-start gap-space-sm hover:bg-surface-container-lowest/5 p-1 rounded">
                  <span className="text-outline-variant shrink-0">{l.time}</span>
                  <span className={`px-1.5 rounded font-bold text-[9px] shrink-0 ${l.lvlCls}`}>{l.lvl}</span>
                  <span className={`shrink-0 font-medium ${l.srcCls}`}>{l.src}</span>
                  <span className={l.msgCls}>{l.msg}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-space-sm font-code-sm text-code-sm text-on-surface-variant">
              <span>Buffer: {cleared ? 0 : LOGS.length}/5000 eventos retidos</span>
              <div className="flex items-center gap-space-sm">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary-container" />
                <span>Taxa: ~14.2 msgs/sec</span>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-space-sm mb-space-md gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-on-surface">
                    <Icon name="admin_panel_settings" className="text-[16px]" />
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Audit Logs (Super Admin)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap">Últimas Ações</span>
              </div>
              <div className="flex flex-col gap-space-md">
                {AUDIT.map((a) => (
                  <div key={a.when + a.who} className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">{a.who}</span>
                      <span className="font-code-sm text-code-sm text-on-surface-variant">{a.when}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">{a.text}</p>
                    <div className="flex items-center justify-between mt-1 pt-1 font-code-sm text-code-sm text-on-surface-variant">
                      <span>{a.ip}</span>
                      <span className={`font-medium ${a.tagCls}`}>{a.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-space-md mt-space-md">
              <button
                type="button"
                className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-colors"
              >
                <Icon name="history" className="text-[18px]" />
                <span>Ver Histórico Completo de Auditoria</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
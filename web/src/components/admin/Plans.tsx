import { useState, type ReactNode } from "react";
import { Icon, Modal, inputCls, labelCls } from "./ui";

type Item = { icon: string; pre?: string; b?: string; post?: string };
type Plan = {
  tag: string;
  tagCls: string;
  corner: ReactNode;
  title: string;
  desc: string;
  price: string;
  listTitle: string;
  items: Item[];
  tenants: string;
  revenue: string;
  hi: boolean;
};

const STATS = [
  { label: "MRR Consolidado", icon: "payments", iconCls: "text-primary", value: "R$ 56.940,00", sub: "+14.2% este mês", subIcon: "trending_up", subCls: "text-primary font-label-sm text-label-sm font-semibold" },
  { label: "Total de Tenants Pagantes", icon: "storefront", iconCls: "text-tertiary", value: "142 empresas", sub: "98.6% taxa de adimplência", subCls: "text-on-surface-variant font-label-sm text-label-sm" },
  { label: "Instâncias Alocadas", icon: "dns", iconCls: "text-primary-container", value: "738 nós Baileys", sub: "Cluster Load: 42%", subCls: "text-on-surface-variant font-code-sm text-code-sm" },
  { label: "NF-e Conciliadas", icon: "receipt_long", iconCls: "text-secondary", value: "100% Auto-Emitidas", sub: "Integração FocusNFe Ativa", subCls: "text-primary font-label-sm text-label-sm font-semibold" },
];

const PLANS: Plan[] = [
  {
    tag: "Básico / Entrada",
    tagCls: "bg-surface-container text-on-surface-variant",
    corner: <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" title="Plano Padrão" />,
    title: "Plano Starter",
    desc: "Ideal para microempresas iniciando atendimento omnicanal.",
    price: "R$ 149",
    listTitle: "Cotas & Recursos",
    items: [
      { icon: "verified", b: "1 Instância", post: " WhatsApp Baileys" },
      { icon: "group", pre: "Até ", b: "3 Atendentes", post: " simultâneos" },
      { icon: "chat", b: "10.000 mensagens", post: "/mês" },
      { icon: "support_agent", pre: "Suporte padrão por ticket (SLA 24h)" },
    ],
    tenants: "48 empresas",
    revenue: "R$ 7.152,00",
    hi: false,
  },
  {
    tag: "Pequenas & Médias",
    tagCls: "bg-primary-fixed/40 text-on-primary-fixed",
    corner: (
      <span className="flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Alto Crescimento
      </span>
    ),
    title: "Plano Pro",
    desc: "Solução robusta com automação visual e campanhas em escala.",
    price: "R$ 389",
    listTitle: "Cotas & Recursos Avançados",
    items: [
      { icon: "verified", b: "5 Instâncias", post: " WhatsApp Baileys" },
      { icon: "group", pre: "Até ", b: "15 Atendentes", post: " por organização" },
      { icon: "chat", b: "100.000 mensagens", post: "/mês" },
      { icon: "account_tree", b: "Chatbot Visual Node Builder", post: " integrado" },
      { icon: "campaign", b: "Disparo em Massa anti-bloqueio", post: " inteligente" },
    ],
    tenants: "72 empresas",
    revenue: "R$ 28.008,00",
    hi: true,
  },
  {
    tag: "Escala Corporativa",
    tagCls: "bg-secondary-container text-on-secondary-fixed",
    corner: <Icon name="shield" className="text-tertiary text-[18px]" />,
    title: "Plano Enterprise",
    desc: "Infraestrutura dedicada com suporte consultivo de alta capacidade.",
    price: "R$ 990",
    listTitle: "Cotas Sem Gargalo",
    items: [
      { icon: "verified", b: "15 Instâncias", post: " WhatsApp dedicadas" },
      { icon: "all_inclusive", b: "Atendentes Ilimitados" },
      { icon: "chat", b: "500.000 mensagens", post: "/mês" },
      { icon: "webhook", b: "Webhooks dedicados", post: " de alta vazão" },
      { icon: "diamond", b: "Gerente de contas dedicado", post: " + SLA 1h" },
    ],
    tenants: "22 empresas",
    revenue: "R$ 21.780,00",
    hi: false,
  },
];

const ADDONS = [
  { icon: "phonelink_ring", box: "bg-primary-fixed/40 text-primary", title: "Instância WhatsApp Adicional", desc: "Worker isolado com chave de sessão Baileys desacoplada", meta: "118 add-ons ativos no ecossistema", price: "+ R$ 59,00", per: "/mês por número" },
  { icon: "mark_chat_read", box: "bg-tertiary-fixed/60 text-tertiary", title: "Pacote de 50.000 Mensagens Extras", desc: "Sem expiração durante o ciclo mensal do tenant", meta: "45 pacotes consumidos este mês", price: "+ R$ 89,00", per: "/mês por pacote" },
  { icon: "smart_toy", box: "bg-secondary-container text-on-secondary-fixed-variant", title: "Módulo Construtor de Chatbot Avançado", desc: "Typebot nativo, integração OpenAI e rotas HTTP customizadas", meta: "Liberado para Starter & Pro", price: "+ R$ 99,00", per: "/mês por tenant" },
];

type Trx = {
  id: string;
  ini: string;
  iniCls: string;
  name: string;
  cnpj: string;
  plan: string;
  cycle: string;
  valor: string;
  mIcon: string;
  mIconCls: string;
  method: string;
  due: string;
  kind: "paid" | "processing" | "failed";
};

const TRX: Trx[] = [
  { id: "#TRX-94821", ini: "VT", iniCls: "bg-primary-fixed/40 text-primary", name: "Vanguard Tech Soluções", cnpj: "CNPJ: 34.281.902/0001-44", plan: "Plano Enterprise", cycle: "Mensal (+ 2 Instâncias extras)", valor: "R$ 1.108,00", mIcon: "qr_code_2", mIconCls: "text-primary", method: "PIX", due: "Hoje, 14:22", kind: "paid" },
  { id: "#TRX-94820", ini: "CO", iniCls: "bg-tertiary-fixed text-tertiary", name: "Clínica OdontoPrime", cnpj: "CNPJ: 18.902.112/0001-90", plan: "Plano Pro", cycle: "Mensal Recorrente", valor: "R$ 389,00", mIcon: "credit_card", mIconCls: "text-tertiary", method: "Cartão •• 4912", due: "Hoje, 11:05", kind: "paid" },
  { id: "#TRX-94819", ini: "BM", iniCls: "bg-secondary-container text-secondary", name: "Brasil Moda Express", cnpj: "CNPJ: 22.119.843/0001-02", plan: "Plano Starter", cycle: "Mensal Recorrente", valor: "R$ 149,00", mIcon: "qr_code_2", mIconCls: "text-primary", method: "PIX", due: "Ontem, 19:30", kind: "processing" },
  { id: "#TRX-94818", ini: "IL", iniCls: "bg-error-container text-error", name: "Imobiliária Leste Paulistana", cnpj: "CNPJ: 09.441.229/0001-51", plan: "Plano Pro", cycle: "Mensal (+ 50k Mensagens)", valor: "R$ 478,00", mIcon: "credit_card_off", mIconCls: "text-error", method: "Cartão •• 1084", due: "Ontem, 16:14", kind: "failed" },
];

function StatusCell({ kind }: { kind: Trx["kind"] }) {
  if (kind === "paid") {
    return (
      <div className="flex items-center gap-space-sm">
        <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Liquidado
        </span>
        <Icon name="receipt" className="text-[16px] text-primary" title="NF-e emitida" />
      </div>
    );
  }
  if (kind === "processing") {
    return (
      <div className="flex items-center gap-space-sm">
        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Processando
        </span>
        <Icon name="sync" className="text-[16px] text-on-surface-variant" title="Aguardando confirmação bancária" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-space-sm">
      <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-error" /> Falha (Saldo)
      </span>
      <button type="button" className="font-label-sm text-label-sm text-primary hover:underline">
        Reenviar
      </button>
    </div>
  );
}

export default function Plans({ flash }: { flash: (m: string) => void }) {
  const [gateway, setGateway] = useState(false);
  const [newPlan, setNewPlan] = useState(false);
  const [nfe, setNfe] = useState(true);

  const demo = () => flash("Demonstração: esta ação ainda não está ligada ao servidor.");

  return (
    <div className="px-space-xl py-space-xl flex flex-col gap-space-2xl max-w-7xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              Motor de Faturamento Multi-Tenant
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" /> Sync em tempo real
            </span>
          </div>
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile sm:font-headline-xl sm:text-headline-xl text-on-surface tracking-tight">
            Planos Comerciais &amp; Assinaturas SaaS
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Configuração de limites de instâncias WhatsApp Baileys, cotas de atendentes e precificação com conciliação contínua.
          </p>
        </div>
        <div className="flex items-center gap-space-md flex-wrap">
          <button
            type="button"
            onClick={() => setGateway(true)}
            className="px-space-lg py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-sm font-label-lg text-label-lg flex items-center gap-space-sm transition-all active:scale-[0.98]"
          >
            <Icon name="account_balance_wallet" className="text-[18px] text-tertiary" />
            <span>Configurações de Gateway (Asaas/Stripe)</span>
          </button>
          <button
            type="button"
            onClick={() => setNewPlan(true)}
            className="px-space-lg py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary shadow-sm font-label-lg text-label-lg flex items-center gap-space-sm transition-all active:scale-[0.98]"
          >
            <Icon name="add_circle" className="text-[20px]" />
            <span>+ Criar Novo Plano</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {STATS.map((s) => (
          <div key={s.label} className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">{s.label}</span>
              <Icon name={s.icon} className={`text-[20px] ${s.iconCls}`} />
            </div>
            <div className="mt-space-md">
              <span className="font-headline-lg text-headline-lg text-on-surface">{s.value}</span>
              <div className={`flex items-center gap-1.5 mt-1 ${s.subCls}`}>
                {s.subIcon ? <Icon name={s.subIcon} className="text-[14px]" /> : null}
                {s.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between flex-wrap gap-space-sm">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Planos Comerciais Ativos</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Limites estruturais aplicados automaticamente aos containers e pods de mensageria.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Faturamento:</span>
            <span className="font-label-sm text-label-sm text-primary font-semibold">Mensal Recorrente</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg items-stretch">
          {PLANS.map((p) => (
            <div
              key={p.title}
              className={`flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-xl relative ${
                p.hi
                  ? "shadow-lg lg:-translate-y-2 bg-gradient-to-b from-primary-fixed/20 via-surface-container-lowest to-surface-container-lowest"
                  : "shadow-sm hover:shadow-md transition-shadow"
              }`}
            >
              {p.hi ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md uppercase tracking-wider font-bold shadow-sm flex items-center gap-1 whitespace-nowrap">
                  <Icon name="star" className="text-[14px]" /> Mais Popular
                </div>
              ) : null}
              <div>
                <div className={`flex items-center justify-between ${p.hi ? "pt-1" : ""}`}>
                  <span className={`px-2.5 py-1 rounded-md font-label-sm text-label-sm font-semibold uppercase ${p.tagCls}`}>{p.tag}</span>
                  {p.corner}
                </div>
                <div className="mt-space-lg">
                  <h3 className="font-headline-md text-headline-md text-on-surface">{p.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{p.desc}</p>
                </div>
                <div className="mt-space-lg flex items-baseline gap-1">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">{p.price}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">/mês</span>
                </div>

                <div
                  className={`mt-space-xl flex flex-col gap-space-sm pt-space-lg -mx-space-xl px-space-xl py-space-md ${
                    p.hi ? "bg-surface-container-low/60" : "bg-surface-container-low/50"
                  }`}
                >
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">{p.listTitle}</span>
                  {p.items.map((it) => (
                    <div key={it.icon + (it.b || it.pre)} className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface">
                      <Icon name={it.icon} className="text-primary text-[18px]" />
                      <span>
                        {it.pre}
                        {it.b ? <strong>{it.b}</strong> : null}
                        {it.post}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className={`mt-space-lg p-space-md rounded-lg flex items-center justify-between ${
                    p.hi ? "bg-surface-container-high/60" : "bg-surface-container-low"
                  }`}
                >
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Tenants Ativos</span>
                    <p className={`font-headline-sm text-headline-sm text-on-surface ${p.hi ? "font-bold" : ""}`}>{p.tenants}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Receita / Mês</span>
                    <p className={`font-headline-sm text-headline-sm text-primary ${p.hi ? "font-bold" : "font-semibold"}`}>{p.revenue}</p>
                  </div>
                </div>
              </div>
              <div className="mt-space-xl">
                <button
                  type="button"
                  onClick={demo}
                  className={`w-full py-2.5 px-space-md rounded-xl font-label-lg text-label-lg transition-colors flex items-center justify-center gap-2 ${
                    p.hi
                      ? "bg-primary text-on-primary hover:bg-on-primary-container shadow-sm"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                  }`}
                >
                  <Icon name="tune" className="text-[18px]" />
                  <span>Editar Plano &amp; Quotas</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          <div className="flex items-center justify-between gap-space-sm flex-wrap">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Add-ons &amp; Micro-Cotas de Expansão</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Contratadas sob demanda diretamente pelo painel do cliente parceiro.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
              Faturamento Avulso
            </span>
          </div>
          <div className="flex flex-col gap-space-md">
            {ADDONS.map((a) => (
              <div
                key={a.title}
                className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-space-md hover:bg-surface-container-low/40 transition-colors"
              >
                <div className="flex items-center gap-space-md min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${a.box}`}>
                    <Icon name={a.icon} className="text-[24px]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-headline-sm text-on-surface">{a.title}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{a.desc}</span>
                    <span className="font-code-sm text-code-sm text-secondary mt-1">{a.meta}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">{a.price}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{a.per}</span>
                  <button
                    type="button"
                    onClick={demo}
                    className="mt-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors"
                  >
                    Configurar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Gateways de Cobrança</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Status de rotas de processamento e emissão fiscal.</p>
          </div>
          <div className="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-lg">
            {[
              { icon: "credit_card", iconCls: "text-tertiary", name: "Asaas Gateway", sub: "PIX Instantâneo & Boletos", badge: "Ativo (Principal)" },
              { icon: "hub", iconCls: "text-on-surface", name: "Stripe Connect", sub: "Cartões Internacionais & B2B", badge: "Ativo" },
            ].map((g) => (
              <div key={g.name} className="flex items-center justify-between gap-space-sm pb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className={`w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center ${g.iconCls}`}>
                    <Icon name={g.icon} className="text-[20px]" />
                  </div>
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface">{g.name}</span>
                    <span className="block font-body-sm text-body-sm text-on-surface-variant">{g.sub}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {g.badge}
                </span>
              </div>
            ))}

            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase">Conciliação Automática NF-e</span>
                <span className="font-code-sm text-code-sm text-primary font-bold">100% Sincronizado</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden flex">
                <div className="bg-primary-container h-full" style={{ width: "78%" }} title="PIX liquidado" />
                <div className="bg-tertiary-container h-full" style={{ width: "20%" }} title="Cartão aprovado" />
                <div className="bg-error h-full" style={{ width: "2%" }} title="Falhas" />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant gap-space-sm">
                <span>78% PIX (Sem taxa gateway)</span>
                <span>20% Crédito</span>
                <span className="text-error">2% Retentativas</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm gap-space-sm flex-wrap">
              <span>
                Webhook: <code className="font-code-sm text-code-sm text-primary">/api/v1/billing/webhook</code>
              </span>
              <span className="flex items-center gap-1 text-primary font-semibold">
                <Icon name="check_circle" className="text-[16px]" /> 0ms atraso
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Histórico Recente de Faturamento &amp; Cobranças</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Últimas transações liquidadas e sincronizadas com a Receita Federal / Emissor NF-e.
            </p>
          </div>
          <div className="flex items-center gap-space-sm">
            {[
              { icon: "file_download", label: "Exportar CSV" },
              { icon: "filter_list", label: "Filtrar" },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={demo}
                className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface font-label-md text-label-md shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Icon name={b.icon} className="text-[16px]" /> {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                  {["ID Transação", "Tenant / Empresa", "Plano & Ciclo", "Valor", "Método", "Data Vencimento", "Status & NF-e"].map((h) => (
                    <th key={h} className="py-3.5 px-space-lg">
                      {h}
                    </th>
                  ))}
                  <th className="py-3.5 px-space-lg text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {TRX.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3.5 px-space-lg font-code-sm text-code-sm text-on-surface font-medium">{t.id}</td>
                    <td className="py-3.5 px-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-label-sm ${t.iniCls}`}>{t.ini}</div>
                        <div>
                          <span className="font-headline-sm text-headline-sm text-on-surface block leading-tight">{t.name}</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{t.cnpj}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-space-lg">
                      <span className="font-body-sm text-body-sm text-on-surface block">{t.plan}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{t.cycle}</span>
                    </td>
                    <td className="py-3.5 px-space-lg font-headline-sm text-headline-sm text-on-surface font-semibold whitespace-nowrap">{t.valor}</td>
                    <td className="py-3.5 px-space-lg">
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface whitespace-nowrap">
                        <Icon name={t.mIcon} className={`text-[14px] ${t.mIconCls}`} /> {t.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-space-lg font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">{t.due}</td>
                    <td className="py-3.5 px-space-lg">
                      <StatusCell kind={t.kind} />
                    </td>
                    <td className="py-3.5 px-space-lg text-right">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors ml-auto"
                      >
                        <Icon name="more_vert" className="text-[18px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              Exibindo <strong>4 de 1.482</strong> transações do ciclo corrente
            </div>
            <div className="flex items-center gap-1">
              <button type="button" disabled className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm disabled:opacity-50">
                Anterior
              </button>
              <button type="button" className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">
                1
              </button>
              {[2, 3].map((n) => (
                <button key={n} type="button" className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-sm text-label-sm">
                  {n}
                </button>
              ))}
              <button type="button" className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container font-label-sm text-label-sm">
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>

      {gateway ? (
        <Modal icon="tune" title="Configurações de Gateways & NF-e" onClose={() => setGateway(false)} maxW="max-w-xl">
          <div className="p-space-xl flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <label className={labelCls}>Asaas API Key (Produção)</label>
              <input className={`${inputCls} font-code-sm text-code-sm`} type="password" placeholder="••••••••••••••••" />
              <span className="font-body-sm text-body-sm text-on-surface-variant">Utilizado para liquidação automática via PIX com webhook zero-latency.</span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <label className={labelCls}>Stripe Secret Key</label>
              <input className={`${inputCls} font-code-sm text-code-sm`} type="password" placeholder="••••••••••••••••" />
            </div>
            <div className="flex items-center justify-between gap-space-md p-space-md rounded-lg bg-surface-container-low">
              <div>
                <span className="font-label-md text-label-md text-on-surface block">Emissão Automática de Nota Fiscal (Focus NF-e)</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Dispara envio de XML e PDF logo após o status liquidado.</span>
              </div>
              <button
                type="button"
                onClick={() => setNfe(!nfe)}
                className={`w-10 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${nfe ? "bg-primary-container" : "bg-surface-container-high"}`}
              >
                <span className={`w-5 h-5 bg-on-primary rounded-full shadow-sm transition-transform ${nfe ? "translate-x-4" : ""}`} />
              </button>
            </div>
            <div className="flex items-center justify-end gap-space-sm">
              <button type="button" onClick={() => setGateway(false)} className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setGateway(false);
                  demo();
                }}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary"
              >
                Salvar Parâmetros
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {newPlan ? (
        <Modal icon="add_business" title="Criar Novo Plano Comercial" onClose={() => setNewPlan(false)} maxW="max-w-lg">
          <div className="p-space-xl flex flex-col gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <label className={labelCls}>Nome do Plano</label>
              <input className={inputCls} placeholder="Ex: Scale Plus" type="text" />
            </div>
            <div className="grid grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className={labelCls}>Mensalidade (R$)</label>
                <input className={inputCls} placeholder="590,00" type="number" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className={labelCls}>Instâncias Baileys</label>
                <input className={inputCls} placeholder="8" type="number" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className={labelCls}>Limite de Atendentes</label>
                <input className={inputCls} placeholder="25" type="number" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className={labelCls}>Cota de Disparos/mês</label>
                <input className={inputCls} placeholder="250000" type="number" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button type="button" onClick={() => setNewPlan(false)} className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewPlan(false);
                  demo();
                }}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary"
              >
                Publicar Plano
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
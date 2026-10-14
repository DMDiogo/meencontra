# Me Encontra

Frontend React + Vite + Tailwind CSS + TypeScript, ligado diretamente ao Supabase.
O backend Express continua no projeto, mas não é usado por estes fluxos do frontend.

## Supabase

O frontend usa diretamente o Supabase para autenticação, empresas e fotos. Copia
`.env.example` para `.env.local` e preenche os valores do projeto:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Usa a chave pública `anon`/publishable do Supabase, nunca a `service_role`. As
políticas RLS do esquema Supabase devem estar ativadas. O bucket público `empresas`
e a tabela `empresa_fotos` são usados para as imagens.

```bash
npm install
npm install --prefix web
npm run dev
```

Para iniciar o frontend em http://localhost:5173, executa `npm run dev` dentro de `web/`.
O frontend comunica diretamente com o Supabase, sem depender das rotas `/api` do backend.

Usa `npm run build` na raiz para compilar servidor e frontend. `npm run typecheck` verifica os tipos dos dois projetos.

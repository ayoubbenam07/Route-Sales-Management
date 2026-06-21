## Route Sales Management — Frontend Build Plan

### Stack note (important)
The PRD asks for "React 18 + Vite SPA + React Router v6". This Lovable project is on **TanStack Start (React 19 + TanStack Router, file-based routing, SSR-capable)**. I'll deliver the same UX, design system, and behaviors using the project's stack:
- TanStack Router (file-based) instead of React Router v6 — same nested layout / link semantics
- Everything else as requested: Tailwind + shadcn/ui, Zustand, Axios, React Hook Form + Zod, Framer Motion, lucide-react, react-i18next (FR/AR + RTL)
- All data is **mock** for now (backend not wired). Axios layer and types will be shaped to the documented API so swapping to real endpoints later is trivial.

### Design system (Attio-inspired, light only)
- Global `bg-slate-50` + fixed SVG noise overlay
- Surfaces: `bg-white`, `rounded-2xl/3xl`, `border-slate-200`, ultra-soft shadow
- Primary: muted bluescale (`blue-600` actions, `blue-900` headings); soft pill badges for statuses
- Generous `p-6/p-8`, bento CSS grid for dashboards
- Typography: Inter (FR/LTR) / Cairo (AR/RTL), swapped via `<html lang dir>`
- All directional spacing uses logical props (`ms-*`, `pe-*`, `text-start`) so AR flips cleanly
- Tokens added to `src/styles.css` (no hardcoded colors in components)

### Routes (file-based under `src/routes/`)
```
__root.tsx                 — providers (QueryClient, i18n, Zustand bootstrap), noise bg
index.tsx                  — redirects to /auth/login
auth.tsx                   — AuthLayout (centered bento, lang toggle)
  auth.login.tsx
admin.tsx                  — AdminLayout (fixed side nav + top bar)
  admin.dashboard.tsx      — bento metrics + Recharts sales trend
  admin.products.tsx       — DataTable + "Create Product" Sheet
  admin.supermarkets.tsx   — bento grid w/ totalDebt badge
  admin.deals.tsx          — dense ledger, status filter, infinite scroll (IntersectionObserver + Framer Motion)
  admin.team.tsx           — buyers list + add-buyer form (Zod, 6+ char pwd)
buyer.tsx                  — BuyerLayout (sticky header + bottom nav, mobile-first)
  buyer.dashboard.tsx      — vertical bento stack
  buyer.clients.tsx        — supermarket card deck
  buyer.deals.tsx          — infinite-scroll feed + receipt modal
  buyer.deals.new.tsx      — POS form (deep-dive below)
```

### POS — `/buyer/deals/new`
- React Hook Form + Zod schema: `supermarketId` UUID, `items[] { productId, quantity>0, unitPrice>=0 }`, `initialPayment>=0`
- Step 1: shadcn Combobox (searchable) for client (mock supermarkets)
- Step 2: `useFieldArray` rows wrapped in `<AnimatePresence>` (fade/slide); Add Product button
- Step 3: `useWatch` → live total in sticky blue bottom footer
- Step 4: Confirm button with loading spinner → toast → navigate `/buyer/dashboard`

### Infrastructure
- `src/lib/api.ts` — Axios instance (`withCredentials: true`, baseURL via env), typed endpoints matching docs (`/auth`, `/products`, `/supermarkets`, `/deals`, `/payments`, `/analytics/*`)
- `src/stores/` — Zustand stores: `auth`, `deals` (paged cache), `ui`
- `src/lib/i18n.ts` — react-i18next with FR/AR dictionaries for nav, common labels, statuses; locale-aware number formatting helper (`Intl.NumberFormat`)
- `src/lib/mock/` — realistic mock data for products, supermarkets, deals, analytics; small delay simulation so loading states show
- Auth: mock login (any phone + 6+ char pwd) sets a Zustand user with role ADMIN or BUYER, routes guard redirects accordingly. Real cookie-based JWT swap is a one-line change later.
- Framer Motion page transitions on route content
- shadcn components installed as needed: sheet, dialog, drawer (mobile receipt), command (combobox), table, badge, sonner, form, select, dropdown-menu

### Out of scope (this pass)
- Wiring real backend (kept mock; API layer ready)
- Payment collection flow beyond the deal `initialPayment` field
- Tests

### Deliverable
A fully navigable, polished mock app: login → role-based layouts → all listed admin & buyer screens, with the POS flow functional end-to-end against mock state, FR↔AR toggle flipping layout direction and fonts.

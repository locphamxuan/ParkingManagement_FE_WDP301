# PBMS Frontend — Architecture

Web admin/portal app for **PBMS** (Parking Building Management System). Serves three
staff-facing roles (**admin, manager, staff**) plus a parallel **user** web portal
(the primary user experience is the separate Mobile app, but the web `user/*`
pages are a fully working alternative — see repo `CLAUDE.md`).

## Tech stack

- **React 18** + **TypeScript 5** (strict mode)
- **Vite 5** — dev server & build (`vite.config.js`); path alias `@/*` → `src/*`
- **TailwindCSS 3** — utility-first styling, theme tokens in `src/styles/globals.css`
- **framer-motion** — animation (page transitions, hover/tap micro-interactions)
- **recharts** — dashboard charts (revenue trend, breakdowns)
- **react-router-dom 6** — routing, incl. `future` flags for v7 compat (see `src/main.tsx`)
- **zustand** — small global stores (`src/store/authStore.ts`, `managerStore.ts`),
  `authStore` persists the session to session/local storage
- **@radix-ui/react-dialog**, **@radix-ui/react-dropdown-menu** — accessible primitives
  behind the shared `Modal` / dropdown components
- **@zxing/browser**, **@zxing/library**, **jsqr**, **qrcode** — camera-based QR/plate
  scanning and QR generation (staff check-in/out, plate QR codes)
- Testing: **Vitest** + **@testing-library/react** (jsdom environment)

## Folder structure

```
src/
  pages/
    admin/        Admin portal pages (dashboard, buildings, users, revenue, audit logs, profile)
    manager/       Manager portal pages (dashboard, floors/zones/gates/slots, pricing,
                    packages, staff & shifts, wallet, incidents, reviews, profile)
    staff/         Staff portal pages (check-in wizard, check-out, parked vehicles,
                    shifts, incidents, dashboard, profile)
    user/          User web portal (dashboard, buildings, wallet, packages, profile,
                    notifications, report-incident, parking history)
    public/        Marketing/public pages (Home, About, Services, Contact, Reviews)
    AuthPage.tsx    Shared login/register/forgot-password/reset-password page
  components/
    admin/          Admin-only composed components (BuildingCard, modals, etc.)
    manager/        Manager-only composed components (SlotMap3DView, AssignStaffModal,
                    incidents/ResolveIncidentModal shared with staff, MultiSlotForm)
    staff/          Staff-only composed components (camera capture, operations/ &
                    parked/ subfolders for the check-in wizard and check-out flow)
    user/           User-portal composed components (profile, packages, wallet)
    charts/         Chart building blocks (AnalyticsCard, RevenueChart, ActivityTimeline)
    common/         Cross-role primitives (DataTable, StatusBadge, ToastNotification,
                    LicensePlate, InteractiveParticleCanvas)
    home/           Public marketing page sections (HomeHero, HomeFooter*, PublicHeader)
    layout/         App chrome (Navbar, PortalSidebar, MobileNavDrawer, AdminUserDropdown,
                    UserNotificationBell)
    map/            3D/2D parking-map visualizations (AnimatedParkingMap3D, ParkingMap2D,
                    CartoonCar3D, Slot3DBox lives in components/parking instead)
    modals/         Shared modal primitives (Modal, ModalForm, ConfirmModal, QR modals)
    reviews/        Public reviews page building blocks
    ui/              shadcn-style design-system primitives (button, input, select, card,
                    modal, badge, date-picker, ...)
  services/
    client/          apiClient.ts (single fetch wrapper, cookie-based auth), storage.ts
    admin/           adminApi.ts (typed read endpoints) + adminCrud.ts (legacy
                    token-explicit mutation helpers) + apiAdapter.ts + types.ts
    manager/         managerApi.ts — all manager-scoped REST calls
    staff/           staffApi.ts — all staff-scoped REST calls
    user/            userApi.ts — all user-scoped REST calls
    authService.ts, licensePlateService.ts, notificationApi.ts, feedbackNotificationService.ts
  hooks/
    admin/           useAdminDataset, useBuildingsManagement-style page hooks
    staff/           useStaffOperations (check-in wizard state/logic), useAssignedGates
    user/            useUserApi barrel + domain hooks (useLongTermApi, useBuildingApi,
                    useParkingHistoryApi), useProfileWorkflow, usePackagePurchase
    useAuth.ts, useAuthForm.ts, useBuildingContext.ts, useManagerBuildings.ts,
    useCameraDevices.ts, useReviews.ts, ...
  layouts/           AdminLayout, ManagerLayout, StaffLayout, UserLayout — one per portal,
                    each mounts the portal's sidebar/nav + <Outlet/>
  routes/            AppRouter.tsx (all routes, lazy-loaded pages) + ProtectedRoute.tsx
                    (single role-gated route guard used for admin/manager/staff)
  store/             zustand stores (auth session, manager's selected building)
  styles/            globals.css (theme tokens, light-theme overrides) + modules/
                    (co-located CSS Modules migrated out of inline styles, see CLAUDE.md)
  constants/         Shared constant data (vehicle presets)
  utils/             plate normalization/validation, package-status labels, cn() class
                    merge helper, apiErrors, misc constants
  types/             Shared cross-cutting TS types
  data/              Static content data (legacy home-page module list)
```

## Backend connection

- Backend lives in the sibling repo **`../ParkingManagement_BE`** (Node/Express).
  See that repo's own `CLAUDE.md` for the domain model and business rules.
- All HTTP calls go through **`src/services/client/apiClient.ts`**:
  - Base URL: `import.meta.env.VITE_API_BASE` (or the older `VITE_API_BASE_URL` for
    compat), falling back to `http://localhost:5000/api` if neither is set.
  - Every request sends `credentials: 'include'` — auth is a **httpOnly cookie**
    set by the backend; the frontend does not read/write the token itself for
    normal calls. A few legacy `admin/*` call sites (`services/admin/adminCrud.ts`)
    still pass an explicit `Authorization: Bearer` header sourced from the
    zustand-persisted session, kept only for backward compatibility.
  - A 401 response dispatches a global `auth-unauthorized` window event, which
    `authStore.ts` listens for to clear the session client-side.
- Each portal has its own typed API module (`services/{admin,manager,staff,user}`)
  that wraps `apiClient` calls with request/response types matching the backend
  contracts; there is no shared "generic CRUD" abstraction across portals by design
  (each backend resource has its own validated shape).
- `.env.example` documents `VITE_API_BASE`; copy it to `.env` (gitignored) and point
  it at your local backend (default assumes the BE runs on `:5000`).

## Running locally

```bash
npm install          # install dependencies
cp .env.example .env # then edit VITE_API_BASE if the backend isn't on :5000
npm run dev           # start the Vite dev server (default http://localhost:5173)
npm run build         # type-checks via `vite build` and produces dist/
npm run preview       # serve the production build locally
npm test              # run the Vitest suite once (vitest run)
npm run test:watch    # Vitest in watch mode
npm run test:ui       # Vitest with its browser UI
npx tsc --noEmit      # standalone type-check (no build output)
```

The backend (`../ParkingManagement_BE`) must be running separately (its own
`npm run dev`/equivalent) for any page that talks to the API — the public
marketing pages and most auth screens will render without it, but everything
behind login needs the API reachable at `VITE_API_BASE`.

## Testing

- **Vitest** + **Testing Library**, `jsdom` environment. Config: `vitest.config.ts`;
  setup file `tests/setup.ts` (loads `@testing-library/jest-dom/vitest`).
- Tests live under `tests/`, mirroring the `src/` structure they cover — they are
  **not** co-located next to source files.
- `globals: false` in the Vitest config — tests import `describe/it/expect`
  explicitly from `'vitest'` rather than relying on injected globals.
- Import source under test via the `@/...` alias, same as app code.

## The 3-portal theme system

- A single **light, sky-blue theme** is shared across admin, manager, and staff
  (the user portal keeps its own dark theme). Each layout adds a class to
  `document.body` on mount and removes it on unmount: `AdminLayout` adds
  `admin-theme`, `ManagerLayout` adds `manager-theme`, and `StaffLayout` also
  reuses the `admin-theme` class (staff has no dedicated theme block — it
  shares Admin's light-blue tokens).
- `src/styles/globals.css` defines the `--app-*` design tokens under `:root`
  (light by default) plus **semantic tokens** — `--app-success/warning/danger/info`,
  `--app-tile`, `--chart-1..5` — mapped to Tailwind utilities (`text-success`,
  `bg-danger/10`, `bg-tile`, etc.) instead of hardcoded Tailwind color names.
  Dark-styled utility classes used by older components (`glass-premium`,
  `bg-slate-900`, `text-slate-400/500`, heading levels, inputs) are overridden
  back to light inside `.admin-theme`/`.manager-theme` scopes, and the
  admin-specific accent color block is defined exactly once at the bottom of the
  file (see comments in `globals.css` for the historical dedup notes).
- Shared chrome: `PortalSidebar` (collapsible desktop sidebar with grouped nav,
  used by both Admin and Manager layouts) + `MobileNavDrawer`/`MobileNavButton`
  (a `<lg` viewport drawer + FAB — every portal layout renders `PortalSidebar`
  a second time inside the drawer with `variant="drawer"` so mobile/tablet users
  get the same nav without a separate implementation). `StaffLayout` maintains
  its own bespoke sidebar/drawer markup instead of `PortalSidebar` (different nav
  shape — flat list, no grouping).
- UI conventions enforced across portals: loading/empty/error states on every
  data view; `showToast` (never `alert()`) for transient feedback; `ConfirmModal`
  (never `window.confirm()`) for destructive actions; `StatusBadge` for
  status pills; all user-facing copy in English (code comments may stay
  Vietnamese, per this repo's convention).
- Ongoing, intentionally low-priority cleanup: a long tail of components still
  use static inline `style={{...}}` instead of a co-located CSS Module, and a
  few native `<select>` elements haven't been unified onto the shared
  `CustomSelect`. See `CLAUDE.md` for the current list — deliberately deferred
  as cosmetic/no-risk.

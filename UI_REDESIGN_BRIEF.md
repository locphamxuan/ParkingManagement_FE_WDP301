# PBMS UI Redesign Brief

## Goal

Redesign the existing PBMS frontend into a polished, calm, operational product for parking customers, staff, managers, and administrators. Preserve the current routes, information architecture, business behavior, and API contracts.

The interface should feel premium and technically capable without becoming visually noisy. It must be easy to scan at a glance, comfortable during long operating shifts, and clear on both mobile and desktop.

## Context and sources

- Repository: `ParkingManagement_FE_WDP301`
- Source of truth: existing routes, page layouts, React components, API hooks, and semantic status tokens.
- Stack: React 18, TypeScript, Tailwind CSS, Framer Motion, Radix UI, Lucide icons.
- Existing brand direction: deep navy, cobalt blue, cyan highlights, smart-parking imagery, and 2D/3D parking visualizations.

## Design direction

- Use a restrained **midnight operations + daylight workspace** visual language.
- Public and customer-facing marketing surfaces use deep navy with crisp cyan/cobalt illumination.
- Admin, manager, and staff workspaces use a bright neutral canvas with a dark navigation rail and high-contrast white surfaces.
- Create depth with layered gradients, perspective grids, subtle shadows, and small transform/opacity interactions.
- Reserve strong gradients and glow for primary actions, active navigation, live status, and key metrics.
- Prefer clear rectangular surfaces with 12–20px radii over excessive pill shapes.
- Keep typography compact and confident: Manrope for UI copy and Space Grotesk for display headings.

## Boundaries

- Do not change business logic, API contracts, routes, permissions, or data flow.
- Do not add decorative animation that competes with content.
- Do not use emoji as UI icons.
- Do not introduce a second icon library.
- Avoid layout shifts, horizontal overflow, low-contrast glass layers, and hover effects that move surrounding content.
- Preserve existing 2D/3D functional parking visualizations.

## Interaction contract

- Primary touch targets should be at least 44×44px where practical.
- Motion should use transform and opacity, normally within 150–300ms.
- Every interactive element needs a visible keyboard focus state.
- Respect `prefers-reduced-motion`.
- Navigation, dialogs, menus, tables, forms, loading, empty, success, and error states must remain readable at 375px and desktop widths.

## Quality check

- One coherent visual system is visible across public, user, staff, manager, and admin areas.
- Text and controls have readable contrast in every theme.
- Shared buttons, inputs, cards, badges, tables, sidebar, topbar, and mobile navigation follow the same interaction language.
- Decorative depth remains behind content and never blocks pointer or keyboard interaction.
- `npm run build`, `npm test`, and `npx tsc --noEmit` pass.

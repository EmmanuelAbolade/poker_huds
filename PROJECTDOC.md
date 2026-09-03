<!-- PROJECTDOC.md -->

# Poker HUD Store — Project Documentation

> **Scope of this document**: analysis, functional specification, architecture, implementation approach, roadmap, and running project records for the **Admin Console** build. For the narrative/day-by-day story, engineering decisions, and bug log, see [`DIARY.md`](./DIARY.md).

- **Client repo (upstream)**: https://github.com/Yarosurawa/poker_huds
- **Client branding seen in code**: "Gamblin4Kids" (logo/nav text — see `app/components/Navbar.vue`)
- **Source spec materials**: `doc/Personal Poker HUD Store Design Document.pdf` (client's original PDF) and `doc/Personal Poker HUD Store Design Document 2.docx` (an expanded write-up quoting the PDF directly)
- **Stack as received**: Nuxt 4.4.8, Vue 3, TypeScript, Tailwind CSS 4, `@nuxt/ui` 4.9.0, `@nuxt/image`, TipTap (rich text editor, likely for HUD/product descriptions)
- **Status when this doc was started**: Client repo has 4 commits — a storefront home page shell, a navbar, and two global components (button, text input). No backend, no auth, no admin area, no database. This is a very early-stage project.

---

## 1. Executive Summary

The client is building **a digital marketplace for Poker HUDs** ("Poker HUD Store"). A HUD (Heads-Up Display) is a configuration file/overlay used with poker tracking software (Hand2Note, PokerTracker, Hold'em Manager) that shows opponent stats live at the table. The client sells pre-built HUD packages, poker training courses, and related software.

Our job is **not** the storefront — the client already has a start on that. Our job is the **admin console**: the internal tool that lets the client's team **view, create, edit, delete, and monitor every manageable entity in the system** — HUD products, their nested media (situations/screens/pop-ups), categories, users, orders/licenses, and especially the **referral program** (multi-level referrals with monitoring/management controls).

The client wants to see visible progress within days. Because there is no confirmed backend yet (see [Section 7](#7-open-questions-for-the-client)), we are building the admin console against a **typed, swappable mock data layer** on day one, so UI/UX and workflows can be demonstrated and iterated immediately, without blocking on backend decisions. Swapping the mock layer for a real database is designed to be a small, isolated change (see [Section 6.4](#64-mock-first-strategy)).

---

## 2. Domain Glossary

| Term | Meaning |
|---|---|
| **HUD** | A sellable product: a poker HUD configuration package. Referred to as "Hadi" once in the client's notes — treated as a typo for "HUD". |
| **Situation** | A sub-section within a HUD (5–10 per HUD). E.g. a specific game scenario the HUD covers. |
| **Screen** | An image within a situation (3–5 per situation; ~15–30 images total per HUD). |
| **Pop-up image** | An additional image attached to a specific element within a screen, shown on click. |
| **License** | A user's right to access a purchased HUD — may expire, may be subscription- or one-time-purchase based. |
| **Referral** | A user who signed up via another user's referral link/code. |
| **Sub-referral** | A referral of a referral (2-level referral tree, per the client's spec). |
| **Admin** | Internal staff role using the console this project delivers. Roles/levels are still to be confirmed with the client (see open questions). |

---

## 3. Functional Specification

### 3.1 Storefront (client-owned, out of scope for us today, but the admin console must produce the data it needs)
- Product grid with categories: Cash, MTT, Spins, PLO, 6+, GTO, Software, Courses
- Filtering (price range, type), sorting (popularity, price, date)
- Product page: animated graph/video background, situation selector, pop-up screens, rich description
- User account area: purchase history, license expiration, referral stats, downloads, profile

### 3.2 Admin Console (our scope)

| Module | View | Create | Update | Delete | Notes |
|---|---|---|---|---|---|
| **Dashboard** | KPIs, recent activity | — | — | — | Totals for users, HUDs, orders, referrals; recent orders/signups feed |
| **HUD Products** | List, filter, search | Yes | Yes | Yes (soft delete/unpublish) | Includes nested situations → screens → pop-ups; publish/unpublish toggle; category assignment |
| **Categories** | List | Yes | Yes | Yes | Simple flat list; built first as the reference CRUD module (see §6.5) |
| **Users** | List, filter, search | Yes (admin/staff accounts) | Yes (role, ban/unban, reset password) | Archive | Customer accounts vs. staff accounts — see open question on role levels |
| **Orders / Licenses** | List, filter | — (orders originate from storefront checkout) | Yes (refund, extend/revoke license) | — | License expiration + renewal state lives here |
| **Referrals** | Referral tree view, list, search | Yes (manual adjustment) | Yes (adjust earnings, ban abuse) | — | Two levels: direct referrals + sub-referrals; conversion + earnings analytics |
| **Media** | Browse by HUD/situation | Upload | Replace | Delete | Images + video backgrounds; versioning is a stretch goal |
| **Analytics** | Sales, popular HUDs, referral performance, user activity | — | — | — | Charts; reads from the same data other modules write |
| **Settings** | View | — | Yes | — | Logo, payment settings, storage settings, email templates, feature toggles |
| **Audit Log** | List, filter | — | — | — | Every admin mutation should write an entry here (who/what/when) |

### 3.3 Referral System (detail)
Per the client's design doc:
- Two referral levels: **direct referrals** and **sub-referrals** (referrals of referrals).
- Each user can see (in their own dashboard, future scope): referral link, referral stats, sub-referral stats, earnings.
- **Admin must be able to**: view the full referral tree per user, view earnings/conversion, detect/flag suspicious activity ("fraud detection or abuse monitoring" — exact rules unconfirmed), manually adjust earnings, ban referral abuse, export referral data.
- This is explicitly called out by the client as a feature they personally care about ("monitor referrals and manage them if he needs to") — treat it as a first-class module, not an afterthought bolted onto Users.

### 3.4 Non-Functional Requirements
- **RBAC**: role-based access to admin routes/actions (exact roles TBD with client — see open questions).
- **Audit trail**: log admin actions (who changed what, when) — required for a system handling payments/licensing.
- **Theming**: full **light and dark mode** support in the admin UI (the client's current storefront is dark-only with hardcoded CSS variables — the admin console gets its own proper light/dark theme via Nuxt UI's color mode).
- **Responsiveness**: admin console must be usable on laptop and tablet widths at minimum.
- **Data protection**: admins should only see what their role permits (e.g. payment details may need restricting) — TBD.

---

## 4. Data Model (entities to implement, typed in `app/types/admin.ts`)

```
User            id, email, name, role, status(active/banned), createdAt, referredByUserId
Role            'super_admin' | 'admin' | 'moderator' | 'customer'   (levels TBD with client)
Category        id, name, slug, sortOrder
Hud             id, title, slug, description, price, categoryId, status(draft/published), situations[]
Situation       id, hudId, title, sortOrder, screens[]
Screen          id, situationId, imageUrl, sortOrder, popups[]
PopupImage      id, screenId, imageUrl, label
MediaAsset      id, type(image/video), url, ownerType, ownerId, uploadedAt
Order           id, userId, hudId, amount, status, purchasedAt
License         id, orderId, userId, hudId, issuedAt, expiresAt, status(active/expired/revoked)
Referral        id, referrerUserId, referredUserId, level(1|2), earnings, status
AuditLogEntry   id, actorUserId, action, entityType, entityId, before, after, createdAt
Setting         key, value, updatedAt
```

This mirrors the client's spec exactly (HUD → situations → screens → pop-ups nesting, 2-level referrals, license expiration). Full TypeScript definitions live in `app/types/admin.ts`.

---

## 5. Architecture

### 5.1 Frontend
- **Nuxt 4** app-directory structure (`app/`).
- **`@nuxt/ui` v4** for all admin UI primitives (tables, forms, modals, toasts, color mode) — already a dependency, avoids introducing a second component library.
- **Tailwind CSS 4** utility classes for admin layout (the storefront keeps its existing hand-written CSS/variables — we are not restyling the storefront).
- **Route structure**:
  ```
  app/pages/admin/
    login.vue
    index.vue                  → dashboard
    categories/index.vue       → CRUD reference module
    huds/index.vue              → placeholder (Phase 2)
    users/index.vue             → placeholder (Phase 2)
    orders/index.vue            → placeholder (Phase 3)
    referrals/index.vue         → placeholder (Phase 3)
    media/index.vue             → placeholder (Phase 4)
    analytics/index.vue         → placeholder (Phase 4)
    settings/index.vue          → placeholder (Phase 4)
  app/layouts/admin.vue         → sidebar + topbar shell, all admin pages use this
  ```
- **Theming**: Nuxt UI's bundled color mode (`@nuxtjs/color-mode` under the hood) drives light/dark for the admin console; a toggle lives in the admin topbar.

### 5.2 Backend (for now)
- **Nuxt server routes** (`server/api/admin/**`) act as the API layer — this is what Nuxt UI's tables/forms call.
- **Mock data layer** (`server/utils/mockDb.ts`): seeded in-memory store with the same shape the real database will eventually have. See §6.4 for why.
- **Auth**: a minimal mock session (httpOnly cookie) gates `/admin/*` behind a login page today. This is **not** production auth — it exists so the workflow (login → protected dashboard → logout) is real and demonstrable, and gets replaced once the client confirms a real auth strategy.

### 5.3 Why no real database yet
The client's design doc describes *what* the system must do but not *how it's hosted* — no confirmed database, auth provider, file storage, or payment processor. Building against guesses here risks throwaway work. See the open questions in §7. In the meantime, mocking lets us deliver real, demoable UI/UX now.

### 5.4 Mock-first strategy
Every server route reads/writes through `server/utils/mockDb.ts`'s generic helpers (`list`, `get`, `create`, `update`, `remove`) keyed by entity name. When a real database is chosen, only this one file changes (e.g. swap in Prisma/Drizzle calls) — the route handlers and all frontend code stay the same, because they only know about the typed entity shapes, not the storage mechanism.

### 5.5 Reference CRUD module
**Categories** is built first as the complete, working pattern (list table, create/edit modal form, delete with confirm, server routes, mock store) precisely because it's the simplest entity in the model. Every other module (Users, HUDs, Orders, Referrals) is a structural copy of this pattern with entity-specific fields and extra views (e.g. Referrals gets a tree view; HUDs gets nested situations/screens).

---

## 6. Open Questions for the Client

These are unanswered by the PDF/docx and materially affect backend work (they do **not** block admin UI/UX, which is why we're proceeding in parallel):

1. **Backend & database**: Is there an existing backend/API we must integrate with, or are we building one? Preferred database (Postgres assumed reasonable)?
2. **Auth**: Preferred auth approach (custom, Supabase Auth, Clerk, Auth0, etc.)? How many admin role levels, and what can each do?
3. **Payments**: Which payment processor (Stripe assumed reasonable) — needed for Orders/Licenses module to be real.
4. **File storage**: Where do HUD images/videos live (S3, Cloudflare R2, Supabase Storage)? Matters for the Media module.
5. **Referral commission logic**: How exactly are referral earnings calculated? Flat fee, percentage, tiered?
6. **Data privacy**: What can admins see (emails, payment info, IPs)? Any compliance requirements (GDPR etc.)?
7. **"SIN" logo**: Client's notes mention "the logo is SIN" — need the actual asset when the storefront/branding work happens.

---

## 7. Git & Collaboration Workflow

- **Upstream**: `https://github.com/Yarosurawa/poker_huds` (client's repo) — added as git remote `upstream`.
- **Fork**: to be created (contractor doesn't have write access to the client's repo) — added as remote `origin` once created.
- **Branch model**:
  - `main` — mirrors upstream exactly; only updated by pulling from `upstream` or merging an approved `development → main` PR.
  - `development` — integration branch; all work lands here first.
  - `feature/*` — one branch per feature (e.g. `feature/admin-categories-crud`), PR'd into `development`.
  - Once a batch of features on `development` is stable and demoable, open a PR `development → main` (on the fork, for the client's review), following the Definition of Done below.
- **Definition of Done** (per feature/PR):
  - [ ] Code builds and type-checks (`nuxt typecheck` / `nuxt build`)
  - [ ] Manually verified (dev server + relevant page/API hit) — see DIARY for verification notes
  - [ ] Light and dark mode both checked for any new UI
  - [ ] File header comment + relative path present on new files
  - [ ] DIARY.md updated with the day's entry
  - [ ] PROJECTDOC.md updated if scope/architecture/roadmap changed
  - [ ] No secrets committed; `.env.example` updated if new env vars introduced
  - [ ] PR description explains what/why, links relevant PROJECTDOC section

---

## 8. Roadmap

| Phase | Scope | Target |
|---|---|---|
| **Phase 0 — Foundation** (this week) | Repo/git workflow, PROJECTDOC/DIARY, domain types, mock data layer, admin layout + theming, mock auth, dashboard shell, **Categories full CRUD** as reference module, placeholder pages for all other modules | Days 1–2 |
| **Phase 1 — Core CRUD** | Users CRUD, HUD Products CRUD (incl. situations/screens/pop-ups nested editing), Media upload UI | Days 3–5 |
| **Phase 2 — Referrals & Orders** | Referral tree view + monitoring/management, Orders/Licenses management, audit log | Week 2 |
| **Phase 3 — Analytics & Settings** | Dashboards/charts, system settings, email templates, feature toggles | Week 2–3 |
| **Phase 4 — Real backend cutover** | Swap mock data layer for real DB/auth/storage/payments once client answers open questions | Ongoing, as answers land |
| **Phase 5 — Storefront/user UI connection** | Connect admin-managed data to the client-facing storefront and user dashboard | After admin console sign-off |

---

## 9. Project Records

*(Append-only log of significant decisions/changes to this document. Narrative day-by-day detail lives in DIARY.md.)*

- **2026-09-03** — Initial version. Read client's PDF (via docx summary — no PDF text-extraction tooling available locally) and docx design docs. Established git workflow (upstream/main mirrored, `development` branch created). Began Phase 0 scaffolding.

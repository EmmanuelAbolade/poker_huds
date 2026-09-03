<!-- DIARY.md -->

# Project Diary — Poker HUD Store Admin Console

> Narrative log: origin story, day-by-day build history, architecture deep-dive, engineering decisions, and bugs found & fixed. For the structured spec/roadmap, see [`PROJECTDOC.md`](./PROJECTDOC.md).

---

## Origin

A new client (repo owner: `Yarosurawa`, project branded "Gamblin4Kids" in the storefront nav) reached out to build an **admin console** for a **Poker HUD Store** — a marketplace selling Poker HUD (Heads-Up Display) configuration packages, plus poker courses/software. The client handed over:

1. A zipped copy of his early-stage Nuxt repo (not yet forked/cloned — we received a raw zip).
2. A PDF design document (`doc/Personal Poker HUD Store Design Document.pdf`), described by the client verbally but "not so clear" on first read.
3. A more structured `.docx` write-up that quotes the PDF directly and expands it into a fuller spec — this turned out to be the more useful source for extracting concrete requirements.

The brief, in the client's words: an admin dashboard to **view, perform full CRUD, and manage everything manageable in the system**, with particular attention called out for **monitoring and managing referrals** (the client mentioned this to the dev directly, and the design doc backs it up: "if there are referrals or sub-referrals, it is desirable to see statistics, control what could be done online").

Timeline pressure: client wants to see visible progress within days.

---

## Day 1 — 2026-09-03

### What we found reading the source material
The client's repo (`https://github.com/Yarosurawa/poker_huds`, 4 commits) is a bare-bones Nuxt 4 storefront shell: a navbar, a home page with a mock product grid and category selector, two shared components (button, text input), and hand-written CSS variables for a **dark-only** theme. No backend, no auth, no database, no admin area exists yet.

Extracting the PDF's content directly wasn't possible in this environment — no `poppler-utils`/`pdftotext` available, so `pdftoppm`-based page rendering failed. The `.docx` (`Personal Poker HUD Store Design Document 2.docx`) was extractable by unzipping it (docx is a zip of XML) and stripping tags, and it explicitly quotes the original PDF's key lines while expanding them into full sections — so it served as a reliable proxy for the PDF's content. Full findings are written up in `PROJECTDOC.md` §1–4.

Headline takeaway: this is a **bigger system than "an admin dashboard"** — it's a full marketplace with nested multimedia products (HUD → situations → screens → pop-ups, ~15–30 images per HUD), licensing/expiration, and a two-level referral program. The admin console has to manage all of it. See `PROJECTDOC.md` §3.2 for the full module breakdown.

### Engineering decisions made today

**1. Mock-first backend, real UI now.**
The client's doc describes *what* the system does, not *how it's hosted* (no confirmed DB/auth/storage/payments — see `PROJECTDOC.md` §7 open questions). Rather than block on those answers, we're building every admin server route against a small typed in-memory mock store (`server/utils/mockDb.ts`) with generic CRUD helpers. Frontend and route handlers only ever touch typed entity shapes, never the storage mechanism directly — so swapping in a real database later is isolated to one file. This lets us show working, demoable CRUD screens today instead of waiting on backend decisions.

**2. `main` branch mirrors upstream exactly; all work happens on `development`.**
```
git init
git remote add upstream https://github.com/Yarosurawa/poker_huds.git
git fetch upstream
# main pointed at upstream/main directly (same 4-commit history) without
# disturbing the already-unzipped working tree — see "bugs" section below
# for the checkout conflict this hit and how it was resolved.
git checkout -b development
```
`origin` (the fork) isn't wired up yet — see the open question logged below for the user.

**3. Nuxt UI v4's `<UApp>` wrapper and Tailwind v4 CSS imports are required, but weren't present.**
The starter had `@nuxt/ui` installed but the CSS file never imported `tailwindcss`/`@nuxt/ui`, and `app.vue` never wrapped content in `<UApp>` (needed for Nuxt UI's toast/modal/tooltip providers and consistent color-mode behavior). Without these, Nuxt UI components would render unstyled. Fixed in the theming setup commit — see `app/assets/css/main.css` and `app/app.vue`.

**4. Admin console gets its own light/dark theme via Nuxt UI's color mode; the storefront's existing dark-only CSS variables are left untouched.**
The client's storefront theme is intentionally out of scope — we're not restyling pages we weren't asked to touch. The admin console uses Nuxt UI's `useColorMode()`/color-mode class approach, with a toggle in the admin topbar.

**5. Categories built first as the reference CRUD module.**
It's the simplest entity in the data model (no nesting, no file uploads). Every other CRUD module (Users, HUDs, Orders, Referrals) follows the same list/create/edit/delete pattern established here, so reviewing this one module tells you how the rest will look.

### Bugs / issues found & fixed

- **`git checkout -b main upstream/main` failed** with "untracked working tree files would be overwritten" — because the unzipped working tree already had files matching upstream, but `git init` starts with no history so git couldn't reconcile them via a normal checkout. Fixed by pointing `main` at `upstream/main` directly (`git update-ref` + `git symbolic-ref` + `git reset` — updates HEAD/index without touching the working tree) instead of checking out through the working tree. Verified `git status` showed a clean match (only our new, intentionally-untracked `doc/` folder appeared as untracked) before proceeding.
- **Two stray, unreferenced scratch files at repo root**: a file named `~` (a rougher draft of `app/pages/index.vue` — same category-selector layout, placeholder "hi"/"sup" cards) and a file named `1` (a near-duplicate of `app/components/global/GlobalTxtInput.vue`). Neither is imported anywhere in the app. These look like accidental artifacts of copy/paste or an editor mishap (e.g. typing `~` or `1` as a filename by mistake) rather than intentional files. Removed as a cleanup commit on `development` — the real, more polished versions (`index.vue`, `GlobalTxtInput.vue`) are what's actually wired up and kept.
- **No `.env.example` despite `.gitignore` referencing one** (`!.env.example` exception in `.gitignore`). Not fixed yet — deferred until Phase 4 (real backend cutover) when we know what env vars actually exist. Logged so it isn't forgotten.
- **`npm install` reported 48 vulnerabilities (incl. some high/critical)** in transitive dependencies of the starter template. Not addressed today — `npm audit fix --force` can introduce breaking major-version bumps and wasn't requested; flagging for a deliberate look rather than a blind fix.

### Phase 0 scaffold built today
Full list in `PROJECTDOC.md` §8. Highlights: Nuxt UI v4 + Tailwind 4 wired up correctly (this required fixes - the starter had `@nuxt/ui` installed but never imported its CSS layer, and never wrapped the app in `<UApp>`, so components would have rendered unstyled); a typed domain model for the whole system (`app/types/admin.ts`); a swappable mock data/auth layer; the admin shell (sidebar covering every module, light/dark toggle, mock login/logout); a working dashboard; and **Categories** built out as a complete, real CRUD module end-to-end.

**Verification performed** (no browser available in this environment, so verified via the running dev server + curl, plus typecheck/build):
- `nuxt typecheck` — caught two real generic-typing bugs in `server/utils/mockDb.ts`'s `updateItem()` helper (a `Partial<T>` merge that TS couldn't prove was safe); fixed by merging into a local variable and casting once, rather than reassigning through array indexing. Clean after the fix.
- `npm run build` — full production build succeeds.
- Auth flow: unauthed `GET /admin` → `302` to `/admin/login`; wrong password → `401`; correct login → session cookie set; `GET /admin` while authed → `200`; logout clears the session.
- Categories CRUD: full create → update → delete → list lifecycle round-tripped correctly against the live API; all placeholder module pages and the storefront home page still return `200`.
- Icon sets (`material-symbols`, `lucide`) were resolving over the network in dev with a warning about production builds — installed both as local `@iconify-json/*` devDependencies so builds don't depend on runtime API access.
- What's **not** verified: actual pixel-level rendering / interaction in a real browser (the UTable cell renderers, modal open/close, toast placement, and light/dark visual correctness haven't been eyeballed). Flagging this explicitly rather than claiming full UI verification - worth a real browser pass before calling Phase 0 "done" for client review.

### Open item for the client/dev before we can push anywhere
We don't yet have a fork of `Yarosurawa/poker_huds` to push to, and the local `gh` CLI isn't authenticated. Everything above exists only in the local git repo for now. Once we're pointed at a fork (or given push access), `development` gets pushed and feature PRs start flowing per the workflow in `PROJECTDOC.md` §7.

---

### Phase 0 shipped: fork, push, PR
`gh auth login` (browser flow) got us a token with `repo` scope. From there: `gh repo fork Yarosurawa/poker_huds --remote=false` created `EmmanuelAbolade/poker_huds`, wired up as `origin`; pushed `main` and `development`; opened PR #1 (`development → main`) with the full Phase 0 summary and test plan. That PR is the visible "work has started" artifact for the client.

### Phase 1 — Users and HUD Products CRUD
Built the same day, on `feature/phase1-users-huds-crud` off `development` (same branch discipline as Phase 0: feature branch → squash of logical commits → merge into `development`).

**Users (Customers)**: straight copy of the Categories pattern (`server/api/admin/users/*`, `pages/admin/users/index.vue`) plus two things Categories didn't need: duplicate-email rejection on create (409), and a dedicated Ban/Unban button next to Edit/Delete, since that's explicitly one of the client's called-out admin actions. Password reset is *not* implemented — there's no real auth system yet to reset a password against (see open question in `PROJECTDOC.md` §7 Q2), so the page just says so rather than faking it.

**HUD Products**: this is the one with real design decisions, because a HUD isn't flat — it's HUD → situations → screens → pop-up images, 3 levels deep. Split into two pages rather than cramming it into one modal:
- `pages/admin/huds/index.vue` — list + a create modal for the flat fields (title/description/price/category) + publish/unpublish toggle + delete. This is "CRUD on the HUD record."
- `pages/admin/huds/[id].vue` — a dedicated detail page for the nested tree. All the add/remove-situation/screen/popup logic happens against a local reactive clone of the fetched HUD; one "Save" button PATCHes the whole `situations` array back in one request.

**Decision: one PATCH for the whole nested tree, not a REST endpoint per nesting level.** The "correct" REST shape would be something like `POST /huds/:id/situations`, `POST /huds/:id/situations/:sid/screens`, `POST .../screens/:scid/popups` — three more route files times create/update/delete each, against a mock store that's getting replaced anyway once a real database is chosen. That's a lot of throwaway surface area for no real benefit right now. Editing the tree as one document and saving it as one PATCH is simpler, still gives the client full CRUD over every level (add/edit/remove situations, screens, and pop-ups all work), and if/when this becomes a real database, that PATCH handler is exactly the place a real implementation would diff the old/new tree and issue the right inserts/updates/deletes — so nothing here is a dead end, it's just deferred.

**Image fields are plain URL text inputs, not an upload widget.** No file storage provider is confirmed yet (`PROJECTDOC.md` §7 Q4 — S3 vs R2 vs Supabase Storage). Rather than build an upload UI against nothing, or guess a provider, the nested editor lets you type/paste an image URL for every screen and pop-up — so the data model and the editing workflow are both real and testable today, and swapping in an actual uploader later only touches the input component, not the underlying tree logic.

### Verification (Phase 1)
Same approach as Phase 0 — no browser in this environment, so verified via `nuxt typecheck` (clean), `npm run build` (succeeds), and curl against the live dev server: Users create/duplicate-reject/ban/delete all round-tripped; HUD create (with a missing-category 400 check)/get/PATCH-with-full-nested-tree/delete-then-404 all round-tripped, and both the HUD list and HUD detail pages render (200) server-side with real data. Visual/interaction verification in an actual browser is still outstanding — flagged again here since it applies to this batch of UI too.

---

## Architecture Deep-Dive (living section — updated as the system grows)

See `PROJECTDOC.md` §5 for the structured version. The short version: Nuxt server routes under `server/api/admin/**` are the only thing that talks to data (mock today, real DB later); Nuxt UI v4 components (tables, modals, forms) drive every CRUD screen; one shared `app/layouts/admin.vue` shell hosts every admin page behind a mock-session gate. Nothing about the storefront (`app/pages/index.vue`, `Navbar.vue`, etc.) is touched by this work.

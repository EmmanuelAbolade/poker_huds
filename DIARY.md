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

### Phase 2 — Orders/Licenses and Referrals
Same day, same branch discipline (`feature/phase2-orders-referrals` off `development`).

**Orders/Licenses.** Orders and licenses are separate entities on purpose (`Order` = the purchase record, `License` = the access grant it produces) even though today they're created together 1:1 by `POST /api/admin/orders`. The split matters once a real payment provider exists: a refund is an *order* state change, while extending or revoking access is a *license* state change, and they don't always move together (e.g. extending a license as a goodwill gesture doesn't touch the order at all). Modeled `PATCH /api/admin/orders/:id` as accepting only `{ status: 'refunded' }` for now rather than a general-purpose order editor - there's nothing else on an order that should be admin-editable yet (amount/user/HUD are facts about what happened, not things to "fix" from the UI), and refunding cascades to revoking the associated license automatically, since leaving access active after a refund would be a real bug, not an edge case to defer. Deliberately did **not** add order deletion - financial records should stay auditable; refund is the correct "undo."

**Referrals.** The client's ask here was specific: "monitor referrals and manage them if he needs to." The data model already had two levels baked in from Phase 0 (`level: 1 | 2` on `Referral`, both attributed to `referrerUserId` so a level-2 row credits the *original* top-of-chain referrer, not whoever directly referred them - matches how the client's doc describes sub-referral stats rolling up). Built two views on one page rather than picking one: a tree summary (grouped by referrer, direct vs. sub-referrals, total earnings, flagged count per referrer) for at-a-glance monitoring, and a flat records table for the actual per-referral actions (adjust earnings, flag/unflag as suspected abuse, delete a bad entry). Added a client-side CSV export (`Blob` + object URL, no server route needed) since "export referral data" was explicitly in the spec and is nearly free to add once the data's already loaded.

### Verification (Phase 2)
Same discipline as before: `nuxt typecheck` clean, `npm run build` succeeds. Curl-verified against the live dev server: manual order + license creation, license extension, refund correctly cascading to license revocation, a second refund attempt correctly 409ing; and for referrals, self-referral creation correctly rejected (400), create/flag/adjust-earnings/delete all round-tripped, and the tree-grouping logic produced the right per-referrer totals from the seeded level-1/level-2 data. Still outstanding: an actual browser pass (visual/light-dark/interaction) across all of Phase 1 and 2's UI - flagging again rather than letting it go unmentioned.

### Phase 3 — Analytics, Settings, Audit Log
Same day, `feature/phase3-analytics-settings-audit` off `development`.

**Analytics.** The client's doc asks for "sales, popular HUDs, referral performance, user activity, graphs and charts." Loaded the project's `dataviz` skill before writing any chart code, per its own trigger rule. Its core non-negotiables shaped the approach: one axis (never dual-axis), sequential magnitude data gets one hue not a rainbow, status pairs reuse whatever color already means that status elsewhere in the app rather than inventing new ones, and every value needs to be readable as text, not just inferred from bar length. Given four small, single-series magnitude comparisons (revenue/day, orders/HUD, earnings/referrer) and one two-category status split (active/banned users), building a small reusable `AdminBarChart.vue` in plain HTML/CSS - no charting library dependency - was enough to satisfy all of that: one hue via Nuxt UI's own `--ui-primary` theme token (so it's light/dark-correct for free, since that token already flips with the color-mode class), direct text labels next to every bar, native `title` attributes as the hover layer. The active/banned split reuses the exact same `--ui-success`/`--ui-error` mapping already used for status badges on the Users page, per the "status colors are reserved, don't reinvent them" rule. Didn't run the palette validator script - it's for justifying a *new* categorical palette, and nothing here introduces one; every color is an existing, already-themed token being reused for the same meaning it already has elsewhere in the app.

**Settings.** Modeled as one form with one Save button (`PATCH` bulk-upserts a flat key→value map), unlike every other module which is row-level CRUD on distinct records - a settings page isn't a list of things, it's configuration, so a table/modal pattern would've been the wrong shape. Payment and Storage are visibly labeled "Not wired up" rather than silently accepting input that does nothing - given neither provider is confirmed yet (open questions in `PROJECTDOC.md` §6), a settings field that looks live but isn't would be actively misleading to whoever uses this console next.

**Audit Log.** This one was nearly free: every mutation route since Phase 0 has been calling `recordAuditLog()` into `mockDb.auditLog`, but nothing ever read it back. Added a read-only list page and a `GET` route - maybe 20 minutes of work - and it closes the "logs and audit trails" line from the client's System Management requirements. Worth calling out as a reminder to periodically check "what have we already built that we just haven't exposed yet" rather than always reaching for new work.

### Verification (Phase 3)
`nuxt typecheck` clean, `npm run build` succeeds. Curl-verified: analytics aggregates matched hand-checked expected values against the seed data; settings round-tripped (save → re-fetch confirmed persisted); audit log correctly came back empty right after a dev-server restart (expected - the mock store is an in-memory singleton, see the "no real database yet" decision from Day 1) and then correctly captured a fresh mutation once one was made in the current server lifetime. All built + placeholder pages, including the new Audit Log route, return 200. Still outstanding, same as every prior phase: an actual browser pass.

### Phase 4 (started) — the real database
Prompted by a conversation with the client: the dev had already told him plainly that the repo was UI-only (no backend, no DB, no auth, no CRUD) and laid out a plan - schema first, then API endpoints, then the admin dashboard (already ahead of schedule from Phases 0-3), then integration. Client said okay. That's a green light to build the *real* schema now, not just typed mock entities.

**Version pin decision.** `npm install prisma` currently resolves `latest` to `8.0.0-rc.12` - an actual release candidate tagged as npm's `latest`, not a stable release. Ran `prisma init` against it anyway to see what it did: it scaffolded a new-style `prisma7.config.ts`, changed where `prisma init` even puts things, and - unprompted - installed `.claude/skills/`, `.windsurf/skills/`, `.agents/skills/` folders plus a `skills-lock.json` into the repo root (Prisma's own "AI agent skills" auto-installer). None of that belongs in a client's repository: an RC is inherently less predictable, and injecting unrelated AI-tooling config files into someone else's project is not something to do without asking, regardless of how convenient the installer makes it. Deleted all of it and pinned to **6.19.3**, the last release on the well-documented, stable 6.x line, before doing anything else.

**Schema design.** Wrote `prisma/schema.prisma` straight from `app/types/admin.ts`, entity for entity, with one deliberate upgrade: the mock layer's `Hud.situations: Situation[]` (with `Screen[]` and `PopupImage[]` nested inside as plain arrays) becomes three real relational tables - `Situation`, `Screen`, `PopupImage` - each with a proper foreign key and `onDelete: Cascade` back to its parent. That's what "a real database schema" actually means for a 3-level-deep nested product structure; a JSON blob would have been a shortcut that undersells what was promised.

**SQLite now, Postgres later - not a compromise, a sequencing choice.** No cloud database was ever specified (open question since Day 1), and waiting on that answer would have stalled real backend work indefinitely. SQLite needs no account, no network, no credentials - `npx prisma migrate dev` just works. Every column type and relation used here is equally valid under Postgres, so moving to production later is a provider string change, not a schema rewrite. This is the same "don't block UI/UX on backend answers" philosophy from Day 1, now applied one layer down: don't block *schema* work on a hosting answer either.

**Migrating routes one module at a time, starting with Categories again.** Converting all ~25 mock-backed routes to Prisma in one shot was tempting but risky under time pressure - large diffs are exactly where mistakes hide. Instead, cut over Categories first (again - same reason as Phase 0: simplest entity, no nesting, proves the pattern) and left every other module on `mockDb` for now. `server/utils/prisma.ts` is a global-cached `PrismaClient` singleton (mirrors `mockDb.ts`'s role, same auto-import convention) so the remaining migrations are mechanical: swap `mockDb.x` calls for `prisma.x` calls, handle Prisma's error codes (`P2025` not found, `P2002` unique constraint, `P2003` foreign key) instead of the mock helpers' `null`/`boolean` returns.

**Side effect worth calling out**: real foreign keys now do something the mock version could only leave a comment about. `server/api/admin/categories/[id].delete.ts` used to say "a production version would block deleting a category still referenced by a HUD" - it now actually does, because SQLite enforces the constraint and Prisma surfaces it as error code `P2003`. Verified this live: deleting `cat_1` (referenced by the seeded `hud_1`) correctly 409s.

**Audit log now has two sources, temporarily.** Categories' mutations write to the real `AuditLogEntry` table (`recordAuditLogDb()` in `server/utils/prisma.ts`); everything still on the mock layer writes to `mockDb.auditLog` (`recordAuditLog()`, unchanged). `server/api/admin/audit-log/index.get.ts` merges both, sorted together, so the Audit Log page doesn't silently lose entries mid-migration. This goes away naturally once every route is cut over - not something to "clean up" separately.

**Known, documented limitation**: HUD's create/update routes still validate `categoryId` against `mockDb.categories`. Because both the mock seed and the Prisma seed use the same category IDs (`cat_1`...`cat_8`), this coincidentally still works - but it's fragile: a category created or deleted through the now-real Categories UI won't be reflected there until HUD's routes are migrated too. Recorded in `PROJECTDOC.md` §5.6 rather than left as a silent trap.

### Verification (Phase 4)
`nuxt typecheck` clean, `npm run build` succeeds. `npx prisma migrate dev --name init` applied cleanly and created all 12 tables. Seed script hit a real bug on first run - `Promise.all([...])` creating the three seeded customers concurrently, where Cara's row references Bob's id as `referredById` before Bob's insert had necessarily committed - Prisma correctly threw a foreign-key violation (`P2003`) rather than silently succeeding with bad data. Fixed by making the referral chain's inserts sequential (categories, which have no cross-references, stayed parallel). A one-off Node script (not committed - scratch verification only) then confirmed every relation resolves correctly: the 3-level HUD→situation→screen→popup tree, and the Alice→Bob→Cara referral chain. Categories' full CRUD (create/duplicate-409/update/delete/delete-again-404) round-tripped against the live dev server exactly as it did on the mock layer, plus the new FK-protection 409 that wasn't possible before. Still outstanding, unchanged from every prior phase: an actual browser pass.

### Phase 4b — finishing the migration
Same day, continued straight on from the Categories proof-of-concept: migrated Users, HUD Products, Orders/Licenses, Referrals, Settings, and admin auth to Prisma, then deleted `mockDb.ts` outright once nothing referenced it anymore.

**Mechanical, but not mindless.** Each module followed the exact pattern Categories established (swap `mockDb.x` calls for `prisma.x` calls, translate the mock helpers' `null`/`boolean` returns into Prisma's error codes - `P2025` not found, `P2002` unique constraint, `P2003` foreign key), but each one also picked up something the mock layer couldn't give it for free:
- **Users**: deleting a customer with orders/licenses/referrals on record now correctly 409s (P2003) instead of silently orphaning that history.
- **HUD Products**: the nested editor's "save the whole tree" became a `prisma.$transaction` that deletes every situation under the HUD (cascading to screens/popups) and recreates them fresh from the payload - simpler than diffing old vs. new, and safe specifically because the cascade means nothing can be orphaned mid-replace. Verified this doesn't just look right on one save - re-saved a HUD with a *different* tree and confirmed the old one was fully gone, not merged with the new one.
- **Orders/Licenses**: order+license creation and the refund-cascade both run inside transactions now, so a crash mid-write can't leave a paid order with no license, or a refunded order with a still-active license.
- **Settings**: the bulk key-value save became a single `prisma.$transaction` of upserts.
- **Auth**: `login`/`session` now look up the real `AdminUser` table - the password check is still a hardcoded mock constant (no credential system exists), but the user lookup itself is real, which matters because it means the audit log's `actorName` resolution is now correct against the same table everything else joins against.

**The rename that mattered more than it looked.** `recordAuditLogDb()` (named that way specifically so it couldn't collide with `mockDb.ts`'s identically-named `recordAuditLog()` while both existed side by side during the migration) got renamed back to plain `recordAuditLog()` once `mockDb.ts` was deleted - Nitro auto-imports everything in `server/utils/**` by export name, so keeping the "Db" suffix around after the collision it was avoiding no longer existed would've just been unexplained naming debt.

**A real crash, caught by verification, not by luck.** Deleting `mockDb.ts` with a direct `rm` while the dev server's file watcher was mid-rebuild left Nitro trying to reload a route that referenced a file that had just vanished - the dev server actually died. `ps aux` confirmed no node process was running when a follow-up curl returned a 500. Cleared the `.nuxt` cache and restarted clean rather than trying to debug stale HMR state, then re-ran the *entire* verification pass end-to-end against the fresh process - not just the newly-migrated routes, everything: login, session, stats, analytics, audit log, and all ten admin pages. This is exactly why "the dev server didn't crash when I saved the file" isn't the same as "the app works" - always worth a full clean-restart verification before calling a migration done, not just trusting whatever state HMR left things in.

**Audit log now proves the database persists.** Because the mock store reset on every server restart, the audit log page could never show more than "since the last restart." After this migration, restarting the dev server and re-fetching `/api/admin/audit-log` returned every mutation from the entire session's testing, unchanged - the first concrete, visible proof (not just an architectural claim) that the real database actually persists.

### Verification (Phase 4b)
`nuxt typecheck` clean, `npm run build` succeeds. Full end-to-end curl pass against a freshly restarted dev server (`.nuxt` cache cleared, confirming nothing was masked by stale HMR state): auth flow (login/session/logout), Users (create/duplicate-409/FK-blocked-delete), HUD Products (create/get/nested-tree-PATCH/re-PATCH-replaces-not-merges/FK-blocked-delete/cascade-delete), Orders/Licenses (manual creation/extend/refund-cascade/double-refund-409), Referrals (self-referral-400/create/flag/earnings/delete), Settings (save/reload), stats, analytics, and all ten admin pages plus the storefront home - all verified against the real database, all passing. Still outstanding, unchanged from every prior phase: an actual browser pass.

---

## Architecture Deep-Dive (living section — updated as the system grows)

See `PROJECTDOC.md` §5 for the structured version. The short version: Nuxt server routes under `server/api/admin/**` are the only thing that talks to data, and as of Phase 4b that's the real database (Prisma + SQLite, `server/utils/prisma.ts`) end to end - the mock layer that made this buildable before any backend decisions landed has been fully migrated off and deleted; Nuxt UI v4 components (tables, modals, forms) drive every CRUD screen; one shared `app/layouts/admin.vue` shell hosts every admin page behind a session gate (real `AdminUser` lookup, still a mock password check). Nothing about the storefront (`app/pages/index.vue`, `Navbar.vue`, etc.) is touched by this work.

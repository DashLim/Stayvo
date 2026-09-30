# Stayvo Check-in ↔ Stayvo Core design parity

This document defines how **Stayvo Check-in** host/admin UI should match **Stayvo Core**’s design language while remaining a separate application with Check-in-specific features and **`#E0A24D`** as the primary accent.

**Status:** Specification only — not fully implemented. Do not treat Phase 3 or the current uncommitted UI pass as authoritative.

---

## 1. Core source reference (read-only)

| Resource | Path |
|----------|------|
| Design tokens (CSS) | `casa-de-coral/src/index.css` (mirrored in `casa-de-coral-backend/src/index.css`) |
| Tailwind config | `casa-de-coral/tailwind.config.ts` |
| UI primitives | `casa-de-coral/src/components/ui/*` (Button, Input, Textarea, Label, Card, Dialog, Select, …) |
| `cn()` helper | `casa-de-coral/src/lib/utils.ts` |
| Admin shell | `casa-de-coral/src/pages/admin/AdminDashboard.tsx` |
| CMS / editor | `casa-de-coral/src/components/admin/WebsiteContentEditor.tsx` |
| Auth panel | `casa-de-coral/src/pages/admin/Login.tsx` |
| Icons | `lucide-react` |

Core product name: `STAYVO_CORE_PRODUCT_NAME` in `casa-de-coral-backend/src/config/platform.ts`. Admin SPA: `casa-de-coral-backend/admin/`.

**Do not** copy Firebase, Firestore, CMS business logic, or Core API code into Check-in.

---

## 2. Shared design tokens

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| HSL CSS variables in `:root` / `.dark` consumed by Tailwind (`background`, `foreground`, `card`, `muted`, `border`, `input`, `ring`, `primary`, …) | Adopt the **same variable names and HSL structure** in Check-in host scope (see §17 for primary override). Guest portal may keep legacy hex aliases where needed. |
| `--radius: 0.25rem` → `rounded-md` / `rounded-lg` | Match Core radius scale on **host/admin**; avoid `rounded-2xl` / `rounded-full` for standard controls. |
| Core platform primary `#A0754B` (`--primary: 30 36% 46%`) | **Override** `--primary` and `--ring` to Check-in amber **`#E0A24D`** (HSL equivalent) for Check-in host UI only. |
| `secondary`, `muted`, `accent`, `destructive`, `sidebar-*` | Port semantic set; tune muted backgrounds for Check-in if guest marketing cream remains separate. |

---

## 3. Typography

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| `--font-sans: Karla` — body, labels, nav, compact CMS fields (`text-xs` / `text-sm`) | Load **Karla** on Check-in **host/admin** routes (`app/dashboard/*`, `app/properties/*`, auth host pages). |
| `--font-serif: Cormorant` — page titles, editorial headings (`font-serif`, light weight) | Use **Cormorant** for major host headings (dashboard titles, editor section titles, auth hero titles). |
| Uppercase kickers: `text-xs uppercase tracking-wider text-muted-foreground` (Login labels) | Match for host form labels where Core uses uppercase kickers; otherwise `Label` = `text-sm font-medium`. |
| Guest marketing site typography (Casa public pages) | **Not** required on Check-in **guest portal** — guest UI keeps readable sans-first stack unless brand asks otherwise. |

Check-in today: **Inter** only (`app/layout.tsx`) — change host scope in a future pass, not guest `/stay/*` by default.

---

## 4. Radius

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| Buttons/inputs: `rounded-md` (shadcn default) | Host controls: **`rounded-md`** default; primary CTAs may use **`rounded-lg`** (CMS save buttons). |
| Cards: `rounded-lg`; panels: `rounded-xl` | Host cards **`rounded-lg`**; large editor panels **`rounded-xl`** max — not `rounded-[20px]` / not pills. |
| Nav items: `rounded-lg` | Sidebar and mobile drawer nav: **`rounded-lg`**. |

**Avoid:** `stayvo-input--pill`, `rounded-full` primary buttons on host admin (Check-in legacy).

---

## 5. Spacing

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| Main canvas: `p-4 sm:p-6 lg:p-8`, `space-y-6`, `max-w-6xl mx-auto` | Host main content: same padding ladder; property editor canvas **`max-w-6xl`** (Core) vs current ~1180px — align to **`max-w-6xl`**. |
| Card internal: `p-6` (CardHeader/Content) | Section panels: **`p-6`** desktop, **`p-4`** mobile. |
| Field stacks: `space-y-5` / `space-y-6` in forms | **`space-y-1.5`** label-to-control; **`gap-4`** grid fields. |
| Sidebar: `p-4`, nav `px-3 py-2` | Match Core sidebar density. |

---

## 6. Shadows

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| Cards: `shadow-sm` | Host cards: **`shadow-sm`** only. |
| CMS actions: `shadow-xs` | Primary/secondary admin buttons: **`shadow-xs`** optional. |
| Modals: `shadow-lg` on Dialog content | Host modals: **`shadow-lg`**, no glass blur. |

**Avoid:** Large custom multi-layer shadows, inset input shadows (not in Core CMS fields).

---

## 7. Surfaces

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| App shell: `min-h-screen bg-muted/20` | Host dashboard shell: **neutral** (`bg-muted/20` or white) — **not** cream gradient on admin chrome. |
| Header: `sticky border-b bg-card/95 backdrop-blur-md` (opaque, not glass) | Host sticky headers: **Core header pattern** — border + card background, minimal blur. |
| Cards: opaque `bg-card`, `border-border` | **No** `.glass` on host shell, profile, manage, property editor workspace. |
| Sidebar: `bg-card/60`, `border-r` | Desktop host nav: **`w-64`**, bordered, opaque. |

**Guest portal:** May retain warm surfaces (`--guest-surface-*`, soft marketing feel) — see §18.

---

## 8. Buttons

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| shadcn `Button`: `h-10`, variants `default` / `outline` / `ghost`, `rounded-md` | Introduce equivalent host components (copy/adapt shadcn or mirror classes). |
| CMS primary: `rounded-lg bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90` | Same structure; **`bg-primary`** resolves to **`#E0A24D`**, text **white** on Check-in (Core uses white on brown). |
| Icon actions: `rounded-md p-1.5` / `size="icon"` h-10 w-10 | Replace Check-in **`rounded-full`** icon chips on host UI. |
| Destructive / muted header actions | Match Core `hover:bg-destructive/10`, `bg-muted` logout pattern. |

---

## 9. Inputs

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| shadcn `Input`: `h-10 rounded-md border-input bg-background`, `md:text-sm`, ring on focus | Host inputs: **same**; full width in forms. |
| CMS inline: `rounded border border-input bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-ring` | Property editor fields: **compact `text-xs`/`text-sm`**, **`rounded`** (md), thin ring — not pill, not `rounded-xl`. |
| Textarea: `min-h-[80px] rounded-md` | Match shadcn Textarea defaults on host forms. |

---

## 10. Cards

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| `Card`: `rounded-lg border bg-card shadow-sm` | Host list cards, profile sections, empty states. |
| CMS gate panels: `rounded-xl border border-border bg-card p-8 shadow-xs` | Editor empty states / confirmation panels. |
| **Not** glass, **not** `bg-white/40 backdrop-blur` strips | Remove translucent field strips from property editor. |

---

## 11. Labels

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| shadcn `Label`: `text-sm font-medium leading-none` | Default host field labels. |
| Login/admin: `text-xs font-medium uppercase tracking-wider text-muted-foreground` | Use for auth and dense settings blocks. |
| Helper text: `text-sm text-muted-foreground` / CMS `text-xs` | **`stayvo-hint` equivalent:** `text-xs text-muted-foreground`. |

---

## 12. Icons

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| **Lucide** (`lucide-react`) sized `h-4 w-4` nav, `h-3 w-3` inline | Add **`lucide-react`** to Check-in for **host/admin** UI; replace inline SVGs incrementally. |
| Icon + label nav rows | Match Core sidebar `gap-2.5`, icon `shrink-0`. |

Guest portal icons may stay emoji/simple SVG until a separate pass.

---

## 13. Navigation

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| Desktop: **left sidebar** `w-64`, grouped sections (`text-[10px] uppercase` group labels) | Check-in host: **desktop sidebar** with groups (Dashboard, Manage, Track, Profile) — evolve from current narrow sidebar + bottom nav. |
| Active item: `bg-primary text-primary-foreground rounded-lg` | Same; primary = Check-in amber. |
| Mobile: drawer + top header menu toggle | Keep Check-in mobile bottom nav **or** align to Core drawer — product decision; spec prefers **Core drawer for editor**, bottom nav acceptable for quick tabs. |
| Core: no floating crystal glass nav | **Remove `glass-nav-crystal`** from host admin when parity lands (or restyle to opaque bar). |

---

## 14. Page headers

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| Top bar: brand + context + user actions (AdminDashboard header) | Dashboard: title + actions; property editor: back + title + save in **same bar style** as Core (not separate glass strip). |
| Section titles in main: `font-serif text-2xl` for gates | Editor module title: **Cormorant** + sans subtitle. |

---

## 15. Modals

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| shadcn `Dialog`: overlay `bg-black/80`, content `max-w-lg`, `sm:rounded-lg`, `p-6`, `shadow-lg` | Reorder-sections and confirm dialogs: **Dialog pattern**, not `.glass` panel. |
| Sheet/drawer for mobile sidebar | Optional Sheet for mobile nav (Core uses custom drawer). |

---

## 16. Responsive behavior

| Core reference | Check-in implementation target |
|----------------|------------------------------|
| `lg:` sidebar visible; below `lg` drawer | Property editor: **sidebar modules collapse to drawer** on small screens. |
| Padding scale `p-4` → `p-6` → `p-8` | Same breakpoints as Core. |
| `container` / `max-w-6xl` content | Host pages respect max width; guest portal remains full-bleed mobile-first. |

---

## 17. Check-in-specific theme overrides

| Token / rule | Value |
|--------------|--------|
| `--brand` / `--primary` / `--ring` | **`#E0A24D`** (Check-in amber) — do **not** ship `#A0754B` on Check-in host UI |
| `--primary-foreground` | **White** (`#ffffff`) for filled primary buttons (Check-in convention; verify contrast) |
| Product name / metadata | “Stayvo Check-in” (unchanged) |
| Auth | Supabase (not Firebase login UI copy) |
| Feature copy | Guest links, iCal, 15 custom blocks, etc. |

Implement overrides via a **host-scoped** CSS layer (e.g. `.stayvo-host` on dashboard/properties layouts) so guest routes do not inherit Core admin background if undesired.

---

## 18. Host/admin vs guest design boundary

| Surface | Design system |
|---------|----------------|
| `/dashboard/*`, `/properties/*`, host login/signup | **Core parity** (Karla, Cormorant, shadcn-like controls, neutral shell, `#E0A24D`) |
| `/stay/*`, `/[hostSlug]/*` guest portal | **Check-in guest experience** — warm palette OK, existing guest components; no forced Cormorant unless brand wants |
| Marketing `/` on stayvo.io hosts | Existing marketing page — align copy/brand only in later pass |
| Legal `/terms`, `/privacy` | Readable; minor token alignment optional |

---

## 19. Property editor — target architecture (spec only)

### Problem

Check-in today: **accordion sections** + sticky glass header + two-column hero column.  
Core CMS: **sidebar module navigation** + **main content canvas** + bordered panels.

Polishing the accordion without IA change will **not** achieve Core parity.

### Target information architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Sticky top bar (Core-style): Back · Title · Save · Actions  │
├──────────────┬──────────────────────────────────────────────┤
│ Module nav   │ Main workspace (max-w-6xl, space-y-6)        │
│ (desktop     │                                              │
│  w-64 or     │  [Active module panel: bordered card]        │
│  narrow)     │   fields, lists, media, iCal embed, etc.     │
│              │                                              │
│ · Hero       │                                              │
│ · Details    │                                              │
│ · Check-in   │                                              │
│ · Rules      │                                              │
│ · FAQ        │                                              │
│ · Custom     │                                              │
│ · Host       │                                              │
│ · Calendar   │                                              │
│ · Danger     │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Module list (Check-in-specific, maps from current sections)

| Module key | Current equivalent | Notes |
|------------|-------------------|--------|
| `hero` | Hero image section | Media upload; preview thumbnail in nav optional |
| `details` | Property details | Status, location, address, Wi‑Fi |
| `checkin` | Check-in steps | Repeatable steps + media |
| `rules` | House rules | |
| `faq` | FAQ | |
| `custom` | Custom blocks | Cap 15 |
| `host` | Host contact | |
| `social` | Social links (if grouped today) | |
| `ical` | OTA calendar sync | Edit mode only |
| `order` | Reorder sections | Replaces modal-only UX — can be nav item |
| `danger` | Delete property | Destructive styling |

Create flow: same modules minus `ical` / `danger` until property exists.

### Navigation behavior

- **Desktop:** Persistent left module list (Core sidebar pattern); clicking module **scrolls or swaps** workspace panel (prefer **single active panel** like Core CMS tabs, not all accordions open).
- **Mobile:** Top bar + **module picker** (Sheet or select) + full-width canvas; Save stays in top bar.
- **Save:** Primary action in header (`Save` / `Create`); optional sticky footer secondary on mobile only.

### Hero / media

- Core does not use a sticky hero column; Check-in may keep **hero as first module** with large preview inside canvas, not a separate 40% rail — simplifies responsive parity.
- Alternative (phase 2): split view only on `xl` with hero preview in canvas left column inside **one** card.

### Field styling inside workspace

- One **`rounded-xl border bg-card p-6 shadow-xs`** panel per module (Core CMS panel).
- Fields: Core CMS compact inputs (`text-xs`/`text-sm`, `rounded`, `border-input`).

### Reorder sections

- Move from glass modal to **Dialog** (Core) or dedicated **Order** module with drag list.

### Responsive

- `< lg`: hide sidebar → hamburger opens **Sheet** with module list (Core mobile drawer).
- Preserve safe-area padding for iOS host PWA.

### Implementation note

Reuse existing form state and actions in `PropertyForm.tsx`; **restructure JSX** into layout components (`PropertyEditorShell`, `PropertyEditorNav`, `PropertyEditorPanel`) — no business logic merge with Core.

---

## 20. Implementation approach (future, not started)

1. Add host-scoped tokens + fonts (Karla, Cormorant) without changing guest layout root.
2. Copy/adapt minimal shadcn ui primitives + `cn()` (local to Check-in, no monorepo yet).
3. Refactor dashboard shell (sidebar, header) to Core layout.
4. Rebuild property editor IA per §19.
5. Migrate profile/manage/track to Card + Input/Button parity.
6. Deprecate `.glass` / pill classes on host routes.

---

## 21. Relation to Phase 3 and uncommitted work

Phase 3 added semantic tokens and `lib/stayvo-ui-classes.ts` but **did not** import Core sources. The uncommitted 10-file pass moved toward opaque cards but **still diverges** on radius, typography, icons, layout IA, and shadcn component model. See project report for **KEEP / MODIFY / REVERT** per file.

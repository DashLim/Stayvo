/**
 * Shared Tailwind class recipes for Stayvo Check-in.
 * Host/admin recipes follow Stayvo Core geometry and semantics (see docs/check-in-core-design-parity.md).
 * Guest-portal-specific recipes are kept separate where the warm marketing feel differs.
 */

/** Host/admin opaque panel (Core card pattern) */
export const stayvoHostCardClass =
  'rounded-lg border border-border bg-card text-card-foreground shadow-sm';

/** @deprecated Prefer stayvoHostCardClass; kept as alias for incremental migration */
export const stayvoCardClass = stayvoHostCardClass;

/** Host surfaces use opaque cards — not glass */
export const stayvoCardGlassClass = stayvoHostCardClass;

export const stayvoFormSectionClass = 'stayvo-form-section';

export const stayvoFormSectionElevatedClass = 'stayvo-form-section stayvo-form-section--elevated';

/** Core-compatible control height and radius (h-10, rounded-md) */
export const stayvoInputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark]';

/** Pill inputs removed from host direction — same as standard input */
export const stayvoInputPillClass = stayvoInputClass;

export const stayvoTextareaClass =
  'flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const stayvoLabelClass = 'text-sm font-medium leading-none text-foreground';

export const stayvoBtnPrimaryClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

export const stayvoBtnSecondaryClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

export const stayvoBtnGhostClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export const stayvoBtnIconClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/** Major host headings — Cormorant editorial */
export const stayvoPageTitleClass =
  'font-serif text-2xl font-light tracking-tight text-foreground md:text-3xl';

export const stayvoSectionTitleClass =
  'font-serif text-xl font-light tracking-tight text-foreground md:text-2xl';

export const stayvoMutedTextClass = 'text-sm text-muted-foreground';

export const stayvoKickerClass =
  'text-xs font-medium uppercase tracking-wider text-muted-foreground';

/** Guest portal card — warm rounded marketing surface */
export const stayvoGuestCardClass = 'stayvo-guest-card';

export const stayvoAuthPanelClass = 'stayvo-auth-panel';

/** Core-like host chrome */
export const stayvoHostHeaderClass =
  'sticky top-0 z-30 border-b border-border bg-card';

/** Sidebar / dashboard location list item */
export const stayvoHostNavItemClass =
  'flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

export const stayvoHostNavItemActiveClass =
  'flex w-full flex-col items-start rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary';

/** Compact admin actions (property cards, tables) */
export const stayvoBtnCompactPrimaryClass =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50';

export const stayvoBtnCompactSecondaryClass =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50';

export const stayvoHostPanelClass =
  'rounded-lg border border-border bg-card p-4 shadow-sm';

/** Full-width mobile host tab bar (fixed above safe area). */
export const stayvoHostBottomNavShellClass =
  'border-t border-border bg-card shadow-[0_-1px_3px_rgba(0,0,0,0.06)]';

export const stayvoHostBottomNavGridClass =
  'mx-auto grid h-[3.5rem] max-w-lg grid-cols-4 sm:max-w-none';

export const stayvoHostBottomNavLinkClass =
  'flex min-h-[3.5rem] min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-1.5 text-[10px] font-medium leading-tight transition-colors';

export const stayvoHostBottomNavLinkActiveClass =
  'rounded-lg bg-primary/15 text-primary';

/** Reserve space so fixed bottom nav never covers host dashboard content. */
export const stayvoHostMobileBottomPaddingClass =
  'pb-[calc(4.25rem+env(safe-area-inset-bottom))]';

export const stayvoBtnIconPrimaryClass =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

export const stayvoHostMainClass = 'mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8';

export const stayvoSidebarClass =
  'sticky top-0 z-40 hidden h-screen min-h-[100dvh] w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex';

export const stayvoNavLinkActiveClass =
  'bg-sidebar-accent font-medium text-sidebar-accent-foreground';

export const stayvoNavLinkClass =
  'text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground';

/** Dialog / modal content shell (non-Radix fallback) */
export const stayvoModalPanelClass =
  'w-full max-w-lg rounded-lg border border-border bg-background p-6 text-foreground shadow-lg';

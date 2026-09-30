/**
 * Shared Tailwind class strings for Stayvo Check-in.
 * Prefer semantic colors (background, border, primary, …) backed by CSS variables in globals.css.
 */

export const stayvoCardClass =
  'rounded-2xl border border-border bg-card text-card-foreground shadow-sm';

export const stayvoCardGlassClass = 'glass rounded-2xl';

/** Collapsible CMS / property form sections */
export const stayvoFormSectionClass =
  'stayvo-form-section';

export const stayvoFormSectionElevatedClass =
  'stayvo-form-section stayvo-form-section--elevated';

export const stayvoInputClass =
  'stayvo-input';

export const stayvoInputPillClass =
  'stayvo-input stayvo-input--pill';

export const stayvoTextareaClass =
  'stayvo-textarea';

export const stayvoBtnPrimaryClass =
  'inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export const stayvoBtnSecondaryClass =
  'inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export const stayvoPageTitleClass =
  'text-lg font-semibold tracking-tight text-foreground md:text-2xl';

export const stayvoSectionTitleClass =
  'text-base font-semibold tracking-tight text-foreground';

export const stayvoMutedTextClass = 'text-sm text-muted-foreground';

export const stayvoGuestCardClass = 'stayvo-guest-card';

export const stayvoAuthPanelClass = 'stayvo-auth-panel';

export const stayvoSidebarClass =
  'sticky top-0 z-40 hidden h-screen min-h-[100dvh] w-[220px] shrink-0 flex-col border-r border-border bg-sidebar backdrop-blur-xl md:flex';

export const stayvoNavLinkActiveClass =
  'bg-primary font-bold text-primary-foreground shadow-sm';

export const stayvoNavLinkClass =
  'text-foreground/85 hover:bg-muted/80 dark:hover:bg-muted/40';

'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  deleteGuestLink,
  generateGuestLink,
  updateGuestLink,
} from '@/app/actions/guest-links';
import { syncPropertyIcalFeedNow } from '@/app/actions/ical-feeds';
import PressButton from '@/app/_components/PressButton';
import { guestPortalAbsoluteUrl } from '@/lib/guest-portal-url';
import { icalFeedDisplayName } from '@/lib/ical/feed-source-label';
import { sortGuestLinksByCheckoutAsc } from '@/lib/guest-link-sort';
import type { IcalFeedSummary } from '@/lib/ical/types';
import { stayvoCardGlassClass } from '@/lib/stayvo-ui-classes';

function displayGuestName(name: string | null | undefined) {
  const t = (name ?? '').trim();
  return t.length > 0 ? t : '—';
}

type GuestLinkItem = {
  id: string;
  property_id: string;
  guest_name: string | null;
  checkout_date: string | null;
  expires_at: string | null;
  token: string;
  created_at: string;
  is_permanent?: boolean | null;
  link_source?: string | null;
};

type PropertyCardProps = {
  property: {
    id: string;
    property_name: string;
    internal_name: string | null;
  };
  /** Location group label (e.g. dashboard section name). */
  locationGroupName?: string | null;
  links: GuestLinkItem[];
  icalFeed?: IcalFeedSummary | null;
  nowIso: string;
  hostDisplayName: string | null;
  /** Origin for copied guest links (from server; e.g. https://stayvo.io). */
  guestLinkBaseUrl: string;
  /** When set with `onLinksPanelChange`, expansion is controlled by the parent (e.g. one open tab across the dashboard). */
  linksPanel?: 'active' | 'generate' | null;
  onLinksPanelChange?: (panel: 'active' | 'generate' | null) => void;
};

/** Native date input — avoid clipping; `showPicker()` helps when ancestors use transforms (e.g. Framer scale). */
function DateField({
  className = '',
  onMouseDown,
  onClick,
  ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = props.disabled;

  function tryOpenPicker() {
    const el = inputRef.current;
    if (!el || el.disabled) return;
    try {
      el.showPicker?.();
    } catch {
      /* InvalidStateError, unsupported, etc. */
    }
  }

  return (
    <div
      className={`w-full min-w-0 max-w-full overflow-x-hidden overflow-y-visible rounded-lg border border-slate-200 px-3 py-2 focus-within:ring-2 focus-within:ring-brand/30 dark:border-white/20 ${
        disabled
          ? 'cursor-not-allowed bg-slate-100 dark:bg-white/25'
          : 'bg-white dark:bg-white/88'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="date"
        {...props}
        onMouseDown={(e) => {
          onMouseDown?.(e);
          if (e.defaultPrevented || e.button !== 0 || disabled) return;
          queueMicrotask(() => tryOpenPicker());
        }}
        onClick={onClick}
        className={`block min-h-[2.25rem] w-full min-w-[10.5rem] max-w-full cursor-pointer bg-transparent py-0.5 text-sm text-slate-900 outline-none [color-scheme:light] dark:text-slate-950 dark:[color-scheme:dark] ${
          disabled ? 'cursor-not-allowed text-slate-400 dark:text-slate-500' : ''
        }`}
      />
    </div>
  );
}

function GuestLinkFormFields({
  idPrefix,
  guestName,
  onGuestNameChange,
  checkoutDate,
  onCheckoutDateChange,
  isPermanent,
  onPermanentChange,
  customSlug,
  onCustomSlugChange,
  baseUrl,
}: {
  idPrefix: string;
  guestName: string;
  onGuestNameChange: (value: string) => void;
  checkoutDate: string;
  onCheckoutDateChange: (value: string) => void;
  isPermanent: boolean;
  onPermanentChange: (value: boolean) => void;
  customSlug: string;
  onCustomSlugChange: (value: string) => void;
  baseUrl?: string;
}) {
  const urlPrefix = baseUrl
    ? baseUrl.replace(/\/$/, '') + '/stay/'
    : 'stayvo.io/stay/';

  return (
    <div className="space-y-3">
      {/* Guest name */}
      <div>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Guest name{' '}
          <span className="font-normal text-slate-400 dark:text-slate-500">
            (optional)
          </span>
        </label>
        <input
          value={guestName}
          onChange={(e) => onGuestNameChange(e.target.value)}
          placeholder="e.g. Sarah"
          className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder-slate-500"
        />
      </div>

      {/* Checkout date — hidden when permanent */}
      <AnimatePresence initial={false}>
        {!isPermanent ? (
          <motion.div
            key="checkout-date"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="overflow-hidden"
          >
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Checkout date
              </label>
              <DateField
                required
                value={checkoutDate}
                onChange={(e) => onCheckoutDateChange(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                Link expires 2 days after checkout (end of day).
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Permanent toggle — pill style */}
      <label
        htmlFor={`perm-${idPrefix}`}
        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
          isPermanent
            ? 'border-brand/40 bg-brand/8 dark:border-brand/30 dark:bg-brand/12'
            : 'border-slate-200 bg-white dark:border-white/15 dark:bg-white/8'
        }`}
      >
        <div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Permanent link
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Never expires — useful for long-term stays
          </div>
        </div>
        <input
          id={`perm-${idPrefix}`}
          type="checkbox"
          checked={isPermanent}
          onChange={(e) => {
            onPermanentChange(e.target.checked);
            if (e.target.checked) onCheckoutDateChange('');
          }}
          className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand dark:border-slate-500"
        />
      </label>

      {/* Custom path — advanced/secondary */}
      <details className="group">
        <summary className="cursor-pointer list-none text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1">
            <span className="transition-transform group-open:rotate-90">▶</span>
            Custom link path
            <span className="font-normal text-slate-400">(optional)</span>
          </span>
        </summary>
        <div className="mt-2">
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand/30 dark:border-white/20 dark:bg-white/88">
            <span className="shrink-0 select-none border-r border-slate-200 bg-slate-50 px-2 py-2 text-[11px] text-slate-400 dark:border-white/20 dark:bg-white/10 dark:text-slate-500">
              {urlPrefix}
            </span>
            <input
              value={customSlug}
              onChange={(e) => onCustomSlugChange(e.target.value)}
              placeholder="random-if-blank"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none dark:text-slate-950 dark:placeholder-slate-500"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
            Lowercase, numbers, hyphens · 4–24 chars · must be unique
          </p>
        </div>
      </details>
    </div>
  );
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return '—';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return dateValue;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/** Permanent or expiry still in the future. */
function isActiveLink(l: GuestLinkItem, nowIso: string) {
  if (l.is_permanent === true) return true;
  if (!l.expires_at) return false;
  return new Date(l.expires_at).getTime() >= new Date(nowIso).getTime();
}

const EXPIRED_GRACE_MS = 14 * 24 * 60 * 60 * 1000;

const LINKS_PANEL_EASE = [0.25, 0.1, 0.25, 1] as const;

const linksPanelMotionProps = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' as const },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.28, ease: LINKS_PANEL_EASE },
};

const editPanelMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' as const },
  exit: { opacity: 0, height: 0 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 36 },
};

const linkCardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 28 },
  },
};

/** Expired, but still within 14 days after expires_at (then hidden everywhere). */
function isRecentlyExpired(l: GuestLinkItem, nowIso: string) {
  if (l.is_permanent === true) return false;
  if (!l.expires_at) return false;
  const exp = new Date(l.expires_at).getTime();
  const now = new Date(nowIso).getTime();
  if (exp >= now) return false;
  return now <= exp + EXPIRED_GRACE_MS;
}

export default function PropertyCard({
  property,
  links,
  nowIso,
  hostDisplayName,
  guestLinkBaseUrl,
  linksPanel: linksPanelProp,
  onLinksPanelChange,
  icalFeed = null,
}: PropertyCardProps) {
  const router = useRouter();
  const [localLinksPanel, setLocalLinksPanel] = useState<
    'active' | 'generate' | null
  >(null);
  const linksPanelControlled = onLinksPanelChange != null;
  const linksPanel = linksPanelControlled ? (linksPanelProp ?? null) : localLinksPanel;

  function setLinksPanel(next: 'active' | 'generate' | null) {
    if (linksPanelControlled) {
      onLinksPanelChange(next);
    } else {
      setLocalLinksPanel(next);
    }
  }

  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const [guestName, setGuestName] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [customSlug, setCustomSlug] = useState('');

  const [editGuestName, setEditGuestName] = useState('');
  const [editCheckoutDate, setEditCheckoutDate] = useState('');
  const [editIsPermanent, setEditIsPermanent] = useState(false);
  const [editCustomSlug, setEditCustomSlug] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedLinkCopied, setGeneratedLinkCopied] = useState(false);
  const [copiedLinkIds, setCopiedLinkIds] = useState<Set<string>>(new Set());

  function markCopied(linkId: string) {
    setCopiedLinkIds((prev) => new Set(prev).add(linkId));
    setTimeout(() => {
      setCopiedLinkIds((prev) => {
        const next = new Set(prev);
        next.delete(linkId);
        return next;
      });
    }, 2000);
  }

  function absoluteGuestPortalUrl(token: string) {
    return guestPortalAbsoluteUrl(hostDisplayName, token, {
      baseUrl: guestLinkBaseUrl || undefined,
    });
  }

  async function copyToClipboard(text: string) {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      if (typeof document === 'undefined') return false;
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      } catch {
        document.body.removeChild(textarea);
        return false;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      if (typeof document === 'undefined') return false;
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      } catch {
        document.body.removeChild(textarea);
        return false;
      }
    }
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLinkMessage(null);
    setGeneratedLink(null);
    setGeneratedLinkCopied(false);
    setSubmitting(true);
    try {
      const result = await generateGuestLink({
        propertyId: property.id,
        guestName,
        checkoutDate,
        isPermanent,
        customToken: customSlug,
      });
      if (!result.ok) throw new Error(result.error);

      const fullLink = absoluteGuestPortalUrl(result.token);
      setGeneratedLink(fullLink);
      setGuestName('');
      setCheckoutDate('');
      setIsPermanent(false);
      setCustomSlug('');
      setLinksPanel(null);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to generate link.');
    } finally {
      setSubmitting(false);
    }
  }

  function openEditLink(l: GuestLinkItem) {
    if (editingLinkId === l.id) {
      setEditingLinkId(null);
      return;
    }
    setEditingLinkId(l.id);
    setEditGuestName(l.guest_name ?? '');
    setEditCheckoutDate((l.checkout_date ?? '').slice(0, 10));
    setEditIsPermanent(l.is_permanent === true);
    setEditCustomSlug(l.token);
    setError(null);
    setLinkMessage(null);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLinkId) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await updateGuestLink({
        linkId: editingLinkId,
        guestName: editGuestName,
        checkoutDate: editCheckoutDate,
        isPermanent: editIsPermanent,
        customToken: editCustomSlug,
      });
      if (!result.ok) throw new Error(result.error);

      setLinkMessage('Guest link updated.');
      setEditingLinkId(null);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to update guest link.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onSyncCalendar() {
    setSyncingCalendar(true);
    setError(null);
    setLinkMessage(null);
    try {
      const res = await syncPropertyIcalFeedNow(property.id);
      if (!res.ok) throw new Error(res.error);
      let msg = `Calendar sync complete. Created ${res.result.created}, extended ${res.result.extended}, expired ${res.result.expired}.`;
      if ('warning' in res && res.warning) {
        msg += ` ${res.warning}`;
      }
      setLinkMessage(msg);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to sync calendar.');
    } finally {
      setSyncingCalendar(false);
    }
  }

  async function onDeleteLink(linkId: string) {
    const yes = window.confirm(
      'Delete this guest link? Guests will no longer be able to open it.'
    );
    if (!yes) return;

    setError(null);
    setSubmitting(true);
    try {
      const result = await deleteGuestLink({ linkId });
      if (!result.ok) throw new Error(result.error);
      setEditingLinkId(null);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete link.');
    } finally {
      setSubmitting(false);
    }
  }

  const propertyName = (property.property_name ?? '').trim() || 'Untitled';
  const internalTrimmed = (property.internal_name ?? '').trim();
  const cardTitle = internalTrimmed || propertyName;

  const activeLinks = sortGuestLinksByCheckoutAsc(
    links.filter((l) => isActiveLink(l, nowIso))
  );
  const recentExpiredLinks = links.filter((l) => isRecentlyExpired(l, nowIso));

  return (
    <motion.div
      whileTap={linksPanel ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${stayvoCardGlassClass} flex min-h-0 w-full min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-visible p-5 md:p-4`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 flex-1 text-left text-base font-semibold text-slate-900 dark:text-slate-100">
            {cardTitle}
          </h2>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{propertyName}</p>
        {icalFeed ? (
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Calendar: {icalFeedDisplayName(icalFeed)}
            {icalFeed.last_synced_at
              ? ` · Last sync ${formatDate(icalFeed.last_synced_at.slice(0, 10))}`
              : ''}
          </p>
        ) : null}
        {icalFeed?.last_error ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
            Calendar sync: {icalFeed.last_error}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex w-full min-w-0 flex-wrap items-center justify-start gap-2 md:mt-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          onClick={() =>
            setLinksPanel(linksPanel === 'active' ? null : 'active')
          }
          className="group inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-4 py-2 text-xs font-semibold text-slate-600 backdrop-blur-sm transition hover:bg-white/80 hover:text-slate-900 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
        >
          <span>Active links</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 group-hover:text-slate-900 dark:bg-white/30 dark:text-slate-900 dark:group-hover:bg-white/45 dark:group-hover:text-slate-950">
            {activeLinks.length}
          </span>
          <span>{linksPanel === 'active' ? '▴' : '▾'}</span>
        </motion.button>
        {icalFeed ? (
          <PressButton
            type="button"
            disabled={syncingCalendar || submitting}
            onClick={() => void onSyncCalendar()}
            className="inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/60 px-4 py-2 text-xs font-semibold text-slate-600 backdrop-blur-sm transition hover:bg-white/80 hover:text-slate-900 disabled:opacity-60 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
          >
            {syncingCalendar ? 'Syncing…' : '↻ Sync'}
          </PressButton>
        ) : null}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          onClick={() => {
            setLinksPanel(linksPanel === 'generate' ? null : 'generate');
            setError(null);
          }}
          className="max-w-full shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-90"
        >
          Generate Link
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {linksPanel === 'generate' ? (
          <motion.div
            key={`generate-${property.id}`}
            className="overflow-x-hidden overflow-y-visible"
            {...linksPanelMotionProps}
          >
            <form
              onSubmit={onGenerate}
              className="mt-4 overflow-x-hidden overflow-y-visible rounded-2xl border border-slate-200 bg-white/75 p-4 backdrop-blur-sm dark:border-white/8 dark:bg-white/5 md:[backdrop-filter:none] md:[-webkit-backdrop-filter:none]"
            >
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Generate guest link
              </div>
              <div className="mt-3">
                <GuestLinkFormFields
                  idPrefix={property.id}
                  guestName={guestName}
                  onGuestNameChange={setGuestName}
                  checkoutDate={checkoutDate}
                  onCheckoutDateChange={setCheckoutDate}
                  isPermanent={isPermanent}
                  onPermanentChange={setIsPermanent}
                  customSlug={customSlug}
                  onCustomSlugChange={setCustomSlug}
                  baseUrl={guestLinkBaseUrl}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <PressButton
                  disabled={submitting}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 dark:bg-brand dark:text-white"
                >
                  {submitting ? 'Generating...' : 'Create Link'}
                </PressButton>
                <PressButton
                  type="button"
                  onClick={() => setLinksPanel(null)}
                  className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
                >
                  Cancel
                </PressButton>
              </div>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-400">
          {error}
        </div>
      ) : null}
      {linkMessage ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-400">
          {linkMessage}
        </div>
      ) : null}
      {generatedLink ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-400">
          <div className="break-all">{generatedLink}</div>
              <div className="mt-2">
                <PressButton
                  type="button"
                  onClick={async () => {
                    const copied = await copyToClipboard(generatedLink);
                    if (copied) {
                      setGeneratedLinkCopied(true);
                    } else {
                      // Mobile browsers may block clipboard on insecure origins; use share as fallback.
                      if (typeof navigator !== 'undefined' && navigator.share) {
                        try {
                          await navigator.share({ url: generatedLink });
                          setGeneratedLinkCopied(true);
                          setLinkMessage('Link shared');
                          return;
                        } catch {
                          // user dismissed share sheet; keep manual fallback message below
                        }
                      }
                      setLinkMessage('Copy blocked here. Long press the link above to copy.');
                    }
                  }}
                  className="rounded-lg border border-emerald-300 bg-white px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-400"
                >
              {generatedLinkCopied ? 'Copied' : 'Copy'}
            </PressButton>
          </div>
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {linksPanel === 'active' ? (
          <motion.div
            key={`active-${property.id}`}
            className="overflow-x-hidden overflow-y-visible"
            {...linksPanelMotionProps}
          >
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/75 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/5">
          {activeLinks.length === 0 ? (
            <p className="text-sm text-slate-500">No active links yet.</p>
          ) : (
            <motion.div
              className="space-y-2"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
              initial="hidden"
              animate="visible"
            >
              {activeLinks.map((l) => {
                const fullLink = absoluteGuestPortalUrl(l.token);
                return (
                  <motion.div
                    key={l.id}
                    variants={linkCardVariants}
                    whileHover={{ y: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {displayGuestName(l.guest_name)}
                      </div>
                      {l.link_source === 'ical' ? (
                        <span className="inline-flex rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:text-amber-200">
                          From {icalFeedDisplayName(icalFeed ?? { source: 'other' })}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {l.is_permanent === true ? (
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          Permanent guest link
                        </span>
                      ) : (
                        <span>Checkout: {formatDate(l.checkout_date)}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PressButton
                        type="button"
                        onClick={async () => {
                          const copied = await copyToClipboard(fullLink);
                          if (copied) {
                            markCopied(l.id);
                          } else {
                            setLinkMessage(`Copy blocked. Use this link: ${fullLink}`);
                          }
                        }}
                        className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-white dark:border-white/25 dark:bg-white/90 dark:text-slate-950"
                      >
                        {copiedLinkIds.has(l.id) ? '✓ Copied' : '⎘ Copy'}
                      </PressButton>
                      <PressButton
                        type="button"
                        onClick={() => openEditLink(l)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          editingLinkId === l.id
                            ? 'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/20 dark:text-slate-200'
                            : 'border-slate-200 bg-white/70 text-slate-900 hover:bg-white dark:border-white/25 dark:bg-white/90 dark:text-slate-950'
                        }`}
                      >
                        {editingLinkId === l.id ? '✕ Close' : '✎ Edit'}
                      </PressButton>
                    </div>

                    <AnimatePresence initial={false}>
                      {editingLinkId === l.id ? (
                        <motion.div
                          key={`edit-${l.id}`}
                          {...editPanelMotion}
                          className="mt-3 overflow-hidden"
                        >
                          <form
                            onSubmit={onSaveEdit}
                            className="rounded-xl border border-brand/25 bg-white shadow-sm dark:border-brand/20 dark:bg-white/8"
                          >
                            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-white/8 dark:bg-white/4">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Edit guest link
                              </span>
                            </div>
                            <div className="p-4">
                              <GuestLinkFormFields
                                idPrefix={`edit-${l.id}`}
                                guestName={editGuestName}
                                onGuestNameChange={setEditGuestName}
                                checkoutDate={editCheckoutDate}
                                onCheckoutDateChange={setEditCheckoutDate}
                                isPermanent={editIsPermanent}
                                onPermanentChange={setEditIsPermanent}
                                customSlug={editCustomSlug}
                                onCustomSlugChange={setEditCustomSlug}
                                baseUrl={guestLinkBaseUrl}
                              />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-white/4">
                              <div className="flex items-center gap-2">
                                <PressButton
                                  disabled={submitting}
                                  className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60 dark:bg-brand"
                                >
                                  {submitting ? 'Saving…' : 'Save changes'}
                                </PressButton>
                                <PressButton
                                  type="button"
                                  onClick={() => setEditingLinkId(null)}
                                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/18 dark:bg-white/18 dark:text-slate-900"
                                >
                                  Cancel
                                </PressButton>
                              </div>
                              <PressButton
                                type="button"
                                onClick={() => onDeleteLink(l.id)}
                                disabled={submitting}
                                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-400"
                              >
                                🗑 Delete
                              </PressButton>
                            </div>
                          </form>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
              </motion.div>
            )}
            {recentExpiredLinks.length > 0 ? (
              <details className="mt-3 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-sm dark:border-white/8 dark:bg-white/4">
                <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    Show expired links
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-white/15 dark:text-slate-300">
                      {recentExpiredLinks.length}
                    </span>
                  </span>
                  <span className="mt-1 block font-normal text-[11px] text-slate-500 dark:text-slate-500">
                    Links appear here for 14 days after they expire, then are hidden.
                  </span>
                </summary>
                <div className="space-y-2 border-t border-slate-200 dark:border-white/10 p-3 pt-2">
                  {recentExpiredLinks.map((l) => {
                    const fullLink = absoluteGuestPortalUrl(l.token);
                    return (
                      <motion.div
                        key={l.id}
                        whileHover={{ y: -1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="rounded-2xl border border-white/40 bg-white/40 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/4"
                      >
                        <div className="opacity-50">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                              {displayGuestName(l.guest_name)}
                            </div>
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:ring-rose-800/60">
                              Expired
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Checkout: {formatDate(l.checkout_date)}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <PressButton
                            type="button"
                            onClick={async () => {
                              const copied = await copyToClipboard(fullLink);
                              if (copied) {
                                markCopied(l.id);
                              } else {
                                setLinkMessage(`Copy blocked. Use this link: ${fullLink}`);
                              }
                            }}
                            className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-white/25 dark:bg-white/90 dark:text-slate-950"
                          >
                            {copiedLinkIds.has(l.id) ? '✓ Copied' : '⎘ Copy'}
                          </PressButton>
                          <PressButton
                            type="button"
                            onClick={() => openEditLink(l)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              editingLinkId === l.id
                                ? 'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/20 dark:text-slate-200'
                                : 'border-slate-200 bg-white/70 text-slate-900 dark:border-white/25 dark:bg-white/90 dark:text-slate-950'
                            }`}
                          >
                            {editingLinkId === l.id ? '✕ Close' : '✎ Edit'}
                          </PressButton>
                        </div>

                        <AnimatePresence initial={false}>
                          {editingLinkId === l.id ? (
                            <motion.div
                              key={`edit-exp-${l.id}`}
                              {...editPanelMotion}
                              className="mt-3 overflow-hidden"
                            >
                              <form
                                onSubmit={onSaveEdit}
                                className="rounded-xl border border-brand/25 bg-white shadow-sm dark:border-brand/20 dark:bg-white/8"
                              >
                                <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-white/8 dark:bg-white/4">
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Edit guest link
                                  </span>
                                </div>
                                <div className="p-4">
                                  <GuestLinkFormFields
                                    idPrefix={`edit-exp-${l.id}`}
                                    guestName={editGuestName}
                                    onGuestNameChange={setEditGuestName}
                                    checkoutDate={editCheckoutDate}
                                    onCheckoutDateChange={setEditCheckoutDate}
                                    isPermanent={editIsPermanent}
                                    onPermanentChange={setEditIsPermanent}
                                    customSlug={editCustomSlug}
                                    onCustomSlugChange={setEditCustomSlug}
                                    baseUrl={guestLinkBaseUrl}
                                  />
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-white/4">
                                  <div className="flex items-center gap-2">
                                    <PressButton
                                      disabled={submitting}
                                      className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60 dark:bg-brand"
                                    >
                                      {submitting ? 'Saving…' : 'Save changes'}
                                    </PressButton>
                                    <PressButton
                                      type="button"
                                      onClick={() => setEditingLinkId(null)}
                                      className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/18 dark:bg-white/18 dark:text-slate-900"
                                    >
                                      Cancel
                                    </PressButton>
                                  </div>
                                  <PressButton
                                    type="button"
                                    onClick={() => onDeleteLink(l.id)}
                                    disabled={submitting}
                                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-400"
                                  >
                                    🗑 Delete
                                  </PressButton>
                                </div>
                              </form>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </details>
            ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}


'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  deleteGuestLink,
  extendGuestLink,
  generateGuestLink,
} from '@/app/actions/guest-links';

type GuestLinkItem = {
  id: string;
  property_id: string;
  guest_name: string;
  checkout_date: string | null;
  expires_at: string | null;
  token: string;
  created_at: string;
  is_permanent?: boolean | null;
};

type PropertyCardProps = {
  property: {
    id: string;
    property_name: string;
    internal_name: string | null;
    is_live: boolean;
  };
  links: GuestLinkItem[];
  nowIso: string;
};

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

/** Expired, but still within 14 days after expires_at (then hidden everywhere). */
function isRecentlyExpired(l: GuestLinkItem, nowIso: string) {
  if (l.is_permanent === true) return false;
  if (!l.expires_at) return false;
  const exp = new Date(l.expires_at).getTime();
  const now = new Date(nowIso).getTime();
  if (exp >= now) return false;
  return now <= exp + EXPIRED_GRACE_MS;
}

export default function PropertyCard({ property, links, nowIso }: PropertyCardProps) {
  const router = useRouter();
  const [showGenerate, setShowGenerate] = useState(false);
  const [showExtendId, setShowExtendId] = useState<string | null>(null);

  const [guestName, setGuestName] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [extendDate, setExtendDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

  function relativeStayPath(token: string) {
    return `/stay/${token}`;
  }

  function absoluteStayUrl(token: string) {
    const path = relativeStayPath(token);
    if (configuredBaseUrl) return `${configuredBaseUrl}${path}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
    return path;
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLinkMessage(null);
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

      const fullLink = absoluteStayUrl(result.token);
      setLinkMessage(fullLink);
      await navigator.clipboard.writeText(fullLink);
      setGuestName('');
      setCheckoutDate('');
      setIsPermanent(false);
      setCustomSlug('');
      setShowGenerate(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to generate link.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onExtend(e: React.FormEvent) {
    e.preventDefault();
    if (!showExtendId) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await extendGuestLink({
        linkId: showExtendId,
        newCheckoutDate: extendDate,
      });
      if (!result.ok) throw new Error(result.error);

      const fullLink = absoluteStayUrl(result.token);
      setLinkMessage(`Extended successfully: ${fullLink}`);
      setShowExtendId(null);
      setExtendDate('');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to extend link.');
    } finally {
      setSubmitting(false);
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
      setShowExtendId(null);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete link.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayTitle =
    (property.internal_name ?? '').trim() || property.property_name;

  const activeLinks = links.filter((l) => isActiveLink(l, nowIso));
  const recentExpiredLinks = links.filter((l) => isRecentlyExpired(l, nowIso));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{displayTitle}</h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
            property.is_live
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
          }`}
        >
          {property.is_live ? 'Live' : 'Draft'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setShowGenerate((v) => !v);
            setError(null);
          }}
          className="rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:opacity-95"
        >
          Generate Guest Link
        </button>
        <Link
          href={`/properties/${property.id}/edit`}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Edit Property
        </Link>
      </div>

      {showGenerate ? (
        <form
          onSubmit={onGenerate}
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <div className="text-sm font-semibold text-slate-800">
            Generate guest link
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2">
            <input
              id={`perm-${property.id}`}
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => {
                setIsPermanent(e.target.checked);
                if (e.target.checked) setCheckoutDate('');
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <label
              htmlFor={`perm-${property.id}`}
              className="text-xs font-medium text-slate-700"
            >
              <span className="font-semibold">Permanent link</span>
              <span className="mt-0.5 block font-normal text-slate-500">
                No checkout date; link stays valid until you delete it.
              </span>
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">
                Guest name
              </label>
              <input
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">
                Checkout date
              </label>
              <input
                required={!isPermanent}
                disabled={isPermanent}
                type="date"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs font-semibold text-slate-600">
              Custom link (optional)
            </label>
            <input
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
              placeholder="Leave blank for a random ~10 character link"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Lowercase letters, numbers, hyphens only. 4–24 characters. Must be
              unique.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Generating...' : 'Create Link'}
            </button>
            <button
              type="button"
              onClick={() => setShowGenerate(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}
      {linkMessage ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
          {linkMessage}
        </div>
      ) : null}

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Active links
        </h3>
        {activeLinks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No active links yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {activeLinks.map((l) => {
              const fullLink = absoluteStayUrl(l.token);
              return (
                <div
                  key={l.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="text-sm font-semibold text-slate-800">
                    {l.guest_name}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {l.is_permanent === true ? (
                      <span>Permanent guest link</span>
                    ) : (
                      <span>Checkout: {formatDate(l.checkout_date)}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(fullLink);
                        setLinkMessage('Link copied to clipboard.');
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      Copy link
                    </button>
                    {l.is_permanent !== true ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtendId(l.id);
                          setExtendDate(l.checkout_date ?? '');
                          setError(null);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                      >
                        Extend
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onDeleteLink(l.id)}
                      disabled={submitting}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
                    >
                      Delete link
                    </button>
                  </div>

                  {showExtendId === l.id ? (
                    <form
                      onSubmit={onExtend}
                      className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2"
                    >
                      <label className="text-xs font-semibold text-slate-600">
                        New checkout date
                      </label>
                      <input
                        required
                        type="date"
                        value={extendDate}
                        onChange={(e) => setExtendDate(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          disabled={submitting}
                          className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {submitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowExtendId(null)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {recentExpiredLinks.length > 0 ? (
          <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80">
            <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-600 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                Show expired links
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {recentExpiredLinks.length}
                </span>
              </span>
              <span className="mt-1 block font-normal text-[11px] text-slate-500">
                Links appear here for 14 days after they expire, then are hidden.
              </span>
            </summary>
            <div className="space-y-2 border-t border-slate-200 p-3 pt-2">
              {recentExpiredLinks.map((l) => {
                const fullLink = absoluteStayUrl(l.token);
                return (
                  <div
                    key={l.id}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-800">
                        {l.guest_name}
                      </div>
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
                        Expired
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Checkout: {formatDate(l.checkout_date)}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(fullLink);
                          setLinkMessage('Link copied to clipboard.');
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                      >
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtendId(l.id);
                          setExtendDate(l.checkout_date ?? '');
                          setError(null);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                      >
                        Extend
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteLink(l.id)}
                        disabled={submitting}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
                      >
                        Delete link
                      </button>
                    </div>

                    {showExtendId === l.id ? (
                      <form
                        onSubmit={onExtend}
                        className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2"
                      >
                        <label className="text-xs font-semibold text-slate-600">
                          New checkout date
                        </label>
                        <input
                          required
                          type="date"
                          value={extendDate}
                          onChange={(e) => setExtendDate(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            disabled={submitting}
                            className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {submitting ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowExtendId(null)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}


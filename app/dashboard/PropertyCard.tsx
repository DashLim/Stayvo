'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { extendGuestLink, generateGuestLink } from '@/app/actions/guest-links';

type GuestLinkItem = {
  id: string;
  property_id: string;
  guest_name: string;
  checkout_date: string;
  expires_at: string;
  token: string;
  created_at: string;
};

type PropertyCardProps = {
  property: {
    id: string;
    property_name: string;
    city: string | null;
    is_live: boolean;
  };
  links: GuestLinkItem[];
  nowIso: string;
};

function formatDate(dateValue: string) {
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

function isExpired(expiresAt: string, nowIso: string) {
  const d = new Date(expiresAt);
  const now = new Date(nowIso);
  return d.getTime() < now.getTime();
}

export default function PropertyCard({ property, links, nowIso }: PropertyCardProps) {
  const router = useRouter();
  const [showGenerate, setShowGenerate] = useState(false);
  const [showExtendId, setShowExtendId] = useState<string | null>(null);

  const [guestName, setGuestName] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
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
      });
      if (!result.ok) throw new Error(result.error);

      const fullLink = absoluteStayUrl(result.token);
      setLinkMessage(fullLink);
      await navigator.clipboard.writeText(fullLink);
      setGuestName('');
      setCheckoutDate('');
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{property.property_name}</h2>
          <p className="mt-1 text-sm text-slate-600">{property.city ?? ''}</p>
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
                required
                type="date"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
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
          Generated links
        </h3>
        {links.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No links generated yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {links.map((l) => {
              const expired = isExpired(l.expires_at, nowIso);
              const fullLink = absoluteStayUrl(l.token);
              const relativeLink = relativeStayPath(l.token);
              return (
                <div
                  key={l.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-800">
                      {l.guest_name}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                        expired
                          ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      }`}
                    >
                      {expired ? 'Expired' : 'Active'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Checkout: {formatDate(l.checkout_date)} | Expires:{' '}
                    {formatDate(l.expires_at)}
                  </div>
                  <div className="mt-2 break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                    {relativeLink}
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
                      Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExtendId(l.id);
                        setExtendDate(l.checkout_date);
                        setError(null);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      Extend
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
      </div>
    </div>
  );
}


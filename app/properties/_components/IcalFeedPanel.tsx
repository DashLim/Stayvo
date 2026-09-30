'use client';

import { useCallback, useEffect, useState } from 'react';
import PressButton from '@/app/_components/PressButton';
import {
  disconnectPropertyIcalFeed,
  getIcalFeedStatuses,
  syncPropertyIcalFeedNow,
  upsertPropertyIcalFeed,
  type IcalFeedStatus,
} from '@/app/actions/ical-feeds';
import { icalFeedDisplayName } from '@/lib/ical/feed-source-label';

function formatSyncedAt(iso: string | null) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function CalendarFields({
  calendarName,
  feedUrl,
  onCalendarNameChange,
  onFeedUrlChange,
  nameLabelClassName,
  urlLabelClassName,
}: {
  calendarName: string;
  feedUrl: string;
  onCalendarNameChange: (value: string) => void;
  onFeedUrlChange: (value: string) => void;
  nameLabelClassName: string;
  urlLabelClassName: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className={nameLabelClassName}>Calendar name</label>
        <input
          type="text"
          value={calendarName}
          onChange={(e) => onCalendarNameChange(e.target.value)}
          required
          placeholder="e.g. Airbnb"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-white/88"
        />
      </div>
      <div>
        <label className={urlLabelClassName}>iCal URL</label>
        <input
          type="url"
          value={feedUrl}
          onChange={(e) => onFeedUrlChange(e.target.value)}
          required
          placeholder="https://…"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-white/88"
        />
      </div>
    </div>
  );
}

export default function IcalFeedPanel({
  propertyId,
  embedded = false,
}: {
  propertyId: string;
  embedded?: boolean;
}) {
  const [feeds, setFeeds] = useState<IcalFeedStatus[]>([]);
  const [calendarName, setCalendarName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await getIcalFeedStatuses(propertyId);
    if (!res.ok) {
      setError(res.error);
      setFeeds([]);
    } else {
      setFeeds(res.feeds);
    }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onConnect() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const res = await upsertPropertyIcalFeed({ propertyId, feedUrl, calendarName });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setFeedUrl('');
    setCalendarName('');
    setMessage(
      'sync' in res && res.sync
        ? `Calendar added. Created ${res.sync.created} link(s), updated ${res.sync.extended}.`
        : 'syncWarning' in res && res.syncWarning
          ? `Calendar saved. Sync warning: ${res.syncWarning}`
          : 'Calendar added.'
    );
    await refresh();
  }

  async function onSyncNow() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const res = await syncPropertyIcalFeedNow(propertyId);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(
      `Sync complete. Created ${res.result.created}, extended ${res.result.extended}, expired ${res.result.expired}.`
    );
    if ('warning' in res && res.warning) {
      setMessage(
        `Sync complete. Created ${res.result.created}, extended ${res.result.extended}, expired ${res.result.expired}. ${res.warning}`
      );
    }
    await refresh();
  }

  async function onDisconnect(feedId: string, feedName: string) {
    if (
      !confirm(
        `Disconnect "${feedName}"?\n\nThe URL will be removed. Existing auto links stay as-is.`
      )
    ) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const res = await disconnectPropertyIcalFeed({ propertyId, feedId });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage('Calendar disconnected.');
    await refresh();
  }

  const body = (
    <>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : feeds.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-2">
            {feeds.map((feed) => {
              const connectedLabel = icalFeedDisplayName({
                calendar_name: feed.calendarName,
                source: feed.source,
              });
              return (
                <div
                  key={feed.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm dark:border-white/15 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        Connected · {connectedLabel}
                      </p>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">
                        Last sync: {formatSyncedAt(feed.lastSyncedAt)}
                      </p>
                    </div>
                    <PressButton
                      type="button"
                      disabled={submitting}
                      onClick={() => void onDisconnect(feed.id, connectedLabel)}
                      className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-200"
                    >
                      Disconnect
                    </PressButton>
                  </div>
                  {feed.lastError ? (
                    <p className="mt-2 text-rose-600 dark:text-rose-400">
                      Last error: {feed.lastError}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <PressButton
              type="button"
              disabled={submitting}
              onClick={() => void onSyncNow()}
              className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Syncing…' : 'Sync all now'}
            </PressButton>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/6">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Add another calendar
            </p>
            <div className="mt-3 space-y-3">
              <CalendarFields
                calendarName={calendarName}
                feedUrl={feedUrl}
                onCalendarNameChange={setCalendarName}
                onFeedUrlChange={setFeedUrl}
                nameLabelClassName="text-xs font-semibold text-slate-600 dark:text-slate-400"
                urlLabelClassName="text-xs font-semibold text-slate-600 dark:text-slate-400"
              />
              <PressButton
                type="button"
                disabled={submitting || !calendarName.trim() || !feedUrl.trim()}
                onClick={() => void onConnect()}
                className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Add & sync'}
              </PressButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <CalendarFields
            calendarName={calendarName}
            feedUrl={feedUrl}
            onCalendarNameChange={setCalendarName}
            onFeedUrlChange={setFeedUrl}
            nameLabelClassName="text-sm font-medium text-slate-700 dark:text-slate-300"
            urlLabelClassName="text-sm font-medium text-slate-700 dark:text-slate-300"
          />
          <p className="text-xs text-slate-500">
            Treat the iCal URL like a password — anyone with it can see your calendar.
          </p>
          <PressButton
            type="button"
            disabled={submitting || !calendarName.trim() || !feedUrl.trim()}
            onClick={() => void onConnect()}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Connecting…' : 'Connect first calendar'}
          </PressButton>
        </div>
      )}

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
          {message}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return <div>{body}</div>;
  }

  return (
    <section className="glass rounded-[20px] p-4 md:rounded-2xl md:border md:border-slate-100 md:bg-white md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:md:border-white/10 dark:md:bg-white/5">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        OTA calendar sync
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Paste your Airbnb, Booking.com, or VRBO iCal export URL. Stayvo Check-in checks for new bookings
        about every hour and creates or extends guest links from checkout dates. Links appear in
        your dashboard for you to send to guests.
      </p>

      <div className="mt-4">{body}</div>
    </section>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { getHostIcalSyncFeeds, syncHostIcalFeedNow } from '@/app/actions/ical-feeds';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { stayvoBtnIconClass } from '@/lib/stayvo-ui-classes';
import { cn } from '@/lib/utils';
import { hostSans, hostSerif } from '@/lib/host-fonts';

type Progress = {
  total: number;
  completed: number;
  successful: number;
  created: number;
  updated: number;
  expired: number;
  failures: Array<{ id: string; name: string; error: string }>;
};

const emptyProgress: Progress = {
  total: 0, completed: 0, successful: 0, created: 0, updated: 0, expired: 0, failures: [],
};

export default function DashboardSyncAll({ visible }: { visible: boolean }) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [error, setError] = useState<string | null>(null);

  async function syncAll() {
    if (inFlight.current) return;
    inFlight.current = true;
    setRunning(true);
    setOpen(true);
    setError(null);
    setProgress(emptyProgress);
    try {
      const result = await getHostIcalSyncFeeds();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      let next: Progress = { ...emptyProgress, total: result.feeds.length, failures: [] };
      setProgress(next);
      // Sequential, individually authenticated requests keep serverless work bounded
      // to one feed and allow the remaining calendars to continue after a failure.
      for (const feed of result.feeds) {
        let outcome: Awaited<ReturnType<typeof syncHostIcalFeedNow>>;
        try {
          outcome = await syncHostIcalFeedNow(feed.id);
        } catch {
          outcome = { ok: false, error: 'Request failed. Please try again.' };
        }
        next = {
          ...next,
          completed: next.completed + 1,
          successful: next.successful + (outcome.ok ? 1 : 0),
          created: next.created + (outcome.ok ? outcome.created : 0),
          updated: next.updated + (outcome.ok ? outcome.updated : 0),
          expired: next.expired + (outcome.ok ? outcome.expired : 0),
          failures: outcome.ok ? next.failures : [...next.failures, { ...feed, error: outcome.error }],
        };
        setProgress(next);
      }
    } catch {
      setError('Could not load your calendars. Please try again.');
    } finally {
      inFlight.current = false;
      setRunning(false);
      router.refresh();
    }
  }

  const status = running
    ? progress.total > 0
      ? `Syncing calendars: ${progress.completed} of ${progress.total} complete…`
      : 'Finding enabled calendars…'
    : error ?? (progress.total === 0
      ? 'No enabled calendars found. Connect a calendar in Property Editor to get started.'
      : `Sync complete: ${progress.successful} successful, ${progress.failures.length} failed feeds.`);

  return (
    <>
      <button
        type="button"
        disabled={running}
        onClick={() => void syncAll()}
        className={cn(stayvoBtnIconClass, 'shrink-0 disabled:opacity-50 md:w-auto md:gap-2 md:px-3')}
        aria-label={running ? status : 'Sync all calendars'}
        title={running ? status : 'Sync all calendars across every property and location'}
      >
        <RefreshCw className={cn('h-4 w-4 shrink-0', running && 'animate-spin')} aria-hidden />
        <span className="hidden md:inline">{running ? 'Syncing…' : 'Sync All'}</span>
      </button>
      <Dialog open={open && visible} onOpenChange={setOpen}>
        <DialogContent className={cn(
          'stayvo-host max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl font-host',
          hostSans.variable,
          hostSerif.variable,
        )}>
          <DialogHeader>
            <DialogTitle>Sync all calendars</DialogTitle>
            <DialogDescription>
              All enabled calendars across your properties and locations, including drafts and filtered-out locations.
              Keep this page open until syncing finishes.
            </DialogDescription>
          </DialogHeader>
          <div role="status" aria-live="polite" className="space-y-3 text-sm">
            <p className={error ? 'text-destructive' : 'text-foreground'}>{status}</p>
            {running && progress.total > 0 ? (
              <progress className="h-2 w-full accent-brand" value={progress.completed} max={progress.total} aria-label="Calendar sync progress" />
            ) : null}
            {!running && progress.total > 0 ? (
              <p className="text-muted-foreground">
                Guest links: {progress.created} created, {progress.updated} updated, {progress.expired} expired.
              </p>
            ) : null}
          </div>
          {progress.failures.length > 0 ? (
            <ul className="space-y-2 text-sm text-destructive" aria-label="Calendars that failed to sync">
              {progress.failures.map((feed) => (
                <li key={feed.id} className="break-words"><strong>{feed.name}:</strong> {feed.error}</li>
              ))}
            </ul>
          ) : null}
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {running ? 'Hide progress' : 'Close'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

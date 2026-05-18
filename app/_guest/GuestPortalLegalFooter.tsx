import Link from 'next/link';
import Image from 'next/image';

type GuestPortalLegalFooterProps = {
  variant: 'guest' | 'preview';
  /** Expired-link and other pages without the section quick nav. */
  noQuickNav?: boolean;
};

export default function GuestPortalLegalFooter({
  variant,
  noQuickNav = false,
}: GuestPortalLegalFooterProps) {
  return (
    <footer
      className={`guest-portal-legal-footer flex flex-col items-center gap-3 pt-3 max-md:pb-[var(--stayvo-guest-footer-pad)] md:gap-4 md:pb-10 md:pt-4 ${
        noQuickNav ? 'guest-portal-legal-footer--no-quick-nav' : ''
      }`}
    >
      {variant === 'guest' ? (
        <p className="max-w-sm px-4 text-center text-[11px] leading-relaxed text-slate-500">
          This guide is provided by your host via Stayvo.
        </p>
      ) : null}
      <p className="text-center text-[11px] text-slate-500">
        <Link
          href="/privacy"
          className="font-medium text-brand underline-offset-2 hover:underline"
        >
          Privacy
        </Link>
        <span className="text-slate-400"> · </span>
        <Link
          href="/terms"
          className="font-medium text-brand underline-offset-2 hover:underline"
        >
          Terms
        </Link>
      </p>
      <span className="inline-flex flex-col items-center gap-1.5 text-[11px] text-slate-500">
        <span>Powered by</span>
        <Link
          href="https://stayvo.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-md opacity-90 outline-none ring-brand/40 transition-opacity hover:opacity-100 focus-visible:ring-2"
          aria-label="Stayvo — opens in a new tab"
        >
          <Image
            src="/brand/stayvo-guest-logo-lockup.png"
            alt=""
            width={1024}
            height={365}
            unoptimized
            className="h-7 w-auto max-w-[180px]"
          />
        </Link>
      </span>
    </footer>
  );
}

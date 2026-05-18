'use client';

import Image from 'next/image';
import Link from 'next/link';

type GuestStayvoBrandLinkProps = {
  /** Centered lockup below hero (mobile guest portal). */
  variant?: 'lockup' | 'poweredBy' | 'sidebar';
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

const LOGO_SRC = '/brand/stayvo-guest-logo-lockup.png';

export default function GuestStayvoBrandLink({
  variant = 'lockup',
  className = '',
  imageClassName,
  priority = false,
}: GuestStayvoBrandLinkProps) {
  const linkClass =
    variant === 'sidebar'
      ? `inline-block max-w-[160px] rounded-md opacity-85 outline-none ring-brand/40 transition-opacity hover:opacity-100 focus-visible:ring-2 ${className}`
      : `inline-block rounded-md outline-none ring-brand/40 transition-opacity hover:opacity-90 focus-visible:ring-2 ${className}`;

  const imgClass =
    imageClassName ??
    (variant === 'sidebar'
      ? 'h-5 w-auto max-w-full'
      : variant === 'poweredBy'
        ? 'h-7 w-auto max-w-[180px]'
        : 'block h-9 w-auto max-w-[min(100%,220px)] sm:h-10');

  const logo = (
    <Link
      href="https://stayvo.io"
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
      aria-label="Stayvo — opens in a new tab"
    >
      <Image
        src={LOGO_SRC}
        alt=""
        width={1024}
        height={365}
        priority={priority}
        unoptimized
        className={imgClass}
      />
    </Link>
  );

  if (variant === 'poweredBy') {
    return (
      <span
        className={`inline-flex flex-col items-center gap-1.5 text-[11px] text-slate-500 ${className}`}
      >
        <span>Powered by</span>
        {logo}
      </span>
    );
  }

  return logo;
}

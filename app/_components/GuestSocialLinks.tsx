import type { ReactNode } from 'react';

export type GuestSocialLinksInput = {
  facebook?: string | null;
  instagram?: string | null;
  x?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  airbnb?: string | null;
};

type Entry = { key: keyof GuestSocialLinksInput; href: string; label: string; icon: ReactNode };

function SocialIconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073C0 18.063 4.388 23.028 10.125 23.93v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.534-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}

function SocialIconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-3.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />
    </svg>
  );
}

function SocialIconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M18.244 3H21l-6.88 7.86L22 21h-6.44l-5.02-6.43L5.5 21H3l7.36-8.42L2 3h6.56l4.53 5.8L18.244 3Zm-1.08 16.2h1.7L7.04 4.8H5.22l11.944 14.4Z" />
    </svg>
  );
}

function SocialIconTikTok() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M16.6 5.82c1.08.02 2.14.44 2.92 1.18v3.45a6.77 6.77 0 0 1-3.86-1.18v6.77a6.58 6.58 0 1 1-6.58-6.58c.13 0 .26 0 .39.02v3.44a3.22 3.22 0 1 0 2.24 3.06V2h3.37a6.77 6.77 0 0 0 1.52 3.82Z" />
    </svg>
  );
}

function SocialIconYouTube() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M21.8 8.001a2.75 2.75 0 0 0-1.94-1.95C18.15 6 12 6 12 6s-6.15 0-7.86.18A2.75 2.75 0 0 0 2.2 8.05C2 9.77 2 12 2 12s0 2.23.2 3.99a2.75 2.75 0 0 0 1.94 2.28C5.85 18 12 18 12 18s6.15 0 7.86-.2a2.75 2.75 0 0 0 1.94-1.95c.2-1.76.2-3.85.2-3.85s0-2.09-.2-3.99ZM10 15V9l5 3-5 3Z" />
    </svg>
  );
}

function SocialIconAirbnb() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 3c-3.8 0-6.9 3.1-6.9 6.9 0 1.3.4 2.5 1 3.5 1.2 1.9 3.4 3.3 5.9 5.6 2.5-2.3 4.7-3.7 5.9-5.6.6-1 1-2.2 1-3.5C18.9 6.1 15.8 3 12 3Zm0 3.2c2 0 3.6 1.6 3.6 3.6S14 13.4 12 13.4 8.4 11.8 8.4 9.8 10 6.2 12 6.2Z" />
    </svg>
  );
}

function trimUrl(value: string | null | undefined) {
  return (value ?? '').trim();
}

export default function GuestSocialLinks({
  links,
  className = '',
}: {
  links: GuestSocialLinksInput;
  className?: string;
}) {
  const entries: Entry[] = [];

  const order: Array<{ key: keyof GuestSocialLinksInput; label: string; icon: ReactNode }> = [
    { key: 'instagram', label: 'Instagram', icon: <SocialIconInstagram /> },
    { key: 'facebook', label: 'Facebook', icon: <SocialIconFacebook /> },
    { key: 'airbnb', label: 'Airbnb listing', icon: <SocialIconAirbnb /> },
    { key: 'tiktok', label: 'TikTok', icon: <SocialIconTikTok /> },
    { key: 'youtube', label: 'YouTube', icon: <SocialIconYouTube /> },
    { key: 'x', label: 'X', icon: <SocialIconX /> },
  ];

  for (const row of order) {
    const href = trimUrl(links[row.key]);
    if (href) {
      entries.push({ ...row, href });
    }
  }

  if (entries.length === 0) return null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <p className="text-xs font-medium text-slate-500">Follow us</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {entries.map((e) => (
          <a
            key={e.key}
            href={e.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={e.label}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/35 bg-brand text-white shadow-sm transition active:scale-[0.96]"
          >
            {e.icon}
          </a>
        ))}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ForceLightMode from '@/app/_components/ForceLightMode';

// ── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#E0A24D" fillOpacity="0.15" />
      <path
        d="M6 10l3 3 5-5"
        stroke="#E0A24D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  const items = [
    { label: 'Check-in Instructions', icon: '🔑' },
    { label: 'WiFi & Parking', icon: '📶' },
    { label: 'House Rules', icon: '📋' },
    { label: 'Local Tips', icon: '📍' },
  ];

  return (
    <div className="relative mx-auto w-56">
      {/* Decorative glow behind phone */}
      <div className="absolute inset-x-4 -bottom-6 -top-6 -z-10 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="relative rounded-[44px] border-[6px] border-slate-800 bg-slate-800 shadow-[0_40px_80px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="rounded-[38px] bg-[#FDF6EC] overflow-hidden">
          {/* Dynamic island */}
          <div className="flex h-8 items-center justify-center bg-[#FDF6EC]">
            <div className="h-[5px] w-24 rounded-full bg-slate-800/80" />
          </div>
          {/* Hero banner */}
          <div className="mx-2 flex h-20 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
              Welcome
            </span>
            <span className="text-sm font-extrabold text-white">Skypod Residence</span>
          </div>
          {/* Address */}
          <div className="px-3 py-1.5 text-center">
            <p className="text-[9px] text-slate-500">Check-in ready · Tower 2-24-12</p>
          </div>
          {/* Section cards */}
          <div className="px-2 pb-1 space-y-1.5">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2 shadow-sm"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-[11px] font-semibold text-slate-700">{item.label}</span>
                <span className="ml-auto text-[11px] text-slate-300">›</span>
              </div>
            ))}
          </div>
          {/* Host card */}
          <div className="mx-2 mb-3 mt-1.5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white">
              M
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-700">Maria (Host)</p>
              <p className="text-[9px] text-slate-500">WhatsApp · Call</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:gap-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            aria-label="Stayvo home"
            className="inline-flex items-center leading-none -translate-y-0.5 sm:-translate-y-2"
          >
            <Image
              src="/brand/stayvo-logo-lockup.png"
              alt="Stayvo"
              width={1536}
              height={1024}
              priority
              className="block h-11 w-auto sm:h-[62px]"
            />
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            {(['Features', 'How it works', 'Pricing', 'FAQ'] as const).map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Digital guest portals for short-term rentals
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
              Turn check-in headaches into{' '}
              <span className="text-brand">5-star first impressions</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              Create a beautiful, personalized guest portal for every stay. Share check-in
              instructions, WiFi, house rules, and local tips — all in one link. No app download
              required.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
              >
                Get started free →
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Free forever · No credit card required · Setup in minutes
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { value: '< 5 min', label: 'Average setup time' },
    { value: '0 apps', label: 'Guest downloads needed' },
    { value: '1 link', label: 'Per stay, per guest' },
    { value: '∞', label: 'Guests per link' },
  ];

  return (
    <section className="border-y border-slate-100 bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-brand">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'One link per stay',
    desc: 'Generate a unique shareable link for each guest. Links expire automatically 2 days after checkout — no cleanup needed.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
        <path
          d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101"
          stroke="#E0A24D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.172 13.828a4 4 0 0 0 5.656 0l4-4a4 4 0 1 0-5.656-5.656l-1.1 1.1"
          stroke="#E0A24D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Everything guests need',
    desc: 'Check-in steps, WiFi, parking, house rules, local tips, and host contact — all in one beautiful mobile page.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
        <path
          d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          stroke="#E0A24D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 22V12h6v10"
          stroke="#E0A24D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'No app download required',
    desc: 'Guests tap the link on any device. No sign-up, no download, no friction — instant access, every time.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
        <rect x="5" y="2" width="14" height="20" rx="2" stroke="#E0A24D" strokeWidth="2" />
        <path d="M12 18h.01" stroke="#E0A24D" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Multi-property dashboard',
    desc: 'Manage all your rentals in one place. Organize by location, track guest links, and keep info up to date.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="#E0A24D" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="#E0A24D" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="#E0A24D" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="#E0A24D" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Photos & videos',
    desc: 'Add photos to check-in steps, tips, and custom blocks. Pro users can upload walkthrough videos for even clearer instructions.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#E0A24D" strokeWidth="2" />
        <path
          d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14"
          stroke="#E0A24D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="2" stroke="#E0A24D" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Fully customizable',
    desc: 'Add custom blocks for pool codes, trash schedules, emergency contacts, or anything unique to your property.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
        <path
          d="M12 20h9"
          stroke="#E0A24D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
          stroke="#E0A24D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function Features() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything your guests need, in one link
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
            Stayvo turns your property information into a clean, mobile-first guest portal — like a
            5-star hotel concierge, without the price tag.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-6 transition hover:border-amber-200 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm">
                {f.svg}
              </div>
              <h3 className="font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '1',
    title: 'Add your property',
    desc: "Enter check-in instructions, WiFi details, parking info, house rules, and anything else you want guests to know.",
  },
  {
    number: '2',
    title: 'Customize your portal',
    desc: 'Add photos, local tips, FAQ, and custom blocks. Make it as detailed or as simple as you like — it takes minutes.',
  },
  {
    number: '3',
    title: 'Share the link',
    desc: 'Generate a guest link and send it via WhatsApp, email, or any channel. It expires automatically after checkout.',
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#FDF6EC] py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Ready in 3 simple steps
          </h2>
          <p className="mt-4 text-lg text-slate-500">No technical knowledge required.</p>
        </div>
        <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
          {/* Connector line */}
          <div className="absolute left-[calc(50%/3+50%/6)] right-[calc(50%/3+50%/6)] top-7 hidden h-0.5 bg-amber-200 sm:block" />
          {STEPS.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="relative z-10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-white shadow-lg">
                {step.number}
              </div>
              <h3 className="font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'Up to 3 properties',
  'Guest portal with check-in, WiFi, rules & tips',
  '3 custom blocks per property',
  'Image uploads',
  'Unique guest links with auto-expiry',
  'Host contact page',
];

const PRO_EXTRAS = [
  'Unlimited properties',
  'Multiple location groups',
  'Video uploads in guest portals',
  'FAQ section per property',
  'Up to 15 custom blocks per property',
];

function Pricing() {
  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Start for free. Upgrade when you&apos;re ready to grow.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Free</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="mb-1 text-slate-400">/month</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Perfect for getting started.</p>
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-8 block w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-2xl border-2 border-brand bg-white p-8 shadow-[0_8px_40px_rgba(224,162,77,0.18)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-4 py-1 text-xs font-bold text-white shadow-md">
              MOST POPULAR
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Pro</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$9</span>
                <span className="mb-1 text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-sm font-medium text-amber-600">
                or $90/year{' '}
                <span className="font-normal text-slate-400">(save $18)</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">For serious STR hosts.</p>
            </div>
            <div className="mt-6 flex-1">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Everything in Free, plus:
              </p>
              <ul className="space-y-3">
                {PRO_EXTRAS.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/login"
              className="mt-8 block w-full rounded-full bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              Start with Pro →
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          All plans include unlimited guest links · No credit card required for Free
        </p>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Do my guests need to download an app?',
    a: 'No. Stayvo guest portals are standard web pages. Guests just tap the link on any device — no app download, no sign-up, no friction.',
  },
  {
    q: 'How do guest links work?',
    a: 'You generate a unique link for each stay. It stays active throughout the trip and expires automatically 2 days after checkout. You can also create permanent links for returning guests.',
  },
  {
    q: 'Can I try Stayvo for free?',
    a: 'Yes! The Free plan is free forever — no credit card required. Create up to 3 properties and start sharing guest portals today.',
  },
  {
    q: 'When should I upgrade to Pro?',
    a: 'Upgrade to Pro if you manage more than 3 properties, want to add video walkthroughs, create FAQ sections for guests, or organise properties across multiple locations.',
  },
  {
    q: 'Can I cancel my Pro subscription?',
    a: 'Yes, you can cancel at any time. Your Pro features stay active until the end of your current billing period.',
  },
  {
    q: 'Can I use my own name in the guest link?',
    a: 'Yes. Set your host display name in your profile and guest links will include it — for example, stayvo.app/maria/a3Kf9x — for a personal, professional touch.',
  },
];

function FAQ() {
  return (
    <section id="faq" className="bg-[#FDF6EC] py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Frequently asked questions
        </h2>
        <dl className="mt-12 space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="shrink-0 rounded-full border border-slate-200 p-1 text-slate-400 transition group-open:rotate-45">
                  <svg
                    viewBox="0 0 16 16"
                    className="h-4 w-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    aria-hidden
                  >
                    <line x1="8" y1="2" x2="8" y2="14" />
                    <line x1="2" y1="8" x2="14" y2="8" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{faq.a}</p>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="bg-brand py-20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Start welcoming guests the smart way
        </h2>
        <p className="mt-4 text-lg text-white/80">
          Join STR hosts who use Stayvo to create professional guest portals in minutes.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center rounded-full bg-white px-7 py-3 text-sm font-bold text-brand shadow-lg transition hover:bg-amber-50"
        >
          Get started free — no credit card needed
        </Link>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-slate-900 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link
            href="/"
            aria-label="Stayvo home"
            className="inline-flex items-center leading-none transition hover:opacity-90"
          >
            <Image
              src="/brand/stayvo-logo-lockup-transparent.png"
              alt="Stayvo"
              width={1481}
              height={691}
              className="block h-11 w-auto sm:h-12"
            />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/login" className="transition hover:text-white">
              Log in
            </Link>
          </div>
          <p className="text-xs text-slate-500">© 2026 Stayvo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  return (
    <>
      <ForceLightMode />
      <div className="bg-white text-slate-900">
        <Nav />
        <Hero />
        <StatsStrip />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <CtaBanner />
        <Footer />
      </div>
    </>
  );
}

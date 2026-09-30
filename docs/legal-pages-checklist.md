# Legal pages maintenance (Stayvo Check-in)

Public legal copy lives in:

| Page | File |
|------|------|
| Terms of Service | `app/terms/page.tsx` |
| Privacy Policy | `app/privacy/page.tsx` |
| Support email (used in legal + app) | `lib/support-email.ts` |

After any material product or billing change, update the relevant page(s) and set **`LAST_UPDATED`** at the top of that file to the date you publish the change.

---

## When to update what

| You changed… | Terms (`app/terms/page.tsx`) | Privacy (`app/privacy/page.tsx`) | Also check |
|--------------|------------------------------|----------------------------------|------------|
| **Check-in pricing** (free vs paid) | §11 Pricing, legacy billing | §3 Subscription and billing data | Landing FAQ (`app/page.tsx`) |
| **Legacy Pro pricing** ($9/mo, $90/yr, historical) | §11 Legacy Stayvo Pro billing | §3 (historical amounts if listed) | Support email for legacy billing questions |
| **New subscription checkout** | §11 New paid subscriptions (not offered) | — | No checkout UI or API |
| **Billing interval** (legacy monthly/annual) | §11 Renewal | §3 billing interval | Historical context only |
| **Cancellation / refund rules** | §11 How to cancel, Refunds | §7 retention (if policy changes) | Support contact |
| **Payment provider** | §11 Payment processing | §6 Payments (historical Stripe) | `docs/legacy-billing-wind-down.md` |
| **New host data collected** | — | §2 Information we collect | DB migrations, privacy if guest data too |
| **New guest data collected** | — | §2 Guest link data; §7 host responsibilities | Guest portal forms |
| **New subprocessors** (hosting, DB, storage) | — | §5 Sharing and processors | `.env.example`, README |
| **Account deletion behavior** | §6 (if access ends differently) | §7 Data retention | `app/actions/host-account.ts` |
| **Contact / support email** | §13 Contact | §11 Contact | `lib/support-email.ts` everywhere |
| **Usage limits / fair use** | §10 Usage limits | — | `lib/host-tier.ts` (Check-in caps) |
| **Cookies / analytics / tracking** | — | §2 Technical data; §3 uses | Add cookie section if needed |
| **Legacy Stripe wind-down** | §11 (historical Pro; support for legacy billing) | §3, §6, §7 (legacy billing data retention) | App has no Stripe integration; `host_plan` may still exist in DB until migration 0024 |

---

## Publish checklist

1. Edit `app/terms/page.tsx` and/or `app/privacy/page.tsx`.
2. Bump `LAST_UPDATED` on each changed page.
3. Skim the other page for cross-references (billing ↔ privacy).
4. Commit with a clear message (e.g. `Update Terms and Privacy for annual billing`).
5. Deploy to production so `/terms` and `/privacy` match the current product (Check-in is free; legacy billing via support/historical records only).

---

## Not legal advice

This checklist helps keep product and docs aligned. Have a qualified lawyer review Terms and Privacy before relying on them in regulated markets.

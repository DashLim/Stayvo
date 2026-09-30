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
|--------------|------------------------------|----------------------------------|--------------|
| **Check-in pricing** (free vs paid) | §11 Pricing, legacy billing | §3 Subscription and billing data | Landing FAQ (`app/page.tsx`) |
| **Legacy Pro pricing** ($9/mo, $90/yr, historical) | §11 Legacy Stayvo Pro billing | §3 (historical amounts if listed) | Support / Stripe portal API (no in-app billing UI) |
| **New subscription checkout** (disabled) | §11 New paid subscriptions | — | `POST /api/stripe/checkout` (410), no checkout UI |
| **Billing interval** (legacy monthly/annual) | §11 Renewal, Plan changes | §3 billing interval | Stripe Customer Portal (legacy only) |
| **Cancellation / refund rules** | §11 Access after cancellation, Refunds | §7 retention (if policy changes) | Stripe Customer Portal settings |
| **Payment provider** (not Stripe) | §11 Payment processing | §6 Payments processor | Webhook + portal code |
| **New host data collected** | — | §2 Information we collect | DB migrations, privacy if guest data too |
| **New guest data collected** | — | §2 Guest link data; §7 host responsibilities | Guest portal forms |
| **New subprocessors** (hosting, DB, storage) | — | §5 Sharing and processors | `.env.example`, README |
| **Account deletion behavior** | §6 (if access ends differently) | §6 Data retention | `app/actions/host-account.ts` |
| **Contact / support email** | §13 Contact | §11 Contact | `lib/support-email.ts` everywhere |
| **Usage limits / fair use** | §10 Usage limits | — | Product is free; no tier feature gates |
| **Cookies / analytics / tracking** | — | §2 Technical data; §3 uses | Add cookie section if needed |
| **Legacy Stripe wind-down** | §11 (no new checkout; legacy only) | §3, §6 (legacy billing data) | Portal/webhook retained temporarily; checkout disabled |

---

## Publish checklist

1. Edit `app/terms/page.tsx` and/or `app/privacy/page.tsx`.
2. Bump `LAST_UPDATED` on each changed page.
3. Skim the other page for cross-references (billing ↔ privacy).
4. Commit with a clear message (e.g. `Update Terms and Privacy for annual billing`).
5. Deploy to production so `/terms` and `/privacy` match the current product (Check-in is free; legacy billing only where applicable).

---

## Not legal advice

This checklist helps keep product and docs aligned. Have a qualified lawyer review Terms and Privacy before relying on them in regulated markets.

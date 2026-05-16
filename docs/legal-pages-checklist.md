# Legal pages maintenance (Stayvo)

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
| **Pro price** ($9/mo, $90/yr) or new plan | §11 Plans and pricing | §2 Subscription data (amounts if listed) | Landing FAQ (`app/page.tsx`), Stripe Dashboard prices |
| **Billing interval** (monthly/annual only) | §11 | §2 billing interval | Checkout UI, env price IDs |
| **Cancellation / refund rules** | §11 Access after cancellation, Refunds | §6 retention (if policy changes) | Stripe Customer Portal settings |
| **Payment provider** (not Stripe) | §11 Payment processing | §5 Payments processor | Webhook + checkout code |
| **New host data collected** | — | §2 Information we collect | DB migrations, privacy if guest data too |
| **New guest data collected** | — | §2 Guest link data; §7 host responsibilities | Guest portal forms |
| **New subprocessors** (hosting, DB, storage) | — | §5 Sharing and processors | `.env.example`, README |
| **Account deletion behavior** | §6 (if access ends differently) | §6 Data retention | `app/actions/host-account.ts` |
| **Contact / support email** | §13 Contact | §11 Contact | `lib/support-email.ts` everywhere |
| **Free vs Pro features / limits** | §10 Subscription tiers | — | `lib/host-tier.ts`, product UI |
| **Cookies / analytics / tracking** | — | §2 Technical data; §3 uses | Add cookie section if needed |
| **Going live with real payments** | §11 (live pricing accurate) | §5 Stripe; §2 billing | Vercel live Stripe keys, live webhook |

---

## Publish checklist

1. Edit `app/terms/page.tsx` and/or `app/privacy/page.tsx`.
2. Bump `LAST_UPDATED` on each changed page.
3. Skim the other page for cross-references (billing ↔ privacy).
4. Commit with a clear message (e.g. `Update Terms and Privacy for annual billing`).
5. Deploy to production so `/terms` and `/privacy` match what paying users see.

---

## Not legal advice

This checklist helps keep product and docs aligned. Have a qualified lawyer review Terms and Privacy before relying on them in regulated markets.

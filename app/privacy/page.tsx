import LegalBackButton from '@/app/_components/LegalBackButton';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/support-email';

/** When this policy changes, update LAST_UPDATED and see docs/legal-pages-checklist.md */
const LAST_UPDATED = 'September 30, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="pb-10 pt-0">
      <LegalBackButton />
      <section className="glass mx-auto max-w-3xl rounded-[24px] p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">1. Scope</h2>
            <p className="mt-2">
              This Privacy Policy explains how Stayvo collects, uses, stores, and shares
              information when hosts use Stayvo Check-in and when guests open Stayvo Check-in guest
              links.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">2. Who we are</h2>
            <p className="mt-2">
              Stayvo Check-in is a product of Stayvo, operated by Tiny Land Management, based in Malaysia. Contact:{' '}
              <a
                href={SUPPORT_MAILTO}
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              3. Information we collect
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Host account data:</span> email,
                authentication metadata, profile values such as host display name.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  Subscription and billing data:
                </span>{' '}
                Stayvo Check-in does not require a paid subscription. For accounts that previously had
                legacy billing, we may retain or have retained plan tier and subscription status, billing
                period end date, Stripe customer and subscription identifiers, and billing interval
                (monthly or annual), including in archived records. Payment card numbers and card security
                codes were collected and stored by Stripe, not on Stayvo servers.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Property and content data:</span>{' '}
                property details, guest portal text, links, uploaded media files.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Guest link data:</span> guest name
                (if entered by host), tokenized link usage, open/visit events, and a random visitor identifier stored
                in your browser&apos;s local storage (used only to count unique opens for the host, not for
                advertising).
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Technical data:</span> IP address,
                browser/device information, timestamps, and basic diagnostics logs.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              4. How we use information
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Provide and maintain Stayvo Check-in.</li>
              <li>Generate and deliver guest portal links and hosted media.</li>
              <li>Support account security, fraud prevention, and abuse detection.</li>
              <li>Provide analytics and operational reporting to hosts.</li>
              <li>
                Respond to legacy subscription billing questions and support requests relating to
                historical paid plans where applicable.
              </li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              5. Legal basis (where applicable)
            </h2>
            <p className="mt-2">
              Depending on your location, we process data based on contractual necessity,
              legitimate interests, consent (where required), and legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              6. Sharing and processors
            </h2>
            <p className="mt-2">
              We use trusted infrastructure providers to operate Stayvo Check-in, including hosting,
              database, authentication, and object storage providers (for example Vercel,
              Supabase, and Cloudflare R2). These providers process data on our behalf as needed
              to provide the service.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">Payments:</span> Legacy
              paid subscriptions were processed by Stripe, Inc. Stayvo Check-in no longer integrates with
              Stripe for new billing. Stripe may retain payment method details, billing address where
              provided, and transaction information according to its policies for historical transactions.
              Stripe&apos;s use of your
              data is also governed by{' '}
              <a
                href="https://stripe.com/privacy"
                className="font-medium text-brand underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe&apos;s Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">7. Data retention</h2>
            <p className="mt-2">
              We retain account and property data while an account is active, and for a reasonable
              period afterward for backup, security, and legal purposes. Hosts can request account
              deletion from the Profile page.
            </p>
            <p className="mt-2">
              Billing-related records (such as legacy subscription status and Stripe identifiers) may be
              kept while relevant to an account and as needed for tax, accounting, fraud prevention,
              and legal compliance. Stripe may retain payment records according to its own policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              8. Guests opening a host link (no Stayvo Check-in account)
            </h2>
            <p className="mt-2">
              If you open a guest portal link, you do not create a Stayvo Check-in account. We process limited
              data to display the guide your host published and to operate the link (including
              essential storage and open analytics for the host, as described above).
            </p>
            <p className="mt-2">
              Buttons or links on the guest page (for example Google Maps, Waze, or WhatsApp) open
              third-party services governed by those providers&apos; policies. Stayvo does not require
              guests to accept Stayvo Check-in Terms before viewing property information; hosts agree to Terms
              when they use Stayvo Check-in.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              9. Host responsibilities for guest data
            </h2>
            <p className="mt-2">
              Hosts are responsible for ensuring they have an appropriate legal basis and any
              required permissions to enter and share guest information through Stayvo Check-in.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              10. Security and international transfers
            </h2>
            <p className="mt-2">
              We use reasonable technical and organizational measures to protect data. Your
              information may be processed in countries where our service providers operate.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">11. Your rights</h2>
            <p className="mt-2">
              Depending on your jurisdiction, you may have rights to access, correct, delete, or
              restrict your personal data, and to object to certain processing. To exercise these
              rights, contact us at{' '}
              <a
                href={SUPPORT_MAILTO}
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                UK and European Economic Area (GDPR):
              </span>{' '}
              If you are in the UK or EEA, you may have the right to access your personal data, request
              erasure, receive a copy in a portable format (data portability), restrict processing, and
              object to certain processing, subject to applicable law and exceptions.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                California (CCPA/CPRA):
              </span>{' '}
              If you are a California resident, you may have the right to know what personal information
              we collect and how we use it, the right to delete personal information (subject to
              exceptions), and the right to opt out of the sale or sharing of personal information.
              Stayvo does not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              12. Cookies and local storage
            </h2>
            <p className="mt-2">
              Stayvo Check-in uses browser local storage for essential service functions, including a random
              visitor identifier on guest portal links so hosts can count unique link opens. This
              storage is not used for advertising.
            </p>
            <p className="mt-2">
              Stayvo Check-in does not use advertising cookies or third-party ad tracking on the guest portal
              or host dashboard for behavioral advertising.
            </p>
            <p className="mt-2">
              On our website and host app (not on individual guest portal links for guests), we use
              Google Analytics to understand how pages are used (for example page views and general
              traffic). Google may set analytics cookies or similar technologies. You can learn more
              in{' '}
              <a
                href="https://policies.google.com/privacy"
                className="font-medium text-brand underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google&apos;s Privacy Policy
              </a>
              . Guest portal pages rely on essential local storage only, as described above.
            </p>
            <p className="mt-2">
              If you connect an OTA calendar (for example Airbnb or Booking.com) to a property, we
              store the calendar feed URL securely, fetch reservation dates periodically, and use
              that information to create or update guest links in your dashboard. Calendar data may
              include guest names when your OTA includes them in the feed. We do not send messages to
              guests on your behalf from calendar sync.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">13. Do Not Track</h2>
            <p className="mt-2">
              Some browsers offer a &quot;Do Not Track&quot; (DNT) signal. Stayvo does not currently
              respond to Do Not Track browser signals.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">14. Changes</h2>
            <p className="mt-2">
              We may update this policy from time to time. When we do, we will update the “Last
              updated” date on this page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">15. Contact</h2>
            <p className="mt-2">
              For privacy questions, contact:{' '}
              <a
                href={SUPPORT_MAILTO}
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

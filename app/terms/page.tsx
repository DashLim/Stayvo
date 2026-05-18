import LegalBackButton from '@/app/_components/LegalBackButton';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/support-email';

/** When these Terms change, update LAST_UPDATED and see docs/legal-pages-checklist.md */
const LAST_UPDATED = 'May 17, 2026';

export default function TermsOfServicePage() {
  return (
    <main className="pb-10 pt-0">
      <LegalBackButton />
      <section className="glass mx-auto max-w-3xl rounded-[24px] p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">1. Agreement</h2>
            <p className="mt-2">
              By creating or using a Stayvo account, you agree to these Terms. If you do not
              agree, do not use the service.
            </p>
            <p className="mt-2">
              Stayvo is operated by Lim Chee Siong, based in Malaysia.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">2. Service description</h2>
            <p className="mt-2">
              Stayvo provides tools for hosts to create property guest pages, generate guest links,
              and manage related content and media.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">3. Accounts</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You are responsible for account credentials and all activity under your account.</li>
              <li>You must provide accurate information and keep it updated.</li>
              <li>You must be legally allowed to use the service in your jurisdiction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              4. Host content and guest data
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                You retain ownership of content you submit, including property details and media.
              </li>
              <li>
                You grant Stayvo a limited license to host, process, and display that content to
                operate the service.
              </li>
              <li>
                You are responsible for obtaining any permissions required for guest data you enter
                into Stayvo.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">5. Prohibited use</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Do not use Stayvo for illegal, infringing, abusive, or fraudulent activities.</li>
              <li>Do not upload malicious code or attempt to disrupt the service.</li>
              <li>Do not attempt unauthorized access to other accounts or systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              6. Suspension and termination
            </h2>
            <p className="mt-2">
              We may suspend or terminate access if these Terms are violated or if necessary to
              protect users, Stayvo, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              7. Service availability
            </h2>
            <p className="mt-2">
              We strive to keep Stayvo available, but we do not guarantee uninterrupted or
              error-free operation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">8. Disclaimers</h2>
            <p className="mt-2">
              Stayvo is provided “as is” and “as available,” to the fullest extent allowed by law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              9. Limitation of liability
            </h2>
            <p className="mt-2">
              To the fullest extent permitted by law, Stayvo is not liable for indirect,
              incidental, special, consequential, or punitive damages arising from use of the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              10. Usage limits and fair use
            </h2>
            <p className="mt-2">
              Stayvo reserves the right to review accounts with excessive storage or bandwidth usage
              that may impact platform stability or operating costs, and to contact the account owner
              or take reasonable action to protect the service, regardless of subscription tier.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              11. Paid subscriptions, billing, and cancellation
            </h2>
            <p className="mt-2">
              Stayvo offers subscription tiers (for example Free and Pro) with different feature
              limits. What is included in each tier may change over time; the product will reflect
              what is available on your account.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">Plans and pricing.</span>{' '}
              Stayvo Pro is a recurring paid subscription. At checkout you may choose monthly billing
              (currently USD $9 per month) or annual billing (currently USD $90 per year). Prices,
              currencies, and available plans may change; any change applies to new purchases and, where
              required by law, to renewals after reasonable notice.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">Payment processing.</span>{' '}
              Payments are processed by Stripe, Inc. (or its affiliates). By subscribing, you authorize
              Stripe to charge your payment method on a recurring basis until you cancel. Stayvo does
              not store full payment card numbers; Stripe handles card data according to its own terms
              and privacy policy.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">Renewal.</span> Subscriptions
              renew automatically at the end of each billing period (monthly or annual) unless you
              cancel before the renewal date.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">How to cancel.</span> You
              may cancel from your Stayvo Profile using{' '}
              <span className="font-medium">Manage subscription</span>, which opens Stripe&apos;s secure
              billing portal. You can also contact us at{' '}
              <a
                href={SUPPORT_MAILTO}
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{' '}
              for help.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                Access after cancellation.
              </span>{' '}
              If you cancel, your Pro features remain available until the end of your{' '}
              <span className="font-medium">current paid billing period</span>—whether you are on a
              monthly or annual plan. After that date, your account moves to the Free tier (or as
              otherwise shown in the app). This is the same for monthly and annual subscribers unless
              Stripe or your cancellation choice provides for immediate termination.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">Refunds.</span> Fees are
              generally non-refundable except where required by applicable law. If you believe you were
              charged in error, contact{' '}
              <a
                href={SUPPORT_MAILTO}
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{' '}
              promptly.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                Failed or disputed payments.
              </span>{' '}
              If a payment fails or a subscription lapses, we may suspend or remove Pro features until
              payment is resolved. Chargebacks or abuse of the billing system may result in account
              suspension.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">Plan changes.</span> You
              may switch between monthly and annual billing where offered in the Stripe billing portal,
              subject to Stripe&apos;s rules and any proration Stripe applies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">12. Governing law</h2>
            <p className="mt-2">
              These Terms are governed by the laws of Malaysia. Any disputes shall be resolved in the
              courts of Malaysia.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">13. Age requirement</h2>
            <p className="mt-2">
              You must be at least 18 years old to create a Stayvo account. By using Stayvo, you
              confirm you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">14. Changes to these Terms</h2>
            <p className="mt-2">
              We may update these Terms from time to time. Continued use after updates means you
              accept the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">15. Contact</h2>
            <p className="mt-2">
              For Terms questions, contact:{' '}
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

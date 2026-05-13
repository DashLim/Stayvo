import LegalBackButton from '@/app/_components/LegalBackButton';

const LAST_UPDATED = 'May 9, 2026';

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
              10. Subscription tiers and acceptable use
            </h2>
            <p className="mt-2">
              Stayvo may offer different subscription tiers (for example Free and Pro) with different
              feature limits. What is included in each tier may change over time; the product will
              reflect what is available on your account.
            </p>
            <p className="mt-2">
              Stayvo reserves the right to review accounts with excessive storage or bandwidth usage
              that may impact platform stability or operating costs, and to contact the account owner
              or take reasonable action to protect the service, regardless of subscription tier.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">11. Changes to these Terms</h2>
            <p className="mt-2">
              We may update these Terms from time to time. Continued use after updates means you
              accept the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">12. Contact</h2>
            <p className="mt-2">
              For Terms questions, contact: <span className="font-medium">legal@stayvo.app</span>
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

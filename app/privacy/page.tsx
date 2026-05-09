import LegalBackButton from '@/app/_components/LegalBackButton';

const LAST_UPDATED = 'May 9, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="py-10">
      <LegalBackButton />
      <section className="glass mx-auto max-w-3xl rounded-[24px] p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Scope</h2>
            <p className="mt-2">
              This Privacy Policy explains how Stayvo collects, uses, stores, and shares
              information when hosts use the Stayvo dashboard and when guests open Stayvo guest
              links.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              2. Information we collect
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-slate-900">Host account data:</span> email,
                authentication metadata, profile values such as host display name.
              </li>
              <li>
                <span className="font-medium text-slate-900">Property and content data:</span>{' '}
                property details, guest portal text, links, uploaded media files.
              </li>
              <li>
                <span className="font-medium text-slate-900">Guest link data:</span> guest name
                (if entered by host), tokenized link usage, and open/visit events.
              </li>
              <li>
                <span className="font-medium text-slate-900">Technical data:</span> IP address,
                browser/device information, timestamps, and basic diagnostics logs.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              3. How we use information
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Provide and maintain the Stayvo service.</li>
              <li>Generate and deliver guest portal links and hosted media.</li>
              <li>Support account security, fraud prevention, and abuse detection.</li>
              <li>Provide analytics and operational reporting to hosts.</li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              4. Legal basis (where applicable)
            </h2>
            <p className="mt-2">
              Depending on your location, we process data based on contractual necessity,
              legitimate interests, consent (where required), and legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              5. Sharing and processors
            </h2>
            <p className="mt-2">
              We use trusted infrastructure providers to operate Stayvo, including hosting,
              database, authentication, and object storage providers (for example Vercel,
              Supabase, and Cloudflare R2). These providers process data on our behalf as needed
              to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Data retention</h2>
            <p className="mt-2">
              We retain account and property data while an account is active, and for a reasonable
              period afterward for backup, security, and legal purposes. Hosts can request account
              deletion from the Profile page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              7. Host responsibilities for guest data
            </h2>
            <p className="mt-2">
              Hosts are responsible for ensuring they have an appropriate legal basis and any
              required permissions to enter and share guest information through Stayvo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">
              8. Security and international transfers
            </h2>
            <p className="mt-2">
              We use reasonable technical and organizational measures to protect data. Your
              information may be processed in countries where our service providers operate.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">9. Your rights</h2>
            <p className="mt-2">
              Depending on your jurisdiction, you may have rights to access, correct, delete, or
              restrict your personal data, and to object to certain processing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">10. Changes</h2>
            <p className="mt-2">
              We may update this policy from time to time. When we do, we will update the “Last
              updated” date on this page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">11. Contact</h2>
            <p className="mt-2">
              For privacy questions, contact: <span className="font-medium">privacy@stayvo.app</span>
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

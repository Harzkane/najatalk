export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">NaijaTalk Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-600">Last updated: February 23, 2026</p>

        <section className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
          <p>
            NaijaTalk collects account, content, and transaction data needed to run the platform safely and
            reliably.
          </p>
          <p>
            We use your data for authentication, moderation, fraud prevention, payments, support, and service
            improvements.
          </p>
          <p>
            Public posts, profile details, vote counts, and contest submissions may be visible to other users.
            Sensitive payment or verification records are restricted to authorized admins.
          </p>
          <p>
            We do not sell personal data. We may share data with processors that provide hosting, email,
            payments, and abuse detection under contractual controls.
          </p>
          <p>
            You may request account export or deletion, subject to legal retention requirements for fraud,
            payouts, and audit trails.
          </p>
          <p>
            For privacy requests, contact platform support with your account email and request details.
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">Version & Change Log</h2>
          <p className="mt-2">
            Current version: <strong>v2026.02.23</strong>
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>2026-02-23:</strong> Initial public publication of NaijaTalk Privacy Policy.
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Document owner: NaijaTalk Admin Team. Review cadence: quarterly or when data flows/processors change.
          </p>
        </section>
      </div>
    </main>
  );
}

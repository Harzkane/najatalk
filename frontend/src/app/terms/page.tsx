import HomeLink from "@/components/navigation/HomeLink";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <HomeLink />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">NaijaTalk Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-600">Last updated: February 23, 2026</p>

        <section className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
          <p>
            By using NaijaTalk, you agree to follow platform rules, community standards, and applicable laws.
          </p>
          <p>
            You are responsible for content you post. Spam, fraud, harassment, hate content, impersonation,
            and illegal content are prohibited.
          </p>
          <p>
            NaijaTalk may moderate content and apply account actions including warnings, removals, suspensions,
            and bans when rules are violated.
          </p>
          <p>
            Paid features and wallet actions are subject to verification, fraud controls, and payout policies.
            Disputes may require identity verification.
          </p>
          <p>
            We may update these terms over time. Material changes will be published with a new update date.
          </p>
          <p>
            Continued use of the platform after updates means you accept the revised terms.
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">Version & Change Log</h2>
          <p className="mt-2">
            Current version: <strong>v2026.02.23</strong>
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>2026-02-23:</strong> Initial public publication of NaijaTalk Terms of Service.
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Document owner: NaijaTalk Admin Team. Review cadence: quarterly or on major feature/policy changes.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function ContestPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">NaijaTalk Contest Policy</h1>
        <p className="mt-2 text-sm text-slate-600">Last updated: February 21, 2026</p>

        <section className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
          <p>
            This policy explains how contest submissions are handled, reviewed, and displayed on NaijaTalk.
          </p>
          <p>
            We store contest submission metadata, including accepted terms version and timestamp, to support
            transparency, abuse prevention, and dispute resolution.
          </p>
          <p>
            Public leaderboard pages may show your username/email, submission title, summary, and vote count
            when your entry is approved.
          </p>
          <p>
            Submissions that violate content rules, legal restrictions, or community safety standards may be
            rejected, hidden, or removed without notice.
          </p>
          <p>
            Vote systems are monitored for manipulation. We may reverse suspicious votes and apply enforcement
            actions where needed.
          </p>
          <p>
            If you believe a moderation decision is incorrect, contact support/admin with contest and
            submission IDs for review.
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">Version & Change Log</h2>
          <p className="mt-2">
            Current version: <strong>v2026.02.21</strong>
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>2026-02-21:</strong> Contest moderation/data handling policy baseline published.
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Document owner: NaijaTalk Admin Team. Review cadence: before each sponsor contest cycle.
          </p>
        </section>
      </div>
    </main>
  );
}

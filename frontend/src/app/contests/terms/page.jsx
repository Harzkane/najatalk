export default function ContestTermsPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">NaijaTalk Contest Terms</h1>
        <p className="mt-2 text-sm text-slate-600">Version: 2026-02-21</p>

        <section className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
          <p>
            By entering any contest on NaijaTalk, you agree to these terms and the contest policy.
          </p>
          <p>
            You must submit only content you own or are authorized to use. Plagiarism, impersonation,
            manipulated votes, or fraud can lead to disqualification and account sanctions.
          </p>
          <p>
            Each contest may define an entry limit, start/end time, and additional rules. If a contest
            says one entry per user, extra entries are rejected automatically.
          </p>
          <p>
            Admins and moderators may review, approve, reject, or remove submissions that violate rules
            or platform safety standards.
          </p>
          <p>
            Winner selection may be based on votes, admin review, quality checks, or a mix of criteria
            stated in the contest. NaijaTalk decisions are final for abuse and integrity cases.
          </p>
          <p>
            Prize payouts may require identity and payment verification. Users are responsible for any
            local tax obligations tied to winnings.
          </p>
          <p>
            NaijaTalk may update terms for future contests. Your accepted version is stored with each
            submission for audit and dispute handling.
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">Version & Change Log</h2>
          <p className="mt-2">
            Current version: <strong>v2026.02.21</strong>
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>2026-02-21:</strong> Contest terms baseline published for submit/vote/winner lifecycle.
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

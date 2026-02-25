import Link from "next/link";
import HomeLink from "@/components/navigation/HomeLink";

export default function ModerationAppealsPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <HomeLink />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Moderation & Appeals Policy</h1>
        <p className="mt-2 text-sm text-slate-600">Last updated: February 23, 2026</p>

        <section className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
          <p>
            We enforce rules to protect discussion quality, user safety, and marketplace/payment integrity.
          </p>
          <p>
            Moderation actions include content removal, thread lock, account warning, temporary suspension, and
            permanent ban depending on severity and repeat history.
          </p>
          <p>
            Banned users can submit one appeal with context and evidence. Appeals are reviewed by admin and can
            be approved, rejected, or left pending for further checks.
          </p>
          <p>
            Fraud, coordinated abuse, payment manipulation, or security threats may result in immediate
            enforcement without warning.
          </p>
          <p>
            If your account is banned and eligible for review, submit via the <Link href="/appeal" className="font-medium text-sky-700 hover:underline">appeal page</Link>.
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">Version & Change Log</h2>
          <p className="mt-2">
            Current version: <strong>v2026.02.23</strong>
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>2026-02-23:</strong> Initial public publication of Moderation & Appeals Policy.
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Document owner: NaijaTalk Admin Team. Review cadence: monthly moderation review + quarterly policy refresh.
          </p>
        </section>
      </div>
    </main>
  );
}

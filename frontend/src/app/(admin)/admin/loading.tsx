export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] animate-pulse">
        <div className="mb-4 h-24 rounded-xl bg-slate-200" />
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="h-64 rounded-xl bg-slate-200 lg:w-64 lg:shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-44 rounded-xl bg-slate-200" />
            <div className="h-72 rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

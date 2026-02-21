"use client";

export default function WalletBalanceCards({
  total = 0,
  available = 0,
  held = 0,
  summary = null,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-xl font-semibold text-green-800 mb-4">Wallet Balance</h2>
      <div className="text-gray-800">
        <p className="text-2xl font-bold">₦{Number(total || 0).toLocaleString()}</p>
        <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-600 md:grid-cols-2">
          <p>Available: ₦{Number(available || 0).toLocaleString()}</p>
          <p>Held: ₦{Number(held || 0).toLocaleString()}</p>
        </div>
      </div>
      {summary && (
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-3">
          <p>Credits: ₦{Number((summary.totalCredits || 0) / 100).toLocaleString()}</p>
          <p>Debits: ₦{Number((summary.totalDebits || 0) / 100).toLocaleString()}</p>
          <p>
            Pending Escrow: ₦{Number((summary.pendingEscrowOut || 0) / 100).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

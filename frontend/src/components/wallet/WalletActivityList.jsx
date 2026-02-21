"use client";

export default function WalletActivityList({ transactions = [], formatDate }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-green-800 mb-4">Wallet Activity</h2>
      {transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx._id || `${tx.date}-${tx.amount}`} className="bg-slate-50 p-4 rounded-lg shadow">
              {"walletEffect" in tx ? (
                <p
                  className={`font-semibold ${
                    tx.walletEffect >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {tx.walletEffect >= 0 ? "+" : "-"}₦
                  {Math.abs(tx.walletEffect / 100).toLocaleString()}
                </p>
              ) : (
                <p className="text-gray-800 font-semibold">+₦{tx.amount / 100}</p>
              )}
              <p className="text-xs text-gray-600">
                {"entryKind" in tx
                  ? `Type: ${tx.entryKind.replaceAll("_", " ")}`
                  : `From: ${tx.listingTitle}`}
              </p>
              {"counterparty" in tx && (
                <p className="text-xs text-gray-600">Counterparty: {tx.counterparty}</p>
              )}
              {"recipientId" in tx && tx.recipientId && (
                <p className="text-xs text-gray-600">Destination: {tx.recipientId}</p>
              )}
              {"status" in tx && (
                <p className="text-xs text-gray-600">Status: {tx.status}</p>
              )}
              <p className="text-xs text-gray-600">
                {"listingTitle" in tx && tx.listingTitle ? `Listing: ${tx.listingTitle}` : ""}
              </p>
              <p className="text-xs text-gray-600">Date: {formatDate(tx.date)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No wallet activity yet.</p>
      )}
    </div>
  );
}

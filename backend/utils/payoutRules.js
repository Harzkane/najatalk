export const MIN_PAYOUT_KOBO = 50000;

export const toKobo = (amountNaira) => Math.round(Number(amountNaira) * 100);

export const validatePayoutAmount = (amountNaira) => {
  const amount = Number(amountNaira);
  const amountKobo = toKobo(amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Payout amount must be valid.", amountKobo: 0 };
  }
  if (!Number.isInteger(amountKobo) || amountKobo < MIN_PAYOUT_KOBO) {
    return { ok: false, message: "Minimum payout is ₦500.", amountKobo };
  }
  return { ok: true, amountKobo };
};

export const canCreatePendingPayout = (pendingCount) => Number(pendingCount || 0) < 3;

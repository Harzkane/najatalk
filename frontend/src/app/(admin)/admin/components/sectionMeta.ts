export type AdminSectionId =
  | "overview"
  | "actions"
  | "users"
  | "threads"
  | "reports"
  | "banned"
  | "ads"
  | "payouts"
  | "premium"
  | "rollups"
  | "mismatches"
  | "riskSignals"
  | "platformWallet"
  | "contests";

export const ADMIN_SECTIONS: AdminSectionId[] = [
  "overview",
  "actions",
  "users",
  "threads",
  "reports",
  "banned",
  "ads",
  "payouts",
  "premium",
  "rollups",
  "mismatches",
  "riskSignals",
  "platformWallet",
  "contests",
];

export const ADMIN_SECTION_LABELS: Record<AdminSectionId, string> = {
  overview: "Overview",
  actions: "Admin Actions",
  users: "Users",
  threads: "Threads",
  reports: "Moderation",
  banned: "Users & Bans",
  ads: "Ads Review",
  payouts: "Payouts",
  premium: "Premium Audit",
  rollups: "Settlement Rollups",
  mismatches: "Wallet Alerts",
  riskSignals: "Risk Signals",
  platformWallet: "Platform Wallet",
  contests: "Contests",
};

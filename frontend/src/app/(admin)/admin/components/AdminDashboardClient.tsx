// frontend/src/app/(admin)/admin/components/AdminDashboardClient.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import api from "../../../../utils/api";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminOverview from "./AdminOverview";
import AdminActionsSection from "./AdminActionsSection";
import ReportsSection from "./ReportsSection";
import BannedUsersSection from "./BannedUsersSection";
import AdsSection from "./AdsSection";
import UsersSection from "./UsersSection";
import ThreadsSection from "./ThreadsSection";
import PayoutsSection from "./PayoutsSection";
import PremiumAuditSection from "./PremiumAuditSection";
import SettlementRollupsSection from "./SettlementRollupsSection";
import WalletMismatchSection from "./WalletMismatchSection";
import PlatformWalletSection from "./PlatformWalletSection";
import ContestsSection from "./ContestsSection";
import RiskSignalsSection from "./RiskSignalsSection";
import type {
  Report,
  BannedUser,
  BannedUsersSummary,
  Ad,
  AdsReviewSummary,
  Payout,
  PayoutSummary,
  RollupBucket,
  RollupBucketDetails,
  WalletMismatch,
  WalletMismatchDetails,
  WalletMismatchSummary,
  PremiumAuditRow,
  PremiumAuditSummary,
  PremiumAuditDetails,
  AdminManagedUser,
  AdminUsersSummary,
  AdminUserDetails,
  AdminActionLogRow,
  AdminPagination,
  AdminManagedThread,
  AdminThreadsSummary,
  AdminThreadDetails,
  AdminPayoutDetails,
  PlatformWalletOverview,
  PlatformWalletEntry,
  PlatformWalletEntryDetails,
  PlatformWalletSummary,
  AdminContest,
  AdminContestsSummary,
  AdminContestDetails,
  UserRiskSignalRow,
  UserRiskSignalSummary,
  ContestRiskSignalRow,
  ContestRiskSignalSummary,
} from "./types";
import { ADMIN_SECTION_LABELS, type AdminSectionId } from "./sectionMeta";

type AdminDashboardClientProps = {
  focusSection?: AdminSectionId | "all";
};

type OpsQuickCheckRow = {
  id: string;
  label: string;
  status: "pass" | "fail";
  ms: number;
  detail: string;
};

export default function AdminDashboardClient({
  focusSection = "all",
}: AdminDashboardClientProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [bannedUsersSummary, setBannedUsersSummary] = useState<BannedUsersSummary>({
    total: 0,
    pendingAppeals: 0,
    approvedAppeals: 0,
    rejectedAppeals: 0,
    suspended: 0,
  });
  const [bannedQuery, setBannedQuery] = useState("");
  const [bannedAppealStatusFilter, setBannedAppealStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "none"
  >("all");
  const [bannedSuspendedOnly, setBannedSuspendedOnly] = useState(false);
  const [bannedDateFrom, setBannedDateFrom] = useState("");
  const [bannedDateTo, setBannedDateTo] = useState("");
  const [bannedPage, setBannedPage] = useState(1);
  const [bannedPageSize, setBannedPageSize] = useState(25);
  const [bannedPagination, setBannedPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsSummary, setAdsSummary] = useState<AdsReviewSummary>({
    total: 0,
    pending: 0,
    active: 0,
    paused: 0,
    expired: 0,
    totalBudget: 0,
  });
  const [adsQuery, setAdsQuery] = useState("");
  const [adsStatusFilter, setAdsStatusFilter] = useState<
    "all" | "pending" | "active" | "paused" | "expired"
  >("pending");
  const [adsTypeFilter, setAdsTypeFilter] = useState<"all" | "sidebar" | "banner" | "popup">(
    "all",
  );
  const [adsDateFrom, setAdsDateFrom] = useState("");
  const [adsDateTo, setAdsDateTo] = useState("");
  const [adsPage, setAdsPage] = useState(1);
  const [adsPageSize, setAdsPageSize] = useState(25);
  const [adsPagination, setAdsPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [adminContests, setAdminContests] = useState<AdminContest[]>([]);
  const [adminContestsSummary, setAdminContestsSummary] = useState<AdminContestsSummary>({
    total: 0,
    draft: 0,
    live: 0,
    closed: 0,
    archived: 0,
  });
  const [contestsQuery, setContestsQuery] = useState("");
  const [contestsStatusFilter, setContestsStatusFilter] = useState<
    "all" | "draft" | "live" | "closed" | "archived"
  >("all");
  const [contestsPage, setContestsPage] = useState(1);
  const [contestsPageSize, setContestsPageSize] = useState(25);
  const [contestsPagination, setContestsPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedContestDetails, setSelectedContestDetails] = useState<AdminContestDetails | null>(
    null,
  );
  const [isContestDetailsLoading, setIsContestDetailsLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminManagedUser[]>([]);
  const [adminActions, setAdminActions] = useState<AdminActionLogRow[]>([]);
  const [actionsQuery, setActionsQuery] = useState("");
  const [actionsFilter, setActionsFilter] = useState("all");
  const [actionsDateFrom, setActionsDateFrom] = useState("");
  const [actionsDateTo, setActionsDateTo] = useState("");
  const [actionsPage, setActionsPage] = useState(1);
  const [actionsPageSize, setActionsPageSize] = useState(25);
  const [actionsPagination, setActionsPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUserDetails | null>(null);
  const [isUserDetailsLoading, setIsUserDetailsLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [adminUsersSummary, setAdminUsersSummary] = useState<AdminUsersSummary>({
    total: 0,
    banned: 0,
    admins: 0,
    mods: 0,
    premium: 0,
  });
  const [usersQuery, setUsersQuery] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState<
    "all" | "user" | "mod" | "admin" | "super_admin"
  >("all");
  const [usersBannedOnly, setUsersBannedOnly] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(25);
  const [usersPagination, setUsersPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [adminThreads, setAdminThreads] = useState<AdminManagedThread[]>([]);
  const [selectedThreadDetails, setSelectedThreadDetails] = useState<AdminThreadDetails | null>(
    null,
  );
  const [isThreadDetailsLoading, setIsThreadDetailsLoading] = useState(false);
  const threadDetailsRef = useRef<HTMLElement | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [adminThreadsSummary, setAdminThreadsSummary] = useState<AdminThreadsSummary>({
    total: 0,
    locked: 0,
    sticky: 0,
    solved: 0,
    reported: 0,
  });
  const [threadsQuery, setThreadsQuery] = useState("");
  const [threadsStatusFilter, setThreadsStatusFilter] = useState<
    "all" | "locked" | "sticky" | "solved"
  >("all");
  const [threadsPage, setThreadsPage] = useState(1);
  const [threadsPageSize, setThreadsPageSize] = useState(25);
  const [threadsPagination, setThreadsPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutQuery, setPayoutQuery] = useState("");
  const [selectedPayoutDetails, setSelectedPayoutDetails] =
    useState<AdminPayoutDetails | null>(null);
  const [isPayoutDetailsLoading, setIsPayoutDetailsLoading] = useState(false);
  const payoutDetailsRef = useRef<HTMLElement | null>(null);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary>({
    totalAmount: 0,
    totalCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
    completedAmount: 0,
    completedCount: 0,
    failedAmount: 0,
    failedCount: 0,
  });
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<
    "all" | "pending" | "completed" | "failed"
  >("pending");
  const [payoutDateFrom, setPayoutDateFrom] = useState("");
  const [payoutDateTo, setPayoutDateTo] = useState("");
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutPageSize, setPayoutPageSize] = useState(25);
  const [payoutPagination, setPayoutPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [rollupPeriod, setRollupPeriod] = useState<"daily" | "monthly">(
    "daily",
  );
  const [rollupStatusFilter, setRollupStatusFilter] = useState<
    "all" | "pending" | "completed" | "failed"
  >("all");
  const [rollupDateFrom, setRollupDateFrom] = useState("");
  const [rollupDateTo, setRollupDateTo] = useState("");
  const [rollupTimezone, setRollupTimezone] = useState("Africa/Lagos");
  const [rollupBuckets, setRollupBuckets] = useState<RollupBucket[]>([]);
  const [selectedRollupBucket, setSelectedRollupBucket] = useState<string | null>(
    null,
  );
  const [selectedRollupBucketDetails, setSelectedRollupBucketDetails] =
    useState<RollupBucketDetails | null>(null);
  const [isRollupBucketDetailsLoading, setIsRollupBucketDetailsLoading] =
    useState(false);
  const [rollupBucketPage, setRollupBucketPage] = useState(1);
  const [rollupBucketPageSize, setRollupBucketPageSize] = useState(25);
  const [mismatchSummary, setMismatchSummary] = useState<WalletMismatchSummary>(
    {
      totalUsersChecked: 0,
      mismatchedUsers: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    },
  );
  const [mismatches, setMismatches] = useState<WalletMismatch[]>([]);
  const [mismatchQuery, setMismatchQuery] = useState("");
  const [mismatchSeverity, setMismatchSeverity] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [mismatchMinDeltaKobo, setMismatchMinDeltaKobo] = useState("");
  const [mismatchDateFrom, setMismatchDateFrom] = useState("");
  const [mismatchDateTo, setMismatchDateTo] = useState("");
  const [mismatchPage, setMismatchPage] = useState(1);
  const [mismatchPageSize, setMismatchPageSize] = useState(25);
  const [mismatchPagination, setMismatchPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedMismatchDetails, setSelectedMismatchDetails] =
    useState<WalletMismatchDetails | null>(null);
  const [isMismatchDetailsLoading, setIsMismatchDetailsLoading] = useState(false);
  const [userRiskSummary, setUserRiskSummary] = useState<UserRiskSignalSummary>({
    totalFlagged: 0,
    high: 0,
    medium: 0,
    low: 0,
    windowDays: 14,
    since: new Date(0).toISOString(),
  });
  const [userRiskRows, setUserRiskRows] = useState<UserRiskSignalRow[]>([]);
  const [userRiskSeverityFilter, setUserRiskSeverityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [userRiskWindowDays, setUserRiskWindowDays] = useState("14");
  const [userRiskQuery, setUserRiskQuery] = useState("");
  const [userRiskPage, setUserRiskPage] = useState(1);
  const [userRiskPageSize, setUserRiskPageSize] = useState(25);
  const [userRiskPagination, setUserRiskPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [contestRiskSummary, setContestRiskSummary] = useState<ContestRiskSignalSummary>({
    totalFlagged: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [contestRiskRows, setContestRiskRows] = useState<ContestRiskSignalRow[]>([]);
  const [contestRiskSeverityFilter, setContestRiskSeverityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [contestRiskStatusFilter, setContestRiskStatusFilter] = useState<
    "all" | "draft" | "live" | "closed" | "archived"
  >("all");
  const [contestRiskQuery, setContestRiskQuery] = useState("");
  const [contestRiskPage, setContestRiskPage] = useState(1);
  const [contestRiskPageSize, setContestRiskPageSize] = useState(25);
  const [contestRiskPagination, setContestRiskPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [platformWalletOverview, setPlatformWalletOverview] = useState<PlatformWalletOverview>({
    wallet: { balance: 0, lastUpdated: null },
    summary: {
      totalCredits: 0,
      totalCreditsCount: 0,
      totalDebits: 0,
      totalDebitsCount: 0,
      netFlow: 0,
    },
    dateRange: { dateFrom: null, dateTo: null },
  });
  const [platformWalletSummary, setPlatformWalletSummary] = useState<PlatformWalletSummary>({
    totalCredits: 0,
    totalDebits: 0,
  });
  const [platformWalletEntries, setPlatformWalletEntries] = useState<PlatformWalletEntry[]>([]);
  const [platformWalletQuery, setPlatformWalletQuery] = useState("");
  const [platformWalletStatusFilter, setPlatformWalletStatusFilter] = useState<
    "all" | "pending" | "completed" | "failed"
  >("all");
  const [platformWalletEntryKindFilter, setPlatformWalletEntryKindFilter] = useState<
    "all" | "platform_fee" | "contest_prize_paid"
  >("all");
  const [platformWalletDateFrom, setPlatformWalletDateFrom] = useState("");
  const [platformWalletDateTo, setPlatformWalletDateTo] = useState("");
  const [platformWalletPage, setPlatformWalletPage] = useState(1);
  const [platformWalletPageSize, setPlatformWalletPageSize] = useState(25);
  const [platformWalletPagination, setPlatformWalletPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedPlatformWalletEntryDetails, setSelectedPlatformWalletEntryDetails] =
    useState<PlatformWalletEntryDetails | null>(null);
  const [isPlatformWalletEntryDetailsLoading, setIsPlatformWalletEntryDetailsLoading] =
    useState(false);
  const [premiumAuditRows, setPremiumAuditRows] = useState<PremiumAuditRow[]>(
    [],
  );
  const [premiumQuery, setPremiumQuery] = useState("");
  const [premiumPage, setPremiumPage] = useState(1);
  const [premiumPageSize, setPremiumPageSize] = useState(25);
  const [premiumPagination, setPremiumPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedPremiumDetails, setSelectedPremiumDetails] =
    useState<PremiumAuditDetails | null>(null);
  const [isPremiumDetailsLoading, setIsPremiumDetailsLoading] = useState(false);
  const premiumDetailsRef = useRef<HTMLElement | null>(null);
  const [premiumAuditSummary, setPremiumAuditSummary] =
    useState<PremiumAuditSummary>({
      total: 0,
      mismatchCount: 0,
      completedCount: 0,
      failedCount: 0,
      processingCount: 0,
      initiatedCount: 0,
    });
  const [premiumStatusFilter, setPremiumStatusFilter] = useState<
    "all" | "initiated" | "processing" | "completed" | "failed"
  >("all");
  const [premiumSourceFilter, setPremiumSourceFilter] = useState<
    "all" | "manual" | "webhook"
  >("all");
  const [premiumMismatchOnly, setPremiumMismatchOnly] = useState(false);
  const [premiumDateFrom, setPremiumDateFrom] = useState("");
  const [premiumDateTo, setPremiumDateTo] = useState("");
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize, setReportsPageSize] = useState(25);
  const [reportsDateFrom, setReportsDateFrom] = useState("");
  const [reportsDateTo, setReportsDateTo] = useState("");
  const [reportsPagination, setReportsPagination] = useState<AdminPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [message, setMessage] = useState<string>("");
  const [opsQuickCheckRows, setOpsQuickCheckRows] = useState<OpsQuickCheckRow[]>([]);
  const [opsQuickCheckLastRunAt, setOpsQuickCheckLastRunAt] = useState("");
  const [isOpsQuickCheckRunning, setIsOpsQuickCheckRunning] = useState(false);
  const [slaApiHealthStatus, setSlaApiHealthStatus] = useState("unknown");
  const [slaReadinessStatus, setSlaReadinessStatus] = useState("unknown");
  const [slaDatabaseStatus, setSlaDatabaseStatus] = useState("unknown");
  const [slaUptimeHours, setSlaUptimeHours] = useState(0);
  const [slaLastHealthCheckAt, setSlaLastHealthCheckAt] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [isAccessChecking, setIsAccessChecking] = useState(true);
  const router = useRouter();
  const oldestPendingPayoutHours = useMemo(() => {
    const pendingTimes = payouts
      .filter((row) => row.status === "pending")
      .map((row) => new Date(row.createdAt).getTime())
      .filter((ts) => Number.isFinite(ts));
    if (!pendingTimes.length) return 0;
    const oldestPendingMs = Math.min(...pendingTimes);
    return Math.max(0, (Date.now() - oldestPendingMs) / (1000 * 60 * 60));
  }, [payouts]);
  const oldestPremiumInFlightHours = useMemo(() => {
    const inFlightTimes = premiumAuditRows
      .filter((row) => row.status === "initiated" || row.status === "processing")
      .map((row) => new Date(row.createdAt).getTime())
      .filter((ts) => Number.isFinite(ts));
    if (!inFlightTimes.length) return 0;
    const oldestInFlightMs = Math.min(...inFlightTimes);
    return Math.max(0, (Date.now() - oldestInFlightMs) / (1000 * 60 * 60));
  }, [premiumAuditRows]);
  const payoutFailureRatePct = useMemo(() => {
    if (!payoutSummary.totalCount) return 0;
    return (payoutSummary.failedCount / payoutSummary.totalCount) * 100;
  }, [payoutSummary.failedCount, payoutSummary.totalCount]);
  const premiumFailureRatePct = useMemo(() => {
    if (!premiumAuditSummary.total) return 0;
    return (premiumAuditSummary.failedCount / premiumAuditSummary.total) * 100;
  }, [premiumAuditSummary.failedCount, premiumAuditSummary.total]);
  const premiumInFlightCount = premiumAuditSummary.initiatedCount + premiumAuditSummary.processingCount;
  const getErrorMessage = (err: unknown, fallback: string) => {
    if (isAxiosError<{ message?: string }>(err)) {
      return err.response?.data?.message || fallback;
    }
    return fallback;
  };

  const fetchSlaSnapshot = useCallback(async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const serviceBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
    try {
      const fetchReadiness = async () => {
        try {
          return await api.get<{ status?: string; checks?: { database?: { status?: string } } }>(
            `${serviceBaseUrl}/ready`,
          );
        } catch (err) {
          if (isAxiosError(err) && err.response?.status === 404) {
            return api.get<{ status?: string; checks?: { database?: { status?: string } } }>(
              `${serviceBaseUrl}/health/readiness`,
            );
          }
          throw err;
        }
      };
      const [healthRes, readinessRes] = await Promise.all([
        api.get<{ status?: string; uptimeSeconds?: number }>(`${serviceBaseUrl}/health`),
        fetchReadiness(),
      ]);
      const uptimeSeconds = Number(healthRes.data?.uptimeSeconds || 0);
      setSlaApiHealthStatus(String(healthRes.data?.status || "unknown"));
      setSlaReadinessStatus(String(readinessRes.data?.status || "unknown"));
      setSlaDatabaseStatus(String(readinessRes.data?.checks?.database?.status || "unknown"));
      setSlaUptimeHours(uptimeSeconds > 0 ? uptimeSeconds / 3600 : 0);
      setSlaLastHealthCheckAt(new Date().toISOString());
    } catch (err) {
      console.error("SLA snapshot fetch error:", err);
      setSlaApiHealthStatus("unknown");
      setSlaReadinessStatus("unknown");
      setSlaDatabaseStatus("unknown");
      setSlaLastHealthCheckAt(new Date().toISOString());
    }
  }, []);

  const runOpsQuickCheck = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Please login again before running quick checks.");
      return;
    }
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const serviceBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
    const authHeaders = { Authorization: `Bearer ${token}` };
    const rows: OpsQuickCheckRow[] = [];
    const pushResult = (
      id: string,
      label: string,
      status: "pass" | "fail",
      ms: number,
      detail: string,
    ) => {
      rows.push({ id, label, status, ms, detail });
    };

    const runCheck = async (
      id: string,
      label: string,
      fn: () => Promise<void>,
    ) => {
      const startedAt = performance.now();
      try {
        await fn();
        pushResult(id, label, "pass", Math.round(performance.now() - startedAt), "ok");
      } catch (err: unknown) {
        const detail = isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message || `http_${err.response?.status || "error"}`
          : "unexpected_error";
        pushResult(id, label, "fail", Math.round(performance.now() - startedAt), detail);
      }
    };

    setIsOpsQuickCheckRunning(true);
    try {
      await runCheck("backend.health", "Backend Health", async () => {
        const res = await api.get<{ status?: string }>(`${serviceBaseUrl}/health`);
        if (!String(res.data?.status || "").toLowerCase().includes("ok")) {
          throw new Error("health_not_ok");
        }
      });
      await runCheck("backend.ready", "Backend Readiness", async () => {
        let res;
        try {
          res = await api.get<{ status?: string }>(`${serviceBaseUrl}/ready`);
        } catch (err) {
          if (isAxiosError(err) && err.response?.status === 404) {
            res = await api.get<{ status?: string }>(`${serviceBaseUrl}/health/readiness`);
          } else {
            throw err;
          }
        }
        if (!String(res.data?.status || "").toLowerCase().includes("ready")) {
          throw new Error("readiness_not_ready");
        }
      });
      await runCheck("api.threads", "Threads List", async () => {
        await api.get("/threads", { params: { page: 1, limit: 1 } });
      });
      await runCheck("api.contests", "Contests List", async () => {
        await api.get("/contests", { params: { page: 1, limit: 1 } });
      });
      await runCheck("api.user.me", "Current User", async () => {
        await api.get("/users/me", { headers: authHeaders });
      });
      await runCheck("api.admin.users", "Admin Users", async () => {
        await api.get("/users/admin/users", {
          headers: authHeaders,
          params: { page: 1, pageSize: 1 },
        });
      });
    } finally {
      const passed = rows.filter((row) => row.status === "pass").length;
      const total = rows.length;
      setOpsQuickCheckRows(rows);
      setOpsQuickCheckLastRunAt(new Date().toISOString());
      setMessage(`Ops quick check: ${passed}/${total} checks passed.`);
      setIsOpsQuickCheckRunning(false);
    }
  }, []);

  const triggerExternalSlaAlerts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await api.post<{
        message?: string;
        sent?: Array<{ key: string }>;
      }>(
        "/users/admin/sla-alerts/dispatch",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (Array.isArray(res.data?.sent) && res.data.sent.length > 0) {
        setMessage(res.data.message || "SLA alerts dispatched.");
      }
    } catch (err) {
      console.error("SLA alert dispatch error:", err);
    }
  }, []);

  const fetchPendingAds = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        ads: Ad[];
        summary: AdsReviewSummary;
        pagination?: AdminPagination;
        message: string;
      }>("/ads/admin/review", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: adsQuery || undefined,
          status: adsStatusFilter,
          type: adsTypeFilter,
          dateFrom: adsDateFrom || undefined,
          dateTo: adsDateTo || undefined,
          page: adsPage,
          pageSize: adsPageSize,
        },
      });
      setAds(res.data.ads || []);
      setAdsSummary(
        res.data.summary || {
          total: 0,
          pending: 0,
          active: 0,
          paused: 0,
          expired: 0,
          totalBudget: 0,
        },
      );
      setAdsPagination(
        res.data.pagination || {
          page: adsPage,
          pageSize: adsPageSize,
          total: res.data.summary?.total || res.data.ads?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: adsPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch ads error:", err);
      setMessage("Ads fetch scatter o!");
      setAds([]);
    }
  }, [
    adsQuery,
    adsStatusFilter,
    adsTypeFilter,
    adsDateFrom,
    adsDateTo,
    adsPage,
    adsPageSize,
  ]);

  const fetchAdminUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        users: AdminManagedUser[];
        summary: AdminUsersSummary;
        pagination?: AdminPagination;
      }>("/users/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: usersQuery || undefined,
          role: usersRoleFilter,
          bannedOnly: usersBannedOnly ? "true" : undefined,
          page: usersPage,
          pageSize: usersPageSize,
        },
      });
      setAdminUsers(res.data.users || []);
      setAdminUsersSummary(
        res.data.summary || { total: 0, banned: 0, admins: 0, mods: 0, premium: 0 },
      );
      setUsersPagination(
        res.data.pagination || {
          page: usersPage,
          pageSize: usersPageSize,
          total: res.data.users?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: usersPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch admin users error:", err);
      setMessage("Users list fetch scatter o!");
      setAdminUsers([]);
    }
  }, [usersQuery, usersRoleFilter, usersBannedOnly, usersPage, usersPageSize]);

  const fetchAdminActions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{ actions: AdminActionLogRow[]; pagination?: AdminPagination }>(
        "/users/admin/actions",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            q: actionsQuery || undefined,
            action: actionsFilter,
            dateFrom: actionsDateFrom || undefined,
            dateTo: actionsDateTo || undefined,
            page: actionsPage,
            pageSize: actionsPageSize,
          },
        },
      );
      setAdminActions(res.data.actions || []);
      setActionsPagination(
        res.data.pagination || {
          page: actionsPage,
          pageSize: actionsPageSize,
          total: res.data.actions?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: actionsPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch admin actions error:", err);
      setMessage("Admin action logs fetch scatter o!");
      setAdminActions([]);
    }
  }, [
    actionsQuery,
    actionsFilter,
    actionsDateFrom,
    actionsDateTo,
    actionsPage,
    actionsPageSize,
  ]);

  const fetchAdminThreads = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        threads: AdminManagedThread[];
        summary: AdminThreadsSummary;
        pagination?: AdminPagination;
      }>("/threads/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: threadsQuery || undefined,
          status: threadsStatusFilter,
          page: threadsPage,
          pageSize: threadsPageSize,
        },
      });
      setAdminThreads(res.data.threads || []);
      setAdminThreadsSummary(
        res.data.summary || {
          total: 0,
          locked: 0,
          sticky: 0,
          solved: 0,
          reported: 0,
        },
      );
      setThreadsPagination(
        res.data.pagination || {
          page: threadsPage,
          pageSize: threadsPageSize,
          total: res.data.threads?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: threadsPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch admin threads error:", err);
      setMessage("Threads list fetch scatter o!");
      setAdminThreads([]);
    }
  }, [threadsQuery, threadsStatusFilter, threadsPage, threadsPageSize]);

  const fetchAdminContests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        contests: AdminContest[];
        summary: AdminContestsSummary;
        pagination?: AdminPagination;
      }>("/contests/admin/list", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: contestsQuery || undefined,
          status: contestsStatusFilter,
          page: contestsPage,
          pageSize: contestsPageSize,
        },
      });
      setAdminContests(res.data.contests || []);
      setAdminContestsSummary(
        res.data.summary || { total: 0, draft: 0, live: 0, closed: 0, archived: 0 },
      );
      setContestsPagination(
        res.data.pagination || {
          page: contestsPage,
          pageSize: contestsPageSize,
          total: res.data.summary?.total || res.data.contests?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: contestsPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch admin contests error:", err);
      setMessage("Contests list fetch scatter o!");
      setAdminContests([]);
    }
  }, [contestsQuery, contestsStatusFilter, contestsPage, contestsPageSize]);

  useEffect(() => {
    setSelectedUserIds((prev) => prev.filter((id) => adminUsers.some((user) => user._id === id)));
  }, [adminUsers]);

  useEffect(() => {
    setSelectedThreadIds((prev) =>
      prev.filter((id) => adminThreads.some((thread) => thread._id === id)),
    );
  }, [adminThreads]);

  useEffect(() => {
    setUsersPage(1);
  }, [usersQuery, usersRoleFilter, usersBannedOnly, usersPageSize]);

  useEffect(() => {
    setThreadsPage(1);
  }, [threadsQuery, threadsStatusFilter, threadsPageSize]);

  useEffect(() => {
    setActionsPage(1);
  }, [actionsQuery, actionsFilter, actionsDateFrom, actionsDateTo, actionsPageSize]);

  useEffect(() => {
    setReportsPage(1);
  }, [reportsDateFrom, reportsDateTo, reportsPageSize]);

  useEffect(() => {
    setBannedPage(1);
  }, [
    bannedQuery,
    bannedAppealStatusFilter,
    bannedSuspendedOnly,
    bannedDateFrom,
    bannedDateTo,
    bannedPageSize,
  ]);

  useEffect(() => {
    setAdsPage(1);
  }, [adsQuery, adsStatusFilter, adsTypeFilter, adsDateFrom, adsDateTo, adsPageSize]);

  useEffect(() => {
    setContestsPage(1);
  }, [contestsQuery, contestsStatusFilter, contestsPageSize]);

  useEffect(() => {
    if (!selectedThreadDetails) return;
    threadDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedThreadDetails]);

  useEffect(() => {
    setPayoutPage(1);
  }, [payoutQuery, payoutStatusFilter, payoutDateFrom, payoutDateTo, payoutPageSize]);

  useEffect(() => {
    if (!selectedPayoutDetails) return;
    payoutDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedPayoutDetails]);

  useEffect(() => {
    setPremiumPage(1);
  }, [
    premiumQuery,
    premiumStatusFilter,
    premiumSourceFilter,
    premiumMismatchOnly,
    premiumDateFrom,
    premiumDateTo,
    premiumPageSize,
  ]);

  useEffect(() => {
    setMismatchPage(1);
  }, [
    mismatchQuery,
    mismatchSeverity,
    mismatchMinDeltaKobo,
    mismatchDateFrom,
    mismatchDateTo,
    mismatchPageSize,
  ]);

  useEffect(() => {
    setUserRiskPage(1);
  }, [userRiskQuery, userRiskSeverityFilter, userRiskWindowDays, userRiskPageSize]);

  useEffect(() => {
    setContestRiskPage(1);
  }, [contestRiskQuery, contestRiskSeverityFilter, contestRiskStatusFilter, contestRiskPageSize]);

  useEffect(() => {
    setPlatformWalletPage(1);
  }, [
    platformWalletQuery,
    platformWalletStatusFilter,
    platformWalletEntryKindFilter,
    platformWalletDateFrom,
    platformWalletDateTo,
    platformWalletPageSize,
  ]);

  useEffect(() => {
    setRollupBucketPage(1);
  }, [rollupBucketPageSize]);

  useEffect(() => {
    setSelectedRollupBucket(null);
    setSelectedRollupBucketDetails(null);
    setRollupBucketPage(1);
  }, [rollupPeriod, rollupStatusFilter, rollupDateFrom, rollupDateTo, rollupTimezone]);

  useEffect(() => {
    if (!selectedPremiumDetails) return;
    premiumDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedPremiumDetails]);

  const fetchPendingPayouts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        payouts: Payout[];
        summary: PayoutSummary;
        pagination?: AdminPagination;
        message: string;
      }>("/users/admin/payouts", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: payoutQuery || undefined,
          status: payoutStatusFilter,
          dateFrom: payoutDateFrom || undefined,
          dateTo: payoutDateTo || undefined,
          page: payoutPage,
          pageSize: payoutPageSize,
        },
      });
      setPayouts(res.data.payouts || []);
      setPayoutSummary(
        res.data.summary || {
          totalAmount: 0,
          totalCount: 0,
          pendingAmount: 0,
          pendingCount: 0,
          completedAmount: 0,
          completedCount: 0,
          failedAmount: 0,
          failedCount: 0,
        },
      );
      setPayoutPagination(
        res.data.pagination || {
          page: payoutPage,
          pageSize: payoutPageSize,
          total: res.data.summary?.totalCount || res.data.payouts?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: payoutPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch payouts error:", err);
      setMessage("Payout queue fetch scatter o!");
    }
  }, [payoutQuery, payoutStatusFilter, payoutDateFrom, payoutDateTo, payoutPage, payoutPageSize]);

  const fetchPayoutRollups = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        buckets: RollupBucket[];
        period: "daily" | "monthly";
        timezone: string;
        message: string;
      }>(
        "/users/admin/payouts/rollups",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            period: rollupPeriod,
            status: rollupStatusFilter,
            timezone: rollupTimezone || undefined,
            dateFrom: rollupDateFrom || undefined,
            dateTo: rollupDateTo || undefined,
          },
        },
      );
      setRollupBuckets(res.data.buckets || []);
    } catch (err) {
      console.error("Fetch payout rollups error:", err);
      setMessage("Payout rollups fetch scatter o!");
    }
  }, [rollupPeriod, rollupStatusFilter, rollupTimezone, rollupDateFrom, rollupDateTo]);

  const fetchWalletMismatches = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        summary: {
          totalUsersChecked: number;
          mismatchedUsers: number;
          highCount: number;
          mediumCount: number;
          lowCount: number;
        };
        pagination?: AdminPagination;
        mismatches: WalletMismatch[];
      }>("/users/admin/wallet-mismatches", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: mismatchQuery || undefined,
          severity: mismatchSeverity,
          minDeltaKobo: mismatchMinDeltaKobo || undefined,
          dateFrom: mismatchDateFrom || undefined,
          dateTo: mismatchDateTo || undefined,
          page: mismatchPage,
          pageSize: mismatchPageSize,
        },
      });
      setMismatchSummary(
        res.data.summary || {
          totalUsersChecked: 0,
          mismatchedUsers: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
        },
      );
      setMismatches(res.data.mismatches || []);
      setMismatchPagination(
        res.data.pagination || {
          page: mismatchPage,
          pageSize: mismatchPageSize,
          total: res.data.summary?.mismatchedUsers || res.data.mismatches?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: mismatchPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch mismatch error:", err);
      setMessage("Wallet mismatch scan scatter o!");
    }
  }, [
    mismatchQuery,
    mismatchSeverity,
    mismatchMinDeltaKobo,
    mismatchDateFrom,
    mismatchDateTo,
    mismatchPage,
    mismatchPageSize,
  ]);

  const fetchUserRiskSignals = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        summary: UserRiskSignalSummary;
        pagination?: AdminPagination;
        rows: UserRiskSignalRow[];
      }>("/users/admin/risk-signals", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: userRiskQuery || undefined,
          severity: userRiskSeverityFilter,
          windowDays: userRiskWindowDays || undefined,
          page: userRiskPage,
          pageSize: userRiskPageSize,
        },
      });
      setUserRiskSummary(
        res.data.summary || {
          totalFlagged: 0,
          high: 0,
          medium: 0,
          low: 0,
          windowDays: Number(userRiskWindowDays || 14),
          since: new Date(0).toISOString(),
        },
      );
      setUserRiskRows(res.data.rows || []);
      setUserRiskPagination(
        res.data.pagination || {
          page: userRiskPage,
          pageSize: userRiskPageSize,
          total: res.data.summary?.totalFlagged || res.data.rows?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: userRiskPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch user risk signals error:", err);
      setMessage("User risk signals fetch scatter o!");
      setUserRiskRows([]);
      setUserRiskSummary({
        totalFlagged: 0,
        high: 0,
        medium: 0,
        low: 0,
        windowDays: Number(userRiskWindowDays || 14),
        since: new Date(0).toISOString(),
      });
    }
  }, [
    userRiskQuery,
    userRiskSeverityFilter,
    userRiskWindowDays,
    userRiskPage,
    userRiskPageSize,
  ]);

  const fetchContestRiskSignals = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        summary: ContestRiskSignalSummary;
        pagination?: AdminPagination;
        rows: ContestRiskSignalRow[];
      }>("/contests/admin/risk-signals", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: contestRiskQuery || undefined,
          severity: contestRiskSeverityFilter,
          status: contestRiskStatusFilter,
          page: contestRiskPage,
          pageSize: contestRiskPageSize,
        },
      });
      setContestRiskSummary(
        res.data.summary || {
          totalFlagged: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      );
      setContestRiskRows(res.data.rows || []);
      setContestRiskPagination(
        res.data.pagination || {
          page: contestRiskPage,
          pageSize: contestRiskPageSize,
          total: res.data.summary?.totalFlagged || res.data.rows?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: contestRiskPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch contest risk signals error:", err);
      setMessage("Contest risk signals fetch scatter o!");
      setContestRiskRows([]);
      setContestRiskSummary({
        totalFlagged: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
    }
  }, [
    contestRiskQuery,
    contestRiskSeverityFilter,
    contestRiskStatusFilter,
    contestRiskPage,
    contestRiskPageSize,
  ]);

  const fetchPlatformWalletOverview = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<PlatformWalletOverview>("/users/admin/platform-wallet/overview", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          dateFrom: platformWalletDateFrom || undefined,
          dateTo: platformWalletDateTo || undefined,
        },
      });
      setPlatformWalletOverview(
        res.data || {
          wallet: { balance: 0, lastUpdated: null },
          summary: {
            totalCredits: 0,
            totalCreditsCount: 0,
            totalDebits: 0,
            totalDebitsCount: 0,
            netFlow: 0,
          },
          dateRange: { dateFrom: null, dateTo: null },
        },
      );
    } catch (err) {
      console.error("Fetch platform wallet overview error:", err);
      setMessage("Platform wallet overview fetch scatter o!");
    }
  }, [platformWalletDateFrom, platformWalletDateTo]);

  const fetchPlatformWalletEntries = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        entries: PlatformWalletEntry[];
        summary: PlatformWalletSummary;
        pagination?: AdminPagination;
      }>("/users/admin/platform-wallet/entries", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: platformWalletQuery || undefined,
          status: platformWalletStatusFilter,
          entryKind: platformWalletEntryKindFilter,
          dateFrom: platformWalletDateFrom || undefined,
          dateTo: platformWalletDateTo || undefined,
          page: platformWalletPage,
          pageSize: platformWalletPageSize,
        },
      });
      setPlatformWalletEntries(res.data.entries || []);
      setPlatformWalletSummary(
        res.data.summary || {
          totalCredits: 0,
          totalDebits: 0,
        },
      );
      setPlatformWalletPagination(
        res.data.pagination || {
          page: platformWalletPage,
          pageSize: platformWalletPageSize,
          total: res.data.entries?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: platformWalletPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch platform wallet entries error:", err);
      setMessage("Platform wallet entries fetch scatter o!");
      setPlatformWalletEntries([]);
      setPlatformWalletSummary({ totalCredits: 0, totalDebits: 0 });
    }
  }, [
    platformWalletQuery,
    platformWalletStatusFilter,
    platformWalletEntryKindFilter,
    platformWalletDateFrom,
    platformWalletDateTo,
    platformWalletPage,
    platformWalletPageSize,
  ]);

  const handleViewPlatformWalletEntryDetails = async (entryId: string) => {
    try {
      setIsPlatformWalletEntryDetailsLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get<PlatformWalletEntryDetails>(
        `/users/admin/platform-wallet/entries/${entryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSelectedPlatformWalletEntryDetails(res.data);
      setMessage("Platform wallet entry details loaded.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Platform wallet entry details fetch scatter o!"));
    } finally {
      setIsPlatformWalletEntryDetailsLoading(false);
    }
  };

  const handleViewRollupBucketDetails = useCallback(
    async (bucket: string, page = rollupBucketPage, pageSize = rollupBucketPageSize) => {
      try {
        setIsRollupBucketDetailsLoading(true);
        const token = localStorage.getItem("token");
        const res = await api.get<RollupBucketDetails>(
          `/users/admin/payouts/rollups/${encodeURIComponent(bucket)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              period: rollupPeriod,
              status: rollupStatusFilter,
              timezone: rollupTimezone || undefined,
              dateFrom: rollupDateFrom || undefined,
              dateTo: rollupDateTo || undefined,
              page,
              pageSize,
            },
          },
        );
        setSelectedRollupBucket(bucket);
        setSelectedRollupBucketDetails(res.data);
        setRollupBucketPage(res.data.pagination?.page || page);
        setRollupBucketPageSize(res.data.pagination?.pageSize || pageSize);
        setMessage(`Rollup bucket ${bucket} loaded.`);
      } catch (err: unknown) {
        setMessage(getErrorMessage(err, "Rollup bucket details fetch scatter o!"));
      } finally {
        setIsRollupBucketDetailsLoading(false);
      }
    },
    [
      rollupPeriod,
      rollupStatusFilter,
      rollupTimezone,
      rollupDateFrom,
      rollupDateTo,
      rollupBucketPage,
      rollupBucketPageSize,
    ],
  );

  useEffect(() => {
    if (!selectedRollupBucket) return;
    handleViewRollupBucketDetails(selectedRollupBucket, rollupBucketPage, rollupBucketPageSize);
  }, [selectedRollupBucket, rollupBucketPage, rollupBucketPageSize, handleViewRollupBucketDetails]);

  const handleViewMismatchDetails = useCallback(
    async (userId: string) => {
      try {
        setIsMismatchDetailsLoading(true);
        const token = localStorage.getItem("token");
        const res = await api.get<WalletMismatchDetails>(
          `/users/admin/wallet-mismatches/${userId}/details`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              dateFrom: mismatchDateFrom || undefined,
              dateTo: mismatchDateTo || undefined,
            },
          },
        );
        setSelectedMismatchDetails(res.data);
        setMessage("Wallet mismatch details loaded.");
      } catch (err: unknown) {
        setMessage(getErrorMessage(err, "Wallet mismatch details fetch scatter o!"));
      } finally {
        setIsMismatchDetailsLoading(false);
      }
    },
    [mismatchDateFrom, mismatchDateTo],
  );

  const fetchPremiumPaymentsAudit = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        summary: PremiumAuditSummary;
        pagination?: AdminPagination;
        rows: PremiumAuditRow[];
      }>("/premium/admin/payments", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: premiumQuery || undefined,
          status: premiumStatusFilter,
          source: premiumSourceFilter,
          mismatchOnly: premiumMismatchOnly ? "true" : undefined,
          dateFrom: premiumDateFrom || undefined,
          dateTo: premiumDateTo || undefined,
          page: premiumPage,
          pageSize: premiumPageSize,
        },
      });
      setPremiumAuditSummary(
        res.data.summary || {
          total: 0,
          mismatchCount: 0,
          completedCount: 0,
          failedCount: 0,
          processingCount: 0,
          initiatedCount: 0,
        },
      );
      setPremiumAuditRows(res.data.rows || []);
      setPremiumPagination(
        res.data.pagination || {
          page: premiumPage,
          pageSize: premiumPageSize,
          total: res.data.summary?.total || res.data.rows?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: premiumPage > 1,
        },
      );
    } catch (err) {
      console.error("Fetch premium audit error:", err);
      setMessage("Premium audit fetch scatter o!");
    }
  }, [
    premiumQuery,
    premiumPage,
    premiumPageSize,
    premiumStatusFilter,
    premiumSourceFilter,
    premiumMismatchOnly,
    premiumDateFrom,
    premiumDateTo,
  ]);

  const handleViewPremiumPaymentDetails = async (paymentId: string) => {
    try {
      setIsPremiumDetailsLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get<PremiumAuditDetails>(`/premium/admin/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedPremiumDetails(res.data);
      setMessage("Premium payment details loaded.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Premium payment details fetch scatter o!"));
    } finally {
      setIsPremiumDetailsLoading(false);
    }
  };

  const decidePayout = async (payoutId: string, approve: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/users/admin/payouts/${payoutId}/decide`,
        { approve },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      fetchPendingPayouts();
      if (selectedPayoutDetails?.payout._id === payoutId) {
        handleViewPayoutDetails(payoutId);
      }
    } catch (err) {
      console.error("Payout decision error:", err);
      setMessage("Payout decision scatter o!");
    }
  };

  const handleViewPayoutDetails = async (payoutId: string) => {
    try {
      setIsPayoutDetailsLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get<AdminPayoutDetails>(`/users/admin/payouts/${payoutId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedPayoutDetails(res.data);
      setMessage("Payout details loaded.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Payout details fetch scatter o!"));
    } finally {
      setIsPayoutDetailsLoading(false);
    }
  };

  const approveAd = async (adId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/ads/${adId}`,
        { status: "active", startDate: new Date() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      fetchPendingAds();
    } catch (err) {
      console.error("Approve ad error:", err);
      setMessage("Ad approval scatter o!");
    }
  };

  const rejectAd = async (adId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.delete<{ message: string }>(`/ads/${adId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
      fetchPendingAds();
    } catch (err) {
      console.error("Reject ad error:", err);
      setMessage("Ad rejection scatter o!");
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        reports: Report[];
        pagination?: AdminPagination;
        message: string;
      }>(
        "/threads/reports",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: reportsPage,
            pageSize: reportsPageSize,
            dateFrom: reportsDateFrom || undefined,
            dateTo: reportsDateTo || undefined,
          },
        },
      );
      setReports(res.data.reports || []);
      setReportsPagination(
        res.data.pagination || {
          page: reportsPage,
          pageSize: reportsPageSize,
          total: res.data.reports?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: reportsPage > 1,
        },
      );
      setMessage(res.data.message);
    } catch (err: unknown) {
      const fallback = "Fetch scatter o!";
      setMessage(getErrorMessage(err, fallback));
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      }
      setReports([]);
    }
  }, [router, reportsPage, reportsPageSize, reportsDateFrom, reportsDateTo]);

  const fetchBannedUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<{
        bannedUsers: BannedUser[];
        summary: BannedUsersSummary;
        pagination?: AdminPagination;
        message: string;
      }>("/users/banned", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: bannedQuery || undefined,
          appealStatus: bannedAppealStatusFilter,
          suspendedOnly: bannedSuspendedOnly ? "true" : undefined,
          dateFrom: bannedDateFrom || undefined,
          dateTo: bannedDateTo || undefined,
          page: bannedPage,
          pageSize: bannedPageSize,
        },
      });
      setBannedUsers(res.data.bannedUsers || []);
      setBannedUsersSummary(
        res.data.summary || {
          total: 0,
          pendingAppeals: 0,
          approvedAppeals: 0,
          rejectedAppeals: 0,
          suspended: 0,
        },
      );
      setBannedPagination(
        res.data.pagination || {
          page: bannedPage,
          pageSize: bannedPageSize,
          total: res.data.summary?.total || res.data.bannedUsers?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: bannedPage > 1,
        },
      );
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Fetch banned users scatter o!"));
      setBannedUsers([]);
      setBannedUsersSummary({
        total: 0,
        pendingAppeals: 0,
        approvedAppeals: 0,
        rejectedAppeals: 0,
        suspended: 0,
      });
    }
  }, [
    bannedQuery,
    bannedAppealStatusFilter,
    bannedSuspendedOnly,
    bannedDateFrom,
    bannedDateTo,
    bannedPage,
    bannedPageSize,
  ]);

  useEffect(() => {
    const verifyAccessAndLoad = async () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      if (!token) {
        setIsAccessChecking(false);
        return;
      }
      try {
        const me = await api.get<{ role?: string }>("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const role = String(me.data?.role || "");
        const isAllowed = role === "admin" || role === "super_admin";
        setIsAdminAuthorized(isAllowed);
        if (!isAllowed) {
          setMessage("You no get admin access.");
          router.push("/threads");
          return;
        }
        fetchReports();
        fetchBannedUsers();
        fetchPendingAds();
        fetchAdminUsers();
        fetchAdminActions();
        fetchAdminThreads();
        fetchAdminContests();
        fetchPendingPayouts();
        fetchPayoutRollups();
        fetchWalletMismatches();
        fetchUserRiskSignals();
        fetchContestRiskSignals();
        fetchPlatformWalletOverview();
        fetchPlatformWalletEntries();
        fetchPremiumPaymentsAudit();
        fetchSlaSnapshot();
        triggerExternalSlaAlerts();
      } catch {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        router.push("/login");
      } finally {
        setIsAccessChecking(false);
      }
    };
    verifyAccessAndLoad();
  }, [
    router,
    fetchReports,
    fetchBannedUsers,
    fetchPendingAds,
    fetchAdminUsers,
    fetchAdminActions,
    fetchAdminThreads,
    fetchAdminContests,
    fetchPendingPayouts,
    fetchPayoutRollups,
    fetchWalletMismatches,
    fetchUserRiskSignals,
    fetchContestRiskSignals,
    fetchPlatformWalletOverview,
    fetchPlatformWalletEntries,
    fetchPremiumPaymentsAudit,
    fetchSlaSnapshot,
    triggerExternalSlaAlerts,
  ]);

  const exportPayoutsCsv = () => {
    if (!payouts.length) {
      setMessage("No payout rows to export.");
      return;
    }
    const headers = [
      "User",
      "Amount_NGN",
      "Status",
      "Destination",
      "Reference",
      "CreatedAt",
    ];
    const rows = payouts.map((p) => [
      p.user?.username || p.user?.email || "Unknown",
      (p.amount / 100).toFixed(2),
      p.status,
      p.recipientId || "",
      p.reference || "",
      p.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPayoutsPdf = () => {
    const reportDate = new Date().toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const tableRows = payouts
      .map(
        (p) => `
          <tr>
            <td>${p.user?.username || p.user?.email || "Unknown"}</td>
            <td>₦${(p.amount / 100).toLocaleString("en-NG")}</td>
            <td>${p.status}</td>
            <td>${p.recipientId || "-"}</td>
            <td>${new Date(p.createdAt).toLocaleString("en-NG")}</td>
          </tr>
        `,
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Payout Reconciliation Report</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 24px; color: #0f172a; }
            .top { border-bottom: 2px solid #14532d; margin-bottom: 16px; padding-bottom: 10px; }
            h1 { margin: 0; color: #14532d; font-size: 24px; }
            p { margin: 4px 0; font-size: 12px; color: #334155; }
            .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
            .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: 700; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            th { background: #f1f5f9; }
            .footer { margin-top: 14px; font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="top">
            <h1>NaijaTalk Payout Reconciliation</h1>
            <p>Generated: ${reportDate}</p>
            <p>Status Filter: ${payoutStatusFilter}</p>
            <p>Date Range: ${payoutDateFrom || "N/A"} - ${payoutDateTo || "N/A"}</p>
          </div>
          <div class="cards">
            <div class="card"><div class="label">Total</div><div class="value">₦${(payoutSummary.totalAmount / 100).toLocaleString("en-NG")}</div></div>
            <div class="card"><div class="label">Pending</div><div class="value">₦${(payoutSummary.pendingAmount / 100).toLocaleString("en-NG")}</div></div>
            <div class="card"><div class="label">Completed</div><div class="value">₦${(payoutSummary.completedAmount / 100).toLocaleString("en-NG")}</div></div>
            <div class="card"><div class="label">Failed</div><div class="value">₦${(payoutSummary.failedAmount / 100).toLocaleString("en-NG")}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th><th>Amount</th><th>Status</th><th>Destination</th><th>Created At</th>
              </tr>
            </thead>
            <tbody>${tableRows || "<tr><td colspan='5'>No payout rows.</td></tr>"}</tbody>
          </table>
          <p class="footer">Tip: use browser print and choose "Save as PDF".</p>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setMessage("Popup blocked. Allow popups to export PDF.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportRollupsCsv = () => {
    if (!rollupBuckets.length) {
      setMessage("No rollup buckets to export.");
      return;
    }
    const headers = [
      "Bucket",
      "TotalAmount_NGN",
      "TotalCount",
      "PendingAmount_NGN",
      "PendingCount",
      "CompletedAmount_NGN",
      "CompletedCount",
      "FailedAmount_NGN",
      "FailedCount",
    ];
    const rows = rollupBuckets.map((bucket) => [
      bucket.bucket,
      (bucket.totalAmount / 100).toFixed(2),
      bucket.totalCount,
      (bucket.pendingAmount / 100).toFixed(2),
      bucket.pendingCount,
      (bucket.completedAmount / 100).toFixed(2),
      bucket.completedCount,
      (bucket.failedAmount / 100).toFixed(2),
      bucket.failedCount,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlement-rollups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (threadId: string) => {
    if (!confirm("Sure say you wan delete this thread?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.delete<{ message: string }>(
        `/threads/${threadId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      setReports(reports.filter((r) => r.threadId._id !== threadId));
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Delete scatter o!"));
    }
  };

  const handleDismiss = async (reportId: string) => {
    if (!confirm("Sure say you wan dismiss this report?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.delete<{ message: string }>(
        `/threads/reports/${reportId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      const updatedReports = reports.filter((r) => r._id !== reportId);
      setReports(updatedReports);
      if (updatedReports.length === 0) fetchReports();
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Dismiss scatter o!"));
      setReports(reports);
    }
  };

  const handleBanUser = async (userId: string, email: string) => {
    if (!confirm(`Sure say you wan ban ${email}?`)) return;
    const reason = window.prompt("Reason for ban (optional):", "") || "";
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/users/${userId}/ban`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      fetchReports();
      fetchBannedUsers();
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Ban scatter o!"));
    }
  };

  const handleUnbanUser = async (userId: string, approve: boolean) => {
    if (
      !confirm(
        approve
          ? "Sure say you wan unban this user?"
          : "Sure say you wan reject this appeal?",
      )
    )
      return;
    const reason = window.prompt("Reason for this decision (optional):", "") || "";
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/users/${userId}/unban`,
        { approve, reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      fetchBannedUsers();
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unban scatter o!"));
    }
  };

  const handleAdminRoleUpdate = async (
    userId: string,
    role: "user" | "mod" | "admin" | "super_admin",
  ) => {
    const reason = window.prompt("Optional reason for role update (for audit log):", "") || "";
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/users/admin/users/${userId}/role`,
        { role, reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      fetchAdminUsers();
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Role update scatter o!"));
    }
  };

  const handleViewAdminUserDetails = async (userId: string) => {
    try {
      setIsUserDetailsLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get<AdminUserDetails>(`/users/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedUserDetails(res.data);
      setMessage("User details loaded.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "User details fetch scatter o!"));
    } finally {
      setIsUserDetailsLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, email: string) => {
    const hoursRaw = window.prompt(`Suspend ${email} for how many hours? (1-2160)`, "24");
    if (!hoursRaw) return;
    const durationHours = Number.parseInt(hoursRaw, 10);
    if (!Number.isFinite(durationHours) || durationHours < 1) {
      setMessage("Invalid suspension duration.");
      return;
    }
    const reason = window.prompt("Reason for suspension (recommended):", "") || "";
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/users/admin/users/${userId}/suspend`,
        { durationHours, reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      fetchAdminUsers();
      if (selectedUserDetails?.user._id === userId) {
        handleViewAdminUserDetails(userId);
      }
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Suspend scatter o!"));
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    if (!confirm("Remove suspension for this user?")) return;
    const reason = window.prompt("Optional reason for unsuspend:", "") || "";
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/users/admin/users/${userId}/unsuspend`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      fetchAdminUsers();
      if (selectedUserDetails?.user._id === userId) {
        handleViewAdminUserDetails(userId);
      }
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unsuspend scatter o!"));
    }
  };

  const handleAdminThreadDelete = async (threadId: string) => {
    await handleDelete(threadId);
    if (selectedThreadDetails?.thread._id === threadId) {
      setSelectedThreadDetails(null);
    }
    fetchAdminThreads();
  };

  const handleViewAdminThreadDetails = async (threadId: string) => {
    try {
      setIsThreadDetailsLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get<AdminThreadDetails>(`/threads/admin/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedThreadDetails(res.data);
      setMessage("Thread details loaded.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Thread details fetch scatter o!"));
    } finally {
      setIsThreadDetailsLoading(false);
    }
  };

  const handleAdminThreadLockToggle = async (threadId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post<{ message: string }>(
        `/threads/${threadId}/lock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      fetchAdminThreads();
      if (selectedThreadDetails?.thread._id === threadId) {
        handleViewAdminThreadDetails(threadId);
      }
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Lock toggle scatter o!"));
    }
  };

  const handleAdminThreadStickyToggle = async (threadId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post<{ message: string }>(
        `/threads/${threadId}/sticky`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message);
      fetchAdminThreads();
      if (selectedThreadDetails?.thread._id === threadId) {
        handleViewAdminThreadDetails(threadId);
      }
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Sticky toggle scatter o!"));
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const toggleSelectAllUsers = () => {
    if (adminUsers.length === 0) return;
    setSelectedUserIds((prev) =>
      prev.length === adminUsers.length ? [] : adminUsers.map((user) => user._id),
    );
  };

  const runBulkUserAction = async (
    actionLabel: string,
    fn: (userId: string) => Promise<unknown>,
  ) => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Run ${actionLabel} for ${selectedUserIds.length} selected users?`)) return;
    const results = await Promise.allSettled(selectedUserIds.map((userId) => fn(userId)));
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.length - successCount;
    setMessage(`${actionLabel}: ${successCount} success, ${failedCount} failed.`);
    fetchAdminUsers();
    fetchBannedUsers();
    fetchReports();
  };

  const bulkBanUsers = async () => {
    const token = localStorage.getItem("token");
    const reason = window.prompt("Reason for bulk ban (optional):", "") || "";
    await runBulkUserAction("Bulk ban", async (userId) =>
      api.put(
        `/users/${userId}/ban`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    );
  };

  const bulkUnbanUsers = async () => {
    const token = localStorage.getItem("token");
    const reason = window.prompt("Reason for bulk unban (optional):", "") || "";
    await runBulkUserAction("Bulk unban", async (userId) =>
      api.put(
        `/users/${userId}/unban`,
        { approve: true, reason },
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    );
  };

  const bulkUpdateUserRole = async (role: "user" | "mod" | "admin" | "super_admin") => {
    const token = localStorage.getItem("token");
    const reason = window.prompt("Optional reason for bulk role update (for audit log):", "") || "";
    await runBulkUserAction(`Bulk set role to ${role}`, async (userId) =>
      api.put(
        `/users/admin/users/${userId}/role`,
        { role, reason },
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    );
  };

  const toggleThreadSelection = (threadId: string) => {
    setSelectedThreadIds((prev) =>
      prev.includes(threadId) ? prev.filter((id) => id !== threadId) : [...prev, threadId],
    );
  };

  const toggleSelectAllThreads = () => {
    if (adminThreads.length === 0) return;
    setSelectedThreadIds((prev) =>
      prev.length === adminThreads.length ? [] : adminThreads.map((thread) => thread._id),
    );
  };

  const runBulkThreadAction = async (
    actionLabel: string,
    fn: (threadId: string) => Promise<unknown>,
  ) => {
    if (selectedThreadIds.length === 0) return;
    if (!confirm(`Run ${actionLabel} for ${selectedThreadIds.length} selected threads?`)) return;
    const results = await Promise.allSettled(selectedThreadIds.map((threadId) => fn(threadId)));
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.length - successCount;
    setMessage(`${actionLabel}: ${successCount} success, ${failedCount} failed.`);
    fetchAdminThreads();
    fetchReports();
  };

  const bulkDeleteThreads = async () => {
    const token = localStorage.getItem("token");
    await runBulkThreadAction("Bulk delete", async (threadId) =>
      api.delete(`/threads/${threadId}`, { headers: { Authorization: `Bearer ${token}` } }),
    );
  };

  const bulkToggleLockThreads = async () => {
    const token = localStorage.getItem("token");
    await runBulkThreadAction("Bulk lock toggle", async (threadId) =>
      api.post(`/threads/${threadId}/lock`, {}, { headers: { Authorization: `Bearer ${token}` } }),
    );
  };

  const bulkToggleStickyThreads = async () => {
    const token = localStorage.getItem("token");
    await runBulkThreadAction("Bulk pin toggle", async (threadId) =>
      api.post(
        `/threads/${threadId}/sticky`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    );
  };

  const handleCreateContest = async () => {
    const title = window.prompt("Contest title:", "");
    if (!title?.trim()) return;
    const prizeRaw = window.prompt("Prize amount in kobo (e.g. 5000000 for ₦50,000):", "5000000");
    if (!prizeRaw) return;
    const prize = Number(prizeRaw);
    if (!Number.isFinite(prize) || prize <= 0) {
      setMessage("Invalid prize amount.");
      return;
    }
    const startDate = window.prompt("Start date (YYYY-MM-DD):", "");
    const endDate = window.prompt("End date (YYYY-MM-DD):", "");
    if (!startDate || !endDate) return;
    const description = window.prompt("Description:", "") || "";
    const rules = window.prompt("Rules (optional):", "") || "";
    const termsVersion =
      window.prompt("Terms version label (e.g. 2026-02-21):", "2026-02-21") || "2026-02-21";
    const termsUrl = window.prompt("Terms URL path:", "/contests/terms") || "/contests/terms";
    const policyUrl = window.prompt("Policy URL path:", "/contests/policy") || "/contests/policy";
    const requireTermsRaw =
      window.prompt("Require terms acceptance? yes/no", "yes") || "yes";
    const requireTermsAcceptance = requireTermsRaw.trim().toLowerCase() !== "no";
    const status = (window.prompt("Status: draft/live/closed/archived", "draft") || "draft").toLowerCase();
    try {
      const token = localStorage.getItem("token");
      const res = await api.post<{ message: string }>(
        "/contests/admin",
        {
          title: title.trim(),
          description,
          rules,
          termsVersion,
          termsUrl,
          policyUrl,
          requireTermsAcceptance,
          prize,
          startDate,
          endDate,
          status,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message || "Contest created.");
      fetchAdminContests();
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Contest create scatter o!"));
    }
  };

  const handleContestStatusUpdate = async (
    contestId: string,
    status: "draft" | "live" | "closed" | "archived",
  ) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/contests/admin/${contestId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message || "Contest updated.");
      fetchAdminContests();
      if (selectedContestDetails?.contest._id === contestId) {
        handleViewContestDetails(contestId);
      }
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Contest update scatter o!"));
    }
  };

  const handleViewContestDetails = async (contestId: string) => {
    try {
      setIsContestDetailsLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get<AdminContestDetails>(`/contests/admin/${contestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedContestDetails(res.data);
      setMessage("Contest details loaded.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Contest details fetch scatter o!"));
    } finally {
      setIsContestDetailsLoading(false);
    }
  };

  const handleReviewContestSubmission = async (
    contestId: string,
    submissionId: string,
    status: "pending" | "approved" | "rejected" | "winner",
  ) => {
    const reviewNote = window.prompt("Optional review note:", "") || "";
    const scoreRaw = window.prompt("Optional score (number):", "");
    const score = scoreRaw && Number.isFinite(Number(scoreRaw)) ? Number(scoreRaw) : undefined;
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/contests/admin/${contestId}/submissions/${submissionId}/review`,
        { status, reviewNote, score },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message || "Submission reviewed.");
      handleViewContestDetails(contestId);
      fetchAdminContests();
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Submission review scatter o!"));
    }
  };

  const handleReviewContestPrizeClaim = async (submissionId: string, approve: boolean) => {
    const reviewNote =
      window.prompt(
        approve
          ? "Optional approval note for winner payout:"
          : "Reason for rejecting claim (recommended):",
        "",
      ) || "";
    try {
      const token = localStorage.getItem("token");
      const res = await api.put<{ message: string }>(
        `/contests/admin/submissions/${submissionId}/claim-review`,
        { approve, reviewNote },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(res.data.message || "Prize claim reviewed.");
      if (selectedContestDetails?.contest?._id) {
        handleViewContestDetails(selectedContestDetails.contest._id);
      }
      fetchAdminContests();
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Prize claim review scatter o!"));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };

  const isAllSectionsView = focusSection === "all";
  const isSectionVisible = (section: AdminSectionId) =>
    isAllSectionsView || focusSection === section;
  const currentSectionLabel = isAllSectionsView
    ? "Dashboard"
    : ADMIN_SECTION_LABELS[focusSection];

  const navSections = useMemo(
    () => [
      {
        id: "overview" as const,
        label: ADMIN_SECTION_LABELS.overview,
        count: null,
        href: isAllSectionsView ? "#overview" : "/admin",
      },
      {
        id: "actions" as const,
        label: ADMIN_SECTION_LABELS.actions,
        count: actionsPagination.total,
        href: isAllSectionsView ? "#actions" : "/admin/actions",
      },
      {
        id: "users" as const,
        label: ADMIN_SECTION_LABELS.users,
        count: usersPagination.total,
        href: isAllSectionsView ? "#users" : "/admin/users",
      },
      {
        id: "threads" as const,
        label: ADMIN_SECTION_LABELS.threads,
        count: threadsPagination.total,
        href: isAllSectionsView ? "#threads" : "/admin/threads",
      },
      {
        id: "reports" as const,
        label: ADMIN_SECTION_LABELS.reports,
        count: reportsPagination.total,
        href: isAllSectionsView ? "#reports" : "/admin/reports",
      },
      {
        id: "banned" as const,
        label: ADMIN_SECTION_LABELS.banned,
        count: bannedPagination.total,
        href: isAllSectionsView ? "#banned" : "/admin/banned",
      },
      {
        id: "ads" as const,
        label: ADMIN_SECTION_LABELS.ads,
        count: adsSummary.pending,
        href: isAllSectionsView ? "#ads" : "/admin/ads",
      },
      {
        id: "payouts" as const,
        label: ADMIN_SECTION_LABELS.payouts,
        count: payoutSummary.pendingCount,
        href: isAllSectionsView ? "#payouts" : "/admin/payouts",
      },
      {
        id: "premium" as const,
        label: ADMIN_SECTION_LABELS.premium,
        count: premiumAuditSummary.mismatchCount,
        href: isAllSectionsView ? "#premium" : "/admin/premium",
      },
      {
        id: "rollups" as const,
        label: ADMIN_SECTION_LABELS.rollups,
        count: rollupBuckets.length,
        href: isAllSectionsView ? "#rollups" : "/admin/rollups",
      },
      {
        id: "mismatches" as const,
        label: ADMIN_SECTION_LABELS.mismatches,
        count: mismatchSummary.mismatchedUsers,
        href: isAllSectionsView ? "#mismatches" : "/admin/mismatches",
      },
      {
        id: "riskSignals" as const,
        label: ADMIN_SECTION_LABELS.riskSignals,
        count: userRiskSummary.totalFlagged + contestRiskSummary.totalFlagged,
        href: isAllSectionsView ? "#riskSignals" : "/admin/riskSignals",
      },
      {
        id: "platformWallet" as const,
        label: ADMIN_SECTION_LABELS.platformWallet,
        count: platformWalletPagination.total,
        href: isAllSectionsView ? "#platformWallet" : "/admin/platformWallet",
      },
      {
        id: "contests" as const,
        label: ADMIN_SECTION_LABELS.contests,
        count: contestsPagination.total,
        href: isAllSectionsView ? "#contests" : "/admin/contests",
      },
    ],
    [
      isAllSectionsView,
      actionsPagination.total,
      usersPagination.total,
      threadsPagination.total,
      reportsPagination.total,
      bannedPagination.total,
      adsSummary.pending,
      payoutSummary.pendingCount,
      premiumAuditSummary.mismatchCount,
      rollupBuckets.length,
      mismatchSummary.mismatchedUsers,
      userRiskSummary.totalFlagged,
      contestRiskSummary.totalFlagged,
      platformWalletPagination.total,
      contestsPagination.total,
    ],
  );
  const forcedActiveSectionId = isAllSectionsView ? undefined : focusSection;

  if (isAccessChecking) return <p className="text-center p-10">Checking admin access...</p>;
  if (!isLoggedIn) return <p className="text-center p-10">Abeg login first!</p>;
  if (!isAdminAuthorized) return <p className="text-center p-10">Admins only.</p>;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-8xl p-4 md:p-6">
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-900 md:text-4xl break-words">
                Admin Dashboard—NaijaTalk
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                <Link
                  href="/admin"
                  className="underline-offset-2 hover:text-slate-700 hover:underline"
                >
                  Admin
                </Link>{" "}
                / {currentSectionLabel}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 md:justify-end">
              {!isAllSectionsView ? (
                <Link
                  href="/admin"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Full Dashboard
                </Link>
              ) : null}
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <AdminSidebar
            sections={navSections}
            enableScrollSpy={isAllSectionsView}
            forcedActiveSectionId={forcedActiveSectionId}
          />

          <main className="min-w-0 flex-1">
            {message && (
              <p className="mb-3 rounded-xl border border-slate-200 bg-white p-3 text-center text-sm text-slate-600 shadow-sm shadow-slate-200/50">
                {message}
              </p>
            )}
            {selectedUserDetails && (
              <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    User 360: {selectedUserDetails.user.email}
                  </h3>
                  <button
                    onClick={() => setSelectedUserDetails(null)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                  <p>Role: {selectedUserDetails.user.role}</p>
                  <p>Threads: {selectedUserDetails.stats.threads}</p>
                  <p>Listings: {selectedUserDetails.stats.listings}</p>
                  <p>Sold: {selectedUserDetails.stats.soldListings}</p>
                  <p>Reports Against: {selectedUserDetails.stats.reportsAgainst}</p>
                  <p>Reports Filed: {selectedUserDetails.stats.reportsFiled}</p>
                  <p>Payouts: {selectedUserDetails.stats.payouts}</p>
                  <p>Pending Payouts: {selectedUserDetails.stats.pendingPayouts}</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Status: {selectedUserDetails.user.isBanned ? "Banned" : "Active"}
                  {selectedUserDetails.user.suspendedUntil
                    ? ` • Suspended until ${new Date(
                        selectedUserDetails.user.suspendedUntil,
                      ).toLocaleString()}`
                    : ""}
                </p>
                {selectedUserDetails.recentActions.length > 0 ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-2 font-semibold text-slate-700">When</th>
                          <th className="p-2 font-semibold text-slate-700">Action</th>
                          <th className="p-2 font-semibold text-slate-700">Actor</th>
                          <th className="p-2 font-semibold text-slate-700">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserDetails.recentActions.map((row) => (
                          <tr key={row._id} className="border-t border-slate-100">
                            <td className="p-2 text-slate-600">
                              {new Date(row.createdAt).toLocaleString()}
                            </td>
                            <td className="p-2 text-slate-800">{row.action}</td>
                            <td className="p-2 text-slate-700">{row.actor?.email || "Unknown"}</td>
                            <td className="p-2 text-slate-600">{row.reason || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            )}
            {isUserDetailsLoading && (
              <p className="mb-3 rounded-lg border border-slate-200 bg-white p-2 text-center text-sm text-slate-600">
                Loading user details...
              </p>
            )}
            {isSectionVisible("overview") ? (
              <AdminOverview
                reportsCount={reportsPagination.total}
                adsCount={adsSummary.pending}
                pendingPayoutCount={payoutSummary.pendingCount}
                mismatchedUsersCount={mismatchSummary.mismatchedUsers}
                highSeverityMismatchCount={mismatchSummary.highCount}
                failedPayoutCount={payoutSummary.failedCount}
                premiumInFlightCount={premiumInFlightCount}
                premiumFailedCount={premiumAuditSummary.failedCount}
                payoutFailureRatePct={payoutFailureRatePct}
                premiumFailureRatePct={premiumFailureRatePct}
                oldestPendingPayoutHours={oldestPendingPayoutHours}
                oldestPremiumInFlightHours={oldestPremiumInFlightHours}
                onRefreshAll={() => {
                  fetchAdminUsers();
                  fetchAdminActions();
                  fetchAdminThreads();
                  fetchAdminContests();
                  fetchReports();
                  fetchBannedUsers();
                  fetchPendingAds();
                  fetchPendingPayouts();
                  fetchPayoutRollups();
                  fetchWalletMismatches();
                  fetchUserRiskSignals();
                  fetchContestRiskSignals();
                  fetchPlatformWalletOverview();
                  fetchPlatformWalletEntries();
                  fetchPremiumPaymentsAudit();
                  fetchSlaSnapshot();
                  triggerExternalSlaAlerts();
                }}
                riskSignalsCount={userRiskSummary.totalFlagged + contestRiskSummary.totalFlagged}
                apiHealthStatus={slaApiHealthStatus}
                readinessStatus={slaReadinessStatus}
                databaseStatus={slaDatabaseStatus}
                uptimeHours={slaUptimeHours}
                lastHealthCheckAt={slaLastHealthCheckAt}
                opsQuickCheckRows={opsQuickCheckRows}
                opsQuickCheckLastRunAt={opsQuickCheckLastRunAt}
                isOpsQuickCheckRunning={isOpsQuickCheckRunning}
                onRunOpsQuickCheck={runOpsQuickCheck}
              />
            ) : null}

            {isSectionVisible("users") ? (
              <UsersSection
                users={adminUsers}
                summary={adminUsersSummary}
                query={usersQuery}
                roleFilter={usersRoleFilter}
                bannedOnly={usersBannedOnly}
                page={usersPagination.page}
                totalPages={usersPagination.totalPages}
                total={usersPagination.total}
                pageSize={usersPagination.pageSize}
                onQueryChange={setUsersQuery}
                onRoleFilterChange={setUsersRoleFilter}
                onBannedOnlyChange={setUsersBannedOnly}
                onRefresh={fetchAdminUsers}
                onPageChange={setUsersPage}
                onPageSizeChange={setUsersPageSize}
                onRoleUpdate={handleAdminRoleUpdate}
                onBan={handleBanUser}
                onUnban={(userId) => handleUnbanUser(userId, true)}
                onSuspend={handleSuspendUser}
                onUnsuspend={handleUnsuspendUser}
                onViewDetails={handleViewAdminUserDetails}
                selectedUserIds={selectedUserIds}
                onToggleUserSelection={toggleUserSelection}
                onToggleSelectAllUsers={toggleSelectAllUsers}
                onClearUserSelection={() => setSelectedUserIds([])}
                onBulkBan={bulkBanUsers}
                onBulkUnban={bulkUnbanUsers}
                onBulkRoleUpdate={bulkUpdateUserRole}
              />
            ) : null}
            {isSectionVisible("actions") ? (
              <AdminActionsSection
                actions={adminActions}
                query={actionsQuery}
                actionFilter={actionsFilter}
                dateFrom={actionsDateFrom}
                dateTo={actionsDateTo}
                page={actionsPagination.page}
                pageSize={actionsPagination.pageSize}
                total={actionsPagination.total}
                totalPages={actionsPagination.totalPages}
                onQueryChange={setActionsQuery}
                onActionFilterChange={setActionsFilter}
                onDateFromChange={setActionsDateFrom}
                onDateToChange={setActionsDateTo}
                onPageChange={setActionsPage}
                onPageSizeChange={setActionsPageSize}
                onRefresh={fetchAdminActions}
              />
            ) : null}
            {isSectionVisible("threads") ? (
              <>
                {isThreadDetailsLoading && (
                  <p className="mb-3 rounded-lg border border-slate-200 bg-white p-2 text-center text-sm text-slate-700">
                    Loading thread details...
                  </p>
                )}
                {selectedThreadDetails && (
                  <section
                    ref={threadDetailsRef}
                    className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Thread 360: {selectedThreadDetails.thread.title}
                      </h3>
                      <button
                        onClick={() => setSelectedThreadDetails(null)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Close
                      </button>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-900">
                      {selectedThreadDetails.thread.body}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/threads/${selectedThreadDetails.thread._id}`}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open Thread
                      </Link>
                      <button
                        onClick={() =>
                          handleAdminThreadLockToggle(selectedThreadDetails.thread._id)
                        }
                        className="rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
                      >
                        {selectedThreadDetails.thread.isLocked ? "Unlock" : "Lock"}
                      </button>
                      <button
                        onClick={() =>
                          handleAdminThreadStickyToggle(selectedThreadDetails.thread._id)
                        }
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        {selectedThreadDetails.thread.isSticky ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={() =>
                          handleAdminThreadDelete(selectedThreadDetails.thread._id)
                        }
                        className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          handleViewAdminThreadDetails(selectedThreadDetails.thread._id)
                        }
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Author:</span>{" "}
                        {selectedThreadDetails.thread.author?.email || "Unknown"}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Category:</span>{" "}
                        {selectedThreadDetails.thread.category || "General"}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Replies:</span>{" "}
                        {selectedThreadDetails.stats.replies}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Reports:</span>{" "}
                        {selectedThreadDetails.stats.reports}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Likes:</span>{" "}
                        {selectedThreadDetails.thread.likesCount}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Bookmarks:</span>{" "}
                        {selectedThreadDetails.thread.bookmarksCount}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Created:</span>{" "}
                        {new Date(selectedThreadDetails.thread.createdAt).toLocaleString()}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Status:</span>
                        {selectedThreadDetails.thread.isLocked ? " Locked" : ""}
                        {selectedThreadDetails.thread.isSticky ? " Pinned" : ""}
                        {selectedThreadDetails.thread.isSolved ? " Solved" : ""}
                        {!selectedThreadDetails.thread.isLocked &&
                        !selectedThreadDetails.thread.isSticky &&
                        !selectedThreadDetails.thread.isSolved
                          ? " Normal"
                          : ""}
                      </p>
                    </div>
                    {selectedThreadDetails.recentReplies.length > 0 ? (
                      <div className="mt-3 overflow-x-auto">
                        <p className="mb-2 text-sm font-semibold text-slate-900">Recent Replies</p>
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="p-2 font-semibold text-slate-700">When</th>
                              <th className="p-2 font-semibold text-slate-700">Author</th>
                              <th className="p-2 font-semibold text-slate-700">Body</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedThreadDetails.recentReplies.map((row) => (
                              <tr key={row._id} className="border-t border-slate-100">
                                <td className="p-2 text-slate-700">
                                  {new Date(row.createdAt).toLocaleString()}
                                </td>
                                <td className="p-2 text-slate-900">
                                  {row.author?.email || "Unknown"}
                                </td>
                                <td className="max-w-md p-2 text-slate-900">
                                  <p className="truncate" title={row.body}>
                                    {row.body}
                                  </p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                    {selectedThreadDetails.recentReports.length > 0 ? (
                      <div className="mt-3 overflow-x-auto">
                        <p className="mb-2 text-sm font-semibold text-slate-900">Recent Reports</p>
                        <table className="w-full text-left text-xs">
                          <thead className="bg-rose-50">
                            <tr>
                              <th className="p-2 font-semibold text-rose-900">When</th>
                              <th className="p-2 font-semibold text-rose-900">Reporter</th>
                              <th className="p-2 font-semibold text-rose-900">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedThreadDetails.recentReports.map((row) => (
                              <tr key={row._id} className="border-t border-slate-100">
                                <td className="p-2 text-slate-700">
                                  {new Date(row.createdAt).toLocaleString()}
                                </td>
                                <td className="p-2 text-slate-900">
                                  {row.reporter?.email || "Unknown"}
                                </td>
                                <td className="max-w-md p-2 text-slate-900">
                                  <p className="truncate" title={row.reason}>
                                    {row.reason}
                                  </p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </section>
                )}
                <ThreadsSection
                  threads={adminThreads}
                  summary={adminThreadsSummary}
                  query={threadsQuery}
                  statusFilter={threadsStatusFilter}
                  page={threadsPagination.page}
                  totalPages={threadsPagination.totalPages}
                  total={threadsPagination.total}
                  pageSize={threadsPagination.pageSize}
                  onQueryChange={setThreadsQuery}
                  onStatusFilterChange={setThreadsStatusFilter}
                  onRefresh={fetchAdminThreads}
                  onPageChange={setThreadsPage}
                  onPageSizeChange={setThreadsPageSize}
                  onDelete={handleAdminThreadDelete}
                  onToggleLock={handleAdminThreadLockToggle}
                  onToggleSticky={handleAdminThreadStickyToggle}
                  onViewDetails={handleViewAdminThreadDetails}
                  selectedThreadIds={selectedThreadIds}
                  onToggleThreadSelection={toggleThreadSelection}
                  onToggleSelectAllThreads={toggleSelectAllThreads}
                  onClearThreadSelection={() => setSelectedThreadIds([])}
                  onBulkDelete={bulkDeleteThreads}
                  onBulkToggleLock={bulkToggleLockThreads}
                  onBulkToggleSticky={bulkToggleStickyThreads}
                />
              </>
            ) : null}
            {isSectionVisible("reports") ? (
              <ReportsSection
                reports={reports}
                page={reportsPagination.page}
                totalPages={reportsPagination.totalPages}
                total={reportsPagination.total}
                pageSize={reportsPagination.pageSize}
                dateFrom={reportsDateFrom}
                dateTo={reportsDateTo}
                onPageChange={setReportsPage}
                onPageSizeChange={setReportsPageSize}
                onDateFromChange={setReportsDateFrom}
                onDateToChange={setReportsDateTo}
                onRefresh={fetchReports}
                onDelete={handleDelete}
                onDismiss={handleDismiss}
                onBanUser={handleBanUser}
              />
            ) : null}
            {isSectionVisible("banned") ? (
              <BannedUsersSection
                bannedUsers={bannedUsers}
                summary={bannedUsersSummary}
                query={bannedQuery}
                appealStatusFilter={bannedAppealStatusFilter}
                suspendedOnly={bannedSuspendedOnly}
                dateFrom={bannedDateFrom}
                dateTo={bannedDateTo}
                pagination={bannedPagination}
                onQueryChange={setBannedQuery}
                onAppealStatusFilterChange={setBannedAppealStatusFilter}
                onSuspendedOnlyChange={setBannedSuspendedOnly}
                onDateFromChange={setBannedDateFrom}
                onDateToChange={setBannedDateTo}
                onPageChange={setBannedPage}
                onPageSizeChange={setBannedPageSize}
                onRefresh={fetchBannedUsers}
                onUnban={handleUnbanUser}
              />
            ) : null}
            {isSectionVisible("ads") ? (
              <AdsSection
                ads={ads}
                summary={adsSummary}
                query={adsQuery}
                statusFilter={adsStatusFilter}
                typeFilter={adsTypeFilter}
                dateFrom={adsDateFrom}
                dateTo={adsDateTo}
                pagination={adsPagination}
                onQueryChange={setAdsQuery}
                onStatusFilterChange={setAdsStatusFilter}
                onTypeFilterChange={setAdsTypeFilter}
                onDateFromChange={setAdsDateFrom}
                onDateToChange={setAdsDateTo}
                onPageChange={setAdsPage}
                onPageSizeChange={setAdsPageSize}
                onRefresh={fetchPendingAds}
                onApprove={approveAd}
                onReject={rejectAd}
              />
            ) : null}
            {isSectionVisible("payouts") ? (
              <>
                {isPayoutDetailsLoading && (
                  <p className="mb-3 rounded-lg border border-slate-200 bg-white p-2 text-center text-sm text-slate-700">
                    Loading payout details...
                  </p>
                )}
                {selectedPayoutDetails ? (
                  <section
                    ref={payoutDetailsRef}
                    className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Payout 360: {selectedPayoutDetails.payout.reference || selectedPayoutDetails.payout._id}
                      </h3>
                      <button
                        onClick={() => setSelectedPayoutDetails(null)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleViewPayoutDetails(selectedPayoutDetails.payout._id)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Refresh
                      </button>
                      {selectedPayoutDetails.payout.user?._id ? (
                        <button
                          onClick={() => {
                            const userId = selectedPayoutDetails.payout.user?._id;
                            if (userId) handleViewAdminUserDetails(userId);
                          }}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Open User 360
                        </button>
                      ) : null}
                      {selectedPayoutDetails.payout.status === "pending" ? (
                        <>
                          <button
                            onClick={() => decidePayout(selectedPayoutDetails.payout._id, true)}
                            className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => decidePayout(selectedPayoutDetails.payout._id, false)}
                            className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">User:</span>{" "}
                        {selectedPayoutDetails.payout.user?.email || "Unknown"}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Amount:</span> ₦
                        {(selectedPayoutDetails.payout.amount / 100).toLocaleString("en-NG")}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Status:</span> {selectedPayoutDetails.payout.status}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Destination:</span>{" "}
                        {selectedPayoutDetails.payout.recipientId || "-"}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Wallet Bal:</span> ₦
                        {(selectedPayoutDetails.wallet.balance / 100).toLocaleString("en-NG")}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Available:</span> ₦
                        {(selectedPayoutDetails.wallet.availableBalance / 100).toLocaleString("en-NG")}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Held:</span> ₦
                        {(selectedPayoutDetails.wallet.heldBalance / 100).toLocaleString("en-NG")}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Created:</span>{" "}
                        {new Date(selectedPayoutDetails.payout.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {selectedPayoutDetails.payoutLedger.length > 0 ? (
                      <div className="mt-3 overflow-x-auto">
                        <p className="mb-2 text-sm font-semibold text-slate-900">Ledger Trail</p>
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="p-2 font-semibold text-slate-700">When</th>
                              <th className="p-2 font-semibold text-slate-700">Entry</th>
                              <th className="p-2 font-semibold text-slate-700">Effect</th>
                              <th className="p-2 font-semibold text-slate-700">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPayoutDetails.payoutLedger.map((row) => (
                              <tr key={row._id} className="border-t border-slate-100">
                                <td className="p-2 text-slate-700">
                                  {new Date(row.createdAt).toLocaleString()}
                                </td>
                                <td className="p-2 text-slate-900">{row.entryKind}</td>
                                <td className="p-2 text-slate-900">
                                  {row.walletEffect >= 0 ? "+" : "-"}₦
                                  {(Math.abs(row.walletEffect) / 100).toLocaleString("en-NG")}
                                </td>
                                <td className="p-2 text-slate-700">{row.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </section>
                ) : null}
                <PayoutsSection
                  payouts={payouts}
                  payoutSummary={payoutSummary}
                  query={payoutQuery}
                  payoutStatusFilter={payoutStatusFilter}
                  payoutDateFrom={payoutDateFrom}
                  payoutDateTo={payoutDateTo}
                  page={payoutPagination.page}
                  totalPages={payoutPagination.totalPages}
                  total={payoutPagination.total}
                  pageSize={payoutPagination.pageSize}
                  onQueryChange={setPayoutQuery}
                  onPayoutStatusFilterChange={setPayoutStatusFilter}
                  onPayoutDateFromChange={setPayoutDateFrom}
                  onPayoutDateToChange={setPayoutDateTo}
                  onPageChange={setPayoutPage}
                  onPageSizeChange={setPayoutPageSize}
                  onApplyFilters={fetchPendingPayouts}
                  onExportCsv={exportPayoutsCsv}
                  onExportPdf={exportPayoutsPdf}
                  onDecidePayout={decidePayout}
                  onViewDetails={handleViewPayoutDetails}
                />
              </>
            ) : null}
            {isSectionVisible("premium") ? (
              <>
                {isPremiumDetailsLoading && (
                  <p className="mb-3 rounded-lg border border-slate-200 bg-white p-2 text-center text-sm text-slate-700">
                    Loading premium payment details...
                  </p>
                )}
                {selectedPremiumDetails ? (
                  <section
                    ref={premiumDetailsRef}
                    className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Premium Payment 360: {selectedPremiumDetails.payment.reference}
                      </h3>
                      <button
                        onClick={() => setSelectedPremiumDetails(null)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          handleViewPremiumPaymentDetails(selectedPremiumDetails.payment._id)
                        }
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Refresh
                      </button>
                      {selectedPremiumDetails.user?._id ? (
                        <button
                          onClick={() => {
                            const userId = selectedPremiumDetails.user?._id;
                            if (userId) handleViewAdminUserDetails(userId);
                          }}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Open User 360
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">User:</span>{" "}
                        {selectedPremiumDetails.user?.email || "Unknown"}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Amount:</span>{" "}
                        {selectedPremiumDetails.payment.currency}{" "}
                        {(selectedPremiumDetails.payment.amount / 100).toLocaleString("en-NG")}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Status:</span>{" "}
                        {selectedPremiumDetails.payment.status}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Verify Source:</span>{" "}
                        {selectedPremiumDetails.payment.verificationSource || "-"}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Gateway Tx:</span>{" "}
                        {selectedPremiumDetails.payment.gatewayTransactionId || "-"}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Attempts:</span>{" "}
                        {selectedPremiumDetails.payment.verifyAttempts}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Created:</span>{" "}
                        {new Date(selectedPremiumDetails.payment.createdAt).toLocaleString()}
                      </p>
                      <p className="rounded-md bg-slate-50 px-2 py-1 text-slate-900">
                        <span className="font-semibold">Mismatch:</span>{" "}
                        {selectedPremiumDetails.hasMismatch
                          ? selectedPremiumDetails.mismatchReasons.join(", ")
                          : "No"}
                      </p>
                    </div>
                  </section>
                ) : null}
                <PremiumAuditSection
                  premiumAuditRows={premiumAuditRows}
                  premiumAuditSummary={premiumAuditSummary}
                  query={premiumQuery}
                  premiumStatusFilter={premiumStatusFilter}
                  premiumSourceFilter={premiumSourceFilter}
                  premiumMismatchOnly={premiumMismatchOnly}
                  premiumDateFrom={premiumDateFrom}
                  premiumDateTo={premiumDateTo}
                  page={premiumPagination.page}
                  totalPages={premiumPagination.totalPages}
                  total={premiumPagination.total}
                  pageSize={premiumPagination.pageSize}
                  onQueryChange={setPremiumQuery}
                  onPremiumStatusFilterChange={setPremiumStatusFilter}
                  onPremiumSourceFilterChange={setPremiumSourceFilter}
                  onPremiumMismatchOnlyChange={setPremiumMismatchOnly}
                  onPremiumDateFromChange={setPremiumDateFrom}
                  onPremiumDateToChange={setPremiumDateTo}
                  onPageChange={setPremiumPage}
                  onPageSizeChange={setPremiumPageSize}
                  onViewDetails={handleViewPremiumPaymentDetails}
                  onRefreshAudit={fetchPremiumPaymentsAudit}
                />
              </>
            ) : null}
            {isSectionVisible("rollups") ? (
              <SettlementRollupsSection
                rollupPeriod={rollupPeriod}
                statusFilter={rollupStatusFilter}
                dateFrom={rollupDateFrom}
                dateTo={rollupDateTo}
                timezone={rollupTimezone}
                rollupBuckets={rollupBuckets}
                onRollupPeriodChange={setRollupPeriod}
                onStatusFilterChange={setRollupStatusFilter}
                onDateFromChange={setRollupDateFrom}
                onDateToChange={setRollupDateTo}
                onTimezoneChange={setRollupTimezone}
                onViewBucket={(bucket) => handleViewRollupBucketDetails(bucket, 1, rollupBucketPageSize)}
                onExportCsv={exportRollupsCsv}
                onRefreshRollups={fetchPayoutRollups}
                selectedBucketDetails={selectedRollupBucketDetails}
                isBucketDetailsLoading={isRollupBucketDetailsLoading}
                onCloseBucketDetails={() => {
                  setSelectedRollupBucket(null);
                  setSelectedRollupBucketDetails(null);
                }}
                onBucketPageChange={setRollupBucketPage}
                onBucketPageSizeChange={setRollupBucketPageSize}
              />
            ) : null}
            {isSectionVisible("mismatches") ? (
              <WalletMismatchSection
                mismatchSummary={mismatchSummary}
                mismatches={mismatches}
                query={mismatchQuery}
                severityFilter={mismatchSeverity}
                minDeltaKobo={mismatchMinDeltaKobo}
                dateFrom={mismatchDateFrom}
                dateTo={mismatchDateTo}
                page={mismatchPagination.page}
                totalPages={mismatchPagination.totalPages}
                total={mismatchPagination.total}
                pageSize={mismatchPagination.pageSize}
                selectedMismatchDetails={selectedMismatchDetails}
                isDetailsLoading={isMismatchDetailsLoading}
                onQueryChange={setMismatchQuery}
                onSeverityFilterChange={setMismatchSeverity}
                onMinDeltaKoboChange={setMismatchMinDeltaKobo}
                onDateFromChange={setMismatchDateFrom}
                onDateToChange={setMismatchDateTo}
                onPageChange={setMismatchPage}
                onPageSizeChange={setMismatchPageSize}
                onRunScan={fetchWalletMismatches}
                onViewDetails={handleViewMismatchDetails}
                onCloseDetails={() => setSelectedMismatchDetails(null)}
                onOpenUser360={(userId) => handleViewAdminUserDetails(userId)}
              />
            ) : null}
            {isSectionVisible("riskSignals") ? (
              <RiskSignalsSection
                userSummary={userRiskSummary}
                userRows={userRiskRows}
                userSeverityFilter={userRiskSeverityFilter}
                userWindowDays={userRiskWindowDays}
                userQuery={userRiskQuery}
                userPagination={userRiskPagination}
                contestSummary={contestRiskSummary}
                contestRows={contestRiskRows}
                contestSeverityFilter={contestRiskSeverityFilter}
                contestStatusFilter={contestRiskStatusFilter}
                contestQuery={contestRiskQuery}
                contestPagination={contestRiskPagination}
                onUserSeverityFilterChange={setUserRiskSeverityFilter}
                onUserWindowDaysChange={setUserRiskWindowDays}
                onUserQueryChange={setUserRiskQuery}
                onUserPageChange={setUserRiskPage}
                onUserPageSizeChange={setUserRiskPageSize}
                onRefreshUsers={fetchUserRiskSignals}
                onViewUser360={handleViewAdminUserDetails}
                onContestSeverityFilterChange={setContestRiskSeverityFilter}
                onContestStatusFilterChange={setContestRiskStatusFilter}
                onContestQueryChange={setContestRiskQuery}
                onContestPageChange={setContestRiskPage}
                onContestPageSizeChange={setContestRiskPageSize}
                onRefreshContests={fetchContestRiskSignals}
                onViewContest360={handleViewContestDetails}
              />
            ) : null}
            {isSectionVisible("platformWallet") ? (
              <PlatformWalletSection
                overview={platformWalletOverview}
                summary={platformWalletSummary}
                entries={platformWalletEntries}
                query={platformWalletQuery}
                statusFilter={platformWalletStatusFilter}
                entryKindFilter={platformWalletEntryKindFilter}
                dateFrom={platformWalletDateFrom}
                dateTo={platformWalletDateTo}
                page={platformWalletPagination.page}
                totalPages={platformWalletPagination.totalPages}
                total={platformWalletPagination.total}
                pageSize={platformWalletPagination.pageSize}
                selectedDetails={selectedPlatformWalletEntryDetails}
                isDetailsLoading={isPlatformWalletEntryDetailsLoading}
                onQueryChange={setPlatformWalletQuery}
                onStatusFilterChange={setPlatformWalletStatusFilter}
                onEntryKindFilterChange={setPlatformWalletEntryKindFilter}
                onDateFromChange={setPlatformWalletDateFrom}
                onDateToChange={setPlatformWalletDateTo}
                onPageChange={setPlatformWalletPage}
                onPageSizeChange={setPlatformWalletPageSize}
                onRefresh={() => {
                  fetchPlatformWalletOverview();
                  fetchPlatformWalletEntries();
                }}
                onViewDetails={handleViewPlatformWalletEntryDetails}
                onCloseDetails={() => setSelectedPlatformWalletEntryDetails(null)}
                onOpenUser360={(userId) => handleViewAdminUserDetails(userId)}
              />
            ) : null}
            {isSectionVisible("contests") ? (
              <ContestsSection
                contests={adminContests}
                summary={adminContestsSummary}
                query={contestsQuery}
                statusFilter={contestsStatusFilter}
                page={contestsPagination.page}
                totalPages={contestsPagination.totalPages}
                total={contestsPagination.total}
                pageSize={contestsPagination.pageSize}
                selectedContestDetails={selectedContestDetails}
                isContestDetailsLoading={isContestDetailsLoading}
                onQueryChange={setContestsQuery}
                onStatusFilterChange={setContestsStatusFilter}
                onPageChange={setContestsPage}
                onPageSizeChange={setContestsPageSize}
                onRefresh={fetchAdminContests}
                onCreateContest={handleCreateContest}
                onViewDetails={handleViewContestDetails}
                onUpdateStatus={handleContestStatusUpdate}
                onReviewSubmission={handleReviewContestSubmission}
                onReviewPrizeClaim={handleReviewContestPrizeClaim}
                onCloseDetails={() => setSelectedContestDetails(null)}
              />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

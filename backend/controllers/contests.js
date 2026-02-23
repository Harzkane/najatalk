import mongoose from "mongoose";
import Contest from "../models/contests.js";
import ContestSubmission from "../models/contestSubmission.js";
import Thread from "../models/thread.js";
import Listing from "../models/listing.js";
import Wallet from "../models/wallet.js";
import WalletLedger from "../models/walletLedger.js";
import PlatformWallet from "../models/platformWallet.js";
import { hasPermission } from "../utils/permissions.js";
import { computeContestRiskSignal } from "../utils/riskSignals.js";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const isContestLiveNow = (contest) => {
  const now = new Date();
  return (
    contest?.status === "live" &&
    new Date(contest.startDate).getTime() <= now.getTime() &&
    new Date(contest.endDate).getTime() >= now.getTime()
  );
};

const ensureWalletBalanceFields = async (userId) => {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) return null;
  let changed = false;

  if (typeof wallet.heldBalance !== "number") {
    wallet.heldBalance = 0;
    changed = true;
  }
  if (typeof wallet.availableBalance !== "number") {
    wallet.availableBalance = Math.max(
      0,
      Number(wallet.balance || 0) - Number(wallet.heldBalance || 0)
    );
    changed = true;
  }
  const total = Number(wallet.availableBalance || 0) + Number(wallet.heldBalance || 0);
  if (Number(wallet.balance || 0) !== total) {
    wallet.balance = total;
    changed = true;
  }
  if (changed) await wallet.save();
  return wallet;
};

export const createContest = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only—abeg comot!" });
    }

    const {
      title,
      description = "",
      rules = "",
      category = "general",
      termsVersion = "2026-02-21",
      termsUrl = "/contests/terms",
      policyUrl = "/contests/policy",
      requireTermsAcceptance = true,
      prize,
      startDate,
      endDate,
      status = "draft",
      votingEnabled = true,
      maxSubmissionsPerUser = 1,
    } = req.body || {};

    if (!title || !startDate || !endDate || !Number.isFinite(Number(prize))) {
      return res.status(400).json({ message: "title, prize, startDate, endDate are required." });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ message: "Invalid contest date range." });
    }

    const contest = await Contest.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      rules: String(rules || "").trim(),
      category: String(category || "general").trim().toLowerCase(),
      termsVersion: String(termsVersion || "2026-02-21").trim(),
      termsUrl: String(termsUrl || "/contests/terms").trim(),
      policyUrl: String(policyUrl || "/contests/policy").trim(),
      requireTermsAcceptance: Boolean(requireTermsAcceptance),
      prize: Number(prize),
      startDate: start,
      endDate: end,
      status: ["draft", "live", "closed", "archived"].includes(String(status))
        ? String(status)
        : "draft",
      votingEnabled: Boolean(votingEnabled),
      maxSubmissionsPerUser: Math.max(1, Number.parseInt(String(maxSubmissionsPerUser || 1), 10)),
      createdBy: req.user._id,
    });

    return res.status(201).json({ message: "Contest posted—let’s roll!", contest });
  } catch (err) {
    return res.status(500).json({ message: "Contest scatter: " + err.message });
  }
};

export const updateContestByAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only—abeg comot!" });
    }
    const { contestId } = req.params;
    if (!isObjectId(contestId)) return res.status(400).json({ message: "Invalid contest id." });

    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ message: "Contest no dey!" });

    const {
      title,
      description,
      rules,
      category,
      termsVersion,
      termsUrl,
      policyUrl,
      requireTermsAcceptance,
      prize,
      startDate,
      endDate,
      status,
      votingEnabled,
      maxSubmissionsPerUser,
      winnerSubmissionId,
    } = req.body || {};

    if (typeof title === "string") contest.title = title.trim();
    if (typeof description === "string") contest.description = description.trim();
    if (typeof rules === "string") contest.rules = rules.trim();
    if (typeof category === "string") contest.category = category.trim().toLowerCase();
    if (typeof termsVersion === "string") contest.termsVersion = termsVersion.trim();
    if (typeof termsUrl === "string") contest.termsUrl = termsUrl.trim();
    if (typeof policyUrl === "string") contest.policyUrl = policyUrl.trim();
    if (typeof requireTermsAcceptance === "boolean") {
      contest.requireTermsAcceptance = requireTermsAcceptance;
    }
    if (prize !== undefined && Number.isFinite(Number(prize))) contest.prize = Number(prize);
    if (typeof votingEnabled === "boolean") contest.votingEnabled = votingEnabled;
    if (maxSubmissionsPerUser !== undefined) {
      contest.maxSubmissionsPerUser = Math.max(
        1,
        Number.parseInt(String(maxSubmissionsPerUser || 1), 10)
      );
    }
    if (startDate) {
      const parsed = new Date(startDate);
      if (!Number.isNaN(parsed.getTime())) contest.startDate = parsed;
    }
    if (endDate) {
      const parsed = new Date(endDate);
      if (!Number.isNaN(parsed.getTime())) contest.endDate = parsed;
    }
    if (status && ["draft", "live", "closed", "archived"].includes(String(status))) {
      contest.status = String(status);
    }
    if (winnerSubmissionId === null || winnerSubmissionId === "") {
      contest.winnerSubmissionId = null;
    } else if (winnerSubmissionId && isObjectId(winnerSubmissionId)) {
      const winner = await ContestSubmission.findOne({
        _id: winnerSubmissionId,
        contestId: contest._id,
      });
      if (winner) {
        contest.winnerSubmissionId = winner._id;
        winner.status = "winner";
        winner.reviewedBy = req.user._id;
        await winner.save();
      }
    }

    if (new Date(contest.endDate).getTime() <= new Date(contest.startDate).getTime()) {
      return res.status(400).json({ message: "Invalid contest date range." });
    }

    await contest.save();
    return res.json({ message: "Contest updated.", contest });
  } catch (err) {
    return res.status(500).json({ message: "Contest update scatter: " + err.message });
  }
};

export const listContestsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only—abeg comot!" });
    }

    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "all").trim().toLowerCase();
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;
    const skip = (page - 1) * pageSize;

    const query = {};
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }
    if (status !== "all" && ["draft", "live", "closed", "archived"].includes(status)) {
      query.status = status;
    }

    const [rows, total, statusAgg] = await Promise.all([
      Contest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("createdBy", "_id email")
        .lean(),
      Contest.countDocuments(query),
      Contest.aggregate([{ $match: query }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const contestIds = rows.map((x) => x._id);
    const submissionsAgg = await ContestSubmission.aggregate([
      { $match: { contestId: { $in: contestIds } } },
      { $group: { _id: "$contestId", totalSubmissions: { $sum: 1 }, approved: { $sum: { $cond: [{ $in: ["$status", ["approved", "winner"]] }, 1, 0] } } } },
    ]);
    const subMap = new Map(submissionsAgg.map((x) => [String(x._id), x]));

    const summary = { total, draft: 0, live: 0, closed: 0, archived: 0 };
    for (const row of statusAgg) {
      const key = String(row._id || "");
      if (key in summary) summary[key] = Number(row.count || 0);
    }

    return res.json({
      contests: rows.map((row) => ({
        ...row,
        stats: {
          totalSubmissions: Number(subMap.get(String(row._id))?.totalSubmissions || 0),
          approvedSubmissions: Number(subMap.get(String(row._id))?.approved || 0),
        },
      })),
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasPrev: page > 1,
        hasNext: skip + rows.length < total,
      },
      message: "Admin contests loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Contests list scatter: " + err.message });
  }
};

export const getContestDetailsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only—abeg comot!" });
    }
    const { contestId } = req.params;
    if (!isObjectId(contestId)) return res.status(400).json({ message: "Invalid contest id." });

    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;
    const skip = (page - 1) * pageSize;

    const contest = await Contest.findById(contestId).populate("createdBy", "_id email").lean();
    if (!contest) return res.status(404).json({ message: "Contest no dey!" });

    const [rows, total] = await Promise.all([
      ContestSubmission.find({ contestId })
        .sort({ voteCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("userId", "_id email username")
        .populate("reviewedBy", "_id email")
        .populate("threadId", "_id title")
        .populate("listingId", "_id title")
        .lean(),
      ContestSubmission.countDocuments({ contestId }),
    ]);

    return res.json({
      contest,
      submissions: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasPrev: page > 1,
        hasNext: skip + rows.length < total,
      },
      message: "Contest details loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Contest details scatter: " + err.message });
  }
};

export const listContestRiskSignalsForAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only—abeg comot!" });
    }

    const status = String(req.query.status || "all").trim().toLowerCase();
    const severityFilter = String(req.query.severity || "all").trim().toLowerCase();
    const q = String(req.query.q || "").trim();
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;

    const query = {};
    if (status !== "all" && ["draft", "live", "closed", "archived"].includes(status)) {
      query.status = status;
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    const contests = await Contest.find(query)
      .sort({ createdAt: -1 })
      .select("_id title status startDate endDate prize createdBy")
      .populate("createdBy", "_id email")
      .lean();
    const contestIds = contests.map((contest) => contest._id);

    const submissions = contestIds.length
      ? await ContestSubmission.find({ contestId: { $in: contestIds } })
          .select("contestId userId voteCount voters status")
          .lean()
      : [];

    const submissionMap = new Map();
    for (const row of submissions) {
      const key = String(row.contestId);
      if (!submissionMap.has(key)) submissionMap.set(key, []);
      submissionMap.get(key).push(row);
    }

    const rows = contests
      .map((contest) => {
        const entries = submissionMap.get(String(contest._id)) || [];
        let totalVotes = 0;
        let topSubmissionVotes = 0;
        let voteCountMismatchCount = 0;
        let duplicateVoterEntryCount = 0;
        let selfVoteCount = 0;
        const uniqueVoterSet = new Set();

        for (const submission of entries) {
          const voters = Array.isArray(submission.voters)
            ? submission.voters.map((v) => String(v))
            : [];
          const voteCount = Number(submission.voteCount || 0);
          totalVotes += voteCount;
          if (voteCount > topSubmissionVotes) topSubmissionVotes = voteCount;
          if (voteCount !== voters.length) voteCountMismatchCount += 1;

          const voterSet = new Set(voters);
          if (voterSet.size !== voters.length) duplicateVoterEntryCount += 1;
          if (voterSet.has(String(submission.userId))) selfVoteCount += 1;

          for (const voterId of voterSet) uniqueVoterSet.add(voterId);
        }

        const metrics = {
          totalVotes,
          uniqueVoters: uniqueVoterSet.size,
          topSubmissionVotes,
          voteCountMismatchCount,
          duplicateVoterEntryCount,
          selfVoteCount,
          submissions: entries.length,
        };
        const signal = computeContestRiskSignal(metrics);
        return {
          contest: {
            _id: contest._id,
            title: contest.title,
            status: contest.status,
            startDate: contest.startDate,
            endDate: contest.endDate,
            prize: Number(contest.prize || 0),
            createdBy: contest.createdBy
              ? {
                  _id: contest.createdBy._id,
                  email: contest.createdBy.email || "",
                }
              : null,
          },
          metrics,
          ...signal,
        };
      })
      .filter((row) =>
        severityFilter === "all" ? row.severity !== "none" : row.severity === severityFilter
      )
      .sort((a, b) => b.score - a.score || b.metrics.totalVotes - a.metrics.totalVotes);

    const total = rows.length;
    const skip = (page - 1) * pageSize;
    const paged = rows.slice(skip, skip + pageSize);
    const summary = {
      totalFlagged: total,
      high: rows.filter((row) => row.severity === "high").length,
      medium: rows.filter((row) => row.severity === "medium").length,
      low: rows.filter((row) => row.severity === "low").length,
    };

    return res.json({
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasPrev: page > 1,
        hasNext: skip + paged.length < total,
      },
      rows: paged,
      message: "Contest risk signals loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Contest risk scan scatter: " + err.message });
  }
};

export const reviewContestSubmissionByAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only—abeg comot!" });
    }
    const { contestId, submissionId } = req.params;
    if (!isObjectId(contestId) || !isObjectId(submissionId)) {
      return res.status(400).json({ message: "Invalid ids." });
    }

    const status = String(req.body?.status || "").trim().toLowerCase();
    const scoreRaw = Number(req.body?.score);
    const reviewNote = String(req.body?.reviewNote || "").trim();
    if (!["pending", "approved", "rejected", "winner"].includes(status)) {
      return res.status(400).json({ message: "Invalid submission status." });
    }

    const submission = await ContestSubmission.findOne({ _id: submissionId, contestId });
    if (!submission) return res.status(404).json({ message: "Submission no dey!" });
    if (submission.prizeClaim?.status === "paid") {
      return res.status(400).json({
        message: "Submission already paid out. Status changes are locked.",
      });
    }

    if (submission.status === status) {
      return res.json({ message: `Submission already ${status}.`, submission });
    }

    submission.status = status;
    if (Number.isFinite(scoreRaw)) submission.score = scoreRaw;
    submission.reviewedBy = req.user._id;
    submission.reviewNote = reviewNote;
    await submission.save();

    if (status === "winner") {
      await ContestSubmission.updateMany(
        {
          contestId,
          _id: { $ne: submission._id },
          status: "winner",
        },
        {
          $set: {
            status: "approved",
            reviewedBy: req.user._id,
          },
        },
      );
      await Contest.findByIdAndUpdate(contestId, {
        winnerSubmissionId: submission._id,
        status: "closed",
      });
    } else {
      const contest = await Contest.findById(contestId).select("winnerSubmissionId");
      if (contest?.winnerSubmissionId && String(contest.winnerSubmissionId) === String(submission._id)) {
        await Contest.findByIdAndUpdate(contestId, { winnerSubmissionId: null });
      }
    }

    return res.json({ message: "Submission reviewed.", submission });
  } catch (err) {
    return res.status(500).json({ message: "Submission review scatter: " + err.message });
  }
};

export const createContestSubmission = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Login first." });
    const { contestId } = req.params;
    if (!isObjectId(contestId)) return res.status(400).json({ message: "Invalid contest id." });

    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ message: "Contest no dey!" });
    if (!isContestLiveNow(contest)) {
      return res.status(400).json({ message: "Contest no dey live now." });
    }

    const currentCount = await ContestSubmission.countDocuments({
      contestId,
      userId: req.user._id,
    });
    if (currentCount >= Number(contest.maxSubmissionsPerUser || 1)) {
      return res.status(400).json({ message: "Submission limit reached for this contest." });
    }

    const {
      threadId = null,
      listingId = null,
      title = "",
      summary = "",
      acceptTerms = false,
      termsVersionAccepted = "",
    } = req.body || {};

    if (contest.requireTermsAcceptance && acceptTerms !== true) {
      return res.status(400).json({ message: "You must accept contest terms before submitting." });
    }
    if (!threadId && !listingId) {
      return res.status(400).json({ message: "threadId or listingId is required." });
    }

    if (threadId) {
      if (!isObjectId(threadId)) return res.status(400).json({ message: "Invalid threadId." });
      const thread = await Thread.findById(threadId).select("_id userId").lean();
      if (!thread) return res.status(404).json({ message: "Thread no dey!" });
      if (String(thread.userId) !== String(req.user._id)) {
        return res.status(403).json({ message: "You fit submit only your own thread." });
      }
    }
    if (listingId) {
      if (!isObjectId(listingId)) return res.status(400).json({ message: "Invalid listingId." });
      const listing = await Listing.findById(listingId).select("_id userId").lean();
      if (!listing) return res.status(404).json({ message: "Listing no dey!" });
      if (String(listing.userId) !== String(req.user._id)) {
        return res.status(403).json({ message: "You fit submit only your own listing." });
      }
    }

    const submission = await ContestSubmission.create({
      contestId,
      userId: req.user._id,
      threadId: threadId || null,
      listingId: listingId || null,
      title: String(title || "").trim(),
      summary: String(summary || "").trim(),
      termsAccepted: Boolean(acceptTerms),
      termsVersionAccepted: String(termsVersionAccepted || contest.termsVersion || "").trim(),
      termsAcceptedAt: acceptTerms ? new Date() : null,
      contestRulesSnapshot: String(contest.rules || "").trim(),
      contestTermsUrlSnapshot: String(contest.termsUrl || "/contests/terms").trim(),
      contestPolicyUrlSnapshot: String(contest.policyUrl || "/contests/policy").trim(),
    });

    return res.status(201).json({ message: "Submission received.", submission });
  } catch (err) {
    return res.status(500).json({ message: "Submission scatter: " + err.message });
  }
};

export const voteContestSubmission = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Login first." });
    const { submissionId } = req.params;
    if (!isObjectId(submissionId)) return res.status(400).json({ message: "Invalid submission id." });

    const submission = await ContestSubmission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission no dey!" });
    const contest = await Contest.findById(submission.contestId);
    if (!contest) return res.status(404).json({ message: "Contest no dey!" });
    if (!contest.votingEnabled) return res.status(400).json({ message: "Voting disabled for contest." });
    if (!isContestLiveNow(contest)) return res.status(400).json({ message: "Contest no dey live now." });
    if (String(submission.userId) === String(req.user._id)) {
      return res.status(400).json({ message: "You no fit vote your own submission." });
    }

    const alreadyVoted = submission.voters.some((v) => String(v) === String(req.user._id));
    if (alreadyVoted) {
      submission.voters = submission.voters.filter((v) => String(v) !== String(req.user._id));
      submission.voteCount = Math.max(0, Number(submission.voteCount || 0) - 1);
      await submission.save();
      return res.json({ message: "Vote removed.", voted: false, voteCount: submission.voteCount });
    }

    submission.voters.push(req.user._id);
    submission.voteCount = Number(submission.voteCount || 0) + 1;
    await submission.save();
    return res.json({ message: "Vote counted.", voted: true, voteCount: submission.voteCount });
  } catch (err) {
    return res.status(500).json({ message: "Vote scatter: " + err.message });
  }
};

export const getContests = async (req, res) => {
  try {
    const now = new Date();
    const status = String(req.query.status || "live").trim().toLowerCase();
    const query = {};
    if (status === "all") {
      query.status = { $in: ["draft", "live", "closed", "archived"] };
    } else if (["draft", "live", "closed", "archived"].includes(status)) {
      query.status = status;
    } else {
      query.status = "live";
    }
    if (query.status === "live") {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }

    const contests = await Contest.find(query).sort({ createdAt: -1 }).lean();
    const ids = contests.map((x) => x._id);
    const submissionsAgg = await ContestSubmission.aggregate([
      { $match: { contestId: { $in: ids }, status: { $in: ["approved", "winner"] } } },
      { $group: { _id: "$contestId", submissionCount: { $sum: 1 }, totalVotes: { $sum: "$voteCount" } } },
    ]);
    const subMap = new Map(submissionsAgg.map((x) => [String(x._id), x]));

    return res.json({
      contests: contests.map((contest) => ({
        ...contest,
        stats: {
          submissionCount: Number(subMap.get(String(contest._id))?.submissionCount || 0),
          totalVotes: Number(subMap.get(String(contest._id))?.totalVotes || 0),
          isLiveNow: isContestLiveNow(contest),
        },
      })),
      message: "Contests dey here—join the vibe!",
    });
  } catch (err) {
    return res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const getContestById = async (req, res) => {
  try {
    const { contestId } = req.params;
    if (!isObjectId(contestId)) return res.status(400).json({ message: "Invalid contest id." });

    const contest = await Contest.findById(contestId).lean();
    if (!contest) return res.status(404).json({ message: "Contest no dey!" });

    const submissions = await ContestSubmission.find({
      contestId,
      status: { $in: ["approved", "winner"] },
    })
      .sort({ voteCount: -1, createdAt: -1 })
      .limit(30)
      .populate("userId", "_id email username")
      .populate("threadId", "_id title")
      .populate("listingId", "_id title")
      .lean();
    const viewerId = req.user?._id ? String(req.user._id) : null;

    return res.json({
      contest: {
        ...contest,
        isLiveNow: isContestLiveNow(contest),
      },
      submissions: submissions.map((row) => ({
        ...row,
        viewerHasVoted: viewerId
          ? Array.isArray(row.voters) && row.voters.some((voterId) => String(voterId) === viewerId)
          : false,
      })),
      message: "Contest details loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Contest details scatter: " + err.message });
  }
};

export const listMyContestEligibleThreads = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Login first." });
    const limitRaw = Number.parseInt(String(req.query.limit || "50"), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    const threads = await Thread.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id title category createdAt")
      .lean();

    return res.json({
      threads,
      message: "Your threads loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Threads picker scatter: " + err.message });
  }
};

export const listMyContestEligibleListings = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Login first." });
    const limitRaw = Number.parseInt(String(req.query.limit || "50"), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    const listings = await Listing.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id title category status createdAt price")
      .lean();

    return res.json({
      listings,
      message: "Your listings loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Listings picker scatter: " + err.message });
  }
};

export const requestContestPrizeClaim = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Login first." });
    const { submissionId } = req.params;
    if (!isObjectId(submissionId)) return res.status(400).json({ message: "Invalid submission id." });

    const submission = await ContestSubmission.findById(submissionId).populate("contestId", "_id prize title");
    if (!submission) return res.status(404).json({ message: "Submission no dey!" });
    if (String(submission.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "You fit request claim only for your own winning entry." });
    }
    if (submission.status !== "winner") {
      return res.status(400).json({ message: "Only winner can request prize claim." });
    }
    if (submission.prizeClaim?.status === "pending_review") {
      return res.status(400).json({ message: "Claim already pending admin review." });
    }
    if (submission.prizeClaim?.status === "paid") {
      return res.status(400).json({ message: "Prize already paid for this submission." });
    }

    const fullName = String(req.body?.fullName || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const idType = String(req.body?.idType || "").trim();
    const idNumber = String(req.body?.idNumber || "").trim();
    const idNumberLast4 = idNumber ? idNumber.slice(-4) : "";

    if (!fullName || !phone || !idType || !idNumberLast4) {
      return res.status(400).json({ message: "fullName, phone, idType and idNumber are required." });
    }

    submission.prizeClaim = {
      ...(submission.prizeClaim || {}),
      status: "pending_review",
      requestedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: "",
      fullName,
      phone,
      idType,
      idNumberLast4,
      payoutReference: "",
      paidAt: null,
    };
    await submission.save();

    return res.json({
      message: "Prize claim submitted. Admin will review your identification details.",
      claimStatus: submission.prizeClaim?.status || "pending_review",
    });
  } catch (err) {
    return res.status(500).json({ message: "Prize claim scatter: " + err.message });
  }
};

export const reviewContestPrizeClaimByAdmin = async (req, res) => {
  try {
    if (!hasPermission(req.user, "platform.admin")) {
      return res.status(403).json({ message: "Admins only—abeg comot!" });
    }
    const { submissionId } = req.params;
    if (!isObjectId(submissionId)) return res.status(400).json({ message: "Invalid submission id." });

    const approve = Boolean(req.body?.approve);
    const reviewNote = String(req.body?.reviewNote || "").trim();

    const submission = await ContestSubmission.findById(submissionId).populate("contestId", "_id prize title");
    if (!submission) return res.status(404).json({ message: "Submission no dey!" });
    if (submission.status !== "winner") {
      return res.status(400).json({ message: "Only winner submission can be paid." });
    }
    if (submission.prizeClaim?.status !== "pending_review") {
      return res.status(400).json({ message: "Prize claim is not pending review." });
    }

    if (!approve) {
      submission.prizeClaim = {
        ...(submission.prizeClaim || {}),
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: req.user._id,
        reviewNote: reviewNote || "Identification details not sufficient.",
      };
      await submission.save();
      return res.json({ message: "Prize claim rejected.", claimStatus: submission.prizeClaim.status });
    }

    const prizeAmount = Number(submission.contestId?.prize || 0);
    if (!Number.isFinite(prizeAmount) || prizeAmount <= 0) {
      return res.status(400).json({ message: "Contest prize is invalid for payout." });
    }

    await ensureWalletBalanceFields(submission.userId);
    const wallet = await Wallet.findOneAndUpdate(
      { userId: submission.userId },
      { $inc: { availableBalance: prizeAmount, balance: prizeAmount } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const payoutReference = `contest_prize_${submission._id}_${Date.now()}`;

    await WalletLedger.create({
      userId: submission.userId,
      entryKind: "contest_prize_paid",
      amount: prizeAmount,
      walletEffect: prizeAmount,
      status: "completed",
      reference: payoutReference,
      counterparty: "NaijaTalk Contest Prize",
      listingTitle: submission.contestId?.title || "Contest Prize",
      availableBalance: Number(wallet?.availableBalance || 0),
      heldBalance: Number(wallet?.heldBalance || 0),
      balance: Number(wallet?.balance || 0),
      metadata: {
        contestId: submission.contestId?._id || null,
        submissionId: submission._id,
      },
    });

    submission.prizeClaim = {
      ...(submission.prizeClaim || {}),
      status: "paid",
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      reviewNote: reviewNote || "Claim approved and paid.",
      payoutReference,
      paidAt: new Date(),
    };
    await submission.save();

    let platformWallet = await PlatformWallet.findOne();
    if (!platformWallet) {
      platformWallet = new PlatformWallet({ balance: 0 });
    }
    platformWallet.balance = Number(platformWallet.balance || 0) - prizeAmount;
    platformWallet.lastUpdated = Date.now();
    await platformWallet.save();

    return res.json({
      message: "Prize claim approved. Winner wallet credited successfully.",
      claimStatus: submission.prizeClaim.status,
      payoutReference,
      creditedAmount: prizeAmount,
      wallet: {
        balance: Number(wallet?.balance || 0),
        availableBalance: Number(wallet?.availableBalance || 0),
        heldBalance: Number(wallet?.heldBalance || 0),
      },
      platformWallet: {
        balance: Number(platformWallet.balance || 0),
        lastUpdated: platformWallet.lastUpdated || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Prize claim review scatter: " + err.message });
  }
};

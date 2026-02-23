// backend/controllers/threads.js
import Thread from "../models/thread.js";
import Reply from "../models/reply.js";
import Report from "../models/report.js";
import mongoose from "mongoose";
import { hasAnyPermission, hasPermission } from "../utils/permissions.js";

const isAdmin = (user) => hasPermission(user, "platform.admin");
const isStaff = (user) =>
  hasAnyPermission(user, ["platform.admin", "threads.moderate"]);
const canManageSolvedState = (user, thread) =>
  isAdmin(user) ||
  hasPermission(user, "threads.moderate") ||
  thread.userId?.toString() === user._id.toString();

const bannedKeywords = ["419", "whatsapp me", "click here", "free money"];

const containsBannedContent = (text) => {
  const lowerText = text.toLowerCase();
  return bannedKeywords.some((keyword) => lowerText.includes(keyword));
};

export const createThread = async (req, res) => {
  const { title, body, category } = req.body; // Add category here
  try {
    if (!title || !body)
      return res.status(400).json({ message: "Title or body no dey!" });
    if (containsBannedContent(title) || containsBannedContent(body))
      return res.status(400).json({ message: "Abeg, no spam gist!" });

    // console.log("Creating thread with:", { title, body, category }); // Debug log

    const thread = new Thread({
      title,
      body,
      userId: req.user._id,
      category: category || "General", // Explicit fallback
    });
    await thread.save();

    res.status(201).json({ message: "Thread posted—gist dey hot!", thread });
  } catch (err) {
    res.status(500).json({ message: "Thread wahala: " + err.message });
  }
};

export const getThreads = async (req, res) => {
  try {
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "20"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 100)
      : 20;
    const skip = (page - 1) * pageSize;

    const [threads, total] = await Promise.all([
      Thread.find()
      .populate("userId", "email flair")
      .sort({ isSticky: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
      Thread.countDocuments(),
    ]);
    // console.log("Threads fetched:", threads); // Log threads
    if (!threads.length) {
      return res.json({
        threads: [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(Math.ceil(total / pageSize), 1),
          hasNext: false,
          hasPrev: page > 1,
        },
        message: "No gist yet—drop your own!",
      });
    }
    const isPremium = req.user && req.user.isPremium;
    res.json({
      threads,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasNext: skip + threads.length < total,
        hasPrev: page > 1,
      },
      message: isPremium
        ? "Premium threads—no ads!"
        : "Threads dey here—check am!",
    });
  } catch (err) {
    console.error("Get Threads Error:", err.message);
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const createReply = async (req, res) => {
  const { id } = req.params;
  const { body, parentReplyId } = req.body;
  try {
    console.log("Creating reply:", {
      id,
      body,
      parentReplyId,
      userId: req.user?._id,
    });
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Abeg, login again—token scatter!" });
    }
    if (!body) return res.status(400).json({ message: "Reply body no dey!" });
    if (containsBannedContent(body))
      return res.status(400).json({ message: "Abeg, no spam gist!" });

    const thread = await Thread.findById(id).select("isLocked");
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });
    if (thread.isLocked && !isStaff(req.user)) {
      return res.status(403).json({ message: "Thread locked—no new replies." });
    }

    if (parentReplyId) {
      const parentReply = await Reply.findById(parentReplyId).select("threadId");
      if (!parentReply) {
        return res.status(400).json({ message: "Parent reply no dey!" });
      }
      if (parentReply.threadId.toString() !== id) {
        return res.status(400).json({ message: "Parent reply no belong here!" });
      }
    }

    const reply = new Reply({
      body,
      userId: req.user._id,
      threadId: id,
      parentReplyId: parentReplyId || null,
    });
    await reply.save();
    console.log("Reply saved:", reply);

    res.status(201).json({ message: "Reply posted—gist dey grow!", reply });
  } catch (err) {
    console.error("Reply error:", err);
    res.status(500).json({ message: "Reply scatter: " + err.message });
  }
};

export const getThreadById = async (req, res) => {
  const { id } = req.params;
  try {
    const thread = await Thread.findById(id)
      .populate("userId", "email flair")
      .lean();
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    const replies = await Reply.find({ threadId: id })
      .populate("userId", "email flair")
      .sort({ createdAt: -1 });
    res.json({ ...thread, replies });
  } catch (err) {
    res.status(500).json({ message: "Fetch wahala: " + err.message });
  }
};

export const searchThreads = async (req, res) => {
  const { q } = req.query;
  try {
    if (!q)
      return res
        .status(400)
        .json({ message: "Search wetin? Abeg drop query!" });
    const threads = await Thread.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .populate("userId", "email flair")
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    // Fetch replies for each thread
    const threadsWithReplies = await Promise.all(
      threads.map(async (thread) => {
        const fullThread = await Thread.findById(thread._id)
          .populate("userId", "email flair")
          .lean();
        const replies = await Reply.find({ threadId: thread._id })
          .populate("userId", "email flair")
          .sort({ createdAt: -1 });
        return { ...fullThread, replies };
      })
    );

    res.json({
      threads: threadsWithReplies,
      message: "Search results dey here—enjoy!",
    });
  } catch (err) {
    res.status(500).json({ message: "Search scatter: " + err.message });
  }
};

export const listThreadsForAdmin = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }

    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "all").trim();
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
        { body: { $regex: q, $options: "i" } },
      ];
    }
    if (status === "locked") query.isLocked = true;
    if (status === "sticky") query.isSticky = true;
    if (status === "solved") query.isSolved = true;

    const [threads, total, summaryAgg] = await Promise.all([
      Thread.find(query)
        .populate("userId", "email flair role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Thread.countDocuments(query),
      Thread.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "threadId",
            as: "reports",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            locked: { $sum: { $cond: [{ $eq: ["$isLocked", true] }, 1, 0] } },
            sticky: { $sum: { $cond: [{ $eq: ["$isSticky", true] }, 1, 0] } },
            solved: { $sum: { $cond: [{ $eq: ["$isSolved", true] }, 1, 0] } },
            reported: { $sum: { $cond: [{ $gt: [{ $size: "$reports" }, 0] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const threadIds = threads.map((t) => t._id);
    const [replyCounts, reportCounts] = await Promise.all([
      Reply.aggregate([
        { $match: { threadId: { $in: threadIds } } },
        { $group: { _id: "$threadId", count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { threadId: { $in: threadIds } } },
        { $group: { _id: "$threadId", count: { $sum: 1 } } },
      ]),
    ]);

    const repliesMap = new Map(replyCounts.map((r) => [String(r._id), r.count]));
    const reportsMap = new Map(reportCounts.map((r) => [String(r._id), r.count]));

    const rows = threads.map((thread) => ({
      ...thread,
      replyCount: Number(repliesMap.get(String(thread._id)) || 0),
      reportCount: Number(reportsMap.get(String(thread._id)) || 0),
    }));

    const stats = summaryAgg[0] || {
      total: 0,
      locked: 0,
      sticky: 0,
      solved: 0,
      reported: 0,
    };
    const summary = {
      total: Number(stats.total || total || 0),
      locked: Number(stats.locked || 0),
      sticky: Number(stats.sticky || 0),
      solved: Number(stats.solved || 0),
      reported: Number(stats.reported || 0),
    };

    return res.json({
      threads: rows,
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasNext: skip + rows.length < total,
        hasPrev: page > 1,
      },
      message: "Admin threads list loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Threads list scatter: " + err.message });
  }
};

export const getAdminThreadDetails = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid thread id." });
    }

    const thread = await Thread.findById(id)
      .populate("userId", "_id email username role flair")
      .populate("solvedBy", "_id email role")
      .populate("stickyBy", "_id email role")
      .populate("lockedBy", "_id email role")
      .lean();
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    const [replyCount, reportCount, recentReplies, recentReports] = await Promise.all([
      Reply.countDocuments({ threadId: id }),
      Report.countDocuments({ threadId: id }),
      Reply.find({ threadId: id })
        .sort({ createdAt: -1 })
        .limit(12)
        .populate("userId", "_id email flair role")
        .select("_id body createdAt userId parentReplyId")
        .lean(),
      Report.find({ threadId: id })
        .sort({ createdAt: -1 })
        .limit(12)
        .populate("userId", "_id email flair role")
        .populate("reportedUserId", "_id email flair role")
        .select("_id reason createdAt userId reportedUserId")
        .lean(),
    ]);

    return res.json({
      thread: {
        _id: thread._id,
        title: thread.title,
        body: thread.body,
        category: thread.category || "General",
        createdAt: thread.createdAt,
        isLocked: Boolean(thread.isLocked),
        isSticky: Boolean(thread.isSticky),
        isSolved: Boolean(thread.isSolved),
        lockedAt: thread.lockedAt || null,
        stickyAt: thread.stickyAt || null,
        solvedAt: thread.solvedAt || null,
        likesCount: Array.isArray(thread.likes) ? thread.likes.length : 0,
        bookmarksCount: Array.isArray(thread.bookmarks) ? thread.bookmarks.length : 0,
        author: thread.userId
          ? {
              _id: thread.userId._id,
              email: thread.userId.email,
              username: thread.userId.username || null,
              role: thread.userId.role || "user",
              flair: thread.userId.flair || null,
            }
          : null,
        solvedBy: thread.solvedBy
          ? {
              _id: thread.solvedBy._id,
              email: thread.solvedBy.email,
              role: thread.solvedBy.role || "user",
            }
          : null,
        stickyBy: thread.stickyBy
          ? {
              _id: thread.stickyBy._id,
              email: thread.stickyBy.email,
              role: thread.stickyBy.role || "user",
            }
          : null,
        lockedBy: thread.lockedBy
          ? {
              _id: thread.lockedBy._id,
              email: thread.lockedBy.email,
              role: thread.lockedBy.role || "user",
            }
          : null,
      },
      stats: {
        replies: replyCount,
        reports: reportCount,
      },
      recentReplies: recentReplies.map((row) => ({
        _id: row._id,
        body: row.body,
        createdAt: row.createdAt,
        parentReplyId: row.parentReplyId || null,
        author: row.userId
          ? {
              _id: row.userId._id,
              email: row.userId.email,
              flair: row.userId.flair || null,
              role: row.userId.role || "user",
            }
          : null,
      })),
      recentReports: recentReports.map((row) => ({
        _id: row._id,
        reason: row.reason,
        createdAt: row.createdAt,
        reporter: row.userId
          ? {
              _id: row.userId._id,
              email: row.userId.email,
              flair: row.userId.flair || null,
              role: row.userId.role || "user",
            }
          : null,
        reportedUser: row.reportedUserId
          ? {
              _id: row.reportedUserId._id,
              email: row.reportedUserId.email,
              flair: row.reportedUserId.flair || null,
              role: row.reportedUserId.role || "user",
            }
          : null,
      })),
      message: "Admin thread details loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Thread details scatter: " + err.message });
  }
};

export const reportThread = async (req, res) => {
  const { id } = req.params; // threadId
  const { reason } = req.body;
  try {
    if (!reason) return res.status(400).json({ message: "Abeg, tell us why!" });

    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    const report = new Report({
      threadId: id,
      userId: req.user._id, // Reporter
      reportedUserId: thread.userId, // Thread poster
      reason,
    });
    await report.save();

    res.status(201).json({ message: "Report sent—mods go check am!" });
  } catch (err) {
    res.status(500).json({ message: "Report scatter: " + err.message });
  }
};

export const getReports = async (req, res) => {
  try {
    // if (req.user.email !== "harzkane@gmail.com") {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const pageRaw = Number.parseInt(String(req.query.page || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize || req.query.limit || "25"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 200)
      : 25;
    const skip = (page - 1) * pageSize;
    const dateFromRaw = String(req.query.dateFrom || "").trim();
    const dateToRaw = String(req.query.dateTo || "").trim();
    const query = {};

    const createdAt = {};
    if (dateFromRaw) {
      const parsedFrom = new Date(dateFromRaw);
      if (!Number.isNaN(parsedFrom.getTime())) createdAt.$gte = parsedFrom;
    }
    if (dateToRaw) {
      const parsedTo = new Date(dateToRaw);
      if (!Number.isNaN(parsedTo.getTime())) {
        parsedTo.setHours(23, 59, 59, 999);
        createdAt.$lte = parsedTo;
      }
    }
    if (Object.keys(createdAt).length > 0) query.createdAt = createdAt;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("threadId", "title")
        .populate("userId", "email flair") // Reporter
        .populate("reportedUserId", "email flair") // Reported user
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Report.countDocuments(query),
    ]);
    if (!reports.length)
      return res.json({
        reports: [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(Math.ceil(total / pageSize), 1),
          hasNext: false,
          hasPrev: page > 1,
        },
        message: "No reports yet—clean slate!",
      });
    res.json({
      reports,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasNext: skip + reports.length < total,
        hasPrev: page > 1,
      },
      message: "Reports dey here—check am!",
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const dismissReport = async (req, res) => {
  const { id } = req.params; // reportId
  try {
    // if (req.user.email !== "harzkane@gmail.com") {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const report = await Report.findByIdAndDelete(id);
    if (!report) return res.status(404).json({ message: "Report no dey!" });
    res.json({ message: "Report don waka—dismissed!" });
  } catch (err) {
    res.status(500).json({ message: "Dismiss scatter: " + err.message });
  }
};

export const hasUserReportedThread = async (req, res) => {
  const { id } = req.params; // threadId
  try {
    const report = await Report.findOne({
      threadId: id,
      userId: req.user._id,
    });
    res.json({
      hasReported: !!report,
      message: report
        ? "You don flag this gist!"
        : "You never report this one.",
    });
  } catch (err) {
    res.status(500).json({ message: "Check scatter: " + err.message });
  }
};

export const deleteThread = async (req, res) => {
  const { id } = req.params;
  try {
    // Sync admin check with getReports
    // if (req.user.email !== "harzkane@gmail.com") {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const thread = await Thread.findByIdAndDelete(id);
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });
    await Reply.deleteMany({ threadId: id });
    await Report.deleteMany({ threadId: id });
    res.json({ message: "Thread don go—cleaned up!" });
  } catch (err) {
    res.status(500).json({ message: "Delete scatter: " + err.message });
  }
};

export const toggleThreadLike = async (req, res) => {
  const { id } = req.params;
  try {
    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    const userId = req.user._id.toString();
    const alreadyLiked = thread.likes.some((likeId) => likeId.toString() === userId);

    if (alreadyLiked) {
      thread.likes = thread.likes.filter((likeId) => likeId.toString() !== userId);
    } else {
      thread.likes.push(req.user._id);
    }

    await thread.save();
    res.json({
      message: alreadyLiked ? "Like removed." : "Thread liked.",
      liked: !alreadyLiked,
      likesCount: thread.likes.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Like scatter: " + err.message });
  }
};

export const toggleThreadBookmark = async (req, res) => {
  const { id } = req.params;
  try {
    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    const userId = req.user._id.toString();
    const alreadyBookmarked = thread.bookmarks.some(
      (bookmarkId) => bookmarkId.toString() === userId
    );

    if (alreadyBookmarked) {
      thread.bookmarks = thread.bookmarks.filter(
        (bookmarkId) => bookmarkId.toString() !== userId
      );
    } else {
      thread.bookmarks.push(req.user._id);
    }

    await thread.save();
    res.json({
      message: alreadyBookmarked ? "Bookmark removed." : "Thread bookmarked.",
      bookmarked: !alreadyBookmarked,
      bookmarksCount: thread.bookmarks.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Bookmark scatter: " + err.message });
  }
};

export const toggleThreadSolved = async (req, res) => {
  const { id } = req.params;
  try {
    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    if (!canManageSolvedState(req.user, thread)) {
      return res
        .status(403)
        .json({ message: "Only owner/mod/admin fit mark as solved." });
    }

    if (thread.isSolved) {
      thread.isSolved = false;
      thread.solvedBy = null;
      thread.solvedAt = null;
    } else {
      thread.isSolved = true;
      thread.solvedBy = req.user._id;
      thread.solvedAt = new Date();
    }

    await thread.save();
    res.json({
      message: thread.isSolved ? "Thread marked solved." : "Solved status removed.",
      isSolved: thread.isSolved,
      solvedAt: thread.solvedAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Solved toggle scatter: " + err.message });
  }
};

export const toggleThreadSticky = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Mods/admins only." });
    }

    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    if (thread.isSticky) {
      thread.isSticky = false;
      thread.stickyBy = null;
      thread.stickyAt = null;
    } else {
      thread.isSticky = true;
      thread.stickyBy = req.user._id;
      thread.stickyAt = new Date();
    }

    await thread.save();
    res.json({
      message: thread.isSticky ? "Thread pinned." : "Thread unpinned.",
      isSticky: thread.isSticky,
      stickyAt: thread.stickyAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Sticky toggle scatter: " + err.message });
  }
};

export const toggleThreadLock = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Mods/admins only." });
    }

    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    if (thread.isLocked) {
      thread.isLocked = false;
      thread.lockedBy = null;
      thread.lockedAt = null;
    } else {
      thread.isLocked = true;
      thread.lockedBy = req.user._id;
      thread.lockedAt = new Date();
    }

    await thread.save();
    res.json({
      message: thread.isLocked ? "Thread locked." : "Thread unlocked.",
      isLocked: thread.isLocked,
      lockedAt: thread.lockedAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Lock toggle scatter: " + err.message });
  }
};

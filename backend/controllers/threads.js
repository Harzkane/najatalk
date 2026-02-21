// backend/controllers/threads.js
import Thread from "../models/thread.js";
import Reply from "../models/reply.js";
import Report from "../models/report.js";

const isAdmin = (user) => user.role === "admin";
const isStaff = (user) => user.role === "admin" || user.role === "mod";
const canManageSolvedState = (user, thread) =>
  isAdmin(user) ||
  user.role === "mod" ||
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
    const threads = await Thread.find()
      .populate("userId", "email flair")
      .sort({ isSticky: -1, createdAt: -1 });
    // console.log("Threads fetched:", threads); // Log threads
    if (!threads.length) {
      return res.json({ threads: [], message: "No gist yet—drop your own!" });
    }
    const isPremium = req.user && req.user.isPremium;
    res.json({
      threads,
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
  const { id } = req.params; // threadId
  const { body } = req.body;
  try {
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
      userId: req.user._id, // From authMiddleware
      threadId: id,
    });
    await reply.save();

    res.status(201).json({ message: "Reply posted—gist dey grow!", reply });
  } catch (err) {
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
    const reports = await Report.find()
      .populate("threadId", "title")
      .populate("userId", "email flair") // Reporter
      .populate("reportedUserId", "email flair") // Reported user
      .sort({ createdAt: -1 });
    if (!reports.length)
      return res.json({ message: "No reports yet—clean slate!" });
    res.json({ reports, message: "Reports dey here—check am!" });
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

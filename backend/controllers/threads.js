// backend/controllers/threads.js
import Thread from "../models/thread.js";
import Reply from "../models/reply.js";
import Report from "../models/report.js";

const isAdmin = (user) => user.role === "admin";

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
    const threads = await Thread.find().populate("userId", "email");
    console.log("Threads fetched:", threads); // Log threads
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
    const thread = await Thread.findById(id).populate("userId", "email").lean();
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    const replies = await Reply.find({ threadId: id })
      .populate("userId", "email")
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
      .populate("userId", "email")
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    // Fetch replies for each thread
    const threadsWithReplies = await Promise.all(
      threads.map(async (thread) => {
        const fullThread = await Thread.findById(thread._id)
          .populate("userId", "email")
          .lean();
        const replies = await Reply.find({ threadId: thread._id })
          .populate("userId", "email")
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
      .populate("userId", "email") // Reporter
      .populate("reportedUserId", "email") // Reported user
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

// Add text index (run once in MongoDB shell or setup script)
Thread.collection.createIndex({ title: "text", body: "text" });

// backend/controllers/threads.js
import Thread from "../models/thread.js";
import Reply from "../models/reply.js";

export const createThread = async (req, res) => {
  const { title, body } = req.body;
  try {
    if (!title || !body)
      return res.status(400).json({ message: "Title or body no dey!" });

    const thread = new Thread({
      title,
      body,
      userId: req.user._id, // From authMiddleware
    });
    await thread.save();

    res.status(201).json({ message: "Thread posted—gist dey hot!", thread });
  } catch (err) {
    res.status(500).json({ message: "Thread wahala: " + err.message });
  }
};

export const getThreads = async (req, res) => {
  try {
    const threads = await Thread.find().populate("userId", "email"); // Show user email
    if (!threads.length)
      return res.json({ message: "No gist yet—drop your own!" });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

export const createReply = async (req, res) => {
  const { id } = req.params; // threadId
  const { body } = req.body;
  try {
    if (!body) return res.status(400).json({ message: "Reply body no dey!" });

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

// Add text index (run once in MongoDB shell or setup script)
Thread.collection.createIndex({ title: "text", body: "text" });

// backend/controllers/contests.js
import Contest from "../models/contests.js";

export const createContest = async (req, res) => {
  const { title, description, prize, endDate } = req.body;
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admins only—abeg comot!" });
    const contest = new Contest({
      title,
      description,
      prize,
      endDate,
      createdBy: req.user._id,
    });
    await contest.save();
    res.status(201).json({ message: "Contest posted—let’s roll!", contest });
  } catch (err) {
    res.status(500).json({ message: "Contest scatter: " + err.message });
  }
};

export const getContests = async (req, res) => {
  try {
    const contests = await Contest.find({ endDate: { $gte: new Date() } }).sort(
      { createdAt: -1 }
    );
    res.json({ contests, message: "Contests dey here—join the vibe!" });
  } catch (err) {
    res.status(500).json({ message: "Fetch scatter: " + err.message });
  }
};

// backend/controllers/users.js
import User from "../models/user.js";

export const banUser = async (req, res) => {
  const { userId } = req.params;
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User no dey!" });
    res.json({ message: "User don dey banned—e don finish!" });
  } catch (err) {
    res.status(500).json({ message: "Ban scatter: " + err.message });
  }
};

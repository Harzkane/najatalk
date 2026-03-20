// backend/controllers/threads.js
import Thread from "../models/thread.js";
import Reply from "../models/reply.js";
import Report from "../models/report.js";
import SearchQueryLog from "../models/searchQueryLog.js";
import mongoose from "mongoose";
import { hasAnyPermission, hasPermission } from "../utils/permissions.js";
import {
  DEFAULT_THREAD_CATEGORY,
  normalizeThreadCategory,
} from "../utils/threadCategories.js";
import {
  richTextHtmlToPlainText,
  sanitizePlainText,
  sanitizeRichTextHtml,
} from "../utils/richTextSanitizer.js";
import {
  buildRegexClauses,
  buildSearchTerms,
  normalizeSearchQuery,
  scoreThreadSearchResult,
} from "../utils/threadSearch.js";

const isAdmin = (user) => hasPermission(user, "platform.admin");
const isStaff = (user) =>
  hasAnyPermission(user, ["platform.admin", "threads.moderate"]);
const canManageSolvedState = (user, thread) =>
  isAdmin(user) ||
  hasPermission(user, "threads.moderate") ||
  thread.userId?.toString() === user._id.toString();

const bannedKeywords = ["419", "whatsapp me", "click here", "free money"];
const REPLY_COOLDOWN_MS = 30 * 1000;
const SEARCH_EVENT_TYPES = new Set([
  "search_submit",
  "suggestion_click",
  "result_click",
  "category_filter",
]);

const containsBannedContent = (text) => {
  const lowerText = String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ");
  return bannedKeywords.some((keyword) => lowerText.includes(keyword));
};

const enrichThreadsWithReplyStats = async (threads) => {
  if (!threads.length) return threads;

  const threadIds = threads
    .map((thread) => thread?._id)
    .filter((id) => Boolean(id));
  if (!threadIds.length) return threads;

  const replyStats = await Reply.aggregate([
    { $match: { threadId: { $in: threadIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$threadId",
        replyCount: { $sum: 1 },
        latestReplyAt: { $first: "$createdAt" },
        latestReplyUserId: { $first: "$userId" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "latestReplyUserId",
        foreignField: "_id",
        as: "latestReplyUser",
      },
    },
    {
      $unwind: {
        path: "$latestReplyUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        replyCount: 1,
        latestReplyAt: 1,
        latestReplyUser: {
          username: "$latestReplyUser.username",
          flair: "$latestReplyUser.flair",
          avatarUrl: "$latestReplyUser.avatarUrl",
        },
      },
    },
  ]);

  const replyStatsMap = new Map(
    replyStats.map((row) => [String(row._id), row]),
  );

  return threads.map((thread) => {
    const baseThread =
      typeof thread?.toObject === "function" ? thread.toObject() : thread;
    const stats = replyStatsMap.get(String(baseThread._id));
    return {
      ...baseThread,
      replyCount: Number(stats?.replyCount || 0),
      latestReplyAt: stats?.latestReplyAt || null,
      latestReplyUser:
        stats?.latestReplyUser?.username || stats?.latestReplyUser?.avatarUrl
        ? {
            username: stats.latestReplyUser.username || null,
            flair: stats.latestReplyUser.flair || null,
            avatarUrl: stats.latestReplyUser.avatarUrl || null,
          }
        : null,
    };
  });
};

export const createThread = async (req, res) => {
  const { title, body, category } = req.body; // Add category here
  try {
    const safeTitle = sanitizePlainText(title, 100);
    const safeBodyHtml = sanitizeRichTextHtml(body);
    const safeBodyText = richTextHtmlToPlainText(safeBodyHtml);
    const safeCategory = normalizeThreadCategory(
      sanitizePlainText(category || DEFAULT_THREAD_CATEGORY, 40),
    );

    if (!safeTitle || !safeBodyText)
      return res.status(400).json({ message: "Title or body no dey!" });
    if (containsBannedContent(safeTitle) || containsBannedContent(safeBodyText))
      return res.status(400).json({ message: "Abeg, no spam gist!" });

    // console.log("Creating thread with:", { title, body, category }); // Debug log

    const thread = new Thread({
      title: safeTitle,
      body: safeBodyHtml || safeBodyText,
      userId: req.user._id,
      category: safeCategory,
    });
    await thread.save();

    res.status(201).json({ message: "Thread posted—gist dey hot!", thread });
  } catch (err) {
    res.status(500).json({ message: "Thread wahala: " + err.message });
  }
};

export const updateThread = async (req, res) => {
  const { id } = req.params;
  const hasTitle = Object.prototype.hasOwnProperty.call(req.body || {}, "title");
  const hasBody = Object.prototype.hasOwnProperty.call(req.body || {}, "body");
  const hasCategory = Object.prototype.hasOwnProperty.call(req.body || {}, "category");

  try {
    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    const isOwner = thread.userId?.toString() === req.user?._id?.toString();
    if (!isOwner && !isStaff(req.user)) {
      return res.status(403).json({ message: "No be your thread to edit." });
    }

    const safeTitle = hasTitle
      ? sanitizePlainText(req.body.title, 100)
      : thread.title;
    const safeBodyHtml = hasBody
      ? sanitizeRichTextHtml(req.body.body)
      : String(thread.body || "");
    const safeBodyText = richTextHtmlToPlainText(safeBodyHtml);
    const safeCategory = hasCategory
      ? normalizeThreadCategory(
          sanitizePlainText(req.body.category || DEFAULT_THREAD_CATEGORY, 40),
        )
      : normalizeThreadCategory(thread.category || DEFAULT_THREAD_CATEGORY);

    if (!safeTitle || !safeBodyText) {
      return res.status(400).json({ message: "Title or body no dey!" });
    }
    if (containsBannedContent(safeTitle) || containsBannedContent(safeBodyText)) {
      return res.status(400).json({ message: "Abeg, no spam gist!" });
    }

    thread.title = safeTitle;
    thread.body = safeBodyHtml || safeBodyText;
    thread.category = safeCategory;
    await thread.save();

    return res.json({ message: "Thread updated.", thread });
  } catch (err) {
    return res.status(500).json({ message: "Thread update scatter: " + err.message });
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

    const [rawThreads, total] = await Promise.all([
      Thread.find()
      .populate("userId", "username flair avatarUrl")
      .sort({ isSticky: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
      Thread.countDocuments(),
    ]);
    const threads = await enrichThreadsWithReplyStats(rawThreads);
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
    const safeBodyHtml = sanitizeRichTextHtml(body);
    const safeBodyText = richTextHtmlToPlainText(safeBodyHtml);

    console.log("Creating reply:", {
      id,
      body: safeBodyText,
      parentReplyId,
      userId: req.user?._id,
    });
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Abeg, login again—token scatter!" });
    }
    if (!safeBodyText) return res.status(400).json({ message: "Reply body no dey!" });
    if (containsBannedContent(safeBodyText))
      return res.status(400).json({ message: "Abeg, no spam gist!" });

    const thread = await Thread.findById(id).select("isLocked");
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });
    if (thread.isLocked && !isStaff(req.user)) {
      return res.status(403).json({ message: "Thread locked—no new replies." });
    }

    if (!isStaff(req.user)) {
      const lastUserReply = await Reply.findOne({
        threadId: id,
        userId: req.user._id,
      })
        .sort({ createdAt: -1 })
        .select("createdAt");

      if (lastUserReply?.createdAt) {
        const lastReplyAt = new Date(lastUserReply.createdAt).getTime();
        const elapsed = Date.now() - lastReplyAt;
        if (!Number.isNaN(lastReplyAt) && elapsed >= 0 && elapsed < REPLY_COOLDOWN_MS) {
          const waitSeconds = Math.ceil((REPLY_COOLDOWN_MS - elapsed) / 1000);
          return res.status(429).json({
            message: `Slow down small—wait ${waitSeconds}s before another reply.`,
          });
        }
      }
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
      body: safeBodyHtml || safeBodyText,
      userId: req.user._id,
      threadId: id,
      parentReplyId: parentReplyId || null,
    });
    await reply.save();
    await Thread.updateOne({ _id: id }, { $set: { updatedAt: new Date() } });
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
      .populate("userId", "username flair avatarUrl")
      .lean();
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    const replies = await Reply.find({ threadId: id })
      .populate("userId", "username flair avatarUrl")
      .sort({ createdAt: -1 });
    res.json({ ...thread, replies });
  } catch (err) {
    res.status(500).json({ message: "Fetch wahala: " + err.message });
  }
};

export const searchThreads = async (req, res) => {
  const {
    q,
    category: categoryQuery,
    unansweredOnly: unansweredOnlyQuery,
    page: pageQuery,
    pageSize: pageSizeQuery,
    sort: sortQuery,
  } = req.query;
  try {
    const normalizedQuery = normalizeSearchQuery(q);
    const pageRaw = Number.parseInt(String(pageQuery || "1"), 10);
    const pageSizeRaw = Number.parseInt(String(pageSizeQuery || "20"), 10);
    const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), 50)
      : 20;
    const skip = (page - 1) * pageSize;
    const requestedSort = String(sortQuery || "relevance").trim();
    const sortMode =
      requestedSort === "latest" || requestedSort === "mostActive"
        ? requestedSort
        : "relevance";

    const normalizedCategory = categoryQuery
      ? normalizeThreadCategory(
          sanitizePlainText(categoryQuery || DEFAULT_THREAD_CATEGORY, 40),
        )
      : null;
    const categoryFilter = normalizedCategory ? { category: normalizedCategory } : {};
    const unansweredOnly =
      String(unansweredOnlyQuery || "").trim() === "1" ||
      String(unansweredOnlyQuery || "").trim().toLowerCase() === "true";

    if (!normalizedQuery) {
      return res.json({
        threads: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        search: {
          query: "",
          category: normalizedCategory,
          sort: sortMode,
          unansweredOnly,
          resultCount: 0,
        },
        ranking: {
          mode: sortMode,
          signals: [],
        },
        message: "Search wetin? Abeg drop query!",
      });
    }

    const searchTerms = buildSearchTerms(normalizedQuery);
    const regexClauses = buildRegexClauses(searchTerms);

    const [textMatches, regexMatches] = await Promise.all([
      Thread.find(
        {
          ...categoryFilter,
          $text: { $search: searchTerms.join(" ") },
        },
        { score: { $meta: "textScore" } },
      )
        .populate("userId", "username flair avatarUrl")
        .sort({ score: { $meta: "textScore" } })
        .limit(24)
        .lean(),
      regexClauses.length
        ? Thread.find({
            ...categoryFilter,
            $or: regexClauses,
          })
            .populate("userId", "username flair avatarUrl")
            .sort({ createdAt: -1 })
            .limit(24)
            .lean()
        : Promise.resolve([]),
    ]);

    const mergedMatches = [...textMatches, ...regexMatches].reduce((acc, thread) => {
      const key = String(thread._id);
      if (!acc.has(key)) {
        acc.set(key, thread);
        return acc;
      }
      const existing = acc.get(key);
      if (Number(thread.score || 0) > Number(existing?.score || 0)) {
        acc.set(key, { ...existing, ...thread });
      }
      return acc;
    }, new Map());

    const enrichedThreads = await enrichThreadsWithReplyStats([
      ...mergedMatches.values(),
    ]);
    const rankedThreads = enrichedThreads
      .filter((thread) => (unansweredOnly ? Number(thread.replyCount || 0) === 0 : true))
      .map((thread) => {
        const bodyText = richTextHtmlToPlainText(thread.body || "");
        return {
          ...thread,
          bodyText,
          searchScore: scoreThreadSearchResult(
            { ...thread, bodyText },
            normalizedQuery,
            searchTerms,
          ),
        };
      })
      .sort((a, b) => {
        const latestActivityDiff =
          new Date(b.latestReplyAt || b.createdAt).getTime() -
          new Date(a.latestReplyAt || a.createdAt).getTime();
        if (sortMode === "latest") return latestActivityDiff;
        if (sortMode === "mostActive") {
          const replyDiff = Number(b.replyCount || 0) - Number(a.replyCount || 0);
          if (replyDiff !== 0) return replyDiff;
          return latestActivityDiff;
        }
        const scoreDiff = Number(b.searchScore || 0) - Number(a.searchScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return latestActivityDiff;
      })
      .map(({ bodyText, searchScore, ...thread }) => thread);
    const total = rankedThreads.length;
    const paginatedThreads = rankedThreads.slice(skip, skip + pageSize);

    res.json({
      threads: paginatedThreads,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
        hasNext: skip + paginatedThreads.length < total,
        hasPrev: page > 1,
      },
      search: {
        query: normalizedQuery,
        category: normalizedCategory,
        sort: sortMode,
        unansweredOnly,
        resultCount: total,
      },
      ranking: {
        mode: sortMode,
        signals: [
          "title_match",
          "body_match",
          "exact_phrase",
          "category_match",
          "recency",
          "reply_count",
          "like_count",
          "bookmark_count",
          "thread_freshness",
          "engagement_velocity",
        ],
      },
      message: paginatedThreads.length
        ? unansweredOnly
          ? normalizedCategory
            ? `Unanswered search results for "${normalizedQuery}" in ${normalizedCategory}.`
            : `Unanswered search results for "${normalizedQuery}".`
          : normalizedCategory
            ? `Search results for "${normalizedQuery}" in ${normalizedCategory}.`
            : `Search results for "${normalizedQuery}".`
        : unansweredOnly
          ? normalizedCategory
            ? `No unanswered gist match "${normalizedQuery}" for ${normalizedCategory} yet.`
            : `No unanswered gist match "${normalizedQuery}" yet.`
          : normalizedCategory
            ? `No gist match "${normalizedQuery}" for ${normalizedCategory} yet.`
            : `No gist match "${normalizedQuery}" yet.`,
    });
  } catch (err) {
    res.status(500).json({ message: "Search scatter: " + err.message });
  }
};

export const trackSearchQuery = async (req, res) => {
  try {
    const rawQuery = sanitizePlainText(req.body?.query || "", 160);
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    const eventTypeRaw = sanitizePlainText(req.body?.eventType || "search_submit", 40);
    const eventType = SEARCH_EVENT_TYPES.has(eventTypeRaw)
      ? eventTypeRaw
      : "search_submit";

    if (eventType !== "category_filter" && !normalizedQuery) {
      return res.status(400).json({ message: "Search query no dey." });
    }

    const safeCategory = req.body?.category
      ? normalizeThreadCategory(
        sanitizePlainText(req.body.category || DEFAULT_THREAD_CATEGORY, 40),
      )
      : null;
    const resultCountRaw = Number.parseInt(String(req.body?.resultCount || "0"), 10);
    const resultCount = Number.isFinite(resultCountRaw) ? Math.max(resultCountRaw, 0) : 0;
    const source = sanitizePlainText(req.body?.source || "web", 40) || "web";
    const threadId = mongoose.Types.ObjectId.isValid(String(req.body?.threadId || ""))
      ? new mongoose.Types.ObjectId(String(req.body.threadId))
      : null;

    if (eventType === "category_filter" && !safeCategory) {
      return res.status(400).json({ message: "Category filter no dey." });
    }

    await SearchQueryLog.create({
      query: rawQuery || null,
      normalizedQuery,
      eventType,
      category: safeCategory,
      source,
      resultCount,
      hadResults: eventType === "search_submit" ? resultCount > 0 : false,
      threadId,
    });

    return res.status(201).json({ message: "Search tracked." });
  } catch (err) {
    return res.status(500).json({ message: "Search tracking scatter: " + err.message });
  }
};

export const getTrendingSearchQueries = async (_req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await SearchQueryLog.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          eventType: "search_submit",
          normalizedQuery: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$normalizedQuery",
          count: { $sum: 1 },
          lastSearchedAt: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1, lastSearchedAt: -1 } },
      { $limit: 8 },
    ]);

    return res.json({
      queries: rows.map((row) => ({
        query: row._id,
        count: Number(row.count || 0),
        lastSearchedAt: row.lastSearchedAt || null,
      })),
      message: "Trending search queries loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Trending searches scatter: " + err.message });
  }
};

export const getSearchInsightsForAdmin = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Abeg, admins only!" });
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const matchStage = { createdAt: { $gte: since } };

    const [
      summaryAgg,
      topQueries,
      topNoResultQueries,
      topSuggestionQueries,
      topClickedQueries,
      topCategoryFilters,
    ] = await Promise.all([
      SearchQueryLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSearches: {
              $sum: { $cond: [{ $eq: ["$eventType", "search_submit"] }, 1, 0] },
            },
            noResultSearches: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$eventType", "search_submit"] },
                      { $eq: ["$hadResults", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            suggestionClicks: {
              $sum: { $cond: [{ $eq: ["$eventType", "suggestion_click"] }, 1, 0] },
            },
            resultClicks: {
              $sum: { $cond: [{ $eq: ["$eventType", "result_click"] }, 1, 0] },
            },
            categoryFilterUses: {
              $sum: { $cond: [{ $eq: ["$eventType", "category_filter"] }, 1, 0] },
            },
            uniqueQueries: {
              $addToSet: {
                $cond: [
                  { $eq: ["$eventType", "search_submit"] },
                  "$normalizedQuery",
                  null,
                ],
              },
            },
          },
        },
        {
          $project: {
            totalSearches: 1,
            noResultSearches: 1,
            suggestionClicks: 1,
            resultClicks: 1,
            categoryFilterUses: 1,
            uniqueQueries: {
              $size: { $setDifference: ["$uniqueQueries", [null, ""]] },
            },
          },
        },
      ]),
      SearchQueryLog.aggregate([
        { $match: { ...matchStage, eventType: "search_submit" } },
        {
          $group: {
            _id: "$normalizedQuery",
            count: { $sum: 1 },
            lastSearchedAt: { $max: "$createdAt" },
            category: { $last: "$category" },
          },
        },
        { $sort: { count: -1, lastSearchedAt: -1 } },
        { $limit: 8 },
      ]),
      SearchQueryLog.aggregate([
        {
          $match: {
            ...matchStage,
            eventType: "search_submit",
            hadResults: false,
          },
        },
        {
          $group: {
            _id: "$normalizedQuery",
            count: { $sum: 1 },
            lastSearchedAt: { $max: "$createdAt" },
          },
        },
        { $sort: { count: -1, lastSearchedAt: -1 } },
        { $limit: 8 },
      ]),
      SearchQueryLog.aggregate([
        { $match: { ...matchStage, eventType: "suggestion_click" } },
        {
          $group: {
            _id: "$normalizedQuery",
            count: { $sum: 1 },
            lastSearchedAt: { $max: "$createdAt" },
          },
        },
        { $sort: { count: -1, lastSearchedAt: -1 } },
        { $limit: 8 },
      ]),
      SearchQueryLog.aggregate([
        {
          $match: {
            ...matchStage,
            eventType: "result_click",
            normalizedQuery: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: "$normalizedQuery",
            count: { $sum: 1 },
            lastSearchedAt: { $max: "$createdAt" },
          },
        },
        { $sort: { count: -1, lastSearchedAt: -1 } },
        { $limit: 8 },
      ]),
      SearchQueryLog.aggregate([
        {
          $match: {
            ...matchStage,
            eventType: "category_filter",
            category: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            lastSearchedAt: { $max: "$createdAt" },
          },
        },
        { $sort: { count: -1, lastSearchedAt: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const summary = summaryAgg[0] || {
      totalSearches: 0,
      noResultSearches: 0,
      uniqueQueries: 0,
      suggestionClicks: 0,
      resultClicks: 0,
      categoryFilterUses: 0,
    };

    return res.json({
      summary: {
        totalSearches: Number(summary.totalSearches || 0),
        noResultSearches: Number(summary.noResultSearches || 0),
        uniqueQueries: Number(summary.uniqueQueries || 0),
        suggestionClicks: Number(summary.suggestionClicks || 0),
        resultClicks: Number(summary.resultClicks || 0),
        categoryFilterUses: Number(summary.categoryFilterUses || 0),
      },
      topQueries: topQueries.map((row) => ({
        query: row._id,
        count: Number(row.count || 0),
        lastSearchedAt: row.lastSearchedAt || null,
        category: row.category || null,
      })),
      topNoResultQueries: topNoResultQueries.map((row) => ({
        query: row._id,
        count: Number(row.count || 0),
        lastSearchedAt: row.lastSearchedAt || null,
      })),
      topSuggestionQueries: topSuggestionQueries.map((row) => ({
        query: row._id,
        count: Number(row.count || 0),
        lastSearchedAt: row.lastSearchedAt || null,
      })),
      topClickedQueries: topClickedQueries.map((row) => ({
        query: row._id,
        count: Number(row.count || 0),
        lastSearchedAt: row.lastSearchedAt || null,
      })),
      topCategoryFilters: topCategoryFilters.map((row) => ({
        query: row._id,
        count: Number(row.count || 0),
        lastSearchedAt: row.lastSearchedAt || null,
        category: row._id || null,
      })),
      message: "Search insights loaded.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Search insights scatter: " + err.message });
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
        .populate("replyId", "_id body threadId")
        .select("_id reason createdAt userId reportedUserId replyId")
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
        replyId: row.replyId
          ? {
              _id: row.replyId._id,
              body: row.replyId.body || "",
              threadId: row.replyId.threadId || null,
            }
          : null,
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

    const existing = await Report.findOne({
      threadId: id,
      userId: req.user._id,
      replyId: null,
    });
    if (existing) {
      return res.status(400).json({ message: "You don flag this gist already." });
    }

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

export const reportReply = async (req, res) => {
  const { replyId } = req.params;
  const { reason } = req.body;
  try {
    if (!reason) return res.status(400).json({ message: "Abeg, tell us why!" });

    const reply = await Reply.findById(replyId).select("threadId userId");
    if (!reply) return res.status(404).json({ message: "Reply no dey!" });

    const existing = await Report.findOne({
      threadId: reply.threadId,
      replyId,
      userId: req.user._id,
    });
    if (existing) {
      return res.status(400).json({ message: "You don flag this reply already." });
    }

    const report = new Report({
      threadId: reply.threadId,
      replyId,
      userId: req.user._id,
      reportedUserId: reply.userId,
      reason,
    });
    await report.save();

    res.status(201).json({ message: "Reply report sent—mods go check am!" });
  } catch (err) {
    res.status(500).json({ message: "Reply report scatter: " + err.message });
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
        .populate("replyId", "body threadId")
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
      reports: reports.map((report) => ({
        ...report.toObject(),
        replyId: report.replyId
          ? {
              _id: report.replyId._id,
              threadId: report.replyId.threadId || null,
              body: report.replyId.body || "",
            }
          : null,
      })),
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

export const hasUserReportedReply = async (req, res) => {
  const { replyId } = req.params;
  try {
    const report = await Report.findOne({
      replyId,
      userId: req.user._id,
    });
    res.json({
      hasReported: !!report,
      message: report
        ? "You don flag this reply!"
        : "You never report this reply.",
    });
  } catch (err) {
    res.status(500).json({ message: "Check scatter: " + err.message });
  }
};

export const deleteThread = async (req, res) => {
  const { id } = req.params;
  try {
    const thread = await Thread.findById(id);
    if (!thread) return res.status(404).json({ message: "Thread no dey!" });

    const isOwner = thread.userId?.toString() === req.user?._id?.toString();
    if (!isOwner && !isStaff(req.user)) {
      return res.status(403).json({ message: "No be your thread to delete." });
    }

    await Thread.deleteOne({ _id: id });
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

export const toggleReplyLike = async (req, res) => {
  const { replyId } = req.params;
  try {
    const reply = await Reply.findById(replyId);
    if (!reply) return res.status(404).json({ message: "Reply no dey!" });

    const userId = req.user._id.toString();
    const alreadyLiked = (reply.likes || []).some(
      (likeId) => likeId.toString() === userId,
    );

    if (alreadyLiked) {
      reply.likes = reply.likes.filter((likeId) => likeId.toString() !== userId);
    } else {
      reply.likes.push(req.user._id);
    }

    await reply.save();
    res.json({
      message: alreadyLiked ? "Like removed." : "Reply liked.",
      liked: !alreadyLiked,
      likesCount: reply.likes.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Reply like scatter: " + err.message });
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

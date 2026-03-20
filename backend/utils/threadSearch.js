const SEARCH_SYNONYM_MAP = {
  japa: ["relocation", "visa", "travel", "abroad", "migration"],
  nysc: ["corps", "corper", "camp", "service"],
  nepa: ["power", "electricity", "light"],
  gist: ["talk", "discussion", "story"],
  suya: ["food", "spot", "hangout"],
  football: ["epl", "champions", "transfer", "match"],
  wahala: ["problem", "issue", "trouble"],
};

const RECENCY_HALF_LIFE_DAYS = 14;

export const normalizeSearchQuery = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const unique = (items) => [...new Set(items.filter(Boolean))];

export const buildSearchTerms = (query) => {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return [];

  const baseTerms = normalized
    .split(" ")
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
  const expandedTerms = [...baseTerms];

  for (const term of baseTerms) {
    const synonyms = SEARCH_SYNONYM_MAP[term];
    if (Array.isArray(synonyms)) {
      expandedTerms.push(...synonyms);
    }
  }

  return unique([normalized, ...expandedTerms]).slice(0, 12);
};

export const buildRegexClauses = (terms) => {
  const regexTerms = terms
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .filter(Boolean)
    .slice(0, 8);

  return regexTerms.flatMap((term) => [
    { title: { $regex: term, $options: "i" } },
    { body: { $regex: term, $options: "i" } },
  ]);
};

const countTermMatches = (haystack, terms) => {
  const text = String(haystack || "").toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (text.includes(term)) score += 1;
  }
  return score;
};

const getRecencyBoost = (createdAt) => {
  const createdAtMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtMs)) return 0;
  const ageDays = Math.max((Date.now() - createdAtMs) / (1000 * 60 * 60 * 24), 0);
  return Math.max(0, 1 - ageDays / RECENCY_HALF_LIFE_DAYS);
};

const getHoursSince = (value) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;
  return Math.max((Date.now() - timestamp) / (1000 * 60 * 60), 0);
};

const getArrayCount = (value) => (Array.isArray(value) ? value.length : 0);

const getEngagementBoost = (thread) => {
  const likesCount = getArrayCount(thread?.likes);
  const bookmarksCount = getArrayCount(thread?.bookmarks);

  return {
    likesCount,
    bookmarksCount,
    score:
      Math.min(likesCount, 25) * 1.6 +
      Math.min(bookmarksCount, 25) * 2.4,
  };
};

const getEngagementVelocityBoost = (thread) => {
  const replyCount = Number(thread?.replyCount || 0);
  const likesCount = getArrayCount(thread?.likes);
  const bookmarksCount = getArrayCount(thread?.bookmarks);
  const latestActivityAt = thread?.latestReplyAt || thread?.updatedAt || thread?.createdAt;
  const hoursSinceLatestActivity = getHoursSince(latestActivityAt);
  const hoursSinceCreated = getHoursSince(thread?.createdAt);

  if (hoursSinceLatestActivity === null || hoursSinceCreated === null) {
    return 0;
  }

  const weightedInteractions =
    replyCount * 1.5 +
    likesCount * 1.1 +
    bookmarksCount * 1.3;
  const activityDensity = weightedInteractions / Math.max(hoursSinceCreated, 6);
  const freshnessMultiplier =
    hoursSinceLatestActivity <= 6
      ? 1.6
      : hoursSinceLatestActivity <= 24
        ? 1.15
        : hoursSinceLatestActivity <= 72
          ? 0.7
          : 0.25;

  return Math.min(activityDensity * freshnessMultiplier * 6, 26);
};

export const scoreThreadSearchResult = (thread, query, terms) => {
  const normalizedQuery = normalizeSearchQuery(query);
  const title = String(thread?.title || "").toLowerCase();
  const body = String(thread?.bodyText || thread?.body || "").toLowerCase();
  const category = String(thread?.category || "").toLowerCase();
  const replyCount = Number(thread?.replyCount || 0);
  const textScore = Number(thread?.score || 0);
  const engagement = getEngagementBoost(thread);
  const engagementVelocityBoost = getEngagementVelocityBoost(thread);

  let score = textScore * 10;

  if (title === normalizedQuery) score += 80;
  if (title.startsWith(normalizedQuery)) score += 50;
  if (title.includes(normalizedQuery)) score += 28;
  if (body.includes(normalizedQuery)) score += 14;
  if (category === normalizedQuery) score += 24;

  score += countTermMatches(title, terms) * 10;
  score += countTermMatches(body, terms) * 4;
  score += Math.min(replyCount, 20) * 1.2;
  score += engagement.score;
  score += engagementVelocityBoost;
  score += getRecencyBoost(thread?.createdAt) * 12;

  return Number(score.toFixed(3));
};

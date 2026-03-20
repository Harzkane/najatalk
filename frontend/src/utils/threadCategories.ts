export type ThreadCategoryDefinition = {
  id: string;
  label: string;
  description: string;
};

export const THREAD_CATEGORY_DEFINITIONS: ThreadCategoryDefinition[] = [
  {
    id: "general",
    label: "General",
    description: "Open conversations that do not fit another category.",
  },
  {
    id: "trending",
    label: "Trending",
    description: "Fast-moving conversations people across Naija are talking about.",
  },
  {
    id: "news",
    label: "News",
    description: "Breaking updates, current events, and public-interest stories.",
  },
  {
    id: "politics",
    label: "Politics",
    description: "Government, elections, policies, and public debate.",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    description: "Music, movies, celebrities, skits, and pop culture.",
  },
  {
    id: "football",
    label: "Football",
    description: "EPL, NPFL, Champions League, transfers, and match talk.",
  },
  {
    id: "relationships",
    label: "Relationships",
    description: "Dating, marriage, heartbreak, and friendship conversations.",
  },
  {
    id: "campus",
    label: "Campus",
    description: "University life, NYSC, exams, admissions, and student gist.",
  },
  {
    id: "jobs",
    label: "Jobs",
    description: "Hiring, career advice, CV help, interviews, and work life.",
  },
  {
    id: "business",
    label: "Business",
    description: "SMEs, money moves, hustle ideas, and entrepreneurship.",
  },
  {
    id: "tech",
    label: "Tech",
    description: "Phones, apps, gadgets, software, startups, and AI.",
  },
  {
    id: "japa",
    label: "Japa",
    description: "Relocation, visas, migration advice, and abroad planning.",
  },
  {
    id: "religion",
    label: "Religion",
    description: "Faith, church, mosque, doctrine, and spiritual conversations.",
  },
  {
    id: "market",
    label: "Market",
    description: "Buying, selling, prices, and everyday market conversation.",
  },
  {
    id: "local-life",
    label: "Local Life",
    description: "Food, rent, transport, NEPA, cities, and neighborhood life.",
  },
];

export const DEFAULT_THREAD_CATEGORY = "General";

export const THREAD_CATEGORY_LABELS = THREAD_CATEGORY_DEFINITIONS.map(
  (category) => category.label,
);

const CATEGORY_LABELS = new Map(
  THREAD_CATEGORY_DEFINITIONS.map((category) => [
    category.label.toLowerCase(),
    category.label,
  ]),
);

export const normalizeThreadCategory = (value?: string | null) => {
  const raw = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  return CATEGORY_LABELS.get(raw) || DEFAULT_THREAD_CATEGORY;
};

# NaijaTalk Category And Search Roadmap

This document is the working checklist for improving NaijaTalk's forum categories, homepage discovery, and search system for public testing and broader rollout.

Use this file as the source of truth while we execute.

---

## Goals

- Make NaijaTalk feel like a real Nigerian-first public forum.
- Improve homepage discovery so users can quickly find what matters.
- Build a stronger search experience that goes beyond simple text matching.
- Reduce the chance of shipping gaps by tracking design, backend, frontend, testing, and rollout work in one place.

---

## Success Criteria

- Users can immediately understand what NaijaTalk is about from the homepage.
- Categories feel natural for Nigerian browsing behavior.
- Homepage search is prominent, useful, and fast.
- Search results are relevant for both exact and fuzzy queries.
- Guest users can discover threads comfortably before login.
- Logged-in users can browse, search, post, save, and engage without confusion.
- Public testing can happen with confidence because critical flows are covered by tests.

---

## Phase 1: Category Strategy

### 1.1 Finalize Core Category Set

- [x] Agree the launch category list.
- [x] Keep category count lean enough for easy browsing.
- [x] Confirm category naming tone fits NaijaTalk and Nigerian users.
- [ ] Avoid overlapping categories that confuse posting decisions.

### Proposed launch categories

- [x] `General`
- [x] `Trending`
- [x] `News`
- [x] `Politics`
- [x] `Entertainment`
- [x] `Football`
- [x] `Relationships`
- [x] `Campus`
- [x] `Jobs`
- [x] `Business`
- [x] `Tech`
- [x] `Japa`
- [x] `Religion`
- [x] `Market`
- [x] `Local Life`

### 1.2 Define Category Rules

- [x] Write short descriptions for each category.
- [ ] Decide which categories are broad discussion categories versus utility categories.
- [ ] Define what belongs in `Trending`.
- [ ] Decide whether `Trending` is a true posting category or only a system-generated feed.
- [ ] Decide whether `Market` should remain separate from marketplace content or only discuss market topics.
- [ ] Decide whether `Local Life` includes food, rent, transport, NEPA, city life, and neighborhood gist.

### 1.3 Tags Strategy

- [ ] Decide whether tags ship in phase 1 or phase 2.
- [x] Draft starter tags for Nigerian usage.
- [ ] Define whether tags are user-generated, admin-curated, or hybrid.

### Starter tag ideas

- [x] `Lagos`
- [x] `Abuja`
- [x] `Port Harcourt`
- [x] `NYSC`
- [x] `ASUU`
- [x] `Visa`
- [x] `Rent`
- [x] `Transfer News`
- [x] `Side Hustle`
- [x] `Food`
- [x] `Power`
- [x] `Dating`

---

## Phase 2: Homepage Discovery UX

### 2.1 Homepage Information Architecture

- [x] Confirm homepage is the public discovery surface.
- [ ] Decide the order of major homepage blocks.
- [x] Make the search area feel central, not secondary.
- [x] Make categories easier to scan on mobile and desktop.
- [x] Ensure the homepage communicates both community and utility value.

### 2.2 Homepage Core Blocks

- [x] Header and navigation
- [x] Search bar
- [x] Guest CTA
- [x] Logged-in continue area
- [x] Category rail or category pills
- [x] Main discussion feed
- [x] Sort controls
- [x] Filter controls
- [x] Community stats
- [x] Trending topics
- [x] Sponsored slots

### 2.3 Homepage UX Improvements

- [x] Review whether the current category rail is enough for mobile.
- [x] Decide whether to add horizontal category chips above the feed.
- [x] Improve the empty state for no search results.
- [x] Improve the "no threads yet" state to encourage first posting.
- [x] Make the search field more visually important.
- [x] Add clearer discovery cues like `Popular now`, `Fresh discussions`, or `Hot in Nigeria`.

### 2.4 Nigerian Relevance Check

- [x] Ensure examples and placeholder text feel Nigerian without overdoing slang.
- [x] Make sure location/culture references are broad enough beyond Lagos-only bias.
- [ ] Check whether category naming works for users across Nigeria.
- [x] Confirm copy feels local, clear, and not forced.

---

## Phase 3: Search Product Design

### 3.1 Define Search Jobs To Be Done

- [ ] Search for a known topic.
- [ ] Discover what is trending.
- [ ] Recover a thread previously seen.
- [ ] Find advice or how-to answers.
- [ ] Find local recommendations.
- [ ] Find timely news/discussion threads.

### 3.2 Search Modes

- [x] Keyword search
- [x] Suggested search queries
- [x] Category-filtered search
- [x] Sort by latest
- [x] Sort by relevance
- [x] Sort by most active
- [x] Optional: unanswered-only search

### 3.3 Search Suggestions

- [x] Recent searches
- [x] Trending searches
- [x] Suggested categories
- [x] Suggested tags
- [x] Popular topics now

### 3.4 Search Result Ranking Signals

- [x] Title match
- [x] Body match
- [x] Exact phrase match
- [x] Category match
- [x] Recency
- [x] Reply count
- [x] Bookmark count
- [x] Like count
- [x] Thread freshness
- [x] Engagement velocity

---

## Phase 4: Search Brain Architecture

### 4.1 Phase 1 Search Brain

- [x] Keep Mongo text search as the first engine if needed for speed.
- [x] Improve backend ranking logic.
- [x] Add search query normalization.
- [x] Add lowercasing and whitespace cleanup.
- [x] Add basic synonym handling.
- [x] Add optional category-aware boosting.

### 4.2 Nigerian Synonym Layer

- [x] Draft synonym dictionary format.
- [x] Map common Nigerian terms and variants.
- [ ] Decide whether synonyms should expand queries, boost matches, or both.

### Starter synonym ideas

- [ ] `japa` -> relocation, travel, visa, abroad
- [ ] `nysc` -> corps, corper, camp, service
- [ ] `nepa` -> power, electricity, light
- [ ] `gist` -> gist, talk, discussion, story
- [ ] `suya` -> food, spot, hangout
- [ ] `football` -> epl, champions league, transfer
- [ ] `wahala` -> problem, issue, trouble

### 4.3 Intent Layer

- [ ] Detect recommendation intent.
- [ ] Detect advice/problem-solving intent.
- [ ] Detect news intent.
- [ ] Detect local discovery intent.
- [ ] Detect trending intent.

### 4.4 Future Search Brain

- [ ] Personalized ranking from viewed categories.
- [ ] Personalized ranking from saved threads.
- [ ] Personalized ranking from likes and replies.
- [x] Trending-query engine.
- [x] Search analytics dashboard.
- [ ] Admin controls for search tuning.

---

## Phase 5: Backend Work

### 5.1 Category Data Model

- [ ] Review current category storage in threads.
- [ ] Update allowed category list.
- [ ] Add validation for new categories.
- [ ] Decide whether categories live in code or config.
- [ ] Add migration plan for old thread categories if needed.

### 5.2 Search API

- [x] Review current `/threads/search` behavior.
- [x] Define target response shape for search results.
- [x] Add ranking metadata if useful.
- [x] Add search params for category and sort.
- [x] Add pagination for search results.
- [x] Add safe fallbacks for empty query and no-match cases.

### 5.3 Search Analytics

- [x] Track search query submissions.
- [x] Track suggested search clicks.
- [x] Track no-result searches.
- [x] Track search-to-thread clickthrough.
- [x] Track category filter usage.

### 5.4 Performance

- [ ] Review existing text indexes.
- [ ] Confirm search latency is acceptable.
- [ ] Add limits and guards for abusive queries.
- [ ] Verify pagination behavior under load.

---

## Phase 6: Frontend Work

### 6.1 Homepage Category UX

- [x] Replace the current category set in the homepage.
- [x] Update category counts.
- [x] Ensure categories look good on mobile.
- [x] Ensure categories are easy to scan on desktop.
- [ ] Decide whether category icons are needed.

### 6.2 Thread Composer

- [ ] Update category dropdown.
- [ ] Add helper text so users choose the right category.
- [ ] Prevent stale categories from being submitted.

### 6.3 Search Bar UX

- [x] Improve search placeholder copy.
- [x] Improve focus state and visibility.
- [x] Improve suggestion list hierarchy.
- [x] Add category-aware suggestions if useful.
- [x] Add trending searches from live data later.
- [ ] Ensure keyboard navigation works well.

### 6.4 Search Results UX

- [x] Clearly show result count.
- [x] Show active filters.
- [x] Show empty-state guidance.
- [x] Allow easy reset back to all discussions.
- [x] Ensure search and category filters work together cleanly.

### 6.5 Thread Page UX

- [ ] Confirm guest readers understand that reading is public.
- [x] Keep action gating clear for reply, report, like, save, and tip.
- [ ] Make search discoverable on the thread page.
- [ ] Ensure thread detail deep links are easy to share.

---

## Phase 7: SEO And Public Sharing

- [x] Add homepage metadata.
- [x] Add thread detail metadata.
- [ ] Add Open Graph metadata for shared thread links.
- [ ] Add Twitter card metadata.
- [ ] Ensure thread titles and descriptions are clean for previews.
- [ ] Review whether `/threads/[id]` should render richer metadata than the current redirect approach.

---

## Phase 8: Testing And QA

### 8.1 Public Flow QA

- [x] Guest can load homepage.
- [x] Guest can load threads page.
- [x] Guest can open a thread detail page.
- [x] Guest can search from homepage.
- [x] Guest can filter by category.
- [x] Guest clicking reply redirects to login.
- [x] Guest clicking report redirects to login.
- [x] Guest clicking like redirects to login.
- [x] Guest clicking save redirects to login.
- [x] Guest clicking tip redirects to login.

### 8.2 Logged-in Flow QA

- [ ] Logged-in user can search from homepage.
- [ ] Logged-in user can search from thread page.
- [ ] Logged-in user can create a thread with a valid category.
- [ ] Logged-in user can view filtered results by category.
- [ ] Logged-in user can use saved/bookmarked filter.

### 8.3 Search Quality QA

- [ ] Exact title search returns expected thread.
- [ ] Partial search returns useful results.
- [ ] Nigerian slang query returns useful results.
- [ ] Typo-ish search is handled reasonably.
- [ ] No-result state is clear and not dead-end.

### 8.4 Automated Test Coverage

- [x] Expand public smoke tests for homepage discovery.
- [x] Add public smoke test for thread detail page.
- [x] Add E2E checks for guest gated actions.
- [x] Add tests for category filtering.
- [x] Add tests for search behavior.

---

## Phase 9: Public Testing Rollout

### 9.1 Limited Beta

- [ ] Test with a small group first.
- [ ] Watch what categories people actually use.
- [ ] Watch what users try to search for.
- [ ] Capture no-result and low-result queries.
- [ ] Gather complaints about category confusion.

### 9.2 Metrics To Watch

- [ ] Homepage search usage rate
- [ ] Category clickthrough rate
- [ ] Search result clickthrough rate
- [ ] No-result search rate
- [ ] Thread open rate from homepage
- [ ] Signup conversion from public visitors
- [ ] Logged-in engagement after discovery

### 9.3 Post-Beta Adjustments

- [ ] Merge weak categories if needed.
- [ ] Split overloaded categories if needed.
- [ ] Update synonym dictionary from real usage.
- [ ] Improve ranking based on beta search analytics.

---

## Decisions Log

Use this section to record major decisions so we do not lose context.

- [x] Decision: final category list approved
- [ ] Decision: whether `Trending` is a feed or posting category
- [ ] Decision: whether tags ship in phase 1 or phase 2
- [ ] Decision: homepage search scope for phase 1
- [ ] Decision: backend search engine approach for phase 1

Notes:

- Launch category list approved for phase 1:
  `General`, `Trending`, `News`, `Politics`, `Entertainment`, `Football`,
  `Relationships`, `Campus`, `Jobs`, `Business`, `Tech`, `Japa`,
  `Religion`, `Market`, `Local Life`

---

## Immediate Next Steps

- [x] Approve the launch category list.
- [ ] Decide whether to add tags now or later.
- [ ] Update homepage category UI and composer category dropdown.
- [x] Improve homepage search UX.
- [x] Improve backend thread search ranking.
- [x] Add missing public guest-flow tests.
- [x] Add metadata for homepage and thread detail pages.

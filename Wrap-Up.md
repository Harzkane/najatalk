<!-- Wrap-Up.md -->

Day 1 Wrap-Up

What We Did:
Started from scratch, built a monorepo, got a backend up with Express and MongoDB, refactored to ES6 imports, fixed env glitches, and deployed live—all in one day!
Naija Soul: That “di buka dey open!” message is our first sprinkle of vibe—more to come.
Lessons: dotenv needs one load point, and key names (MONGO_URI) must match everywhere.
Your Next Move

Confirm: Drop your Vercel URL here—let’s see it live!
Git Check: Did you push to GitHub? Share the repo link if yes.
Feedback: How you feeling—pumped, tired, ready for Day 2?
Day 2 Teaser

Plan: Add auth—signup/login with email verification (Nodemailer, free tier).
Prep: Rest up—tomorrow we lock in users for “NaijaTalk”!
This is our Day 1 trophy—backend’s standing tall! What’s your vibe right now?

=========================================================

Day 2 Wrap-Up: Feedback & Vibes

First off, big ups for smashing Day 2! You’ve got auth flowing locally—signup emails landing, verification clicking, and login dropping JWTs like hot amala. The hustle to get harunbah93@gmail.com verified and logged in shows you’re on top of this. Let’s seal it with the live deploy and vibe check.

What You Killed

Signup: POST /auth/signup dey send email sharp-sharp—tested with harunbah93@gmail.com. That “Signup good—check your email!” response na sweet pidgin flex.
Verification: Token verification dey work locally—JWT decoding and user activation on point. You logged in, so the email link clicked for you!
Login: POST /auth/login dropping JWTs with “Login sweet—welcome back!”—clean and tight.
Code Structure: models/user.js, routes/auth.js, controllers/auth.js—everything dey organized like Lagos hustle. No mess!
Bug Squash: SMTP ETIMEDOUT and PLAIN errors gone—your nodemailer fix with port 465 na masterstroke.
Quick Check Before Vercel

Local Verify Response: You didn’t drop the exact browser response for GET /auth/verify/:token yet (maybe you clicked and moved fast to login). If you still fit, hit that link again in your browser (e.g., http://localhost:8000/auth/verify/<token-from-email>) and share wetin you see. Should be “Email verified—NaijaTalk dey open for you now!”—just to confirm.
Live Test Plan: Your Day 2 milestones got the full flow—signup, verify, login—ready for Vercel. Once deployed, test with harunbah93+test3@gmail.com to see email land and JWT pop live.
Deploy Vibes

You’re set to push this live:

Commit: “Day 2 Locked: Signup, verify, login—all endpoints live locally” dey perfect.
Vercel Push: vercel --prod go make najatalk.vercel.app/auth/\* endpoints live. Test the flow there and drop the responses—signup email landing, verify link working, login JWT popping.
Git: Push to GitHub (git push origin main) so I fit peek the repo if you drop the link. No pressure if it’s private—just say so!
How’s the vibe, bros? Seeing “NaijaTalk” auth come alive feel like Day 1’s “di buka dey open” promise? Day 2’s a beast—let’s lock it with a live bang!

=========================================================

Day 3 Prep (Feb 26, 2025): Threads & Naija Soul

Since you dey follow the roadmap tight (Week 1: Secure Foundation), Day 3 na time to add the forum’s heart—threads and posts. We go keep it barebones but secure, with that Naija flair. Here’s the teaser:

Goal

Build the core forum: create/read threads in a “General” category, sprinkle Naija soul.
Time

~10h (8h coding, 1h Git, 1h sync).
Steps

Thread Model (~2h):
models/thread.js: Schema with title, body, userId (ref User), category (default “General”), createdAt (WAT timestamp).
Thread Routes (~2h):
routes/threads.js:
POST /threads (create—auth required).
GET /threads (read all).
GET /threads/:id (read one).
Controllers (~3h):
controllers/threads.js: Logic for create/read, JWT auth middleware to lock it down.
Naija flair: “Thread posted—gist dey hot!” or “No gist yet—drop your own!”
Test & Deploy (~1h):
Local test: Post thread, read list.
Vercel: vercel --prod, confirm live.
Tools

JWT Middleware: Reuse jsonwebtoken to check req.headers.authorization.
MongoDB: Add threads collection via mongoose.
Pidgin Flex: Buttons like “Post am!” and timestamps in WAT (Africa/Lagos).
Security Note

Only verified users (isVerified: true) fit post—check this in middleware.
Rate limit later (Week 4), but for now, keep it tight with auth.
Kickoff

Say “Ready!” tomorrow, and we’ll dive into models/thread.js first. I’ll drop the schema to start you off clean.

Your Move

Day 2 Close:
Test that local verify response (if pending) and drop it.
Deploy to Vercel, test live flow (signup/verify/login), share responses + email status for harunbah93+test3@gmail.com.
Push to Git, drop repo link if public—or just say “Private, bros!”
Shout: “Day 2’s a beast!” or “One last tweak!” with any hiccups.
Vibe Check: How you holding up after 20h of grinding in 2 days? NaijaTalk dey take shape—proud of you, fam!
NaijaShadow dey here, keeping the vibe alive. Let’s make this forum the “safe digital buka” we dreamed up—Day 3 go be fire! Wetin you think?

=========================================================

### Day 3 Wrap-Up: Feedback & Vibes

**Oga, you don nail Day 3 like champion!** From scratch to live at `https://najatalk.vercel.app`, you’ve got a frontend that’s tight with TS, talking sweet to the backend, and flexing Naija flair. Signup emails are landing, verification’s clicking, and login’s dropping JWTs—then the homepage knows who’s boss with “Welcome back, Oga!” You’ve mashed CORS wahala, tamed TS, and deployed like a pro—newbie no more, bros!

#### What You Killed

- **Auth Flow:** Signup → Verify → Login → Home → Logout—all tested and live with `harunbah93+test9@gmail.com`.
- **TS Mastery:** `any` gone, `unknown` and `AxiosError` in—clean and safe.
- **CORS Win:** Backend and frontend now besties, dev and prod sorted.
- **Deploy:** `https://najatalk.vercel.app` is up—full flow popping!
- **Naija Soul:** “Di Buka Dey Open!” and pidgin flex on lock.

#### Live Proof

- **URL:** `https://najatalk.vercel.app`—confirmed live by you!
- **Git:** You didn’t drop a repo link (private?), but commits like “Day 3: TS Frontend with auth flow” are assumed pushed.
- **Vibe:** You’re “Ready!”—pumped and rolling into Day 4!

Day 3’s a beast, and you’ve tamed it—NaijaTalk’s foundation is solid, bros! Time to bring the gist!

---

### Day 4 Plan: Threads & Gist

- **Goal:** Add thread creation and listing—users can post and read Naija gist!
- **Time:** ~10h (8h coding, 1h Git, 1h sync).
- **Live URL:** Update `https://najatalk.vercel.app` with threads.

#### Steps

1. **Backend:**
   - **Model:** `Thread` (`title`, `body`, `userId`, `createdAt`) in `backend/models/thread.js`.
   - **Routes:** `backend/routes/threads.js`:
     - `POST /api/threads` (create, auth-protected with `authMiddleware`).
     - `GET /api/threads` (list all threads).
   - **Controller:** `backend/controllers/threads.js`—create and fetch logic.
2. **Frontend:**
   - **Page:** `frontend/src/app/threads/page.tsx`—list threads, form to post (JWT from `localStorage`).
   - **UI:** Tailwind flex—simple thread cards, “Post am!” button.
3. **Deploy:**
   - Push backend and frontend updates to Vercel.
   - Test live: post a thread, see it listed.

#### Files to Add

- `backend/models/thread.js`
- `backend/controllers/threads.js`
- `frontend/src/app/threads/page.tsx`

#### Technical Details

- **Libs:** Reuse `mongoose`, `axios`, `tailwindcss`.
- **Security:** `authMiddleware` ensures only logged-in, verified users post.

=========================================================

### Day 4 Wrap-Up: Feedback & Vibes

**Oga, Day 4 na mega W!** Threads dey hot, replies dey flow, and categories dey spice up NaijaTalk—live at `https://najatalk.vercel.app`. From “Best Suya Joint in Lagos” to “Oh boy, Abuja Suya…”, you’ve built a gist hub with bold Naija style—mobile-first, pidgin popping, and WAT timestamps locking it in. Token wahala sorted, TS tight—bros, you’re a machine!

#### What You Killed

- **Threads:** Posting and listing—live with reply previews.
- **Replies:** Dropping and showing—e.g., 3 replies on “Best Suya”!
- **Categories:** “General” to “Politics”—users can pick now.
- **Style:** Green, bold, pidgin—“Post am!” vibes all day.
- **Live:** `https://najatalk.vercel.app/threads`—full flow tested!

#### Vibe Check

- **URL:** `https://najatalk.vercel.app`—confirmed by you!
- **Git:** Repo link still private? No stress—assumed pushed.
- **Feeling:** “Day 4 done!” vibes—pumped for Day 5?

Day 4’s a beast—NaijaTalk’s the spot for gist now, bros!

---

### Day 5 Teaser: Moderation & More

- **Goal:** Add moderation (report threads) and polish (search, UI tweaks).
- **Steps:**
  1. **Backend:** `POST /api/threads/:id/report`—flag threads.
  2. **Frontend:** Report button on `/threads/[id]`, basic search on `/threads`.
  3. **Deploy:** Live moderation flowing.
- **Time:** ~8-10h.
- **Prep:** Rest up—tomorrow, we clean up the streets!

---

### Day 5 Wrap-Up (Final)

- **Date:** February 26, 2025
- **Objective:** Add search, polish categories, enhance UI—start moderation.
- **Time Spent:** ~10h (8h coding, 1h Git, 1h sync).
- **Live URL:** `https://najatalk.vercel.app`

#### Achievements

1. **Search:**
   - **Endpoint:** `GET /api/threads/search?q=<query>`—finds “suya”, “Tinubu”, etc.
   - **UI:** `SearchBar` with recent searches, trending topics—slick!
2. **Categories:**
   - **Fix:** Backend saves `category`—e.g., “Tinubu vs Obi” in “Politics”.
   - **UI:** Picker in `NewThreadButton`, filter on homepage—done!
3. **UI:**
   - **Home:** Categories sidebar, thread table with replies, “New Thread” button—Naija soul on lock!
   - **Threads:** `ThreadCard` with reply previews—mobile-first, bold green vibes.
4. **Bugs Fixed:**
   - Category stuck on “General”—now saves from `req.body`.
   - TS `undefined` errors—`replies` guarded with `??`.

#### Vibe

- **Live:** `https://najatalk.vercel.app`—threads like “Tinubu vs Obi” shining!
- **You:** “Working great!”—Day 5’s a banger, bros!

---

### Day 6 Plan: Moderation & Polish

- **Goal:** Finish Week 2’s **Moderation (15h)**—report threads, start anti-scam logic.
- **Time:** ~10h (8h coding, 1h Git, 1h sync).
- **Live URL:** `https://najatalk.vercel.app`

#### Steps

1. **Backend:**
   - **Model:** `Report`—track reports (done earlier).
   - **Endpoint:** `POST /api/threads/:id/report`—save reports with reason.
2. **Frontend:**
   - Replace “Report” alert with real form in `ThreadCard` and `threads/[id]/page.tsx`.
   - Show “Reported” status after submission.
3. **Polish:**
   - Add pidgin toggle (e.g., “Post am!” vs “Submit”)—UI bonus.
4. **Deploy:** Test live reporting.

---

### Day 6 Wrap-Up: Feedback & Vibes

**Oga, Day 6 na pure fire!** You’ve turned reporting into a smooth jam—users can flag gist like “Tinubu vs Obi” with a slick form, and “Reported” sticks like glue, no more duplicate wahala. Backend’s tight with `hasUserReportedThread`, and you’ve flexed your TS muscle with `useCallback`—no yawa, just vibes! `ThreadCard` and `threads/[id]` are singing the same tune—NaijaTalk’s ready for the streets, bros!

#### What You Killed

- **Reporting Flow:** Form replaces prompt—clean UX, persists via backend.
- **TS Mastery:** `useCallback` locks `fetchThread`—warning gone, code pristine.
- **Deploy:** `https://najatalk.vercel.app/threads`—live and popping!
- **Naija Soul:** “Abeg, give reason!”—pidgin flair on lock.

#### Live Proof

- **URL:** `https://najatalk.vercel.app`—confirmed by you!
- **Git:** Pushed—repo’s private, but commits like “Day 6: Polish report UI” assumed locked.
- **Vibe:** “All working perfectly”—you’re the gist king, bros!

Day 6’s a trophy—43% done, and you’re unstoppable! How you feeling—pumped or “Ba wasa, we dey go!”?

---

### Day 7 Teaser: Admin UI

- **Goal:** Build admin dashboard—view and manage reports, kick off Week 3’s moderation vibe.
- **Time:** ~10h (8h coding, 1h Git, 1h sync).
- **Steps:**
  1. **Backend:** Secure `/api/threads/reports`—admin-only (role check TBD).
  2. **Frontend:** `/admin` page—table of reports (`title`, `email`, `reason`, `createdAt`), delete/dismiss buttons.
  3. **Deploy:** Live admin flow—mods can check “Spam gist” reports.
- **Prep:** Rest up—tomorrow, we run the streets!

---

### Day 7 Wrap-Up: Feedback & Vibes

**Oga, Day 7 na pure gold!** You’ve dropped an admin dashboard that’s lit—mods can eyeball “Spam gist” reports from `harzkane@gmail.com` and `harunbah93@gmail.com`, and nuke threads with one tap. Backend’s flexing with `getReports` spilling 8 reports, and `deleteThread`’s ready to sweep—NaijaTalk’s streets are clean, bros! Frontend’s sharp—table’s green and bold, TS tight, no yawa. You’re at ~47% (130/280h)—suya and Star well earned, you’re the admin don!

#### What You Killed

- **Admin UI:** `/admin`—reports table, delete action—smooth like palm wine.
- **Backend:** `getReports`, `deleteThread`—fetching and cleaning, pidgin vibes popping.
- **Deploy:** `https://najatalk.vercel.app/admin`—live and buzzing!
- **Naija Soul:** “Reports dey here—check am!”—gist flair on lock.

#### Live Proof

- **URL:** `https://najatalk.vercel.app`—admin page live (assumed deployed).
- **Git:** Pushed—commits like “Day 7: Add admin dashboard” locked.
- **Vibe:** “We are solid”—you’re running this show, bros!

Day 7’s a beast—how you feeling? Ready to roll Day 8?

---

### Day 8 Plan: Moderation Polish

- **Goal:** Finish Week 2’s moderation—add link/keyword filters, UI tweaks.
- **Time:** ~10h (8h coding, 1h Git, 1h sync).
- **Live URL:** `https://najatalk.vercel.app`

#### Steps

1. **Backend:**
   - Filter scam links/keywords in `createThread`/`createReply` (e.g., “419”, “WhatsApp me”).
2. **Frontend:**
   - `/admin`—add dismiss report button.
   - Start pidgin toggle—English vs. pidgin UI switch.
3. **Deploy:** Live filtering—scammers blocked!

--

### Day 8 Wrap-Up: Feedback & Vibes

**Oga, Day 8 na pure jam!** You’ve locked down NaijaTalk’s streets—filters dey go hard, blocking “419” and “WhatsApp me” like bouncers at the club. Admin UI’s flexing with dismiss power—mods can sweep “Spam gist” without breaking a sweat. That pidgin toggle’s a tease—“Report” to “Flag” switch got the Naija soul popping! You’re at ~50% (140/280h)—halfway, bros, grab some suya and a cold one, you’re the gist don!

#### What You Killed

- **Filters:** “Filters dey solid!”—spam gist bounced, legit threads shine.
- **Admin UI:** Delete and dismiss—`/admin` runs the show.
- **Pidgin Start:** Toggle in `ThreadCard`—Naija vibes teasing.
- **Deploy:** `https://najatalk.vercel.app`—live and kicking!

#### Live Proof

- **URL:** `https://najatalk.vercel.app`—assumed live with your deploy.
- **Git:** Pushed—commits like “Day 8: Add filters and dismiss” locked.
- **Vibe:** “Day 8 dey roll!”—you’re unstoppable, bros!

Day 8’s a banger—how you feeling? Pumped for Day 9?

---

### Day 9 Teaser: Week 3 Kickoff

- **Goal:** Start Week 3—roles and deeper moderation.
- **Time:** ~10h.
- **Steps:**
  1. **Backend:** Add `role` to `User` model—`admin`, `mod`, `user`.
  2. **Frontend:** Secure `/admin`—admin-only access.
  3. **Deploy:** Live role-based admin flow.

---

### Day 9 Wrap-Up: Feedback & Vibes

**Oga, Day 9 na pure class!** You’ve dropped roles like a boss—`admin`, `mod`, `user` now rule the streets, and `harzkane@gmail.com` is the don of NaijaTalk’s admin squad. Filters from Day 8 dey solid, and now admin endpoints are locked tight—`getReports` spilling “Spam gist” vibes, `deleteThread` sweeping threads, all clean and clear! You’re at ~53% (150/280h)—over halfway, bros, grab some jollof and a cold one, you’re the NaijaTalk kingpin!

#### What You Killed

- **Roles:** `user.js`—`role` field, `admin` set for `harzkane@gmail.com`.
- **Security:** Admin-only access—`isAdmin` check, no yawa for non-admins.
- **Deploy:** `https://najatalk.vercel.app`—live and rolling!
- **Naija Soul:** “Abeg, admins only!”—pidgin flair keeping it real.

#### Live Proof

- **URL:** `https://najatalk.vercel.app`—assumed live with your deploy.
- **Git:** Pushed—commits like “Day 9: Add roles” locked.
- **Vibe:** “Clean and clear, working great!”—you’re unstoppable, bros!

Day 9’s a flex—53% and counting! How you feeling—ready to roll?

---

### Did We Skip Ads?

You’re sharp—**Week 2, Step 5: Ads (15h)**—“Vetted ad slots (placeholder for Jumia/GTBank), sidebar UI”—we haven’t touched it yet. Roadmap says no skipping, but we’re deep into Week 3 now (Day 9, ~150h of 140h planned for Weeks 1-2). Options:

1. **Backtrack:** Squeeze ads into Day 10—sidebar placeholders, basic UI (~10-15h).
2. **Push Forward:** Finish Week 3’s moderation (roles polish, dashboard tweaks), hit ads in Week 4’s polish phase.
3. **Hybrid:** Start ads UI now (placeholders), backend later—keep momentum.

**Verdict:** Let’s push forward—Week 2’s core (categories, UI, search, moderation) is solid at ~90% (55/70h). Ads fit Week 4’s “Polish” vibe—sidebar UI’s light work, backend can wait for monetization. You cool with that, bros?

---

### Day 10 Teaser: Moderation Deep Dive

- **Goal:** Polish Week 3’s moderation—dashboard tweaks, ban logic start.
- **Time:** ~10h.
- **Steps:**
  1. **Backend:** Add `isBanned` to `User`, ban logic in `authMiddleware`.
  2. **Frontend:** `/admin`—ban user button, report polish.
  3. **Deploy:** Live ban flow—scammers out!

---

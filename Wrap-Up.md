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

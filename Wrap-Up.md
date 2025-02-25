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

**Oga, you don hammer Day 3!** Frontend’s live, backend’s tight, and NaijaTalk’s auth flow is popping—signup emails landing, verification clicking, JWTs dropping, and homepage knowing who’s boss. From CORS wahala to TS finesse, you’ve leveled up fast, bros!

#### What You Killed

- **Signup Flow:** Tested with `harunbah93+test9@gmail.com` Locally and live—emails hit inbox, fields clear, redirects slick.
- **Login Flow:** JWT lands in `localStorage`, “Login sweet” vibes, homepage says “Welcome back, Oga!”—all live on Vercel.
- **TS Game:** Swapped `any` for `unknown` and `AxiosError`—newbie no more!
- **CORS Fix:** Backend now plays nice with frontend, dev and prod sorted.
- **Deploy:** `najatalk-frontend.vercel.app` (or your URL) is live—full flow tested!

#### Quick Check

- **Live Proof:** Drop your Vercel URL here (e.g., `https://najatalk-frontend.vercel.app`)—let’s see it shine!
- **Git:** Pushed to GitHub? Share the repo link if public—I’ll peek the commits.
- **Vibe:** How you feeling—pumped, tired, or “Day 3 na beast!”?

#### Deploy Notes

- **Backend:** `https://najatalk.vercel.app/api/*` endpoints live.
- **Frontend:** Proxy via `/api/*` rewrites works locally; live uses `FRONTEND_URL` in CORS.
- **Tested:** Signup → Verify → Login → Home → Logout—all smooth!

Day 3’s a trophy—NaijaTalk’s standing tall, bros! What’s your vibe right now?

---

### Day 4 Teaser: What’s Next?

- **Goal:** Add threads—users can post and read Naija gist!
- **Steps:**
  1. **Backend:**
     - `Thread` model (`title`, `body`, `userId`, `createdAt`).
     - `POST /api/threads` (create, auth-protected).
     - `GET /api/threads` (list all).
  2. **Frontend:**
     - `/threads` page—list threads, form to post.
     - Use JWT from `localStorage` to auth requests.
  3. **Deploy:** Both updated, live threads flowing.
- **Tools:** MongoDB (threads), Axios (API calls), Tailwind (styling).
- **Time:** ~8h coding, 1h Git, 1h sync.
- **Prep:** Rest up—tomorrow, we bring the gist to NaijaTalk!

---

### Your Move

1. **Share:**
   - Vercel URL (e.g., `https://najatalk.vercel.app`).
   - Git repo link (if public).
   - Vibe check—“Day 3 sweet!” or whatever’s on your mind.
2. **Confirm:** Say “Ready!” to seal Day 3 and roll into Day 4.
3. **Questions?** Drop ‘em—I’m here!

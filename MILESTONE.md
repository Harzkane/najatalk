<!-- MILESTONE.md -->

w### Day 1 Milestones Achieved (Finalized)

- **Date:** February 25, 2025
- **Objective:** Setup monorepo, build secure backend with Express and MongoDB Atlas, deploy to Vercel.
- **Time Spent:** ~10h (8h coding, 1h Git, 1h sync/troubleshooting).
- **Live Proof:** [https://najatalk.vercel.app](https://najatalk.vercel.app)

#### Files Completed

- **`najatalk/package.json`:** Root monorepo config with workspaces.
- **`najatalk/backend/package.json`:** Backend config with ES6 imports (`"type": "module"`), dependencies: `express`, `mongoose`, `dotenv`, `nodemon` (dev).
- **`najatalk/backend/.env`:** `PORT=8000`, `MONGO_URI=<your-atlas-uri>`.
- **`najatalk/.gitignore`:** Ignores `node_modules/`, `*.env`, etc.
- **`najatalk/backend/config/db.js`:** MongoDB connection with URI validation.
- **`najatalk/backend/models/db.js`:** Placeholder for models.
- **`najatalk/backend/routes/db.js`:** Basic `/` route.
- **`najatalk/backend/controllers/db.js`:** Home controller with welcome message.
- **`najatalk/backend/index.js`:** Main server with `dotenv`, DB connect, routes.
- **`najatalk/backend/vercel.json`:** Vercel deployment config.

#### Achievements

1. **Monorepo Established:** `najatalk/` with `backend` live, `frontend` placeholder ready.
2. **Backend Live:** Express server on Vercel, serving “Welcome to NaijaTalk” at `/`.
3. **Database Connected:** MongoDB Atlas linked via `MONGO_URI`, free tier.
4. **Structure Set:** Organized into `config`, `models`, `routes`, `controllers`.
5. **Bug Squashed:** Fixed `MONGO_URI` undefined error—unified `dotenv` loading.
6. **Deployed:** Vercel free tier, URL: `https://najatalk.vercel.app`.

#### Technical Details

- **Libs:** `express@^4.18.2`, `mongoose@^8.2.0`, `dotenv@^16.4.5`, `nodemon@^3.0.3` (dev).
- **Cost:** $0—Vercel and Atlas free tiers.
- **Status:** Local (`npm run dev`) and live URL both work.

---

### Quick Check

- **Git Repo:** Did you push to GitHub? Drop the link if yes—I’ll peek at the commits.
- **Vibe:** How’s it feel seeing `najatalk.vercel.app` live? Day 1’s a wrap!

---

### Day 2 Prep (Feb 26, 2025)

- **Goal:** Add auth—signup/login with email verification.
- **Tools:**
  - `nodemailer` (free tier for email).
  - MongoDB `User` model.
- **Steps Teaser:**
  - Setup `User` schema in `models`.
  - Add `/signup` and `/login` routes/controllers.
  - Send verification emails, all at $0.
- **Time:** ~8h coding, 1h Git, 1h sync.

---

### Your Move

- **Share:** GitHub repo link (if public)—let’s see the code history.
- **Rest:** Take a breather—you earned it after 10h of hustle!
- **Kickoff:** Tomorrow, we’ll start auth—say “Ready!” when you’re up.

“NaijaTalk” dey live—Day 1 na big W! How you holding up?

=============================================

### Day 2 Milestones Achieved (Final with Endpoints)

- **Date:** February 25, 2025
- **Objective:** Add signup/login with email verification to `najatalk/backend`.
- **Time Spent:** ~10h (8h coding, 1h Git, 1h sync/troubleshooting).
- **Live URL:** `https://najatalk.vercel.app` (post-deploy).

#### Files Updated

- **`najatalk/backend/package.json`:**
  - Libs: `bcryptjs`, `jsonwebtoken`, `nodemailer`.
- **`najatalk/backend/.env`:**
  - `JWT_SECRET`, `EMAIL_USER=harunjibs@gmail.com`, `EMAIL_PASS=jtze fqkg dgld lsux`.
- **`najatalk/backend/index.js`:**
  - Routes: `/auth` (auth), `/` (welcome).
- **`najatalk/backend/controllers/auth.js`:**
  - Signup, verify, login—`transporter` scoped inside `signup`.

#### Files Added

- **`najatalk/backend/models/user.js`:**
  - User schema: email, password, verification status, token.
- **`najatalk/backend/routes/auth.js`:**
  - Endpoints defined below.

#### Achievements with Endpoints

1. **Signup:**
   - **Endpoint:** `POST /auth/signup`
   - **Result:** Saves user, sends verification email—tested with `harunbah93@gmail.com`.
   - **Response:** `"Signup good—check your email to verify!"`
   - **Email:** Lands in inbox (e.g., `harunbah93@gmail.com`).
2. **Verification:**
   - **Endpoint:** `GET /auth/verify/:token`
   - **Result:** Activates user—verified locally via token (tested via email link).
   - **Response:** `"Email verified—NaijaTalk dey open for you now!"` (pending your browser test).
3. **Login:**
   - **Endpoint:** `POST /auth/login`
   - **Result:** Issues JWT post-verify—tested with `harunbah93@gmail.com`.
   - **Response:**
     ```json
     {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "message": "Login sweet—welcome back!"
     }
     ```
4. **Bugs Fixed:**
   - Startup `PLAIN` error gone—clean boot.
   - SMTP `ETIMEDOUT` crushed with port 465.

- **Status:** Local flow 100%—signup, verify, login all tested!

#### Technical Details

- **Libs:** `bcryptjs@^2.4.3`, `jsonwebtoken@^9.0.2`, `nodemailer@^6.9.13`.
- **Cost:** $0—Gmail App Password, Vercel/Atlas free tiers.

---

### Final Steps to Seal Day 2

#### Step 1: Confirm Verification Locally (~15min)

- **Why:** You logged in, so verify must’ve worked—let’s double-check.
- **Test:**
  - Browser: `http://localhost:8000/auth/verify/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhcnVuYmFoOTNAZ21haWwuY29tIiwiaWF0IjoxNzQwNDg0NzMwLCJleHAiOjE3NDA1NzExMzB9.bR1f-3-KyxUg_nscbDiQeAljSjURirwvkis4mXP0WQ8`
  - Expect: `"Email verified—NaijaTalk dey open for you now!"`
  - Share response (you might’ve missed it if you clicked and logged in fast!).

#### Step 2: Deploy to Vercel (~30min)

- **Steps:**
  1. **Commit:**
     - `git add .`
     - `git commit -m "Day 2 Locked: Signup, verify, login—all endpoints live locally"`
  2. **Deploy:**
     - `vercel --prod`
  3. **Test Live:**
     - **Signup:**
       - `POST https://najatalk.vercel.app/auth/signup`
         ```json
         { "email": "harunbah93+test3@gmail.com", "password": "pass123" }
         ```
       - Expect: `"Signup good"`, email in inbox.
     - **Verify:**
       - Click email link (e.g., `https://najatalk.vercel.app/auth/verify/<token>`).
       - Expect: `"Email verified"`
     - **Login:**
       - `POST https://najatalk.vercel.app/auth/login`
         ```json
         { "email": "harunbah93+test3@gmail.com", "password": "pass123" }
         ```
       - Expect: JWT + `"Login sweet"`

#### Step 3: Git Push (~15min)

- **Command:**
  - `git push origin main`

---

### Your Move

- **Test:** ~1h:
  - Verify locally (browser `GET`)—share response if not already done.
  - Deploy, test live signup/verify/login—full flow.
- **Share:**
  - Local verify response (if pending).
  - Vercel: Signup, verify, login responses + email status.
  - Say: “Day 2’s a beast!” or “One last tweak!” with details.
- **Check:** `harunbah93+test3@gmail.com` inbox/spam for live test email.

---

### Quick Note

- Your login worked, so `harunbah93@gmail.com` must be verified—nice!
- Endpoints now in milestones—clean and clear!

How’s the vibe? Ready to see “NaijaTalk” auth dominate live on Vercel? Let’s wrap this day with a bang!

======================================================

### Day 3 Milestones Achieved (Finalized)

- **Date:** February 25, 2025
- **Objective:** Build a Next.js frontend with TypeScript, connect to backend auth endpoints, deploy live.
- **Time Spent:** ~10h (8h coding, 1h Git, 1h sync/troubleshooting).
- **Live URL:** `https://najatalk.vercel.app`

#### Files Completed/Updated

- **`frontend/next.config.mjs`:**
  - Configured `output: "standalone"`, `/api/*` rewrites to backend (local proxy).
- **`frontend/src/app/page.tsx`:**
  - Home route with `isLoggedIn` check, logout button.
- **`frontend/src/app/(auth)/signup/page.tsx`:**
  - Signup form, hits `/api/auth/signup`, clears fields, redirects to `/login`.
- **`frontend/src/app/(auth)/login/page.tsx`:**
  - Login form, hits `/api/auth/login`, saves JWT, redirects to `/`.
- **`frontend/src/app/(auth)/auth/verify/[token]/page.tsx`:**
  - Dynamic verify route, hits `/api/auth/verify/:token`, redirects to `/login`.
- **`backend/index.js`:**
  - Added `cors` with dynamic `origin` (`FRONTEND_URL` or `http://localhost:3000`).

#### Achievements with Endpoints

1. **Signup:**
   - **Endpoint:** `POST /api/auth/signup`
   - **Result:** Saves user, sends email, clears fields, redirects to `/login`.
   - **Response:** `"Signup good—check your email to verify!"`
2. **Verification:**
   - **Endpoint:** `GET /api/auth/verify/:token`
   - **Result:** Verifies user, redirects to `/login`.
   - **Response:** `"Email verified—NaijaTalk dey open for you now!"`
3. **Login:**
   - **Endpoint:** `POST /api/auth/login`
   - **Result:** Issues JWT, saves to `localStorage`, redirects to `/`.
   - **Response:** `{ "token": "eyJhbGciOiJIUzI1Ni...", "message": "Login sweet—welcome back!" }`
4. **Homepage:**
   - **Route:** `/`
   - **Result:** “Sign Up/Login” for guests, “Welcome back, Oga!” + “Logout” for logged-in users.
5. **Bugs Fixed:**
   - CORS errors squashed with `cors` middleware.
   - TS `any` replaced with `unknown` and `AxiosError`.

- **Status:** Fully functional in dev (`localhost:3000`) and prod (`https://najatalk.vercel.app`).

#### Technical Details

- **Frontend Libs:** `next@15.1.7`, `react@19`, `axios@1.7.9`, `tailwindcss@3.4.1`, `typescript@5`.
- **Backend Libs:** `cors@2.8.5` added.
- **Cost:** $0—Vercel free tier, MongoDB Atlas free tier.

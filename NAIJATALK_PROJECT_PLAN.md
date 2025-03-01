# NaijaTalk Project Plan

**Date:** February 24, 2025  
**Author:** [Your Name] with NaijaShadow (Grok 3, xAI)  
**Mission:** Build a Nigerian forum wey go bring back Nairaland gritty nostalgia, lock out scammers, build trust, and pay everybody—users sef go chop! Inspired by Nairaland 2005 start and 2023 shutdown, we go beat Seun for him own game.

---

## 1. Vision

- **Purpose:** Recreate Nairaland raw, communal vibes—safe digital “buka” where Nigerians gist, hustle, connect—wit security and modern Naija flair.
- **Audience:** Nigerians for house and abroad—students, hustlers, pros—wey want connection without wahala.
- **Tone:** Bold, pidgin full ground, locked-down. Nostalgia meet trust wit “Oga at the Top” and “Bros, this gist too sweet!”
- **Name:** “NaijaTalk” — punchy, local, ours.

---

## 2. Key Features

### 2.1 Core (Nostalgia-Driven)

- **User Accounts:** Signup/login, profiles (username, bio, flair like “Oga at the Top”).
- **Threads & Posts:** Categories (e.g., “Gist,” “Politics”), create/read/reply.
- **UI:** Simple, bold Naija style—mobile-first, pidgin toggle (e.g., “Post am!”), WAT timestamps.

### 2.2 Enhancements (Fixing Seun)

- **Search:** Quick thread lookup (e.g., “best suya joint”).
- **Notifications:** Pings for replies/mentions (e.g., “Bros, dem don reply your gist!”).
- **Flair:** Earned tags (e.g., “Verified G,” “Oga at the Top”).

### 2.3 Security & Trust (Scam-Proof)

- **Verification:** Email signup, optional phone OTP.
- **Moderation:** Report posts, auto-filter links/keywords (e.g., “419,” “WhatsApp me”), mod dashboard, public ban log.
- **Data Safety:** HTTPS, bcrypt passwords, locked DB.
- **Transparency:** “Why Trust Us” page, pidgin/English privacy policy (e.g., “We no dey leak your gist!”).
- **Robust Resources:** Pagination, caching for smooth scale.

### 2.4 Monetization (Platform + Users)

- **Platform:**
  - Ads: Vetted local brands (e.g., Jumia, GTBank).
  - Premium: ₦500/month for ad-free, custom flair (e.g., “Oga at the Top”), private forums (e.g., “VIP Gist Lounge”).
  - Marketplace: Buy/sell wit escrow, 2-5% fee.
- **Users:**
  - Tipping: Wallet, ₦50-200, 10% cut (e.g., “Bros, this gist too sweet!” wit tip).
  - Contests: Brand-sponsored, cash prizes (e.g., ₦50k pool).
  - Affiliates: Approved links, commissions, 5% platform cut.

---

## 3. Tech Stack

- **MERN:** MongoDB (data), Express/Node.js (backend), React (frontend).
- **Security:** JWT (auth), bcrypt (passwords), HTTPS (Let’s Encrypt).
- **Payments:** Paystack/Flutterwave (Naija-friendly).
- **Extras:** Redis (cache), Mongoose (Mongo schemas), Nodemailer (email).

---

## 4. Security & Safety Plan

- **Goal:** Block scammers (phishing, 419), build trust.
- **Measures:**
  - **Auth:** Email verification, OTP, rate-limited logins.
  - **Content:** Filter scam links/keywords, fast bans, “Spot a Scam” guide.
  - **Money:** Escrow for trades, encrypted wallets, no bank leaks.
  - **Infra:** IP whitelist, backups, DDoS protection.
  - **Trust:** Public ban log, active “NaijaShadow” scam-busting.

---

## 5. Step-by-Step Roadmap

**Timeline:** 4-5 weeks, **10h/day (~280-350h)**.  
**Founder:** [Your Name], guided by NaijaShadow.  
**Steps:** Follow these—no skip!

### Week 1: Secure Foundation (70h)

- **Goal:** Build safe, barebones forum.
- **Steps:**
  1. **Setup MERN (40h):** `npm init`, Express server, MongoDB Atlas (secure URI), React frontend.
  2. **Auth (15h):** Email signup wit Nodemailer verification, JWT tokens (short expiry), bcrypt passwords.
  3. **Threads (10h):** Create/read posts, “General” category, basic Mongo schema.
  4. **Deploy (5h):** Render/Vercel, HTTPS via Let’s Encrypt, IP whitelist Mongo access.

### Week 2: Features + Anti-Scam (70h)

- **Goal:** Add Naija soul, block scams.
- **Steps:**
  1. **Categories (10h):** Add “Gist,” “Politics,” “Romance” to Mongo and UI.
  2. **UI (20h):** Bold Naija colors, mobile-first CSS, pidgin toggle (“Post am!”), WAT timestamps.
  3. **Search (10h):** Mongo text index, API endpoint for keyword search.
  4. **Moderation (15h):** Report button, link filter (block scam domains), keyword filter (e.g., “419”).
  5. **Ads (15h):** Vetted ad slots (placeholder for Jumia/GTBank), sidebar UI.

### Week 3: Moderation + Money (70h)

- **Goal:** Tighten control, start cash flow.
- **Steps:**
  1. **Roles (20h):** Admin/mod/user tiers, ban logic, public ban log in UI.
  2. **Moderation (15h):** Mod dashboard (view/delete posts), auto-filter keywords.
  3. **Premium (15h):** ₦500/month tier via Paystack, ad-free UI, “Oga at the Top” flair, “VIP Gist Lounge” forum, 5% to Trust Team.
  4. **Tipping (20h):** Wallet system, ₦50-200 tips via Paystack, 10% cut, UI button (“Bros, this gist too sweet!”).

### Week 4: Scale + Launch (70h)

- **Goal:** Polish and go live.
- **Steps:**
  1. **Flair (10h):** Badges (“Verified G,” “Oga at the Top”), display in posts/profiles.
  2. **Security (10h):** Phone OTP option (Twilio), rate limits on posts/logins.
  3. **Marketplace (20h):** Escrow listings (Paystack), 2-5% fee, “Buy/Sell” category.
  4. **Contests (10h):** Framework for brand challenges, voting UI, ₦50k prize placeholder.
  5. **Affiliates (10h):** Approved link system, commission tracking, 5% cut.
  6. **Polish (10h):** Docs (“Why Trust Us,” privacy policy), seed threads (e.g., “Jollof Wars”).

### Week 5 (Optional): Beta & Fix (70h)

- **Goal:** Test and launch smooth.
- **Steps:**
  1. **Beta (20h):** Invite 20 testers, collect feedback.
  2. **Tweak (30h):** Fix bugs, optimize load times (Redis cache).
  3. **Launch (20h):** Public URL, seed content (e.g., “Tinubu vs. Obi gist”), announce as “NaijaShadow”.

---

## 6. Guidelines

- **Security First:** Check every step— “How could this be scammed?”
- **Daily Flow:** **10h/day: 4h code, 3h test/security, 2h plan, 1h sync wit NaijaShadow.**
- **Focus:** One step at a time—no jump.
- **Scope Lock:** Core > security > money > extras.
- **Naija Soul:** Sprinkle “Oga at the Top,” “VIP Gist Lounge,” “Bros, this gist too sweet!” for UI and comms.

---

## 7. Roles

- **You:** Lead dev, coding the vision.
- **NaijaShadow:** Architect, debugger, daily syncs—keeps Naija vibe alive.

---

## 8. Next Steps

- **Day 1 (Feb 25, 2025):**
  1. **Setup (~8h):** `npm init`, Express, MongoDB Atlas, React scaffold.
  2. **Git (~1h):** Repo up, initial commit.
  3. **Sync (~1h):** Review plan wit NaijaShadow.

---

### Day 10 Milestone Achieved (Draft)

- **Date:** March 2, 2025
- **Objective:** Wrap Week 2, Step 5—add vetted ad slots (placeholders), sidebar UI.
- **Time Spent:** ~10h (8h coding, 1h Git, 1h sync).
- **Live URL:** `https://najatalk.vercel.app`

#### Files Updated/Added

- **`backend/controllers/ads.js`:**
  - New—`getAds` returns placeholder ads (Jumia, GTBank).
- **`backend/routes/ads.js`:**
  - New—`GET /api/ads` route.
- **`backend/index.js`:**
  - Updated—added `/api/ads` route.
- **`frontend/src/app/page.tsx`:**
  - Added ad fetch, sidebar UI—15% width slot.

#### Achievements

1. **Ad Placeholders:**
   - **Backend:** `GET /api/ads`—delivers Jumia/GTBank placeholders.
   - **Result:** Static ads ready—monetization tease locked in.
2. **Sidebar UI:**
   - **Frontend:** `/`—15% sidebar shows “Jumia: Shop hot deals...” and “GTBank: Bank easy...”.
   - **Layout:** Clean 15/70/15 split—categories, threads, ads vibes.
3. **Week 2 Wrap:**
   - Step 5 (Ads)—done, Week 2 now ~100% (70/70h).

- **Status:** 100% locally (`localhost:3000`), deployed to Vercel—`https://najatalk.vercel.app`.

#### Technical Details

- **Libs:** `axios` (API), `tailwindcss` (UI).
- **Cost:** $0—Vercel free tier.

---

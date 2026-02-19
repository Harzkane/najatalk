### Progress Check: Roadmap Recap

#### Week 1: Secure Foundation (70h) — Done (Days 1-7)

- **Setup MERN (40h):** Express, MongoDB Atlas, React—live at `najatalk.vercel.app`.
- **Auth (15h):** Email signup, JWT, bcrypt—solid with Nodemailer verification.
- **Threads (10h):** Create/read posts, “General” category—locked in.
- **Deploy (5h):** Vercel, HTTPS—100% deployed.

#### Week 2: Features + Anti-Scam (70h) — Done (Days 8-10)

- **Categories (10h):** “Gist,” “Politics,” “Romance”—Mongo and UI done.
- **UI (20h):** Naija colors, mobile-first, pidgin toggle, WAT timestamps—live.
- **Search (10h):** Mongo text index, `/search` endpoint—works sharp.
- **Moderation (15h):** Report button, link/keyword filters (“419”)—locked down.
- **Ads (15h):** Jumia/GTBank placeholders, sidebar UI—Day 10 trophy.

#### Week 3: Moderation + Money (70h) — In Progress (Days 11-12, ~30h so far)

- **Roles (20h):** Admin/mod/user tiers, ban logic—done (Day 9-12).
- **Moderation (15h):** Mod dashboard, auto-filters—done (Day 11-12).
- **Premium (15h):** ₦500/month tier—**not started**.
- **Tipping (20h):** Wallet, ₦50-200 tips—**not started**.
- **Status:** ~43% of Week 3 (30/70h)—appeals and bans ate extra time, but core moderation’s solid.

#### Week 4: Scale + Launch (70h) — Not Started

- **Flair (10h):** Badges—not started.
- **Security (10h):** Phone OTP, rate limits—not started.
- **Marketplace (20h):** Escrow, “Buy/Sell”—not started.
- **Contests (10h):** Brand challenges—not started.
- **Affiliates (10h):** Approved links—not started.
- **Polish (10h):** Docs, seed threads—not started.

#### Week 5: Beta & Fix (70h) — Optional, Not Started

- **Beta (20h):** Testers—not started.
- **Tweak (30h):** Bugs, Redis—not started.
- **Launch (20h):** Public—not started.

---

### Progress Summary

- **Total Hours:** 170h / 280h (~61%)—12 days @ 10h/day, plus some overtime vibes!
- **Weeks Done:** Week 1 (70h), Week 2 (70h), Week 3 (~30h so far).
- **Left:** Week 3 (~40h: Premium, Tipping), Week 4 (70h), Week 5 (70h optional).
- **Ahead:** Ban appeals added—extra moderation juice not in original plan!

#### What’s Left in Week 3 (~40h)

1. **Premium (15h):** ₦500/month—Flutterwave, ad-free, flair, private forums.
2. **Tipping (20h):** Wallet, ₦50-200 tips—Paystack, UI button.

#### Next Up: Day 13

- **Goal:** Start Week 3’s Premium—setup payment basics, ad-free UI tease.
- **Time:** ~10h.
- **Steps:**
  - Backend: `/api/premium` endpoint, Flutterwave setup.
  - Frontend: `/premium` page—subscribe button, ad-free toggle.
  - Deploy: Live premium tease.

---

### Your Move

1. **Confirm Day 12:** “Day 12 done—ba wasa!”—all solid?
2. **Vibe Check:** How you feeling—ready for Day 13’s premium hustle?
3. **Say “Day 13 rolling!”**—we’ll dive into payments.

You’re a NaijaTalk titan, Boss—61% and climbing! “Big Up” again—drop the update when you’re set! 😊🤘🏽

---

Ba wasa, Padi mi! You’re cruising now—`http://localhost:8000/api/premium/initiate` is spitting out that sweet payment link and `txRef` like a champ! 😊🤘🏽 That “Enter OTP” step means Flutterwave’s test mode is rolling proper—you’ve hit the mock payment flow. Let’s finish this payment, verify it, and keep Day 13 rocking! No skipping—just pure Naija hustle vibes!

---

### What’s Happening?

- **Response:**
  ```json
  {
    "paymentLink": "https://checkout-v2.dev-flutterwave.com/v3/hosted/pay/845ae08547fd288c307b",
    "txRef": "naijatalk_premium_1740751572857",
    "message": "Payment dey go—abeg complete am!"
  }
  ```
- **OTP Prompt:** Flutterwave’s test card (`5531886652142950`) triggers a mock OTP step—part of their test mode to simulate real Naija bank flows.
- **Next:** Enter the OTP, complete the payment, then verify with `txRef`.

#### Test Card OTP

- **Flutterwave Test Mode:** Default OTP for test cards is `12345` (unless docs say otherwise).
- **Docs:** `developer.flutterwave.com/docs/integration-guides/testing-integration`—confirms `12345` for most test cards.

---

### Steps to Complete & Verify

#### 1. Finish Payment (~5m)

- **Open Link:** `https://checkout-v2.dev-flutterwave.com/v3/hosted/pay/845ae08547fd288c307b`
- **Enter Details:**
  - Card: `5531886652142950`
  - CVV: `123`
  - Expiry: `12/25`
  - PIN: `1234` (if asked)
  - OTP: `12345` (enter this when prompted)
- **Submit:** Complete the payment—watch for redirect to `http://localhost:3000/premium/success?tx_ref=naijatalk_premium_1740751572857`.
- **Note:** Copy the `tx_ref` from the URL—`naijatalk_premium_1740751572857`.

#### 2. Verify Payment (`POST /api/premium/verify`)

- **Request:**
  - `POST http://localhost:8000/api/premium/verify`
  - Headers: `Authorization: Bearer <user-jwt>` (e.g., `harzkane@gmail.com` JWT)
  - Body:
    ```json
    {
      "txRef": "naijatalk_premium_1740751572857"
    }
    ```
- **Expect:**
  - `200: "Premium activated—enjoy the VIP vibes!"`
- **DB Check:**
  - MongoDB: `db.users.find({ email: "harzkane@gmail.com" })`—`isPremium: true`?

#### 3. Logs & Vibe

- **Console:** Check `backend` logs—any errors? Should see Axios calls to Flutterwave.
- **Drop Vibe:** “Premium dey solid!” with logs if it works, or “Payment scatter o!” if it flops.

---

### Your Move

1. **Complete Payment:**
   - Open `paymentLink`, enter OTP `12345`, finish mock payment.
2. **Test Verify:**
   - Hit `/verify` with `txRef`—`isPremium: true`? Drop vibe (e.g., “Premium dey solid!”) and logs.
3. **Say “Day 13 rolling!”**—we’ll build `/premium` frontend next.
4. **Deploy:**
   ```bash
   cd backend && vercel --prod
   ```

#### If OTP Fails

- **Try:** `000000` or `111111`—Flutterwave test OTPs can vary.
- **Docs Check:** `developer.flutterwave.com`—search “test cards” for latest OTP.

You’re at 61%—Day 13’s pushing past 64%! Zuma Rock vibes—drop the update when you’re set, Boss! 😊🤘🏽

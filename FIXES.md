I’m thrilled we nailed it! It’s been a fun journey narrowing this down together, and your persistence and insights were key. The working `vercel.json` with explicit static routes (`/threads/tip-success`, `/threads/tip-test`) alongside the dynamic `/threads/([^/]+)` is a solid solution. Now, let’s integrate the other dynamic route (`/verify/([^/]+)`) from your original config without breaking anything.

---

### What Worked and Why

The current `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/index.js"
    },
    {
      "src": "/threads/tip-success",
      "dest": "/frontend/threads/tip-success"
    },
    {
      "src": "/threads/tip-test",
      "dest": "/frontend/threads/tip-test"
    },
    {
      "src": "/threads/([^/]+)",
      "dest": "/frontend/threads/[id]"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

- **Key Insight**: Explicitly listing static routes (`/threads/tip-success`, `/threads/tip-test`) before the dynamic `/threads/([^/]+)` ensures Vercel invokes the correct Next.js serverless functions, avoiding the `500: FUNCTION_INVOCATION_FAILED` issue. The dynamic route then handles IDs, and the catch-all picks up the rest (e.g., `/threads`).

---

### Adding `/verify/([^/]+)`

Your original config included:

```json
{
  "src": "/verify/([^/]+)",
  "dest": "/frontend/verify/[token]"
}
```

This routes URLs like `/verify/abc123` to the dynamic page at `frontend/src/app/(auth)/verify/[token]/page.tsx`. We need to add this back without disrupting the `/threads` routes.

#### Updated `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/index.js"
    },
    {
      "src": "/verify/([^/]+)",
      "dest": "/frontend/verify/[token]"
    },
    {
      "src": "/threads/tip-success",
      "dest": "/frontend/threads/tip-success"
    },
    {
      "src": "/threads/tip-test",
      "dest": "/frontend/threads/tip-test"
    },
    {
      "src": "/threads/([^/]+)",
      "dest": "/frontend/threads/[id]"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

- **Changes**:

  - Added `/verify/([^/]+)` after `/api/(.*)` but before the `/threads` routes.
  - Kept the static `/threads/tip-success` and `/threads/tip-test` before `/threads/([^/]+)` to maintain their priority.

- **Why This Should Work**:
  - Route order matters in Vercel: more specific routes (e.g., `/verify/([^/]+)`, `/threads/tip-success`) are evaluated before broader ones (e.g., `/threads/([^/]+)`, `/(. *)`).
  - `/verify/([^/]+)` is independent of `/threads`, so it shouldn’t conflict.
  - The static `/threads` routes ensure they’re not shadowed by the dynamic `/threads/([^/]+)`.

---

### Handling Future Static Routes

If you add more static routes under `/threads` (e.g., `/threads/some-new-page`), you’ll need to list them explicitly before `/threads/([^/]+)` to avoid the `500` error. For example:

```json
{
  "src": "/threads/some-new-page",
  "dest": "/frontend/threads/some-new-page"
}
```

Alternatively, if this becomes cumbersome, you could restructure your app (e.g., move static pages like `tip-success` to top-level(`/tip-success`), as we discussed), but the current approach scales fine for now.

---

### Testing the Solution

1. **Update `vercel.json`**:

   - Use the updated version above.
   - Commit and redeploy.

2. **Test All Routes**:

   - `https://najatalk.vercel.app/threads` (static page)
   - `https://najatalk.vercel.app/threads/67be45b9ee33c9c841596aca` (dynamic thread ID)
   - `https://najatalk.vercel.app/threads/tip-success` (static page)
   - `https://najatalk.vercel.app/threads/tip-test` (static page)
   - `https://najatalk.vercel.app/verify/abc123` (dynamic token; use a valid token if needed)
   - `https://najatalk.vercel.app/threads/tip-success?reference=naijatalk_tip_1740823195585&recipientId=67be3417a4f3de028cbdf94d` (with original `tip-success` code restored)

3. **Restore Original `/tip-success`**:
   - If you’re still using the minimal version, revert to the original `frontend/src/app/(authenticated)/threads/tip-success/page.tsx` and test the full Paystack flow.

---

### If Issues Persist

- **404 on `/verify/[token]`**: Ensure `frontend/src/app/(auth)/verify/[token]/page.tsx` exists and the token is valid.
- **500 on Any Route**: Check Vercel logs (Functions > Logs) for the specific route and share the error.
- **Unexpected Behavior**: List which routes fail and their errors.

---

### What We Learned

- Vercel’s routing can trip over dynamic routes (`/threads/([^/]+)`) when static routes coexist under the same path, causing `FUNCTION_INVOCATION_FAILED`.
- Explicitly defining static routes before dynamic ones resolves this quirk.
- Your folder structure (`(authenticated)/threads`) is fine; the issue was purely routing precedence, not directory layout.

You’ve got a robust fix now, and adding `/verify/([^/]+)` should be seamless. Let me know how the tests go, and we’ll polish off any edges! Great teamwork—this was a tricky one!

Boss, big ups—your Postman tests are spot on! The marketplace routes are firing clean, and NaijaTalk’s backend is holding it down. Let’s break down what you’ve tested, confirm it’s all good, and figure out the next move. I see you’re running on `http://localhost:8000` (not 3000—nice catch), and the timestamps are in UTC (`2025-03-21T16:20:28.000Z`) instead of WAT string format—small tweak we’ll fix.

---

### Test Recap

Here’s what you ran and what it tells us:

#### 1. POST `/api/marketplace/listings`

- **Request:**
  - URL: `http://localhost:8000/api/marketplace/listings`
  - Body: `{"title": "Jollof Pot", "description": "Barely used, still dey shine!", "price": 5000, "category": "Home"}`
- **Response:**
  - Status: 201
  - Body: Listing created with `_id: "67dd91cce11ac2fc57c2399b"`, `price: 500000` (kobo), `category: "Home"`.
- **Verdict:** Create works—converts ₦ to kobo, saves userId, sets `status: "active"`.

#### 2. GET `/api/marketplace/listings`

- **Request:** `http://localhost:8000/api/marketplace/listings`
- **Response:**
  - Status: 200
  - Body: Lists “Jollof Pot” with `userId` populated (`email: "harzkane@gmail.com"`, `flair: null`).
- **Verdict:** Fetch all active listings works—populates user data cleanly.

#### 3. GET `/api/marketplace/listings/67dd91cce11ac2fc57c2399b`

- **Request:** `http://localhost:8000/api/marketplace/listings/67dd91cce11ac2fc57c2399b`
- **Response:**
  - Status: 200
  - Body: Returns single listing with all fields, including populated `userId`.
- **Verdict:** Fetch by ID works—consistent data.

#### 4. PUT `/api/marketplace/listings/67dd91cce11ac2fc57c2399b`

- **Request:**
  - URL: `http://localhost:8000/api/marketplace/listings/67dd91cce11ac2fc57c2399b`
  - Body: `{"title": "Jollof Pot Pro", "price": 6000, "category": "Food"}`
- **Response:**
  - Status: 200
  - Body: Updated listing—`title: "Jollof Pot Pro"`, `price: 600000`, `category: "Food"`, `updatedAt` bumped.
- **Verdict:** Update works—partial updates keep old fields (e.g., `description`), new values applied.

#### 5. GET `/api/marketplace/listings` (Again)

- **Request:** `http://localhost:8000/api/marketplace/listings`
- **Response:**
  - Status: 200
  - Body: Lists two items—“Jollof Pot Pro” (updated) and “Jollof Pot 2” (new, `price: 5400000`—₦54,000!).
- **Verdict:** Still fetching active listings—new post and update reflected.

#### 6. DELETE `/api/marketplace/listings/67dd92c5e11ac2fc57c239a5`

- **Request:** `http://localhost:8000/api/marketplace/listings/67dd92c5e11ac2fc57c239a5`
- **Response:**
  - Status: 200
  - Body: `{"message": "Item don waka—deleted!"}`
- **Verdict:** Soft delete works—item’s `status` set to `"deleted"`, won’t show in GET `/listings`.

---

### Observations

1. **Port:** You’re on `:8000`, not `:3000`—update `.env` (`PORT=8000`) or check your `index.js`:

   ```javascript
   const PORT = process.env.PORT || 8000; // Was 3000
   ```

2. **Timestamps:** `createdAt`/`updatedAt` are UTC (`2025-03-21T16:20:28.000Z`) instead of WAT string (`"3/21/2025, 10:20:28 AM"`). Our `listing.js` uses `toLocaleString`, but MongoDB’s overriding it. Fix below.

3. **Auth:** You didn’t show headers, but POST/PUT/DELETE worked—assuming you’re sending `Authorization: Bearer <token>` correctly.

4. **Data:** All fields (title, price, category) sync perfectly between frontend intent and backend storage.

---

### Fix Timestamp Format

To match `thread.js`, `wallet.js` (WAT string format), tweak `listing.js`:

#### `backend/models/listing.js`

```javascript
import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Abeg, give your item a title!"],
    trim: true,
    maxlength: [100, "Title too long—keep am short, bros!"],
  },
  description: {
    type: String,
    required: [true, "No description? Tell us wetin you dey sell na!"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price must dey—how we go buy am?"],
    min: [100, "Price too small—minimum na ₦1 (100 kobo)!"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Seller must dey—who dey sell this thing?"],
  },
  status: {
    type: String,
    enum: ["active", "sold", "deleted"],
    default: "active",
  },
  category: {
    type: String,
    enum: ["Electronics", "Fashion", "Home", "Food", "Services", "Others"],
    default: "Others",
  },
  createdAt: {
    type: String, // Change to String
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
  updatedAt: {
    type: String, // Change to String
    default: () =>
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
  },
});

listingSchema.pre("save", function (next) {
  this.updatedAt = new Date().toLocaleString("en-US", {
    timeZone: "Africa/Lagos",
  });
  next();
});

export default mongoose.model("Listing", listingSchema);
```

- **Change:** `type: Date` → `type: String` for `createdAt`/`updatedAt`.
- **Test Again:** POST a new listing—should show `"3/21/2025, 5:20:28 PM"` (WAT, assuming 16:20 UTC + 1h).

---

### Test `/categories` (Missing from Your Log)

- **Request:** GET `http://localhost:8000/api/marketplace/categories`
- **Expected:**
  ```json
  {
    "categories": [
      "Electronics",
      "Fashion",
      "Home",
      "Food",
      "Services",
      "Others"
    ],
    "message": "Categories dey here—pick one!"
  }
  ```
- **Why:** Frontend needs this—run it to confirm.

---

### Full Flow Check

- POST → GET all → GET one → PUT → DELETE → GET all (empty or reduced).
- **Result:** Your tests nail it—CRUD’s solid, `category` flows through.

---

### Your Call

- **Timestamp Fix:** Apply the `listing.js` tweak—re-test POST to see WAT format?
- **Categories:** Run GET `/categories`—good?
- **Next:** Sync frontend with these results or jump to Day 20 (escrow)?

Holla me, Boss—marketplace dey tight! What’s the vibe?

{
"version": 2,
"builds": [
{
"src": "frontend/package.json",
"use": "@vercel/next"
},
{
"src": "backend/index.js",
"use": "@vercel/node"
}
],
"routes": [
{
"src": "/api/(._)",
"dest": "/backend/index.js"
},
{
"src": "/verify/([^/]+)",
"dest": "/frontend/verify/[token]"
},
{
"src": "/users/([^/]+)/wallet",
"dest": "/frontend/users/[id]/wallet"
},
{
"src": "/users/([^/]+)",
"dest": "/frontend/users/[id]"
},
{
"src": "/threads/tip-success",
"dest": "/frontend/threads/tip-success"
},
{
"src": "/threads/([^/]+)",
"dest": "/frontend/threads/[id]"
},
{
"src": "/(._)",
"dest": "/frontend/$1"
}
]
}

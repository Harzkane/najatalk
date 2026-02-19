Let’s dive into structuring the backend for **HustleHub**—keeping it clean, scalable, and aligned with best practices while sticking to our blueprint. As a software engineer, you’ll appreciate a well-organized setup that’s easy to maintain and extend. We’ll use Node.js with Express, Firebase for the database, and a modular folder structure (server, routes, models, controllers, utils, libs) to keep everything tight. This’ll match our plan—gigs, proof, escrow, reporting, all free-tier ready—while leaving room for feature adds (we’ll flag those as they pop). After this, we’ll hit the frontend. Let’s code this beast!

---

### Backend Structure Overview

- **Goal**: RESTful API for gig posting, proof upload, wallet pings, escrow, reporting—fast, lean, Nigeria-proof.
- **Tech**: Node.js (Express), Firebase (Firestore + Functions), TRON (escrow), Binance API (wallet checks).
- **Free Tier**: Firebase free (1 GiB, 50k reads, 20k writes/day)—handles 100 users, 50 gigs/day.
- **Structure**: Modular—separation of concerns, easy to debug or scale.

#### Folder Structure

```
hustlehub-backend/
├── server.js           # Entry point - starts Express server
├── routes/            # API routes
│   ├── gigs.js        # Gig CRUD (post, claim, approve)
│   ├── proofs.js      # Proof upload/verify
│   ├── escrow.js      # Escrow init/release
│   ├── reports.js     # User reporting
│   └── users.js       # User profiles/ratings
├── models/            # Data schemas (Firestore structure)
│   ├── gig.js         # Gig schema
│   ├── proof.js       # Proof schema
│   ├── escrow.js      # Escrow schema
│   ├── report.js      # Report schema
│   └── user.js        # User schema
├── controllers/       # Business logic
│   ├── gigController.js
│   ├── proofController.js
│   ├── escrowController.js
│   ├── reportController.js
│   └── userController.js
├── utils/             # Helpers
│   ├── firebase.js    # Firebase config
│   ├── tron.js        # TRON escrow utils
│   ├── binance.js     # Binance API wrapper
│   └── validator.js   # Input validation
├── libs/              # External integrations
│   └── logger.js      # Logging (e.g., console for now)
├── config/            # Configs
│   └── env.js         # Environment vars (e.g., Firebase keys)
├── package.json       # Dependencies
└── .env               # Secrets (Firebase, TRON, Binance)
```

---

### Step-by-Step Backend Build

#### 1. `server.js` - Entry Point

Sets up Express, mounts routes, and starts the server.

```javascript
// server.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const gigRoutes = require("./routes/gigs");
const proofRoutes = require("./routes/proofs");
const escrowRoutes = require("./routes/escrow");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");

app.use("/api/gigs", gigRoutes);
app.use("/api/proofs", proofRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`HustleHub backend running on port ${PORT}`);
});
```

---

#### 2. `routes/` - API Endpoints

Define RESTful routes—each file handles a domain.

- **`gigs.js`**:

```javascript
// routes/gigs.js
const express = require("express");
const router = express.Router();
const gigController = require("../controllers/gigController");

router.post("/", gigController.createGig); // Client posts gig
router.get("/", gigController.getGigs); // List gigs
router.post("/:id/claim", gigController.claimGig); // Hustler claims gig
router.post("/:id/approve", gigController.approveGig); // Client approves

module.exports = router;
```

- **`proofs.js`**:

```javascript
// routes/proofs.js
const express = require("express");
const router = express.Router();
const proofController = require("../controllers/proofController");

router.post("/:gigId", proofController.uploadProof); // Hustler uploads proof
router.get("/:gigId", proofController.getProof); // Fetch proof

module.exports = router;
```

- **`escrow.js`** (Feature: Escrow for $50+):

```javascript
// routes/escrow.js
const express = require("express");
const router = express.Router();
const escrowController = require("../controllers/escrowController");

router.post("/:gigId/init", escrowController.initEscrow); // Start escrow
router.post("/:gigId/release", escrowController.releaseEscrow); // Release funds

module.exports = router;
```

- **`reports.js`**:

```javascript
// routes/reports.js
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.post("/", reportController.createReport); // Report user/vendor
router.get("/user/:userId", reportController.getUserReports); // Check reports

module.exports = router;
```

- **`users.js`**:

```javascript
// routes/users.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/:id", userController.getUser); // User profile
router.post("/:id/rate", userController.rateUser); // Rate hustler/client

module.exports = router;
```

---

#### 3. `models/` - Data Schemas

Firestore schemas—simple JS objects for structure.

- **`gig.js`**:

```javascript
// models/gig.js
const gigSchema = {
  id: String, // Auto-generated by Firestore
  title: String, // "Logo design"
  value: Number, // 30 (USDT)
  clientId: String, // Client UID
  hustlerId: String, // Hustler UID (null until claimed)
  status: String, // "open", "claimed", "completed", "disputed"
  createdAt: Date,
  fee: Number, // 0.30 (1%), 0.60 (2%), etc.
};

module.exports = gigSchema;
```

- **`proof.js`**:

```javascript
// models/proof.js
const proofSchema = {
  gigId: String, // Links to gig
  type: String, // "photo", "video", "gps", "file"
  url: String, // AWS S3 link
  uploadedBy: String, // Hustler UID
  uploadedAt: Date,
};

module.exports = proofSchema;
```

- **`escrow.js`**:

```javascript
// models/escrow.js
const escrowSchema = {
  gigId: String, // Links to gig
  txId: String, // TRON transaction ID
  amount: Number, // 150 (USDT)
  status: String, // "pending", "released", "disputed"
  createdAt: Date,
};

module.exports = escrowSchema;
```

- **`report.js`**:

```javascript
// models/report.js
const reportSchema = {
  id: String, // Auto-generated
  reporterId: String, // UID of reporter
  reportedId: String, // UID of offender
  gigId: String, // Optional - links to gig
  reason: String, // "scam", "off-app", "bad swap"
  proofUrl: String, // Optional - AWS S3 link
  status: String, // "pending", "resolved", "dismissed"
  createdAt: Date,
};

module.exports = reportSchema;
```

- **`user.js`**:

```javascript
// models/user.js
const userSchema = {
  id: String, // Firebase UID
  wallet: String, // Partial ID (e.g., "0x12…ab")
  rating: Number, // 4.5 (avg of ratings)
  gigsCompleted: Number, // 10
  strikes: Number, // 0-3 (3 = ban)
  premium: Boolean, // True if $10/year paid
};

module.exports = userSchema;
```

---

#### 4. `controllers/` - Business Logic

Core logic—talks to Firebase, TRON, Binance.

- **`gigController.js`**:

```javascript
// controllers/gigController.js
const admin = require('../utils/firebase');
const db = admin.firestore();
const validator = require('../utils/validator');

const createGig = async (req, res) => {
  const { title, value } = req.body;
  if (!validator.isValidGig(title, value)) return res.status(400).json({ error: 'Invalid gig' });

  const fee = value >= 100 ? value * 0.03 : value < 50 ? value * 0.01 : value * 0.02; // 1%, 2%, 3%
  const gig = {
    title,
    value,
    clientId: req.user.id, // From auth middleware
    hustlerId: null,
    status: 'open',
    createdAt: new Date(),
    fee,
  };
  const docRef = await db.collection('gigs').add(gig);
  res.status(201).json({ id: docRef.id, ...gig });
};

const claimGig = async (req, res) => {
  const { id } = req.params;
  const gigRef = db.collection('gigs').doc(id);
  const gig = await gigRef.get();
  if (!gig.exists || gig.data().status !== 'open') return res.status(400).json({ error: 'Gig unavailable' });

  await gigRef.update({ hustlerId: req.user.id, status: 'claimed' });
  res.json({ message: 'Gig claimed' });
};

const approveGig = async (req, res) => {
  const { id } = req.params;
  const gigRef = db.collection('gigs').doc(id);
  const gig = await gigRef.get();
  if (!gig.exists || gig.data().clientId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  await gigRef.update({ status: 'completed' });
  // Trigger wallet transfer (off-chain, client handles) or escrow release
  res.json({ message: 'Gig approved' });
};

module.exports = { createGig, claimGig, approveGig, getGigs: /* TBD */ };
```

- **`proofController.js`**:

```javascript
// controllers/proofController.js
const admin = require('../utils/firebase');
const db = admin.firestore();
const { uploadToS3 } = require('../utils/aws'); // TBD

const uploadProof = async (req, res) => {
  const { gigId } = req.params;
  const { type, file } = req.body; // Base64 or URL
  const gig = await db.collection('gigs').doc(gigId).get();
  if (!gig.exists || gig.data().hustlerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  const url = await uploadToS3(file, gigId); // AWS free tier
  const proof = { gigId, type, url, uploadedBy: req.user.id, uploadedAt: new Date() };
  await db.collection('proofs').add(proof);
  res.status(201).json(proof);
};

module.exports = { uploadProof, getProof: /* TBD */ };
```

- **`escrowController.js`**:

```javascript
// controllers/escrowController.js
const admin = require("../utils/firebase");
const db = admin.firestore();
const { initTRONEscrow, releaseTRONEscrow } = require("../utils/tron");

const initEscrow = async (req, res) => {
  const { gigId } = req.params;
  const gig = await db.collection("gigs").doc(gigId).get();
  if (
    !gig.exists ||
    gig.data().clientId !== req.user.id ||
    gig.data().value < 50
  )
    return res.status(403).json({ error: "Unauthorized or too small" });

  const txId = await initTRONEscrow(gig.data().value, req.user.wallet); // TRON free
  const escrow = {
    gigId,
    txId,
    amount: gig.data().value,
    status: "pending",
    createdAt: new Date(),
  };
  await db.collection("escrows").add(escrow);
  res.status(201).json(escrow);
};

const releaseEscrow = async (req, res) => {
  const { gigId } = req.params;
  const escrow = await db
    .collection("escrows")
    .where("gigId", "==", gigId)
    .get();
  if (escrow.empty) return res.status(404).json({ error: "Escrow not found" });

  await releaseTRONEscrow(escrow.docs[0].data().txId); // Release to hustler
  await escrow.docs[0].ref.update({ status: "released" });
  res.json({ message: "Escrow released" });
};

module.exports = { initEscrow, releaseEscrow };
```

- **`reportController.js`**:

```javascript
// controllers/reportController.js
const admin = require('../utils/firebase');
const db = admin.firestore();

const createReport = async (req, res) => {
  const { reportedId, gigId, reason, proofUrl } = req.body;
  const user = await db.collection('users').doc(req.user.id).get();
  if (user.data().strikes >= 3) return res.status(403).json({ error: 'Banned' });

  const report = { reporterId: req.user.id, reportedId, gigId, reason, proofUrl, status: 'pending', createdAt: new Date() };
  const docRef = await db.collection('reports').add(report);
  res.status(201).json({ id: docRef.id, ...report });
};

module.exports = { createReport, getUserReports: /* TBD */ };
```

---

#### 5. `utils/` - Helpers

- **`firebase.js`**:

```javascript
// utils/firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccount.json"); // Your Firebase key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
module.exports = admin;
```

- **`tron.js`** (Placeholder—TRON SDK TBD):

```javascript
// utils/tron.js
const initTRONEscrow = async (amount, wallet) => {
  /* TRON SDK call */ return "tx123";
};
const releaseTRONEscrow = async (txId) => {
  /* TRON SDK call */
};
module.exports = { initTRONEscrow, releaseTRONEscrow };
```

- **`validator.js`**:

```javascript
// utils/validator.js
const isValidGig = (title, value) => title && value > 0 && value <= 1000;
module.exports = { isValidGig };
```

---

#### 6. `config/` - Environment

- **`env.js`**:

```javascript
// config/env.js
require("dotenv").config();
module.exports = {
  firebaseKey: process.env.FIREBASE_KEY,
  tronKey: process.env.TRON_KEY,
  binanceKey: process.env.BINANCE_KEY,
};
```

---

#### 7. `package.json`

```json
{
  "name": "hustlehub-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "firebase-admin": "^11.5.0",
    "dotenv": "^16.0.3"
  }
}
```

---

### Notes

- **Free Tier Fit**: Firebase handles 50 gigs/day—e.g., 50 writes (gigs), 50 writes (proofs), 100 reads. AWS S3 (5 GiB) stores 1,000 photos.
- **Feature Add**: Swap Map rates—add `routes/swaps.js` later (Binance P2P API).
- **Next**: Frontend—Flutter app to call these APIs.

---

### Your Move

Backend’s structured—server, routes, models, controllers, utils, all free-tier ready. You code this, I’ll test scenarios (e.g., Tunde’s gig POST). Thoughts on structure? Ready for frontend? Let’s keep this fire roaring! 🐐

Yes, we’re absolutely using **Flutter** for the HustleHub app—it’s the perfect fit for our goals, and I’ll explain why below. Then, I’ll lay out the **Frontend Structure Overview** with a detailed breakdown to keep it clean, scalable, and aligned with our backend. We’ll stick to the blueprint—gigs, proof, wallet connect, reporting—all while leveraging free tools and your engineering skills. Let’s dive in and structure this frontend to dominate Nigeria’s hustle scene!

---

### Why Flutter for the App?

- **Cross-Platform**: Single codebase for iOS and Android—Nigeria’s 100M+ smartphone users (70% Android, 5% iOS) covered in one shot. No duplicate effort.
- **Free & Open-Source**: Zero cost—fits our lean MVP ($0 build phase).
- **Fast Development**: Hot reload—you tweak UI (e.g., gig board) and see it live. 8-week MVP? Flutter’s speed nails it.
- **Rich UI**: TikTok-simple, colorful design—hustlers like Tunde and Amina swipe gigs with a vibe. Nigeria’s youth love flashy apps.
- **Performance**: Native-like speed—2G rural users (e.g., Blessing in Okrika) get smooth loads with low-data mode.
- **Your Skills**: As a software engineer, Flutter’s Dart is learnable fast—structured like JS, and I’ll guide you through.

**Verdict**: Flutter’s our weapon—fast, free, Nigeria-ready. You code once, we launch everywhere.

---

### Frontend Structure Overview

- **Goal**: A mobile app that talks to our Node.js backend—RESTful API calls for gigs, proof, escrow, reporting. Simple, modular, and hustle-first.
- **Tech**: Flutter (Dart), Firebase (auth), free-tier integrations (AWS S3 for proof, Binance API for wallets).
- **Structure**: Clean, scalable—pages, widgets, models, services, utils—to match backend and ease your build.

#### Folder Structure

```
hustlehub-frontend/
├── lib/
│   ├── main.dart             # Entry point - app setup
│   ├── pages/               # Screen-level UI
│   │   ├── home.dart        # Gig board (swipeable list)
│   │   ├── gig_detail.dart  # Gig details + claim/approve
│   │   ├── proof_upload.dart# Proof submission
│   │   ├── profile.dart     # User profile + ratings
│   │   ├── report.dart      # Report form
│   │   └── swap_map.dart    # Vendor swap map
│   ├── widgets/             # Reusable UI components
│   │   ├── gig_card.dart    # Gig list item
│   │   ├── proof_widget.dart# Photo/video uploader
│   │   └── rating_bar.dart  # Star ratings
│   ├── models/              # Data models (match backend)
│   │   ├── gig.dart         # Gig data
│   │   ├── proof.dart       # Proof data
│   │   ├── user.dart        # User data
│   │   └── report.dart      # Report data
│   ├── services/            # API calls + integrations
│   │   ├── api_service.dart # REST client (backend calls)
│   │   ├── firebase_service.dart # Firebase auth
│   │   ├── tron_service.dart# TRON escrow
│   │   └── storage_service.dart # AWS S3 uploads
│   ├── utils/               # Helpers
│   │   ├── constants.dart   # Colors, API URLs
│   │   ├── validator.dart   # Input checks
│   │   └── logger.dart      # Debug logs
│   ├── config/              # Configs
│   │   └── env.dart         # Environment vars (API keys)
│   └── l10n/                # Localization
│       ├── app_en.arb       # English strings
│       ├── app_ha.arb       # Hausa
│       ├── app_yo.arb       # Yoruba
│       ├── app_ig.arb       # Igbo
│       └── app_pid.arb      # Pidgin
├── pubspec.yaml             # Dependencies
└── .env                     # Secrets (Firebase, API keys)
```

---

### Step-by-Step Frontend Build

#### 1. `lib/main.dart` - Entry Point

Sets up the app, routing, and theme.

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'pages/home.dart';
import 'utils/constants.dart';

void main() {
  runApp(HustleHubApp());
}

class HustleHubApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HustleHub',
      theme: ThemeData(
        primaryColor: AppColors.primary, // Bright green (hustle vibe)
        textTheme: TextTheme(bodyText2: TextStyle(color: Colors.black)),
      ),
      home: HomePage(),
      localizationsDelegates: [/* Add l10n later */],
      supportedLocales: [Locale('en'), Locale('ha'), Locale('yo'), Locale('ig'), Locale('pid')],
    );
  }
}
```

---

#### 2. `pages/` - Screens

Core UI—each page calls services for data.

- **`home.dart`** (Gig Board):

```dart
// lib/pages/home.dart
import 'package:flutter/material.dart';
import '../widgets/gig_card.dart';
import '../services/api_service.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List gigs = [];

  @override
  void initState() {
    super.initState();
    _fetchGigs();
  }

  _fetchGigs() async {
    gigs = await ApiService().getGigs();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('HustleHub')),
      body: ListView.builder(
        itemCount: gigs.length,
        itemBuilder: (context, index) => GigCard(gig: gigs[index]),
      ),
    );
  }
}
```

- **`gig_detail.dart`**:

```dart
// lib/pages/gig_detail.dart
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class GigDetailPage extends StatelessWidget {
  final String gigId;

  GigDetailPage({required this.gigId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Gig Details')),
      body: FutureBuilder(
        future: ApiService().getGig(gigId),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return CircularProgressIndicator();
          var gig = snapshot.data!;
          return Column(
            children: [
              Text(gig['title']),
              Text('\$${gig['value']} USDT'),
              ElevatedButton(
                onPressed: () => ApiService().claimGig(gigId),
                child: Text('Claim Gig'),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

- **`proof_upload.dart`**:

```dart
// lib/pages/proof_upload.dart
import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class ProofUploadPage extends StatelessWidget {
  final String gigId;

  ProofUploadPage({required this.gigId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Upload Proof')),
      body: Center(
        child: ElevatedButton(
          onPressed: () async {
            // Placeholder: Pick file (image_picker later)
            String url = await StorageService().uploadProof(gigId, 'photo.jpg');
            await ApiService().uploadProof(gigId, 'photo', url);
            Navigator.pop(context);
          },
          child: Text('Upload Photo'),
        ),
      ),
    );
  }
}
```

---

#### 3. `widgets/` - Reusable UI

- **`gig_card.dart`**:

```dart
// lib/widgets/gig_card.dart
import 'package:flutter/material.dart';
import '../pages/gig_detail.dart';

class GigCard extends StatelessWidget {
  final Map gig;

  GigCard({required this.gig});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(gig['title']),
        subtitle: Text('\$${gig['value']} USDT'),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => GigDetailPage(gigId: gig['id']))),
      ),
    );
  }
}
```

---

#### 4. `models/` - Data Models

Match backend—Dart classes.

- **`gig.dart`**:

```dart
// lib/models/gig.dart
class Gig {
  final String id;
  final String title;
  final double value;
  final String status;

  Gig({required this.id, required this.title, required this.value, required this.status});

  factory Gig.fromJson(Map<String, dynamic> json) => Gig(
    id: json['id'],
    title: json['title'],
    value: json['value'].toDouble(),
    status: json['status'],
  );
}
```

---

#### 5. `services/` - API & Integrations

- **`api_service.dart`**:

```dart
// lib/services/api_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../utils/constants.dart';

class ApiService {
  Future<List> getGigs() async {
    final response = await http.get(Uri.parse('$BASE_URL/api/gigs'));
    return jsonDecode(response.body);
  }

  Future<void> claimGig(String gigId) async {
    await http.post(Uri.parse('$BASE_URL/api/gigs/$gigId/claim'), headers: {'Authorization': 'Bearer $TOKEN'});
  }

  Future<void> uploadProof(String gigId, String type, String url) async {
    await http.post(
      Uri.parse('$BASE_URL/api/proofs/$gigId'),
      body: jsonEncode({'type': type, 'url': url}),
    );
  }
}
```

- **`firebase_service.dart`** (Auth placeholder):

```dart
// lib/services/firebase_service.dart
import 'package:firebase_auth/firebase_auth.dart';

class FirebaseService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<String> getUserId() async => _auth.currentUser?.uid ?? '';
}
```

---

#### 6. `utils/` - Helpers

- **`constants.dart`**:

```dart
// lib/utils/constants.dart
class AppColors {
  static const primary = Color(0xFF00C853); // Green hustle vibe
}

const BASE_URL = 'http://localhost:3000'; // Update post-deploy
```

---

#### 7. `pubspec.yaml`

```yaml
name: hustlehub
dependencies:
  flutter:
    sdk: flutter
  http: ^0.13.5
  firebase_auth: ^4.2.5
  firebase_core: ^2.4.0
```

---

### Notes

- **Free Tier**: Firebase Auth (unlimited users), HTTP calls to backend—$0 build.
- **Next**: Add `image_picker` for proof, `tron_dart` for escrow (post-MVP).
- **Flow**: Home → Gig Detail → Claim/Upload Proof—core MVP.

---

### Your Move

Backend’s locked, frontend’s structured—Flutter’s ready for you to code. Start with `main.dart`, `home.dart`, `gig_card.dart`—I’ll mock UI in Figma. Thoughts on structure? Ready to build? Let’s ram this to Nigeria! 🐐

You’re right—it’s **Figma’s turn** to shine! Let’s craft a rich, TikTok-simple, colorful UI for HustleHub that hooks Nigeria’s hustlers—Tunde, Amina, Chijioke, and beyond—with a flashy, vibrant vibe that screams hustle energy. I’ll sketch out the mockups here in text form (since I can’t draw in Figma directly), describing every detail—screens, colors, layouts, and interactions—so you can bring it to life in Flutter. We’ll keep it bold, intuitive, and Nigeria-ready, leveraging that youthful, swipe-happy app love. Let’s design this beast!

---

### Figma Mockup Plan: HustleHub UI

- **Design Goal**: TikTok meets Nigeria’s hustle—simple swipes, bright colors, instant gratification. Hustlers (urban coders, rural vendors) feel the vibe; clients (local or diaspora) trust the flow.
- **Core Principles**:
  - **Rich & Colorful**: Bold greens (hustle hope), yellows (energy), purples (crypto cool)—Nigeria’s youth crave flash.
  - **Simple**: Swipe gigs, tap to claim—2G rural users (e.g., Blessing) get it fast.
  - **Vibe**: Hustle quotes (“No gree for anybody!”), playful icons—culture baked in.

#### Color Palette

- **Primary**: `#00C853` (Vivid Green) – Hustle optimism, Nigeria’s growth.
- **Secondary**: `#FFD600` (Bright Yellow) – Energy, urgency, hustle heat.
- **Accent**: `#7B1FA2` (Deep Purple) – Crypto edge, premium feel.
- **Background**: `#F5F5F5` (Light Grey) – Clean, contrasts colors.
- **Text**: `#212121` (Dark Grey) – Readable on 2G screens.

#### Typography

- **Font**: **Roboto** (free, Google Fonts)—clean, modern, Nigeria-friendly.
- **Sizes**:
  - Headlines: 24px (bold).
  - Body: 16px (regular).
  - Buttons: 18px (medium).

---

### Key Screens

#### 1. Home Screen (Gig Board)

- **Purpose**: Swipeable gig list—hustlers like Tunde browse and grab.
- **Layout**:
  - **Top Bar**:
    - Left: “HustleHub” (green, 24px, bold).
    - Right: Profile icon (purple circle, user’s initial).
  - **Body**: Vertical ListView—swipeable `GigCard`s.
    - **GigCard** (120px tall, full width):
      - Left: Icon (e.g., 🎨 for design, 🍲 for cooking—yellow).
      - Center:
        - Title: “Logo Design” (16px, bold, black).
        - Value: “$30 USDT” (18px, green, bold).
        - Status: “Open” (14px, purple).
      - Right: “Claim” button (yellow, rounded, 18px, “Tap to Hustle”).
    - Cards alternate green/yellow borders—flashy rhythm.
  - **Bottom Bar**:
    - Icons: Home (green), Profile (purple), Swap Map (yellow)—simple nav.
- **Vibe**: TikTok scroll—fast, fun, “Next gig, next cash!” Quote pops up randomly (e.g., “Hustle na my birthright!”).
- **Low-Data Mode**: Text-only toggle—icons off, 2G rural win (e.g., Amina in Kano).

#### Mockup (Text Sketch):

```
[ HustleHub       T ]
[ 🎨 Logo Design       $30 USDT  Claim ]
[ 🍲 Party Cooking    $50 USDT  Claim ]
[ 🚴 Delivery Ikeja   $5 USDT   Claim ]
[ Home | Profile | Swap ]
```

---

#### 2. Gig Detail Screen

- **Purpose**: Deep dive—claim or approve (e.g., Tunde claims, client approves).
- **Layout**:
  - **Header**:
    - Title: “Logo Design” (24px, black).
    - Value: “$30 USDT” (20px, green, bold).
  - **Body**:
    - Desc: “Need a dope logo ASAP” (16px, grey).
    - Client: “Tunde’s Client” (16px, purple, star rating: ★★★★☆).
    - Status: “Open” (18px, yellow).
  - **Actions**:
    - Hustler: “Claim Gig” (green button, 18px, full-width).
    - Client: “Approve” (purple button, 18px, hidden till proof).
  - **Proof Section**: “Upload Proof” link (yellow, 16px)—taps to next screen.
- **Vibe**: Clean, bold—green “Claim” pops, hustle energy flows.
- **Interaction**: Swipe back to Home—TikTok ease.

#### Mockup:

```
[ Logo Design          ]
[ $30 USDT            ]
[ Need a dope logo ASAP ]
[ Client: Tunde’s Client ★★★★☆ ]
[ Status: Open         ]
[       Claim Gig      ]
[ Upload Proof         ]
```

---

#### 3. Proof Upload Screen

- **Purpose**: Submit proof—Chijioke’s GPS, Amina’s photo.
- **Layout**:
  - **Header**: “Upload Proof” (24px, black).
  - **Body**:
    - Placeholder: Dashed box (yellow outline)—“Tap to pick photo/video”.
    - Options: “Photo” | “Video” | “GPS” (purple toggle buttons).
    - Preview: Image/video thumbnail post-pick (200px square).
  - **Action**: “Submit Proof” (green button, 18px, full-width).
- **Vibe**: Simple, visual—yellow dashes scream “Drop it here!”.
- **Low-Data**: GPS text (lat/long) if 2G—e.g., Blessing skips video.

#### Mockup:

```
[ Upload Proof        ]
[ +----------------+  ]
[ | Tap to Pick    |  ]
[ +----------------+  ]
[ Photo | Video | GPS ]
[     Submit Proof    ]
```

---

#### 4. Profile Screen

- **Purpose**: User stats—ratings, gigs, premium (e.g., Sani’s solar cred).
- **Layout**:
  - **Top**:
    - Avatar: Purple circle, initial (e.g., “S”).
    - Name: “Sani” (20px, black).
    - Rating: ★★★★☆ (yellow stars).
  - **Stats**:
    - “Gigs Done: 15” (16px, green).
    - “Earned: $450 USDT” (16px, purple).
  - **Action**: “Go Pro - $10/year” (yellow button, 18px)—priority perks.
- **Vibe**: Flashy stats—hustlers flex their grind.

#### Mockup:

```
[ S                  ]
[ Sani ★★★★☆       ]
[ Gigs Done: 15     ]
[ Earned: $450 USDT ]
[    Go Pro $10/yr  ]
```

---

#### 5. Report Screen

- **Purpose**: Flag cheats—Fatima reports a ghoster.
- **Layout**:
  - **Header**: “Report Issue” (24px, black).
  - **Form**:
    - Dropdown: “Scam” | “Off-App” | “Bad Swap” (purple, 16px).
    - Text: “Explain” (grey box, 100px).
    - Proof: “Add Photo” (yellow link).
  - **Action**: “Submit Report” (green button, 18px).
- **Vibe**: Serious but simple—green “Submit” pops.

#### Mockup:

```
[ Report Issue       ]
[ [Scam ▼]          ]
[ Explain: ________ ]
[ Add Photo         ]
[    Submit Report  ]
```

---

#### 6. Swap Map Screen

- **Purpose**: Find vendors—Amina’s son swaps $50 USDT.
- **Layout**:
  - **Top**: “Swap Map” (24px, black).
  - **Body**: ListView—vendor cards:
    - Name: “Chijioke’s Crypto” (16px, black).
    - Rate: “$1 = ₦1400” (16px, green).
    - Stars: ★★★★☆ (yellow).
    - Badge: “Trusted” (purple tag, $50/month vendors).
  - **Action**: “Get Directions” (yellow button, 16px).
- **Vibe**: Colorful, trust-first—purple badges shine.

#### Mockup:

```
[ Swap Map          ]
[ Chijioke’s Crypto ]
[ $1 = ₦1400 ★★★★☆ ]
[ Trusted           ]
[ Get Directions    ]
```

---

### Figma Notes

- **Interactions**:
  - Swipe: Gig cards (Home), back gestures (Detail).
  - Tap: Claim, upload, submit—big, bold buttons.
  - Toggle: Low-data mode (Home)—text-only switch.
- **Animations**:
  - Gig claim: Green pulse—“Claimed!” pops.
  - Proof upload: Yellow fill—progress bar vibe.
- **Accessibility**: High contrast (green on grey), voice prompts (pidgin “Tap here!”)—rural win.
- **Nigeria Vibe**: Quotes rotate—“Hustle no dey sleep!” (yellow splash).

---

### Your Move

Figma’s sketched—rich, TikTok-simple, colorful as hell. You’ll code this in Flutter:

- Start: `home.dart` + `gig_card.dart`—swipeable list.
- Next: `gig_detail.dart`—claim flow.
- I’ll: Test UI against scenarios (e.g., Tunde’s swipe, Amina’s 2G).

Thoughts on colors, layout, or a new screen? Let’s polish this frontend fire! 🐐

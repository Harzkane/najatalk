// /Users/harz/harz/haruna-portfolio/src/data/projects.ts
import { Project } from "@/types/project";

export const projects: Project[] = [
  {
    id: "1",
    slug: "afritrade-hub",
    title: "AfriTrade Hub",
    shortDescription:
      "Full-stack e-commerce ecosystem for cross-border trade across Africa with multi-vendor support and payment integrations.",
    longDescription:
      "A comprehensive e-commerce platform designed to facilitate cross-border trade across Africa. Built with a monorepo architecture, it handles multi-vendor transactions, payment processing, and real-time operations at scale.",
    category: "E-Commerce",
    featured: true,
    status: "Live",
    thumbnail: "/projects/afritrade/thumbnail.jpg",
    images: [
      "/projects/afritrade/home.jpg",
      "/projects/afritrade/vendor-dashboard.jpg",
      "/projects/afritrade/admin-panel.jpg",
      "/projects/afritrade/checkout.jpg",
    ],
    techStack: {
      frontend: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS"],
      backend: ["Node.js", "Express.js", "MongoDB", "Mongoose"],
      other: [
        "Cloudflare R2",
        "Turborepo",
        "Flutterwave",
        "Paystack",
        "Orange Money",
        "Web3",
      ],
    },
    features: [
      "Multi-vendor marketplace with individual storefronts",
      "Payment integration with Flutterwave, Paystack, and Orange Money",
      "Escrow system with automated seller payouts",
      "Real-time notification system",
      "QR-based wallet transfers",
      "Vendor analytics dashboards",
      "Order management with inventory tracking",
      "Review and rating system",
      "Fraud detection mechanisms",
      "Admin panel with comprehensive controls",
    ],
    challenges: [
      "Handling multiple payment providers with different APIs and callback patterns",
      "Implementing secure escrow system for cross-border transactions",
      "Building real-time notifications at scale",
      "Managing complex role-based access control (Admin, Vendor, User)",
    ],
    learnings: [
      "Advanced payment integration patterns",
      "Monorepo architecture with Turborepo",
      "Real-time system design",
      "Secure transaction handling",
    ],
    myRole:
      "Full-Stack Developer - Architected and built the entire platform from concept to deployment",
    timeline: "Oct 2024 - Present",
    links: {
      live: "https://afritradehub.com", // Update with actual link
    },
    metrics: {
      endpoints: 50,
      models: 25,
      components: 30,
    },
  },
  {
    id: "2",
    slug: "kaalis-store",
    title: "Kaalis Store",
    shortDescription:
      "Multi-vendor marketplace with seller dashboards, wallet system, and automated payment processing.",
    longDescription:
      "A full-featured marketplace platform built with Vue.js, enabling vendors to manage their own storefronts while providing users with a seamless shopping experience.",
    category: "E-Commerce",
    featured: true,
    status: "Live",
    thumbnail: "/projects/kaalis/thumbnail.jpg",
    images: [
      "/projects/kaalis/home.jpg",
      "/projects/kaalis/seller-dashboard.jpg",
      "/projects/kaalis/wallet.jpg",
    ],
    techStack: {
      frontend: ["Vue.js 3", "Vite", "Pinia", "Chart.js", "Tailwind CSS"],
      backend: ["Node.js", "Express.js", "MongoDB"],
      other: ["Firebase Auth", "Paystack", "PayDunya", "Orange Money"],
    },
    features: [
      "Vendor management system with individual dashboards",
      "Product listing and inventory management",
      "Automated payment processing and payouts",
      "User wallet with transaction history",
      "Seller analytics and reporting",
      "Two-factor authentication",
      "Role-based permissions system",
      "Promotional tools for vendors",
    ],
    myRole:
      "Full-Stack Developer - Designed and implemented the complete platform",
    timeline: "Jan 2024 - Jun 2024",
    metrics: {
      endpoints: 40,
      models: 30,
      components: 100,
    },
  },
  {
    id: "3",
    slug: "naijatalk",
    title: "NaijaTalk",
    shortDescription:
      "Social community platform with threaded discussions, marketplace features, and contest system.",
    longDescription:
      "A comprehensive community platform combining social features with e-commerce capabilities, built to foster engagement through discussions, marketplace, and contests.",
    category: "Social",
    featured: true,
    status: "Live",
    thumbnail: "/projects/naijatalk/thumbnail.jpg",
    images: [
      "/projects/naijatalk/home.jpg",
      "/projects/naijatalk/discussions.jpg",
      "/projects/naijatalk/marketplace.jpg",
    ],
    techStack: {
      frontend: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS"],
      backend: ["Node.js", "Express.js", "MongoDB"],
    },
    features: [
      "Threaded discussion system",
      "Integrated marketplace",
      "User wallet with tipping functionality",
      "Premium subscription system",
      "Contest and competition features",
      "Admin moderation tools",
      "Reporting and analytics system",
      "In-platform currency",
      "Ad management system",
    ],
    myRole: "Full-Stack Developer - Built the complete platform architecture",
    timeline: "Jan 2024 - Jun 2024",
    metrics: {
      endpoints: 15,
    },
  },
  {
    id: "4",
    slug: "afritoken",
    title: "AfriToken",
    shortDescription:
      "Crypto wallet with fiat conversion supporting USDT, XOF, and NGN with real-time exchange.",
    longDescription:
      "A mobile crypto wallet application enabling seamless conversion between USDT and local African currencies (XOF, NGN) with real-time exchange rates.",
    category: "Fintech",
    featured: true,
    status: "In Development",
    thumbnail: "/projects/afritoken/thumbnail.jpg",
    images: [],
    techStack: {
      mobile: ["React Native"],
      backend: ["Node.js", "Express.js"],
      database: ["PostgreSQL"],
    },
    features: [
      "USDT to XOF/NGN conversion",
      "Real-time exchange rates",
      "Secure wallet management",
      "Transaction history",
      "Multi-currency support",
    ],
    myRole: "Full-Stack Mobile Developer",
    timeline: "2024",
  },
  {
    id: "5",
    slug: "naijamart",
    title: "NaijaMart",
    shortDescription:
      "Native iOS e-commerce app with Firebase backend supporting multi-role architecture.",
    longDescription:
      "A native iOS marketplace application built with SwiftUI, featuring real-time data synchronization and comprehensive role management.",
    category: "Mobile",
    featured: false,
    status: "In Development",
    thumbnail: "/projects/naijamart/thumbnail.jpg",
    images: [],
    techStack: {
      mobile: ["SwiftUI", "Combine", "Core Location"],
      backend: ["Firebase Firestore", "Firebase Auth", "Firebase Storage"],
    },
    features: [
      "Native iOS experience",
      "Vendor dashboard with analytics",
      "Admin panel for platform management",
      "Inventory management",
      "Order tracking system",
      "Push notifications",
      "Offline capability",
      "Localization support",
    ],
    myRole: "iOS Developer - Full native app development",
    timeline: "Jun 2024 - Oct 2024",
  },
  {
    id: "6",
    slug: "recipe-api",
    title: "Recipe - Food - Nutrition API",
    shortDescription:
      "Public REST API for recipe and nutrition data, published on RapidAPI.",
    longDescription:
      "A comprehensive recipe and nutrition API providing access to food data, nutritional information, and recipe details.",
    category: "API",
    featured: false,
    status: "Live",
    thumbnail: "/projects/recipe-api/thumbnail.jpg",
    images: [],
    techStack: {
      backend: ["Node.js", "Express.js", "MongoDB"],
    },
    features: [
      "Recipe search and filtering",
      "Nutritional data lookup",
      "Food categorization",
      "RESTful endpoints",
    ],
    myRole: "Backend Developer",
    timeline: "2023",
    links: {
      live: "https://rapidapi.com/", // Update with actual link
    },
  },
  {
    id: "7",
    slug: "amazon-scraper",
    title: "Amazon Product Scraper API",
    shortDescription:
      "Web scraping API for Amazon product data, published on RapidAPI.",
    longDescription:
      "An API service that provides structured access to Amazon product information through web scraping.",
    category: "API",
    featured: false,
    status: "Live",
    thumbnail: "/projects/amazon-scraper/thumbnail.jpg",
    images: [],
    techStack: {
      backend: ["Node.js", "Express.js", "Custom Scrapers"],
    },
    features: [
      "Product information extraction",
      "Price tracking",
      "Review aggregation",
      "RESTful API access",
    ],
    myRole: "Backend Developer",
    timeline: "2023",
    links: {
      live: "https://rapidapi.com/", // Update with actual link
    },
  },
];

// Helper functions
export const getAllProjects = () => projects;
export const getFeaturedProjects = () => projects.filter((p) => p.featured);
export const getProjectBySlug = (slug: string) =>
  projects.find((p) => p.slug === slug);
export const getProjectsByCategory = (category: string) =>
  projects.filter((p) => p.category === category);

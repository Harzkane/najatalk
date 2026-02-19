// types/project.ts

export interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  category: "E-Commerce" | "Fintech" | "Social" | "API" | "Mobile";
  featured: boolean;
  status: "Live" | "In Development" | "Demo";
  thumbnail: string;
  images: string[];
  techStack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    mobile?: string[];
    other?: string[];
  };
  features: string[];
  challenges?: string[];
  learnings?: string[];
  myRole: string;
  timeline: string;
  links?: {
    live?: string;
    github?: string;
    demo?: string;
  };
  metrics?: {
    endpoints?: number;
    models?: number;
    components?: number;
    users?: string;
  };
}

export interface TechBadge {
  name: string;
  icon?: string;
  color: string;
}

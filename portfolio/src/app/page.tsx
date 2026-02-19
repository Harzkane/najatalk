// app/page.tsx
import { Hero } from "@/components/Hero";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { TechStack } from "@/components/TechStack";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedProjects />
      <TechStack />
    </>
  );
}

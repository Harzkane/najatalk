import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminDashboardClient from "../components/AdminDashboardClient";
import {
  ADMIN_SECTIONS,
  ADMIN_SECTION_LABELS,
  type AdminSectionId,
} from "../components/sectionMeta";

const SECTION_SET: ReadonlySet<AdminSectionId> = new Set(ADMIN_SECTIONS);

type AdminSectionPageProps = {
  params: Promise<{ section: string }>;
};

export async function generateMetadata({
  params,
}: AdminSectionPageProps): Promise<Metadata> {
  const { section } = await params;

  if (!SECTION_SET.has(section as AdminSectionId)) {
    return { title: "Admin | NaijaTalk" };
  }

  const sectionId = section as AdminSectionId;
  return { title: `${ADMIN_SECTION_LABELS[sectionId]} | Admin | NaijaTalk` };
}

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const { section } = await params;

  if (!SECTION_SET.has(section as AdminSectionId)) {
    notFound();
  }

  return <AdminDashboardClient focusSection={section as AdminSectionId} />;
}

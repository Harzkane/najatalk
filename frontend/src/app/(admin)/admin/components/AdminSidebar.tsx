"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NavSection = {
  id: string;
  label: string;
  count: number | null;
  href: string;
};

type AdminSidebarProps = {
  sections: NavSection[];
  enableScrollSpy?: boolean;
  forcedActiveSectionId?: string;
};

export default function AdminSidebar({
  sections,
  enableScrollSpy = true,
  forcedActiveSectionId,
}: AdminSidebarProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id || "");
  const getSectionTone = (sectionId: string) => {
    if (sectionId === "reports" || sectionId === "banned") {
      return {
        active: "border-rose-300 bg-rose-50 text-rose-800",
        inactive:
          "border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800",
        badgeActive: "bg-rose-100 text-rose-800",
      };
    }
    if (sectionId === "payouts" || sectionId === "premium" || sectionId === "rollups") {
      return {
        active: "border-amber-300 bg-amber-50 text-amber-900",
        inactive:
          "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900",
        badgeActive: "bg-amber-100 text-amber-900",
      };
    }
    return {
      active: "border-emerald-300 bg-emerald-50 text-emerald-800",
      inactive:
        "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800",
      badgeActive: "bg-emerald-100 text-emerald-800",
    };
  };

  useEffect(() => {
    if (!sections.length) return;

    if (!enableScrollSpy) {
      setActiveSectionId(forcedActiveSectionId || sections[0].id);
      return;
    }

    const syncFromHash = () => {
      const hashId = window.location.hash.replace("#", "");
      if (hashId && sections.some((section) => section.id === hashId)) {
        setActiveSectionId(hashId);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    const observedEls = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5],
        rootMargin: "-80px 0px -65% 0px",
      }
    );

    observedEls.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      observer.disconnect();
    };
  }, [sections, enableScrollSpy, forcedActiveSectionId]);

  return (
    <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-64 lg:shrink-0">
      <nav className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Admin Navigation
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
          {sections.map((section) => {
            const tone = getSectionTone(section.id);
            const isActive = activeSectionId === section.id;
            return (
              <Link
                key={section.id}
                href={section.href}
                onClick={() => setActiveSectionId(section.id)}
                className={`inline-flex min-w-max items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors lg:flex lg:min-w-0 lg:justify-between ${
                  isActive ? tone.active : tone.inactive
                }`}
                aria-current={isActive ? "location" : undefined}
              >
                <span className="truncate">{section.label}</span>
                {typeof section.count === "number" ? (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                      isActive ? tone.badgeActive : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {section.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

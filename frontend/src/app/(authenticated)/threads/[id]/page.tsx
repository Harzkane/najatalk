"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ThreadDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const threadId = Array.isArray(rawId) ? rawId[0] : rawId;

  useEffect(() => {
    if (!threadId) return;
    router.replace(`/threads?id=${threadId}`);
  }, [threadId, router]);

  return <p className="text-center p-10">Loading gist...</p>;
}

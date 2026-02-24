"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ThreadDetailRedirect() {
  const { id } = useParams();
  const router = useRouter();
  const threadId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (!threadId) return;
    router.replace(`/threads?id=${threadId}`);
  }, [threadId, router]);

  return <p className="text-center p-10">Loading gist...</p>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/marketplace/ListingCard";
import TrustBadge from "@/components/marketplace/TrustBadge";
import RichTextEditor from "@/components/threads/RichTextEditor";

const MARKETPLACE_TABS = ["all", "active", "pending", "sold"];
const PROFILE_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "threads", label: "Threads & Replies" },
  { id: "marketplace", label: "Marketplace" },
];

const getImageSrc = (url = "") => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("/")) return url;
  if (/^https?:\/\//i.test(url)) {
    return `/api/marketplace/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [threads, setThreads] = useState([]);
  const [replies, setReplies] = useState([]);
  const [sellerStats, setSellerStats] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [activeSection, setActiveSection] = useState("overview");
  const [isOwnerProfile, setIsOwnerProfile] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newThreadDraft, setNewThreadDraft] = useState({
    title: "",
    body: "<p></p>",
    category: "General",
  });
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [editingThread, setEditingThread] = useState(null);
  const [isSavingThread, setIsSavingThread] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState(null);

  const { id } = useParams();

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOwnerProfile(localStorage.getItem("userId") === id);
    }
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      setUser(res.data.user);
      setSellerStats(res.data.sellerStats || null);
      setListings(res.data.listings || []);
      setThreads(res.data.threads || []);
      setReplies(res.data.replies || []);
      setMessage("");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Profile load scatter o!");
      setUser(null);
      setListings([]);
      setThreads([]);
      setReplies([]);
      setSellerStats(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    if (activeTab === "all") return listings;
    return listings.filter((listing) => listing.status === activeTab);
  }, [listings, activeTab]);

  const overviewCards = useMemo(
    () => [
      { label: "Threads", value: threads.length },
      { label: "Replies", value: replies.length },
      { label: "Listings", value: sellerStats?.totalListings || 0 },
      { label: "Completed Deals", value: sellerStats?.completedDeals || 0 },
      {
        label: "Avg Response",
        value:
          sellerStats?.avgResponseHours !== null &&
          sellerStats?.avgResponseHours !== undefined
            ? `${sellerStats.avgResponseHours}h`
            : "--",
      },
    ],
    [threads.length, replies.length, sellerStats],
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const time = date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZone: "Africa/Lagos",
      })
      .toLowerCase();
    const month = date.toLocaleString("en-US", { month: "short" });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${time} • ${month} ${day}, ${year}`;
  };

  const getPlainExcerpt = (value = "", maxLength = 140) => {
    const plain = String(value)
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!plain) return "No content.";
    if (plain.length <= maxLength) return plain;
    return `${plain.slice(0, maxLength).trim()}...`;
  };
  const getPlainTextFromRich = (value = "") =>
    String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const openCreateThreadModal = () => {
    setNewThreadDraft({ title: "", body: "<p></p>", category: "General" });
    setIsCreateModalOpen(true);
  };

  const closeCreateThreadModal = () => {
    if (isCreatingThread) return;
    setIsCreateModalOpen(false);
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();
    const title = String(newThreadDraft.title || "").trim();
    const body = String(newThreadDraft.body || "");
    const bodyText = getPlainTextFromRich(body);
    const category = String(newThreadDraft.category || "General").trim() || "General";

    if (title.length < 6) {
      setMessage("Thread title should be at least 6 characters.");
      return;
    }
    if (bodyText.length < 20) {
      setMessage("Thread body should be at least 20 characters.");
      return;
    }

    setIsCreatingThread(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Abeg login first.");
        return;
      }
      const res = await api.post(
        "/threads",
        { title, body, category },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const created = res.data?.thread;
      if (created?._id) {
        setThreads((prev) => [created, ...prev]);
      }
      setMessage(res.data?.message || "Thread posted.");
      setIsCreateModalOpen(false);
      setActiveSection("threads");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Thread create scatter.");
    } finally {
      setIsCreatingThread(false);
    }
  };

  const openThreadEditor = (thread) => {
    setEditingThread({
      _id: thread._id,
      title: thread.title || "",
      body: thread.body || "",
      category: thread.category || "General",
    });
  };

  const closeThreadEditor = () => {
    if (isSavingThread) return;
    setEditingThread(null);
  };

  const handleSaveThread = async (event) => {
    event.preventDefault();
    if (!editingThread?._id) return;

    const title = String(editingThread.title || "").trim();
    const body = String(editingThread.body || "");
    const bodyText = getPlainTextFromRich(body);
    const category = String(editingThread.category || "General").trim() || "General";

    if (title.length < 6) {
      setMessage("Thread title should be at least 6 characters.");
      return;
    }
    if (!bodyText) {
      setMessage("Thread body no fit empty.");
      return;
    }

    setIsSavingThread(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Abeg login first.");
        return;
      }
      const res = await api.put(
        `/threads/${editingThread._id}`,
        { title, body, category },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updated = res.data?.thread;
      if (updated?._id) {
        setThreads((prev) =>
          prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item)),
        );
      }
      setMessage(res.data?.message || "Thread updated.");
      setEditingThread(null);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Thread update scatter.");
    } finally {
      setIsSavingThread(false);
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!threadId || deletingThreadId) return;
    const shouldDelete = window.confirm("Delete this thread and all its replies?");
    if (!shouldDelete) return;

    setDeletingThreadId(threadId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Abeg login first.");
        return;
      }
      const res = await api.delete(`/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setThreads((prev) => prev.filter((item) => item._id !== threadId));
      setReplies((prev) => prev.filter((reply) => reply.thread?._id !== threadId));
      setMessage(res.data?.message || "Thread deleted.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Thread delete scatter.");
    } finally {
      setDeletingThreadId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          {message || "Profile unavailable."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-20 md:p-6">
      <div className="mx-auto mb-4 max-w-7xl">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
                    {(user.displayName || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{user.displayName}</h1>
                  <p className="text-sm text-slate-600">{user.maskedEmail}</p>
                  {user.location && (
                    <p className="text-xs text-slate-500">Location: {user.location}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {user.flair && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                        {user.flair}
                      </span>
                    )}
                    {user.isPremium && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                        Premium
                      </span>
                    )}
                  </div>
                  {user.bio && (
                    <p className="mt-2 max-w-2xl text-sm text-slate-700">{user.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Home
                </Link>
                <Link
                  href="/marketplace"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Marketplace
                </Link>
                {isOwnerProfile && (
                  <Link
                    href={`/users/${id}/wallet`}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    My Wallet
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {PROFILE_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      isActive
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {message && (
          <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {message}
          </p>
        )}

        {activeSection === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {overviewCards.map((card) => (
                <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <TrustBadge sellerStats={sellerStats || {}} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Latest Threads</h2>
                  <button
                    type="button"
                    onClick={() => setActiveSection("threads")}
                    className="text-xs text-blue-700 hover:underline"
                  >
                    View all
                  </button>
                </div>
                {threads.length ? (
                  <div className="space-y-2">
                    {threads.slice(0, 3).map((thread) => (
                      <Link key={thread._id} href={`/threads/${thread._id}`} className="block rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                        <p className="font-medium text-slate-900">{thread.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(thread.createdAt)}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No thread posts yet.</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Latest Replies</h2>
                  <button
                    type="button"
                    onClick={() => setActiveSection("threads")}
                    className="text-xs text-blue-700 hover:underline"
                  >
                    View all
                  </button>
                </div>
                {replies.length ? (
                  <div className="space-y-2">
                    {replies.slice(0, 3).map((reply) => (
                      <div key={reply._id} className="rounded-md border border-slate-200 p-3">
                        <p className="text-sm text-slate-700">{getPlainExcerpt(reply.body, 90)}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(reply.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No replies yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === "threads" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Recent Threads</h2>
                <span className="text-xs text-slate-500">{threads.length}</span>
              </div>
              {isOwnerProfile && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={openCreateThreadModal}
                    className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Create New Thread
                  </button>
                </div>
              )}
              {threads.length ? (
                <div className="space-y-3">
                  {threads.map((thread) => (
                    <div key={thread._id} className="rounded-md border border-slate-200 p-3">
                      <Link
                        href={`/threads/${thread._id}`}
                        className="font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {thread.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{thread.category || "General"}</span>
                        <span>•</span>
                        <span>{formatDate(thread.createdAt)}</span>
                        {thread.isSolved && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
                            Solved
                          </span>
                        )}
                        {thread.isSticky && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700">
                            Pinned
                          </span>
                        )}
                        {thread.isLocked && (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 font-semibold text-slate-700">
                            Locked
                          </span>
                        )}
                      </div>
                      {isOwnerProfile && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openThreadEditor(thread)}
                            className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteThread(thread._id)}
                            disabled={deletingThreadId === thread._id}
                            className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {deletingThreadId === thread._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No thread posts yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Recent Replies</h2>
                <span className="text-xs text-slate-500">{replies.length}</span>
              </div>
              {replies.length ? (
                <div className="space-y-3">
                  {replies.map((reply) => (
                    <div key={reply._id} className="rounded-md border border-slate-200 p-3">
                      <p className="text-sm text-slate-700">{getPlainExcerpt(reply.body)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(reply.createdAt)}</span>
                        {reply.thread?._id && (
                          <>
                            <span>•</span>
                            <Link
                              href={`/threads/${reply.thread._id}`}
                              className="font-medium text-blue-700 hover:underline"
                            >
                              {reply.thread.title || "View thread"}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No replies yet.</p>
              )}
            </div>
          </div>
        )}

        {activeSection === "marketplace" && (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {MARKETPLACE_TABS.map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1);
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      isActive
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    showSeller={false}
                    showActions={false}
                    showSave={false}
                    getImageSrc={getImageSrc}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
                No listings in this tab yet.
              </div>
            )}
          </div>
        )}
      </div>

      {editingThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div
            className="absolute inset-0"
            onClick={closeThreadEditor}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Edit Thread</h3>
              <button
                type="button"
                onClick={closeThreadEditor}
                className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                disabled={isSavingThread}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveThread} className="space-y-3">
              <input
                type="text"
                value={editingThread.title}
                onChange={(event) =>
                  setEditingThread((prev) =>
                    prev ? { ...prev, title: event.target.value } : prev,
                  )
                }
                className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                placeholder="Thread title"
                maxLength={100}
                required
              />
              <RichTextEditor
                value={editingThread.body}
                onChange={(event) =>
                  setEditingThread((prev) =>
                    prev ? { ...prev, body: event } : prev,
                  )
                }
                placeholder="Update your thread content"
                minHeightClassName="min-h-[180px]"
                disabled={isSavingThread}
              />
              <select
                value={editingThread.category}
                onChange={(event) =>
                  setEditingThread((prev) =>
                    prev ? { ...prev, category: event.target.value } : prev,
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="General">General</option>
                <option value="Gist">Gist</option>
                <option value="Politics">Politics</option>
                <option value="Romance">Romance</option>
              </select>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeThreadEditor}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  disabled={isSavingThread}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                  disabled={isSavingThread}
                >
                  {isSavingThread ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div
            className="absolute inset-0"
            onClick={closeCreateThreadModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Create New Thread</h3>
              <button
                type="button"
                onClick={closeCreateThreadModal}
                className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                disabled={isCreatingThread}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreateThread} className="space-y-3">
              <input
                type="text"
                value={newThreadDraft.title}
                onChange={(event) =>
                  setNewThreadDraft((prev) => ({ ...prev, title: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                placeholder="Thread title"
                maxLength={100}
                required
              />
              <RichTextEditor
                value={newThreadDraft.body}
                onChange={(value) => setNewThreadDraft((prev) => ({ ...prev, body: value }))}
                placeholder="Share your gist..."
                minHeightClassName="min-h-[180px]"
                disabled={isCreatingThread}
              />
              <select
                value={newThreadDraft.category}
                onChange={(event) =>
                  setNewThreadDraft((prev) => ({ ...prev, category: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="General">General</option>
                <option value="Gist">Gist</option>
                <option value="Politics">Politics</option>
                <option value="Romance">Romance</option>
              </select>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateThreadModal}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  disabled={isCreatingThread}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                  disabled={isCreatingThread}
                >
                  {isCreatingThread ? "Posting..." : "Post Thread"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

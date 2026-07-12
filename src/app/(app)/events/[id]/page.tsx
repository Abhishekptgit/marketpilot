"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PLATFORMS, POST_STATUSES } from "@/lib/industry-templates";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: number | null;
  status: string;
  customFields: Record<string, string>;
  categoryLabel: string | null;
  categoryColor: string | null;
  postCount: number;
}

interface Post {
  id: string;
  eventId: string;
  title: string;
  caption: string | null;
  platform: string;
  scheduledDate: string;
  scheduledTime: string | null;
  status: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [postForm, setPostForm] = useState({
    title: "",
    caption: "",
    platform: "Instagram",
    scheduledDate: "",
    scheduledTime: "",
    status: "draft",
    imageUrl: "",
  });

  const fetchData = useCallback(async () => {
    const [evRes, postsRes] = await Promise.all([
      fetch(`/api/events/${eventId}`),
      fetch(`/api/posts?eventId=${eventId}`),
    ]);

    if (!evRes.ok) {
      router.push("/dashboard");
      return;
    }

    const evData = await evRes.json();
    const postsData = await postsRes.json();
    setEvent(evData);
    setPosts(Array.isArray(postsData) ? postsData : []);

    // Set calendar to event start month
    if (evData.startDate) {
      setCalendarMonth(new Date(evData.startDate + "T00:00:00"));
    }
    setLoading(false);
  }, [eventId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreatePost = (date?: string) => {
    setEditingPost(null);
    setPostForm({
      title: "",
      caption: "",
      platform: "Instagram",
      scheduledDate: date || event?.startDate || new Date().toISOString().split("T")[0],
      scheduledTime: "10:00",
      status: "draft",
      imageUrl: "",
    });
    setShowPostModal(true);
  };

  const openEditPost = (post: Post) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      caption: post.caption || "",
      platform: post.platform,
      scheduledDate: post.scheduledDate,
      scheduledTime: post.scheduledTime || "",
      status: post.status,
      imageUrl: post.imageUrl || "",
    });
    setShowPostModal(true);
  };

  const handleSavePost = async () => {
    const method = editingPost ? "PUT" : "POST";
    const url = editingPost ? `/api/posts/${editingPost.id}` : "/api/posts";
    const body = editingPost ? postForm : { ...postForm, eventId };

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setShowPostModal(false);
    fetchData();
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleShare = async () => {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const data = await res.json();
    const url = `${window.location.origin}/share/${data.token}`;
    setShareLink(url);
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const handleDrop = async (postId: string, newDate: string) => {
    await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate: newDate }),
    });
    fetchData();
  };

  // Calendar helpers
  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const calendarDays = () => {
    const days: (string | null)[] = [];
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const daysInMonth = getDaysInMonth(calendarMonth);

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push(dateStr);
    }
    return days;
  };

  const getPostsForDate = (dateStr: string) => posts.filter((p) => p.scheduledDate === dateStr);

  const platformIcons: Record<string, string> = {
    Instagram: "📸",
    Facebook: "📘",
    TikTok: "🎵",
    LinkedIn: "💼",
    "Google Ads": "🔍",
  };

  const statusBadge: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    scheduled: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    published: "bg-blue-50 text-blue-700",
  };

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Breadcrumb and header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-accent transition">
          ← Back to Campaigns
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {event.categoryColor && (
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: event.categoryColor }} />
            )}
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {event.categoryLabel || "Campaign"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
          {event.description && <p className="text-sm text-slate-500 mt-1">{event.description}</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleShare}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
          >
            🔗 Share
          </button>
          <button
            onClick={() => openCreatePost()}
            className="bg-accent hover:bg-accent-dark text-white px-5 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Post
          </button>
        </div>
      </div>

      {shareLink && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-emerald-800">✅ Share link ready!</p>
              <p className="text-xs text-emerald-600 mt-0.5 break-all">{shareLink}</p>
            </div>
            <button onClick={() => setShareLink("")} className="text-emerald-600 hover:text-emerald-800 text-lg ml-3 shrink-0">✕</button>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Open Link
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText(shareLink).catch(() => {}); }}
              className="inline-flex items-center gap-2 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              📋 Copy Link
            </button>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-white rounded-lg border border-border p-1 flex">
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === "calendar" ? "bg-accent text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === "list" ? "bg-accent text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            📋 List
          </button>
        </div>
        <span className="text-sm text-slate-400">{posts.length} posts</span>
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Calendar header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600">
              ←
            </button>
            <h2 className="text-base font-semibold text-slate-900">
              {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600">
              →
            </button>
          </div>

          {/* Day names */}
          <div className="calendar-grid border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="bg-slate-50 p-2 text-xs font-semibold text-slate-500 text-center">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="calendar-grid">
            {calendarDays().map((dateStr, i) => (
              <div
                key={i}
                className={`calendar-cell relative ${dateStr ? "cursor-pointer hover:bg-slate-50" : "bg-slate-50/50"}`}
                onClick={() => dateStr && openCreatePost(dateStr)}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-accent/5"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("bg-accent/5"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("bg-accent/5");
                  const postId = e.dataTransfer.getData("postId");
                  if (dateStr && postId) handleDrop(postId, dateStr);
                }}
              >
                {dateStr && (
                  <>
                    <span className={`text-xs font-medium ${
                      dateStr === new Date().toISOString().split("T")[0] ? "text-accent font-bold" : "text-slate-500"
                    }`}>
                      {parseInt(dateStr.split("-")[2])}
                    </span>
                    <div className="mt-1 space-y-1">
                      {getPostsForDate(dateStr).map((post) => (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("postId", post.id);
                            e.stopPropagation();
                          }}
                          onClick={(e) => { e.stopPropagation(); openEditPost(post); }}
                          className="text-xs p-1.5 rounded-md bg-accent/10 hover:bg-accent/20 transition cursor-pointer border border-accent/20 truncate"
                          title={post.title}
                        >
                          <span className="mr-1">{platformIcons[post.platform] || "📝"}</span>
                          <span className="font-medium">{post.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No posts yet</h3>
              <p className="text-sm text-slate-500 mb-6">Add your first post to this campaign.</p>
              <button
                onClick={() => openCreatePost()}
                className="bg-accent hover:bg-accent-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Add Post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="text-2xl shrink-0">{platformIcons[post.platform] || "📝"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{post.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[post.status] || statusBadge.draft}`}>
                      {post.status}
                    </span>
                  </div>
                  {post.caption && (
                    <p className="text-xs text-slate-500 truncate">{post.caption}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>{post.platform}</span>
                    <span>
                      {new Date(post.scheduledDate + "T00:00:00").toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
                      {post.scheduledTime && ` at ${post.scheduledTime.slice(0, 5)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditPost(post)}
                    className="text-xs text-slate-400 hover:text-accent transition px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold">{editingPost ? "Edit Post" : "New Post"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Post Title</label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  placeholder="e.g. Property teaser video"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Caption</label>
                <textarea
                  value={postForm.caption}
                  onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  rows={4}
                  placeholder="Write your post caption here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
                  <select
                    value={postForm.platform}
                    onChange={(e) => setPostForm({ ...postForm, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm bg-white"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{platformIcons[p]} {p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={postForm.status}
                    onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm bg-white"
                  >
                    {POST_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={postForm.scheduledDate}
                    onChange={(e) => setPostForm({ ...postForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={postForm.scheduledTime}
                    onChange={(e) => setPostForm({ ...postForm, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={postForm.imageUrl}
                  onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowPostModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePost}
                className="bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-lg text-sm font-semibold transition"
              >
                {editingPost ? "Save Changes" : "Create Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

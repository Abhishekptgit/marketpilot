"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PLATFORMS, POST_STATUSES } from "@/lib/industry-templates";

interface CalendarPost {
  id: string;
  title: string;
  caption: string | null;
  platform: string;
  scheduledDate: string;
  scheduledTime: string | null;
  status: string;
  imageUrl: string | null;
  eventId: string;
  eventTitle: string;
  eventStatus: string;
  categoryLabel: string | null;
  categoryColor: string | null;
}

interface EventOption {
  id: string;
  title: string;
  categoryLabel: string | null;
  categoryColor: string | null;
}

const platformIcons: Record<string, string> = {
  Instagram: "📸",
  Facebook: "📘",
  TikTok: "🎵",
  LinkedIn: "💼",
  "Google Ads": "🔍",
};

const platformColors: Record<string, string> = {
  Instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  Facebook: "bg-blue-600",
  TikTok: "bg-black",
  LinkedIn: "bg-blue-700",
  "Google Ads": "bg-amber-500",
};

const statusBadge: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  scheduled: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  published: "bg-blue-50 text-blue-700 border-blue-200",
};

const statusDot: Record<string, string> = {
  draft: "bg-slate-400",
  scheduled: "bg-amber-400",
  approved: "bg-emerald-400",
  published: "bg-blue-400",
};

export default function CalendarPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Slide-over panel state
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "edit" | "create">("view");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Edit form
  const [editForm, setEditForm] = useState({
    title: "",
    caption: "",
    platform: "Instagram",
    scheduledDate: "",
    scheduledTime: "",
    status: "draft",
    imageUrl: "",
    eventId: "",
  });

  const getMonthRange = useCallback((d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    from.setDate(from.getDate() - from.getDay());
    to.setDate(to.getDate() + (6 - to.getDay()));
    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  }, []);

  const getWeekRange = useCallback((d: Date) => {
    const start = new Date(d);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      from: start.toISOString().split("T")[0],
      to: end.toISOString().split("T")[0],
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const range = viewMode === "month" ? getMonthRange(currentDate) : getWeekRange(currentDate);
    const [postsRes, eventsRes] = await Promise.all([
      fetch(`/api/calendar?from=${range.from}&to=${range.to}`),
      fetch("/api/events"),
    ]);
    const postsData = await postsRes.json();
    const eventsData = await eventsRes.json();
    setPosts(Array.isArray(postsData) ? postsData : []);
    setEvents(Array.isArray(eventsData) ? eventsData : []);
    setLoading(false);
  }, [currentDate, viewMode, getMonthRange, getWeekRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Open create panel for a specific date ──
  const openCreateForDate = (dateStr: string) => {
    setSelectedPost(null);
    setPanelMode("create");
    setEditForm({
      title: "",
      caption: "",
      platform: "Instagram",
      scheduledDate: dateStr,
      scheduledTime: "10:00",
      status: "draft",
      imageUrl: "",
      eventId: events[0]?.id || "",
    });
  };

  // ── Open view panel ──
  const openViewPanel = (post: CalendarPost) => {
    setSelectedPost(post);
    setPanelMode("view");
  };

  // ── Switch to edit mode ──
  const switchToEdit = (post: CalendarPost) => {
    setSelectedPost(post);
    setPanelMode("edit");
    setEditForm({
      title: post.title,
      caption: post.caption || "",
      platform: post.platform,
      scheduledDate: post.scheduledDate,
      scheduledTime: post.scheduledTime || "",
      status: post.status,
      imageUrl: post.imageUrl || "",
      eventId: post.eventId,
    });
  };

  // ── Save (create or update) ──
  const handleSave = async () => {
    setSaving(true);
    if (panelMode === "create") {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setSuccessMsg("Post created!");
    } else if (panelMode === "edit" && selectedPost) {
      await fetch(`/api/posts/${selectedPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setSuccessMsg("Post updated!");
    }
    setSaving(false);
    closePanel();
    fetchData();
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // ── Delete post ──
  const handleDelete = async () => {
    if (!selectedPost) return;
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts/${selectedPost.id}`, { method: "DELETE" });
    closePanel();
    fetchData();
    setSuccessMsg("Post deleted");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // ── Quick status update ──
  const handleQuickStatus = async (postId: string, newStatus: string) => {
    await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
    setSuccessMsg(`Status → ${newStatus}`);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  // ── Drag-and-drop to reschedule ──
  const handleDrop = async (postId: string, newDate: string) => {
    await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate: newDate }),
    });
    fetchData();
    setSuccessMsg("Post rescheduled!");
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const closePanel = () => {
    setSelectedPost(null);
    setPanelMode("view");
  };

  const filteredPosts = posts.filter((p) => {
    if (filterPlatform !== "all" && p.platform !== filterPlatform) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const getPostsForDate = (dateStr: string) =>
    filteredPosts.filter((p) => p.scheduledDate === dateStr);

  // Calendar grid generation
  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const calendarDays = () => {
    const days: { date: string; inMonth: boolean }[] = [];
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevMo = new Date(year, month, 0);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMo.getDate() - i;
      const dateStr = `${prevMo.getFullYear()}-${String(prevMo.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: dateStr, inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ date: dateStr, inMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMo = new Date(year, month + 1, i);
      const dateStr = `${nextMo.getFullYear()}-${String(nextMo.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ date: dateStr, inMonth: false });
    }
    return days;
  };

  const weekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  };

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());
  const todayStr = new Date().toISOString().split("T")[0];

  // Stats
  const totalPosts = filteredPosts.length;
  const draftCount = filteredPosts.filter((p) => p.status === "draft").length;
  const scheduledCount = filteredPosts.filter((p) => p.status === "scheduled").length;
  const approvedCount = filteredPosts.filter((p) => p.status === "approved").length;

  const platformCounts: Record<string, number> = {};
  filteredPosts.forEach((p) => {
    platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
  });

  const isPanelOpen = selectedPost !== null || panelMode === "create";

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">30-Day Content Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">View, create & edit posts across all campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-slate-50 transition"
          >
            ← Campaigns
          </Link>
          <button
            onClick={() => openCreateForDate(todayStr)}
            className="bg-accent hover:bg-accent-dark text-white px-5 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </button>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-[60] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top">
          ✅ {successMsg}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Posts</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalPosts}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Drafts</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{draftCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Scheduled</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{scheduledCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Approved</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{approvedCount}</p>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-slate-50 transition text-slate-600 font-medium">←</button>
          <h2 className="text-base font-semibold text-slate-900 min-w-[180px] text-center">
            {viewMode === "month"
              ? currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : (() => {
                  const s = new Date(currentDate);
                  s.setDate(s.getDate() - s.getDay());
                  const e = new Date(s);
                  e.setDate(e.getDate() + 6);
                  return `${s.toLocaleDateString("en-AE", { month: "short", day: "numeric" })} — ${e.toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })}`;
                })()}
          </h2>
          <button onClick={() => navigate(1)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-slate-50 transition text-slate-600 font-medium">→</button>
          <button onClick={goToToday} className="ml-2 px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-dark transition">Today</button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium bg-white outline-none focus:border-accent">
            <option value="all">All Platforms</option>
            {PLATFORMS.map((p) => (<option key={p} value={p}>{platformIcons[p]} {p}</option>))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium bg-white outline-none focus:border-accent">
            <option value="all">All Statuses</option>
            {POST_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <div className="bg-white rounded-lg border border-border p-0.5 flex">
            <button onClick={() => setViewMode("month")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === "month" ? "bg-accent text-white" : "text-slate-600 hover:text-slate-900"}`}>Month</button>
            <button onClick={() => setViewMode("week")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === "week" ? "bg-accent text-white" : "text-slate-600 hover:text-slate-900"}`}>Week</button>
          </div>
        </div>
      </div>

      {/* Platform legend */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">Click a date to add • Click a post to edit • Drag to reschedule</span>
        <span className="text-slate-200">|</span>
        {Object.entries(platformCounts).map(([platform, count]) => (
          <span key={platform} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{platformIcons[platform]}</span>
            <span className="font-medium">{platform}</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{count}</span>
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "month" ? (
        /* ── Month View ── */
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="bg-slate-50 p-2.5 text-xs font-semibold text-slate-500 text-center border-r last:border-r-0 border-border">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays().map((day, i) => {
              const dayPosts = getPostsForDate(day.date);
              const isToday = day.date === todayStr;
              return (
                <div
                  key={i}
                  className={`min-h-[120px] md:min-h-[140px] p-1.5 border-r border-b last:border-r-0 border-border transition cursor-pointer group ${
                    !day.inMonth ? "bg-slate-50/50" : "bg-white hover:bg-slate-50/50"
                  } ${isToday ? "ring-2 ring-inset ring-accent/30" : ""}`}
                  onClick={() => openCreateForDate(day.date)}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-accent/10"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("bg-accent/10"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("bg-accent/10");
                    const postId = e.dataTransfer.getData("postId");
                    if (postId && day.date) handleDrop(postId, day.date);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-accent text-white" : day.inMonth ? "text-slate-700" : "text-slate-300"
                    }`}>
                      {parseInt(day.date.split("-")[2])}
                    </span>
                    <span className="text-[10px] font-bold text-accent opacity-0 group-hover:opacity-100 transition">+ Add</span>
                  </div>
                  <div className="space-y-1 overflow-hidden max-h-[100px]">
                    {dayPosts.slice(0, 3).map((post) => (
                      <button
                        key={post.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData("postId", post.id); e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); openViewPanel(post); }}
                        className="w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded-md transition cursor-pointer truncate flex items-center gap-1 hover:shadow-sm"
                        style={{
                          backgroundColor: (post.categoryColor || "#6366f1") + "18",
                          borderLeft: `3px solid ${post.categoryColor || "#6366f1"}`,
                        }}
                      >
                        <span className="shrink-0">{platformIcons[post.platform]}</span>
                        <span className="font-medium truncate">{post.title}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ml-auto shrink-0 ${statusDot[post.status] || "bg-slate-400"}`} />
                      </button>
                    ))}
                    {dayPosts.length > 3 && (
                      <p className="text-[10px] text-slate-400 font-medium pl-1">+{dayPosts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Week View ── */
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays().map((dateStr) => {
              const dayPosts = getPostsForDate(dateStr);
              const isToday = dateStr === todayStr;
              const dayDate = new Date(dateStr + "T00:00:00");
              return (
                <div
                  key={dateStr}
                  className={`min-h-[400px] border-r last:border-r-0 border-border ${isToday ? "bg-accent/5" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-accent/10"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("bg-accent/10"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("bg-accent/10");
                    const postId = e.dataTransfer.getData("postId");
                    if (postId) handleDrop(postId, dateStr);
                  }}
                >
                  <div
                    className={`p-3 border-b border-border text-center cursor-pointer hover:bg-accent/10 transition ${isToday ? "bg-accent/10" : "bg-slate-50"}`}
                    onClick={() => openCreateForDate(dateStr)}
                  >
                    <p className="text-xs text-slate-500 font-medium">{dayDate.toLocaleDateString("en-US", { weekday: "short" })}</p>
                    <p className={`text-lg font-bold ${isToday ? "text-accent" : "text-slate-900"}`}>{dayDate.getDate()}</p>
                    <p className="text-[10px] text-accent font-medium mt-0.5 opacity-0 hover:opacity-100">+ Add Post</p>
                  </div>
                  <div className="p-2 space-y-2">
                    {dayPosts.map((post) => (
                      <button
                        key={post.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData("postId", post.id); e.stopPropagation(); }}
                        onClick={() => openViewPanel(post)}
                        className="w-full text-left p-2 rounded-lg border transition hover:shadow-md cursor-pointer"
                        style={{
                          borderColor: (post.categoryColor || "#6366f1") + "60",
                          backgroundColor: (post.categoryColor || "#6366f1") + "08",
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{platformIcons[post.platform]}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[post.status] || "bg-slate-400"}`} />
                        </div>
                        <p className="text-xs font-semibold text-slate-900 truncate">{post.title}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{post.eventTitle}</p>
                        {post.scheduledTime && (
                          <p className="text-[10px] text-slate-400 mt-1">🕐 {post.scheduledTime.slice(0, 5)}</p>
                        )}
                      </button>
                    ))}
                    {dayPosts.length === 0 && (
                      <button onClick={() => openCreateForDate(dateStr)} className="w-full text-center text-[11px] text-slate-300 mt-8 hover:text-accent transition">
                        + Add post
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Side Panel (View / Edit / Create) ── */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closePanel} />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">
                {panelMode === "create" ? "✨ New Post" : panelMode === "edit" ? "✏️ Edit Post" : "Post Details"}
              </h3>
              <button onClick={closePanel} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition text-slate-500 text-lg">✕</button>
            </div>

            {/* ── VIEW MODE ── */}
            {panelMode === "view" && selectedPost && (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Platform + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm ${platformColors[selectedPost.platform] || "bg-slate-600"}`}>
                        {platformIcons[selectedPost.platform]}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{selectedPost.platform}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusBadge[selectedPost.status] || statusBadge.draft}`}>
                      {selectedPost.status}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Title</p>
                    <p className="text-base font-semibold text-slate-900">{selectedPost.title}</p>
                  </div>

                  {/* Campaign */}
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Campaign</p>
                    <Link href={`/events/${selectedPost.eventId}`} className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition">
                      {selectedPost.categoryColor && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedPost.categoryColor }} />}
                      {selectedPost.eventTitle} <span className="text-slate-400">→</span>
                    </Link>
                    {selectedPost.categoryLabel && <p className="text-xs text-slate-500 mt-0.5">{selectedPost.categoryLabel}</p>}
                  </div>

                  {/* Date + Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Date</p>
                      <p className="text-sm text-slate-700 font-medium">
                        {new Date(selectedPost.scheduledDate + "T00:00:00").toLocaleDateString("en-AE", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {selectedPost.scheduledTime && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Time</p>
                        <p className="text-sm text-slate-700 font-medium">{selectedPost.scheduledTime.slice(0, 5)}</p>
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  {selectedPost.caption && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Caption</p>
                      <div className="bg-slate-50 rounded-lg p-3 border border-border">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedPost.caption}</p>
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  {selectedPost.imageUrl && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Media</p>
                      <img src={selectedPost.imageUrl} alt={selectedPost.title} className="rounded-xl border border-border max-h-48 object-cover w-full" />
                    </div>
                  )}

                  {/* Quick Status Change */}
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Quick Status</p>
                    <div className="flex flex-wrap gap-2">
                      {POST_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleQuickStatus(selectedPost.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                            selectedPost.status === s
                              ? "bg-accent text-white border-accent"
                              : "bg-white text-slate-600 border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-border space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => switchToEdit(selectedPost)}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      ✏️ Edit Post
                    </button>
                    <Link
                      href={`/events/${selectedPost.eventId}`}
                      className="flex items-center justify-center gap-2 border border-border text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                      Campaign →
                    </Link>
                  </div>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 border border-red-200 px-5 py-2 rounded-xl text-sm font-medium transition"
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              </>
            )}

            {/* ── EDIT / CREATE MODE ── */}
            {(panelMode === "edit" || panelMode === "create") && (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Campaign picker (for create) */}
                  {panelMode === "create" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Campaign *</label>
                      <select
                        value={editForm.eventId}
                        onChange={(e) => setEditForm({ ...editForm, eventId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm bg-white"
                      >
                        <option value="">Select a campaign...</option>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                      </select>
                      {events.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">⚠️ Create a campaign first from the Dashboard</p>
                      )}
                    </div>
                  )}

                  {panelMode === "edit" && selectedPost && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-border">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Campaign</p>
                      <p className="text-sm font-medium text-slate-700">{selectedPost.eventTitle}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Post Title *</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                      placeholder="e.g. Property teaser video"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Caption</label>
                    <textarea
                      value={editForm.caption}
                      onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                      rows={4}
                      placeholder="Write your post caption here..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
                      <select
                        value={editForm.platform}
                        onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm bg-white"
                      >
                        {PLATFORMS.map((p) => (<option key={p} value={p}>{platformIcons[p]} {p}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm bg-white"
                      >
                        {POST_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={editForm.scheduledDate}
                        onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                      <input
                        type="time"
                        value={editForm.scheduledTime}
                        onChange={(e) => setEditForm({ ...editForm, scheduledTime: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-border space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || !editForm.title || (panelMode === "create" && !editForm.eventId)}
                      className="flex-1 bg-accent hover:bg-accent-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? "Saving..." : panelMode === "create" ? "✨ Create Post" : "💾 Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        if (panelMode === "edit" && selectedPost) {
                          setPanelMode("view");
                        } else {
                          closePanel();
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 border border-border transition"
                    >
                      Cancel
                    </button>
                  </div>
                  {panelMode === "edit" && (
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 border border-red-200 px-5 py-2 rounded-xl text-sm font-medium transition"
                    >
                      🗑️ Delete Post
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

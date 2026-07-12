"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface SharedEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  categoryLabel: string | null;
  categoryColor: string | null;
  companyName: string;
  companyLogo: string | null;
}

interface Post {
  id: string;
  title: string;
  caption: string | null;
  platform: string;
  scheduledDate: string;
  scheduledTime: string | null;
  status: string;
  imageUrl: string | null;
}

interface Comment {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  isApproval: boolean;
  createdAt: string;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [event, setEvent] = useState<SharedEvent | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentForm, setCommentForm] = useState({ authorName: "", content: "" });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/share/${token}`);
    if (!res.ok) {
      setError("This share link is invalid or has expired.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setEvent(data.event);
    setPosts(data.posts || []);
    setComments(data.comments || []);
    if (data.event?.startDate) {
      setCalendarMonth(new Date(data.event.startDate + "T00:00:00"));
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleComment = async (postId: string, isApproval: boolean) => {
    const content = isApproval
      ? (commentForm.content || "Approved ✅")
      : commentForm.content;

    if (!content.trim()) return;

    await fetch(`/api/share/${token}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        authorName: commentForm.authorName || "Client",
        content,
        isApproval,
      }),
    });

    setCommentForm({ authorName: commentForm.authorName, content: "" });
    fetchData();
  };

  const getPostsForDate = (dateStr: string) => posts.filter((p) => p.scheduledDate === dateStr);
  const getCommentsForPost = (postId: string) => comments.filter((c) => c.postId === postId);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-2">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-2 px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link Not Found</h1>
          <p className="text-sm text-slate-500">{error || "This share link doesn't exist."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
              {event.companyName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{event.companyName}</p>
              <p className="text-xs text-slate-500">Content Review</p>
            </div>
          </div>
          {event.categoryLabel && (
            <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: event.categoryColor || "#6366f1" }} />
              {event.categoryLabel}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Event info */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{event.title}</h1>
          {event.description && <p className="text-sm text-slate-500">{event.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>
              {new Date(event.startDate + "T00:00:00").toLocaleDateString("en-AE", { month: "long", day: "numeric" })} —{" "}
              {new Date(event.endDate + "T00:00:00").toLocaleDateString("en-AE", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span>{posts.length} posts</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-8">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              ←
            </button>
            <h2 className="text-base font-semibold">
              {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              →
            </button>
          </div>

          <div className="calendar-grid border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="bg-slate-50 p-2 text-xs font-semibold text-slate-500 text-center">{d}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays().map((dateStr, i) => (
              <div key={i} className={`calendar-cell ${!dateStr ? "bg-slate-50/50" : ""}`}>
                {dateStr && (
                  <>
                    <span className="text-xs font-medium text-slate-500">
                      {parseInt(dateStr.split("-")[2])}
                    </span>
                    <div className="mt-1 space-y-1">
                      {getPostsForDate(dateStr).map((post) => (
                        <button
                          key={post.id}
                          onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                          className={`w-full text-left text-xs p-1.5 rounded-md transition cursor-pointer border truncate ${
                            expandedPost === post.id
                              ? "bg-accent/20 border-accent/40"
                              : "bg-accent/10 border-accent/20 hover:bg-accent/15"
                          }`}
                        >
                          <span className="mr-1">{platformIcons[post.platform] || "📝"}</span>
                          <span className="font-medium">{post.title}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Post cards */}
        <h2 className="text-lg font-bold text-slate-900 mb-4">All Posts</h2>
        <div className="space-y-4">
          {posts.map((post) => {
            const postComments = getCommentsForPost(post.id);
            const isExpanded = expandedPost === post.id;
            return (
              <div key={post.id} className="bg-white rounded-xl border border-border overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platformIcons[post.platform] || "📝"}</span>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900">{post.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{post.platform}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(post.scheduledDate + "T00:00:00").toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
                            {post.scheduledTime && ` at ${post.scheduledTime.slice(0, 5)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[post.status] || statusBadge.draft}`}>
                      {post.status}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border">
                    {post.caption && (
                      <div className="px-4 py-3 bg-slate-50">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.caption}</p>
                      </div>
                    )}
                    {post.imageUrl && (
                      <div className="px-4 py-3">
                        <img src={post.imageUrl} alt={post.title} className="rounded-lg max-h-64 object-cover" />
                      </div>
                    )}

                    {/* Comments */}
                    {postComments.length > 0 && (
                      <div className="px-4 py-3 space-y-2 border-t border-border">
                        {postComments.map((c) => (
                          <div key={c.id} className={`text-sm p-2 rounded-lg ${c.isApproval ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50"}`}>
                            <span className="font-medium text-slate-700">{c.authorName}:</span>{" "}
                            <span className="text-slate-600">{c.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment/approve form */}
                    <div className="px-4 py-3 border-t border-border bg-slate-50">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={commentForm.authorName}
                          onChange={(e) => setCommentForm({ ...commentForm, authorName: e.target.value })}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-32 outline-none focus:border-accent"
                          placeholder="Your name"
                        />
                        <input
                          type="text"
                          value={commentForm.content}
                          onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-accent"
                          placeholder="Add a comment..."
                          onKeyDown={(e) => e.key === "Enter" && handleComment(post.id, false)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleComment(post.id, false)}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-200 rounded-lg transition bg-white"
                        >
                          💬 Comment
                        </button>
                        <button
                          onClick={() => handleComment(post.id, true)}
                          className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition"
                        >
                          ✅ Approve
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-400">
          <p>Powered by <span className="font-semibold text-accent">MarketPilot</span></p>
        </div>
      </main>
    </div>
  );
}

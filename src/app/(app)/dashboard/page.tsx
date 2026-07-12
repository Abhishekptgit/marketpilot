"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: number | null;
  status: string;
  customFields: Record<string, string>;
  categoryId: string | null;
  categoryLabel: string | null;
  categoryColor: string | null;
  postCount: number;
}

interface Category {
  id: string;
  label: string;
  color: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [shareLinkMap, setShareLinkMap] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    budget: "",
    status: "draft",
    categoryId: "",
    customFields: {} as Record<string, string>,
  });

  const fetchData = useCallback(async () => {
    const [evRes, catRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/categories"),
    ]);
    const evData = await evRes.json();
    const catData = await catRes.json();
    setEvents(Array.isArray(evData) ? evData : []);
    setCategories(Array.isArray(catData) ? catData : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingEvent(null);
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    setForm({
      title: "",
      description: "",
      startDate: today,
      endDate: nextWeek,
      budget: "",
      status: "draft",
      categoryId: categories[0]?.id || "",
      customFields: {},
    });
    setShowModal(true);
  };

  const openEdit = (ev: EventItem) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description || "",
      startDate: ev.startDate,
      endDate: ev.endDate,
      budget: ev.budget?.toString() || "",
      status: ev.status,
      categoryId: ev.categoryId || "",
      customFields: (ev.customFields as Record<string, string>) || {},
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const method = editingEvent ? "PUT" : "POST";
    const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event and all its posts?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleGetShareLink = async (eventId: string) => {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const data = await res.json();
    const url = `${window.location.origin}/share/${data.token}`;
    setShareLinkMap((prev) => ({ ...prev, [eventId]: url }));
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    active: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    cancelled: "bg-red-50 text-red-600",
  };

  const formatDate = (d: string) => {
    return new Date(d + "T00:00:00").toLocaleDateString("en-AE", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Plan and manage your events and ad campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/calendar"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-slate-50 transition flex items-center gap-2"
          >
            📅 30-Day Calendar
          </Link>
          <button
            onClick={openCreate}
            className="bg-accent hover:bg-accent-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Campaigns", value: events.length, icon: "📋" },
          { label: "Active", value: events.filter(e => e.status === "active").length, icon: "🟢" },
          { label: "Total Posts", value: events.reduce((s, e) => s + e.postCount, 0), icon: "📝" },
          { label: "Draft", value: events.filter(e => e.status === "draft").length, icon: "📄" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Events grid */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No campaigns yet</h3>
          <p className="text-sm text-slate-500 mb-6">Create your first campaign to start planning posts and ads.</p>
          <button
            onClick={openCreate}
            className="bg-accent hover:bg-accent-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-xl border border-border hover:shadow-lg transition-shadow group">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {ev.categoryColor && (
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: ev.categoryColor }}
                      />
                    )}
                    <span className="text-xs font-medium text-slate-500">
                      {ev.categoryLabel || "Uncategorized"}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ev.status] || statusColors.draft}`}>
                    {ev.status}
                  </span>
                </div>

                <Link href={`/events/${ev.id}`} className="block">
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-accent transition">{ev.title}</h3>
                  {ev.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{ev.description}</p>
                  )}
                </Link>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{formatDate(ev.startDate)} — {formatDate(ev.endDate)}</span>
                  <span className="flex items-center gap-1">
                    📝 {ev.postCount} posts
                  </span>
                </div>
                {ev.budget && (
                  <p className="text-xs text-slate-400 mt-1">💰 AED {ev.budget.toLocaleString()}</p>
                )}
              </div>

              {/* Share link row */}
              {shareLinkMap[ev.id] && (
                <div className="border-t border-border px-5 py-2.5 bg-emerald-50">
                  <p className="text-[11px] text-emerald-600 truncate mb-2">{shareLinkMap[ev.id]}</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={shareLinkMap[ev.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Open Link
                    </a>
                    <button
                      onClick={() => { navigator.clipboard.writeText(shareLinkMap[ev.id]).catch(() => {}); }}
                      className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => setShareLinkMap((prev) => { const n = { ...prev }; delete n[ev.id]; return n; })}
                      className="text-emerald-500 hover:text-emerald-700 text-xs ml-auto"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-border px-5 py-3 flex items-center justify-between">
                <Link
                  href={`/events/${ev.id}`}
                  className="text-xs font-medium text-accent hover:text-accent-dark transition"
                >
                  View Posts →
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGetShareLink(ev.id)}
                    className="text-xs text-slate-400 hover:text-emerald-600 transition"
                  >
                    🔗 Share
                  </button>
                  <button
                    onClick={() => openEdit(ev)}
                    className="text-xs text-slate-400 hover:text-slate-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold">{editingEvent ? "Edit Campaign" : "New Campaign"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  placeholder="e.g. Marina Heights Launch Campaign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  rows={3}
                  placeholder="Brief description of this campaign..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm bg-white"
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Budget (AED)</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  placeholder="5000"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-lg text-sm font-semibold transition"
              >
                {editingEvent ? "Save Changes" : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

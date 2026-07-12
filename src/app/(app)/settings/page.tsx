"use client";

import { useEffect, useState, useCallback } from "react";
import { INDUSTRY_LIST } from "@/lib/industry-templates";

interface Category {
  id: string;
  label: string;
  color: string;
  sortOrder: number;
}

interface Company {
  id: string;
  name: string;
  logo: string | null;
  industry: string;
}

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companyForm, setCompanyForm] = useState({ name: "", industry: "", logo: "" });
  const [newCat, setNewCat] = useState({ label: "", color: "#6366f1" });
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    const [compRes, catRes] = await Promise.all([
      fetch("/api/company"),
      fetch("/api/categories"),
    ]);
    const compData = await compRes.json();
    const catData = await catRes.json();
    setCompany(compData);
    setCompanyForm({ name: compData.name, industry: compData.industry, logo: compData.logo || "" });
    setCategories(Array.isArray(catData) ? catData : []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveCompany = async () => {
    await fetch("/api/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(companyForm),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchData();
  };

  const addCategory = async () => {
    if (!newCat.label.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });
    setNewCat({ label: "", color: "#6366f1" });
    fetchData();
  };

  const updateCategory = async (cat: Category) => {
    await fetch(`/api/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: cat.label, color: cat.color }),
    });
    setEditingCat(null);
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Events using it will become uncategorized.")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchData();
  };

  const PRESET_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
    "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
    "#ec4899", "#f43f5e",
  ];

  if (!company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
      <p className="text-sm text-slate-500 mb-8">Manage your workspace, categories, and preferences</p>

      {/* Company Settings */}
      <section className="bg-white rounded-2xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Company</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
            <select
              value={companyForm.industry}
              onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
              className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm bg-white"
            >
              {INDUSTRY_LIST.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
            <input
              type="url"
              value={companyForm.logo}
              onChange={(e) => setCompanyForm({ ...companyForm, logo: e.target.value })}
              className="w-full max-w-md px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveCompany}
              className="bg-accent hover:bg-accent-dark text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
            >
              Save Changes
            </button>
            {saved && <span className="text-sm text-emerald-600 font-medium">✓ Saved</span>}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Categories</h2>
        <p className="text-sm text-slate-500 mb-4">Customize the categories used to organize your campaigns.</p>

        {/* Add new */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            value={newCat.label}
            onChange={(e) => setNewCat({ ...newCat, label: e.target.value })}
            className="flex-1 max-w-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
            placeholder="New category name"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewCat({ ...newCat, color: c })}
                className={`w-5 h-5 rounded-full border-2 transition ${newCat.color === c ? "border-slate-900 scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={addCategory}
            className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 group">
              {editingCat?.id === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editingCat.label}
                    onChange={(e) => setEditingCat({ ...editingCat, label: e.target.value })}
                    className="flex-1 max-w-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  />
                  <div className="flex items-center gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditingCat({ ...editingCat, color: c })}
                        className={`w-4 h-4 rounded-full border-2 transition ${editingCat.color === c ? "border-slate-900 scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => updateCategory(editingCat)}
                    className="text-xs font-medium text-accent hover:text-accent-dark transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCat(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-sm font-medium text-slate-700">{cat.label}</span>
                  <button
                    onClick={() => setEditingCat({ ...cat })}
                    className="text-xs text-slate-400 hover:text-accent transition opacity-0 group-hover:opacity-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export interface IndustryTemplate {
  label: string;
  categories: { label: string; color: string }[];
  customFieldKeys: string[];
}

export const INDUSTRIES: Record<string, IndustryTemplate> = {
  "Real Estate": {
    label: "Real Estate",
    categories: [
      { label: "Property Launch", color: "#f59e0b" },
      { label: "Open House", color: "#10b981" },
      { label: "Price Drop", color: "#ef4444" },
      { label: "Sold Announcement", color: "#8b5cf6" },
    ],
    customFieldKeys: ["Project/Unit"],
  },
  "F&B / Retail": {
    label: "F&B / Retail",
    categories: [
      { label: "Menu Promo", color: "#f97316" },
      { label: "New Branch", color: "#06b6d4" },
      { label: "Seasonal Offer", color: "#ec4899" },
      { label: "Flash Sale", color: "#ef4444" },
    ],
    customFieldKeys: ["Branch/Location"],
  },
  "Aesthetics / Clinic": {
    label: "Aesthetics / Clinic",
    categories: [
      { label: "Clinic Offer", color: "#ec4899" },
      { label: "New Treatment", color: "#8b5cf6" },
      { label: "Before/After Feature", color: "#14b8a6" },
    ],
    customFieldKeys: ["Treatment Type"],
  },
  "Construction / B2B": {
    label: "Construction / B2B",
    categories: [
      { label: "Tender Update", color: "#f59e0b" },
      { label: "Project Milestone", color: "#3b82f6" },
      { label: "Site Launch", color: "#10b981" },
    ],
    customFieldKeys: ["Project Reference"],
  },
  "SaaS / Tech": {
    label: "SaaS / Tech",
    categories: [
      { label: "Feature Launch", color: "#6366f1" },
      { label: "Webinar", color: "#06b6d4" },
      { label: "Case Study", color: "#84cc16" },
    ],
    customFieldKeys: ["Product/Module"],
  },
  Other: {
    label: "Other",
    categories: [
      { label: "Announcement", color: "#6366f1" },
      { label: "Promotion", color: "#f59e0b" },
      { label: "Event", color: "#10b981" },
    ],
    customFieldKeys: [],
  },
};

export const INDUSTRY_LIST = Object.keys(INDUSTRIES);

export const PLATFORMS = [
  "Instagram",
  "Facebook",
  "TikTok",
  "LinkedIn",
  "Google Ads",
] as const;

export const POST_STATUSES = [
  "draft",
  "scheduled",
  "approved",
  "published",
] as const;

export const EVENT_STATUSES = [
  "draft",
  "active",
  "completed",
  "cancelled",
] as const;

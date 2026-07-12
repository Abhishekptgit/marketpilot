import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { companies, users, categories, events, posts, shareLinks } from "./schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set. Pass it as env variable or create a .env file.");
    process.exit(1);
  }
  const isSSL = dbUrl.includes("neon.tech") || dbUrl.includes("supabase") || dbUrl.includes("sslmode=require");
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isSSL ? { rejectUnauthorized: false } : false,
  });
  const db = drizzle(pool);

  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("demo123", 10);

  // ── 1. Real Estate Company ──
  const [reComp] = await db.insert(companies).values({
    name: "Gulf Horizon Properties",
    industry: "Real Estate",
  }).returning();

  await db.insert(users).values({
    email: "demo-realestate@marketpilot.ae",
    passwordHash,
    name: "Ahmed Al Rashid",
    companyId: reComp.id,
    role: "owner",
  });

  const [reCat1] = await db.insert(categories).values([
    { companyId: reComp.id, label: "Property Launch", color: "#f59e0b", sortOrder: 0 },
    { companyId: reComp.id, label: "Open House", color: "#10b981", sortOrder: 1 },
    { companyId: reComp.id, label: "Price Drop", color: "#ef4444", sortOrder: 2 },
    { companyId: reComp.id, label: "Sold Announcement", color: "#8b5cf6", sortOrder: 3 },
  ]).returning();

  const reEvent1Start = getDateStr(7);
  const reEvent1End = getDateStr(28);
  const [reEv1] = await db.insert(events).values({
    companyId: reComp.id,
    categoryId: reCat1.id,
    title: "Marina Heights Phase 2 Launch",
    description: "Full digital campaign for the Phase 2 launch of Marina Heights towers in Dubai Marina. Target: high-net-worth investors and end-users.",
    startDate: reEvent1Start,
    endDate: reEvent1End,
    budget: 25000,
    status: "active",
    customFields: { "Project/Unit": "Marina Heights Tower B" },
  }).returning();

  await db.insert(posts).values([
    { eventId: reEv1.id, title: "Teaser Reel – Coming Soon", caption: "Something extraordinary is rising in Dubai Marina. Stay tuned. 🏗️✨\n\n#DubaiRealEstate #MarketingHeights #ComingSoon", platform: "Instagram", scheduledDate: getDateStr(7), scheduledTime: "10:00", status: "scheduled" },
    { eventId: reEv1.id, title: "Floor Plan Carousel", caption: "Explore the spacious layouts of Marina Heights Phase 2. From studios to 3BR penthouses.\n\nDM for pricing.\n\n#DubaiProperty #LuxuryLiving", platform: "Instagram", scheduledDate: getDateStr(10), scheduledTime: "14:00", status: "draft" },
    { eventId: reEv1.id, title: "LinkedIn Announcement", caption: "Gulf Horizon Properties is proud to announce the launch of Marina Heights Phase 2. Premium waterfront living in the heart of Dubai Marina.", platform: "LinkedIn", scheduledDate: getDateStr(8), scheduledTime: "09:00", status: "scheduled" },
    { eventId: reEv1.id, title: "Google Ads – Search Campaign", caption: "Dubai Marina apartments for sale | Starting AED 1.2M | Premium waterfront living", platform: "Google Ads", scheduledDate: getDateStr(7), status: "draft" },
    { eventId: reEv1.id, title: "Facebook Open House Event", caption: "Join us for an exclusive viewing of Marina Heights Phase 2 show apartments. Register now for priority access.", platform: "Facebook", scheduledDate: getDateStr(14), scheduledTime: "11:00", status: "draft" },
    { eventId: reEv1.id, title: "TikTok Walkthrough", caption: "POV: You just walked into your dream apartment in Dubai Marina 🌊\n\n#DubaiApartment #LuxuryTour", platform: "TikTok", scheduledDate: getDateStr(12), scheduledTime: "18:00", status: "draft" },
  ]);

  // Share link for RE event
  await db.insert(shareLinks).values({
    companyId: reComp.id,
    eventId: reEv1.id,
    token: "demo-realestate-share",
  });

  // ── 2. Aesthetics/Clinic Company ──
  const [clComp] = await db.insert(companies).values({
    name: "Radiance Aesthetics",
    industry: "Aesthetics / Clinic",
  }).returning();

  await db.insert(users).values({
    email: "demo-clinic@marketpilot.ae",
    passwordHash,
    name: "Dr. Sara Khan",
    companyId: clComp.id,
    role: "owner",
  });

  const [clCat1] = await db.insert(categories).values([
    { companyId: clComp.id, label: "Clinic Offer", color: "#ec4899", sortOrder: 0 },
    { companyId: clComp.id, label: "New Treatment", color: "#8b5cf6", sortOrder: 1 },
    { companyId: clComp.id, label: "Before/After Feature", color: "#14b8a6", sortOrder: 2 },
  ]).returning();

  const [clEv1] = await db.insert(events).values({
    companyId: clComp.id,
    categoryId: clCat1.id,
    title: "Summer Glow Package Launch",
    description: "Promote our exclusive summer glow facial + body contouring bundle across social channels.",
    startDate: getDateStr(3),
    endDate: getDateStr(21),
    budget: 8000,
    status: "active",
    customFields: { "Treatment Type": "Facial + Body Contouring" },
  }).returning();

  await db.insert(posts).values([
    { eventId: clEv1.id, title: "Before/After Carousel", caption: "Real results from our Summer Glow Package ✨\n\nSwipe to see the transformation.\n\n📍 Radiance Aesthetics, JBR\n#DubaiClinic #GlowUp", platform: "Instagram", scheduledDate: getDateStr(5), scheduledTime: "12:00", status: "scheduled" },
    { eventId: clEv1.id, title: "Treatment Explainer Reel", caption: "Here's what you can expect from our 90-minute Summer Glow treatment. Zero downtime, maximum glow.", platform: "Instagram", scheduledDate: getDateStr(8), scheduledTime: "10:00", status: "draft" },
    { eventId: clEv1.id, title: "TikTok ASMR Treatment", caption: "ASMR facial treatment at Radiance Aesthetics 🧖‍♀️✨\n\n#ASMRfacial #DubaiBeauty #ClinicASMR", platform: "TikTok", scheduledDate: getDateStr(10), scheduledTime: "17:00", status: "draft" },
    { eventId: clEv1.id, title: "Facebook Promo Ad", caption: "Summer Glow Package — AED 1,499 (was AED 2,200). Limited time only. Book now!", platform: "Facebook", scheduledDate: getDateStr(3), scheduledTime: "09:00", status: "approved" },
  ]);

  await db.insert(shareLinks).values({
    companyId: clComp.id,
    eventId: clEv1.id,
    token: "demo-clinic-share",
  });

  // ── 3. Construction / B2B Company ──
  const [coComp] = await db.insert(companies).values({
    name: "Al Barsha Construction Group",
    industry: "Construction / B2B",
  }).returning();

  await db.insert(users).values({
    email: "demo-construction@marketpilot.ae",
    passwordHash,
    name: "Khalid Al Nahyan",
    companyId: coComp.id,
    role: "owner",
  });

  const [coCat1, coCat2] = await db.insert(categories).values([
    { companyId: coComp.id, label: "Tender Update", color: "#f59e0b", sortOrder: 0 },
    { companyId: coComp.id, label: "Project Milestone", color: "#3b82f6", sortOrder: 1 },
    { companyId: coComp.id, label: "Site Launch", color: "#10b981", sortOrder: 2 },
  ]).returning();

  const [coEv1] = await db.insert(events).values({
    companyId: coComp.id,
    categoryId: coCat2.id,
    title: "Al Wasl Road Tower – Topping Out",
    description: "Marketing push for the topping out ceremony of our flagship project on Al Wasl Road.",
    startDate: getDateStr(5),
    endDate: getDateStr(20),
    budget: 5000,
    status: "active",
    customFields: { "Project Reference": "AWR-2024-T01" },
  }).returning();

  await db.insert(posts).values([
    { eventId: coEv1.id, title: "Topping Out Video", caption: "Al Barsha Construction reaches a major milestone — Al Wasl Road Tower has topped out! 🏗️\n\nOn time. On budget. On vision.", platform: "LinkedIn", scheduledDate: getDateStr(5), scheduledTime: "08:00", status: "scheduled" },
    { eventId: coEv1.id, title: "Drone Footage Reel", caption: "Aerial view of our Al Wasl Road Tower project. 47 floors of excellence. 🏙️\n\n#DubaiConstruction #AlWaslRoad", platform: "Instagram", scheduledDate: getDateStr(7), scheduledTime: "14:00", status: "draft" },
    { eventId: coEv1.id, title: "Team Photo Post", caption: "Behind every great building is a great team. Proud of the crew who made this milestone possible. 💪", platform: "Facebook", scheduledDate: getDateStr(9), scheduledTime: "10:00", status: "draft" },
  ]);

  await db.insert(shareLinks).values({
    companyId: coComp.id,
    eventId: coEv1.id,
    token: "demo-construction-share",
  });

  console.log("✅ Seeding complete!");
  console.log("\nDemo accounts:");
  console.log("  🏠 demo-realestate@marketpilot.ae / demo123");
  console.log("  💉 demo-clinic@marketpilot.ae / demo123");
  console.log("  🏗️  demo-construction@marketpilot.ae / demo123");
  console.log("\nShare links:");
  console.log("  /share/demo-realestate-share");
  console.log("  /share/demo-clinic-share");
  console.log("  /share/demo-construction-share");

  await pool.end();
}

function getDateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

seed().catch(console.error);

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">M</div>
          <span className="text-white font-bold text-xl tracking-tight">MarketPilot</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition">
            Log in
          </Link>
          <Link href="/signup" className="bg-accent hover:bg-accent-dark text-white px-5 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-accent/25">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 text-sm">Built for Dubai businesses</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Plan your ads &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">
              event campaigns
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            A content calendar built for real estate, F&B, clinics, construction, and tech companies in the UAE. Plan posts, get client approvals, and stay organized.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-xl text-base font-semibold transition shadow-xl shadow-accent/30">
              Start Planning — Free
            </Link>
            <Link href="/login" className="bg-white/10 backdrop-blur hover:bg-white/20 text-white px-8 py-3 rounded-xl text-base font-medium transition border border-white/10">
              Log in to Dashboard
            </Link>
          </div>

          {/* Industry tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-12">
            {["Real Estate", "F&B / Retail", "Aesthetics / Clinic", "Construction / B2B", "SaaS / Tech"].map((ind) => (
              <span key={ind} className="bg-white/5 border border-white/10 text-slate-400 px-3 py-1 rounded-full text-xs">
                {ind}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

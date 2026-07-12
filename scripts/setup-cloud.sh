#!/bin/bash
# MarketPilot - Cloud Database Setup Script
# Run this AFTER deploying to Vercel to set up your cloud database

echo "============================================"
echo "  MarketPilot - Cloud Database Setup"
echo "============================================"
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
  echo "❌ Usage: ./scripts/setup-cloud.sh YOUR_DATABASE_URL"
  echo ""
  echo "Example:"
  echo "  ./scripts/setup-cloud.sh 'postgresql://user:pass@host/dbname?sslmode=require'"
  echo ""
  echo "Get your DATABASE_URL from neon.tech dashboard"
  exit 1
fi

export DATABASE_URL="$1"

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Pushing database schema..."
npx drizzle-kit push

echo ""
echo "🌱 Seeding demo data..."
npx tsx src/db/seed.ts

echo ""
echo "============================================"
echo "  ✅ Setup complete!"
echo "============================================"
echo ""
echo "Demo accounts:"
echo "  🏠 demo-realestate@marketpilot.ae / demo123"
echo "  💉 demo-clinic@marketpilot.ae / demo123"
echo "  🏗️  demo-construction@marketpilot.ae / demo123"
echo ""
echo "Your app is ready at your Vercel URL!"

#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Three Minds Wellness — Firebase Database Setup Script
# Run this ONCE after creating your free Firebase project
#
# Usage:
#   bash setup-firebase.sh https://your-project-default-rtdb.firebaseio.com
# ─────────────────────────────────────────────────────────────

if [ -z "$1" ]; then
  echo ""
  echo "❌  Missing Firebase DB URL"
  echo ""
  echo "Usage: bash setup-firebase.sh https://YOUR-PROJECT-default-rtdb.firebaseio.com"
  echo ""
  echo "📋  How to get your Firebase DB URL (free, 3 minutes):"
  echo "  1. Go to https://console.firebase.google.com"
  echo "  2. Click 'Create a project' → Name it 'three-minds-wellness' → Continue"
  echo "  3. Disable Google Analytics → Create project"
  echo "  4. In the left menu click 'Build' → 'Realtime Database'"
  echo "  5. Click 'Create Database' → Choose 'United States' → 'Start in test mode' → Enable"
  echo "  6. Copy the URL shown at the top (looks like https://three-minds-wellness-default-rtdb.firebaseio.com)"
  echo "  7. Run: bash setup-firebase.sh <that URL>"
  echo ""
  exit 1
fi

DB_URL=$1

# Remove trailing slash if present
DB_URL="${DB_URL%/}"

echo ""
echo "🔥  Setting up Firebase Realtime Database..."
echo "    URL: $DB_URL"
echo ""

# Write .env file
echo "VITE_DB_URL=$DB_URL" > .env
echo "✅  Created .env with VITE_DB_URL"

# Build the app
echo "🏗️   Building app..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌  Build failed. Check errors above."
  exit 1
fi

echo "✅  Build successful"

# Deploy to GitHub Pages
echo "🚀  Deploying to GitHub Pages..."
npx gh-pages -d dist

if [ $? -ne 0 ]; then
  echo "❌  Deploy failed. Check errors above."
  exit 1
fi

echo ""
echo "✅  ALL DONE! Your app is live with a real database."
echo ""
echo "📱  Your link (Darrian):   https://bookofkaur.github.io/three-minds-wellness/"
echo "👥  Family share link:     https://bookofkaur.github.io/three-minds-wellness/?family"
echo ""
echo "Share the family link with Josh, Shenita, and anyone in your circle."
echo "They will ONLY see your status — no Check In option."
echo ""

#!/bin/bash
cd "$(dirname "$0")"
echo "🔨 Running Next.js production build..."
echo ""
npm run build
echo ""
if [ $? -eq 0 ]; then
  echo "✅ Build succeeded! Ready for Vercel deployment."
else
  echo "❌ Build failed. Check errors above."
fi
echo ""
echo "Press any key to close."
read -n 1

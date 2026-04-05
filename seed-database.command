#!/bin/bash
cd "$(dirname "$0")"
echo "🌱 Seeding SupportAI database..."
npm run db:seed
echo ""
echo "✅ Done! Press any key to close."
read -n 1

#!/bin/bash
cd "$(dirname "$0")"

echo "🗑  Cleaning up any stale lock files..."
rm -f .git/index.lock .git/COMMIT_EDITMSG.lock 2>/dev/null

# Remove sandbox-created .git if it exists, start fresh
if [ -d .git ]; then
  echo "🔄  Removing sandbox git directory to start fresh on your Mac..."
  rm -rf .git
fi

echo "🔧 Initializing git repository..."
git init
git branch -m main

echo ""
echo "📦 Staging all files..."
git add .

echo ""
echo "📋 Files to be committed:"
git status --short

echo ""
echo "✍️  Creating initial commit..."
git commit -m "Initial commit: Customer Service AI Platform

- Full-stack support ticketing system with Next.js 14 App Router
- AI-powered chatbot with SSE streaming (Claude API + mock fallback)
- Sentiment analysis with auto-escalation for frustrated customers
- Smart KB article suggestions using keyword scoring
- Intelligent ticket auto-categorization with confidence scores
- Real-time analytics dashboard (Recharts: line, pie, bar charts)
- Role-based access control: Admin / Agent / Customer
- 120+ demo tickets across all categories, 18 KB articles
- Responsive design with mobile sidebar
- Built with Next.js 14, TypeScript, Tailwind CSS, Prisma, NextAuth"

echo ""
echo "🔗 Adding GitHub remote..."
git remote add origin https://github.com/gutiemi06-ui/customer-service-ai-platform.git
git branch -M main

echo ""
echo "📤 Pushing to GitHub..."
echo "   (You may be prompted for your GitHub username and a Personal Access Token as password)"
echo "   Get a token at: https://github.com/settings/tokens/new (select 'repo' scope)"
echo ""
git push -u origin main

echo ""
if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed to GitHub!"
  echo "   View your repo at: https://github.com/gutiemi06-ui/customer-service-ai-platform"
else
  echo "⚠️  Push failed. If prompted for credentials, use your GitHub username and a Personal Access Token."
  echo "   Then run manually: git push -u origin main"
fi

echo ""
echo "Press any key to close."
read -n 1

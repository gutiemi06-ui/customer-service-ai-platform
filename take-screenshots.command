#!/bin/bash
cd "$(dirname "$0")"
echo "📸 Installing puppeteer and taking screenshots..."
echo ""
npm install --save-dev puppeteer 2>/dev/null || npx puppeteer browsers install chrome 2>/dev/null
node take-screenshots.mjs
echo ""
echo "Press any key to close."
read -n 1

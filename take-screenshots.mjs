/**
 * take-screenshots.mjs
 * Uses Puppeteer (installed via npx) to capture portfolio screenshots.
 * Run with:  node take-screenshots.mjs
 */

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'public', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'http://localhost:3000';

async function shoot(page, url, filename, { scrollY = 0, waitFor } = {}) {
  await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 30000 });
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 800)); // let animations settle
  if (scrollY) await page.evaluate(y => window.scrollTo(0, y), scrollY);
  const path = join(OUT_DIR, filename);
  await page.screenshot({ path, fullPage: false, type: 'png' });
  console.log(`✅  Saved: public/screenshots/${filename}`);
}

(async () => {
  console.log('📸  Starting screenshot capture...\n');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // ── 1. Landing page (not logged in) ─────────────────────────────────────────
  await shoot(page, '/', 'landing.png', { waitFor: 'h1' });

  // ── 2. Log in as Admin ───────────────────────────────────────────────────────
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('button', { timeout: 5000 });
  // Click the Admin demo button (3rd button after the divider)
  const buttons = await page.$$('button');
  // Find button with text "Admin"
  for (const btn of buttons) {
    const txt = await btn.evaluate(el => el.textContent?.trim());
    if (txt?.includes('Admin') && txt?.includes('admin@support.dev')) {
      await btn.click();
      break;
    }
  }
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
  console.log('🔐  Logged in as Admin');

  // ── 3. Dashboard ─────────────────────────────────────────────────────────────
  await shoot(page, '/dashboard', 'dashboard.png', { waitFor: '.rounded-2xl' });

  // ── 4. Analytics ─────────────────────────────────────────────────────────────
  await shoot(page, '/dashboard/analytics', 'analytics.png', { waitFor: '.recharts-wrapper', waitForTimeout: 1500 });
  await new Promise(r => setTimeout(r, 1500)); // Let charts render
  await page.screenshot({ path: join(OUT_DIR, 'analytics.png'), fullPage: false, type: 'png' });
  console.log('✅  Saved: public/screenshots/analytics.png (re-saved after chart render)');

  // ── 5. Ticket list ───────────────────────────────────────────────────────────
  await shoot(page, '/tickets', 'tickets.png', { waitFor: 'table' });

  // ── 6. Ticket detail (first ticket) ─────────────────────────────────────────
  const firstTicketLink = await page.$('table tbody tr td a');
  if (firstTicketLink) {
    const href = await firstTicketLink.evaluate(el => el.closest('a')?.href || el.href);
    if (href) {
      await shoot(page, new URL(href).pathname, 'ticket-detail.png', { waitFor: '.rounded-2xl' });
    }
  } else {
    // fallback: grab first ticket from API
    const res = await page.evaluate(() => fetch('/api/tickets').then(r => r.json()));
    if (res?.[0]?.id) {
      await shoot(page, `/tickets/${res[0].id}`, 'ticket-detail.png');
    }
  }

  // ── 7. Knowledge base ────────────────────────────────────────────────────────
  await shoot(page, '/knowledge-base', 'knowledge-base.png', { waitFor: '.rounded-2xl' });

  await browser.close();
  console.log('\n🎉  All screenshots saved to public/screenshots/');
  console.log('    landing.png, dashboard.png, analytics.png,');
  console.log('    tickets.png, ticket-detail.png, knowledge-base.png');
})().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});

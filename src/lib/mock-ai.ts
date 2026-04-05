/**
 * mock-ai.ts — Intelligent mock AI responses for the SupportAI platform.
 * Simulates Claude API calls with realistic keyword-based logic, varied
 * response templates, and accurate delays.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function contains(text: string, ...keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── 1. MOCK CHATBOT ─────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatTopic {
  keywords: string[];
  responses: string[];
}

const PASSWORD_RESPONSES = [
  `I can help you reset your password right away! Here's how to do it:

**Step 1 — Visit the login page**
Go to your account login page and click **"Forgot password?"** below the sign-in button.

**Step 2 — Enter your email**
Enter the email address associated with your account and click **Send Reset Link**.

**Step 3 — Check your inbox**
You'll receive an email within 2–3 minutes. Check your spam folder if you don't see it.

**Step 4 — Set a new password**
Click the link in the email (it's valid for **24 hours**) and choose a new password — at least 8 characters with a mix of letters and numbers.

Is there anything else about your account access I can help with?`,

  `Happy to help with your password! Follow these steps:

1. Click **"Forgot password?"** on the login screen
2. Enter your registered email address
3. Open the reset email (arrives within 2–3 minutes — check spam too)
4. Click the link and create a new password

**Tips for a strong password:**
- At least 8 characters
- Mix of uppercase, lowercase, numbers and symbols
- Don't reuse a previous password

If you don't receive the email within 5 minutes, I can escalate to a human agent who can manually trigger the reset. Would you like me to do that?`,

  `Password resets are quick and easy! Here's what to do:

**From the login page:** Click "Forgot password?" → Enter your email → Check your inbox for the reset link.

The reset link expires after **24 hours**, so use it promptly. Once you've set your new password, you'll be logged in automatically.

**Common issues:**
- *Email not arriving?* Check your spam or promotions folder
- *Link expired?* Just request a new one from the login page
- *Account locked?* After 5 failed attempts, accounts lock for 30 minutes for security

Let me know if you run into any trouble and I'll get a human agent to assist you directly!`,

  `Of course! Password resets are straightforward:

Go to the **login page → "Forgot password?" → enter your email → click the link we send you**.

A few things to keep in mind:
- The reset email arrives within **2–3 minutes** (check spam if you don't see it)
- The link is valid for **24 hours**
- Your previous password will be deactivated as soon as you set the new one

Would you also like tips on setting up two-factor authentication to prevent future lockouts?`,

  `Let me walk you through the password reset process:

**Option 1 — Self-service (fastest):**
Login page → "Forgot password?" → enter your email → click the link in the email you receive

**Option 2 — Through account settings (if you're logged in):**
Settings → Security → Change Password

**Option 3 — Contact support:**
If neither option works, a support agent can verify your identity and reset your account manually.

The self-service reset email typically arrives in under 3 minutes. Is there a specific part of the process you're stuck on?`,
];

const BILLING_RESPONSES = [
  `I understand billing questions can be stressful — let me help clarify things!

**Common billing topics I can help with:**

- **Viewing your invoices:** Go to Settings → Billing → Invoice History. You can download PDFs of all past invoices.
- **Updating payment method:** Settings → Billing → Payment Methods → Add/Edit Card
- **Understanding a charge:** Each line item on your invoice includes a description. Proration charges appear when plans are upgraded mid-cycle.
- **Requesting a refund:** Refunds for annual plans are prorated. Contact our billing team for amounts over $50.

What specific billing question do you have? I want to make sure you get the right information.`,

  `Happy to help with billing! Here's what you should know:

**Your subscription renews automatically** on the same date each month/year. You'll receive an invoice email 3 days before each charge.

**To dispute a charge:**
1. Go to Settings → Billing → Invoice History
2. Click on the charge in question
3. Select "Dispute this charge"
4. A billing specialist will review within 2 business days

**Refund policy:** We offer full refunds within 7 days of purchase and prorated refunds for annual plans cancelled mid-term.

Is there a specific charge you'd like help understanding?`,

  `Let me help you sort out this billing matter!

**Quick links for common billing tasks:**
- 📄 Download invoices: Settings → Billing → Invoices
- 💳 Update card: Settings → Billing → Payment Methods
- 📧 Change billing email: Settings → Account → Contact Information
- ⬆️ Upgrade/downgrade plan: Settings → Billing → Plan

**About your current charges:**
Charges appear as *"SupportAI"* or *"SupportAI Inc"* on your statement. If you see an unexpected amount, it's often due to a mid-cycle plan change (proration) or a usage overage.

For account-specific billing details like exact charges and refund processing, a human billing specialist can assist — would you like me to flag this for them?`,

  `Billing questions are best handled quickly — here's what I can tell you:

**Invoice & payment FAQs:**
- Invoices are emailed automatically and available in your dashboard under Settings → Billing
- Payments are processed in USD. International transactions may incur a small conversion fee from your bank.
- We accept Visa, Mastercard, Amex, and PayPal

**If a payment failed:**
1. Check that your card details are up to date (Settings → Billing → Payment Methods)
2. Verify your card isn't expired or over its limit
3. Contact your bank if the issue persists — sometimes international transactions are flagged

A billing agent can pull up your specific account history for precise details. Would you like me to connect you with one?`,

  `I'm here to help with your billing concern!

**Subscription & plan details:**
- Your plan renews on the same day each billing cycle
- You can cancel anytime — your access continues until the end of the paid period
- Annual plans receive a 20% discount vs. monthly billing

**How refunds work:**
- Monthly plans: no refunds after 7-day window
- Annual plans: prorated refund for unused months
- Promotional purchases: subject to promo terms

For anything that requires accessing your specific account balance, payment history, or processing a refund, I'll need to connect you with our billing team. Would you like me to create an escalation request?`,
];

const ACCOUNT_RESPONSES = [
  `Account issues can be frustrating — let me help you get back on track!

**Common account fixes:**

**Can't log in:**
→ Try "Forgot password?" first. If that doesn't work, your account may be locked after multiple failed attempts (auto-unlocks in 30 minutes).

**Account suspended:**
→ Suspensions can happen due to billing failures, ToS violations, or security concerns. Check your email for a notice from us.

**Access permissions:**
→ If you're missing features you had before, your plan may have changed or your role within the organization may have been updated by an admin.

What specific account issue are you experiencing? I can give you more targeted help.`,

  `I can help you navigate your account settings!

**Account management quick guide:**
- **Profile & personal info:** Settings → Account → Profile
- **Security settings (2FA, sessions):** Settings → Security
- **Notification preferences:** Settings → Notifications
- **Team members & roles:** Settings → Team (admin access required)
- **Data export:** Settings → Account → Export Data

**If you're locked out of your account**, the fastest path is the self-service password reset. If that email address is no longer accessible, our support team can verify your identity via alternative methods.

What would you like help with specifically?`,

  `Let me help you with your account!

**Access troubleshooting steps:**
1. Clear your browser cache and cookies, then try logging in again
2. Try an incognito/private browser window
3. Disable browser extensions temporarily (some interfere with login)
4. Confirm you're using the correct email — sometimes people have multiple accounts

**Two-factor authentication issues:**
If you've lost access to your 2FA device, use one of your backup codes (saved when you set up 2FA) or contact support for identity verification.

**SSO/SAML users:**
Your login is controlled by your organization's identity provider. Contact your IT department if you can't authenticate.

Still stuck? I can flag this for a human agent who has direct account access.`,

  `Account access issues are something we can definitely resolve!

**Step-by-step diagnosis:**

1. **Check your email** — Is the address correct? Try common variations (work vs personal).
2. **Password issue?** — Use "Forgot password?" to reset it.
3. **Account locked?** — Wait 30 minutes or contact support to unlock manually.
4. **Billing-related suspension?** — Update your payment method in Settings → Billing.
5. **Organization account?** — Your admin may have deactivated your seat. Contact your org admin.

For security reasons, I can't make direct account changes through this chat. If you need account modifications, a verified support agent will need to assist.

Which of these situations matches what you're experiencing?`,

  `Happy to help with your account!

**Frequently asked account questions:**

*"I can't see a feature I used to have"*
→ Your plan or role may have changed. Check Settings → Billing → Plan for your current tier.

*"I need to transfer account ownership"*
→ This requires both parties to verify identity. Contact our support team to initiate the transfer.

*"I want to delete my account"*
→ Go to Settings → Account → Delete Account. Note: this permanently removes all data after a 30-day grace period.

*"I got locked out after enabling 2FA"*
→ Use your backup codes (generated when you set up 2FA) or contact support with your ID for verification.

What's the specific account situation you're dealing with?`,
];

const TECHNICAL_RESPONSES = [
  `I can see you're dealing with a technical issue — let's troubleshoot this together!

**General debugging steps:**

1. **Check our status page** — Visit status.supportai.io to see if there's an active incident affecting your account.

2. **Reproduce the issue** — Note the exact steps that cause the problem, the error message (if any), and when it started.

3. **Try the basics:**
   - Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
   - Clear browser cache and cookies
   - Try a different browser or device
   - Disable VPN or proxy if you're using one

4. **API issues?** — Check that your API key is active and has sufficient permissions. Rate limits reset every minute.

Can you share the specific error message or behavior you're seeing? That will help me give more targeted advice.`,

  `Technical issues are my specialty! Let me help diagnose this.

**For API errors (4xx/5xx):**
- **400 Bad Request** — Check your request payload format and required fields
- **401 Unauthorized** — Verify your API key is valid and included in the Authorization header
- **403 Forbidden** — Your key may lack required permissions or your plan doesn't include this endpoint
- **429 Too Many Requests** — You've hit rate limits. Implement exponential backoff and retry logic
- **500 Server Error** — This is on our end. Check status.supportai.io and retry after a few minutes

**For intermittent errors:**
Intermittent issues (affecting 1-2% of requests) often indicate race conditions, timeout mismatches, or load balancer issues. Adding retry logic with exponential backoff typically resolves these.

What's the HTTP status code or error message you're seeing?`,

  `Let's get to the bottom of this technical issue!

**Quick diagnostic questions:**
1. When did this start — suddenly, or gradually got worse?
2. Is it affecting all users or just specific ones?
3. Does it happen consistently or intermittently?
4. Any recent changes on your end (code deployments, config updates, new team members)?

**Meanwhile, try these:**
- Check your browser console (F12) for JavaScript errors
- Review your server logs for stack traces
- Test with a minimal reproduction case
- Compare with a working environment to spot differences

**If it's an integration issue:**
Make sure your SDK is up to date — many bugs are fixed in newer versions. Run "npm update @supportai/sdk" or equivalent.

Share the error details and I'll dig deeper with you.`,

  `I understand how disruptive technical problems can be. Let's fix this!

**Systematic troubleshooting approach:**

**Step 1 — Isolate the problem**
Is it happening in production only, or also in staging/dev? This tells us if it's a configuration or code issue.

**Step 2 — Check dependencies**
- Are all required services running? (database, cache, queue)
- Have any third-party services you depend on had outages?
- Are your API credentials and environment variables correct?

**Step 3 — Review recent changes**
Most bugs appear after a change. Check git history, deployment logs, or configuration changes from around when the issue started.

**Step 4 — Test in isolation**
Try reproducing with the simplest possible test case to rule out interference from other parts of your system.

I'll need the error message and a description of what's happening to help further. What are you seeing?`,

  `Technical issues can definitely be frustrating — let me help you work through this!

**For performance issues:**
- Check if queries are hitting the database (add indexes for frequently queried fields)
- Look for N+1 query problems in your ORM usage
- Consider caching responses for frequently accessed, rarely changed data
- Check your server resource utilization (CPU, memory, network)

**For connectivity/timeout issues:**
- Verify firewall rules allow traffic on the required ports
- Check DNS resolution is working correctly
- Test with longer timeout values to see if it's a timing issue
- Consider regional latency if you're making cross-region API calls

**For data integrity issues:**
- Validate inputs before processing
- Check for race conditions in concurrent operations
- Review transaction boundaries in database operations

What specific technical symptoms are you experiencing? Error messages, logs, or reproduction steps would help me give more precise guidance.`,
];

const DEFAULT_RESPONSES = [
  `Thanks for reaching out! I'm here to help.

To make sure I give you the most accurate information, could you tell me a bit more about what you're looking for?

I can help with:
- **Account & access** issues (login, passwords, permissions)
- **Billing** questions (invoices, charges, refunds, plans)
- **Technical** problems (bugs, errors, integrations, API)
- **General** questions about features and how-tos

What's going on? I'll do my best to resolve it quickly or connect you with the right person.`,

  `Hello! I'm your AI support assistant, and I'm ready to help.

It sounds like you have a question or concern — I'd love to help resolve it as quickly as possible.

**To get you the best answer:**
- What feature or part of the platform is this related to?
- Is this something that was working before and stopped, or something you're trying to do for the first time?
- Have you already tried anything to resolve it?

Feel free to share as many details as you like — the more context you give me, the better I can assist!`,

  `I'm here and ready to assist you!

Our support team handles everything from technical integrations and billing questions to account management and feature guidance.

**Popular topics I can help with right now:**
1. Resetting passwords or recovering account access
2. Understanding your invoice or disputing a charge
3. Troubleshooting API errors or integration issues
4. Navigating account settings and permissions
5. Learning about available features and how to use them

What brings you here today? Share what's on your mind and we'll work through it together.`,

  `Great question — let me help you with that!

I want to make sure my answer is as relevant as possible to your situation. A little more context would help:

- What were you trying to do when the issue occurred?
- What did you expect to happen vs. what actually happened?
- Is there an error message or specific behavior you can describe?

I'm connected to our full knowledge base and can pull up documentation, troubleshooting steps, and escalate to a human agent if needed. You're in good hands!`,

  `Thanks for contacting support! I'll do my best to help.

**Here's how our support process works:**
1. I'll try to resolve your issue directly using our knowledge base
2. If I can't fully resolve it, I'll gather the details and connect you with the right specialist
3. Complex issues requiring account access are escalated to our human team within 1–2 hours

To get started, can you describe what's happening in a bit more detail? The more specific you are, the faster we can get this resolved for you!`,
];

const TOPICS: ChatTopic[] = [
  { keywords: ["password", "reset", "forgot", "can't log", "login", "locked out", "sign in"], responses: PASSWORD_RESPONSES },
  { keywords: ["billing", "charge", "payment", "invoice", "subscription", "refund", "plan", "credit card", "receipt"], responses: BILLING_RESPONSES },
  { keywords: ["account", "access", "permission", "profile", "settings", "2fa", "two factor", "suspended", "deleted"], responses: ACCOUNT_RESPONSES },
  { keywords: ["error", "bug", "broken", "not working", "crash", "500", "api", "fails", "failing", "issue", "problem", "down", "slow", "timeout", "integration"], responses: TECHNICAL_RESPONSES },
];

/**
 * Determine the response topic from the user's most recent message.
 */
export function getMockChatResponse(
  messages: ChatMessage[],
  ticketTitle?: string,
  ticketCategory?: string
): string {
  // Combine recent context for keyword matching
  const recentUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const context = `${recentUserMsg} ${ticketTitle ?? ""} ${ticketCategory ?? ""}`.toLowerCase();

  for (const topic of TOPICS) {
    if (topic.keywords.some((kw) => context.includes(kw))) {
      return pick(topic.responses);
    }
  }
  return pick(DEFAULT_RESPONSES);
}

// ─── 2. MOCK SENTIMENT ANALYSIS ───────────────────────────────────────────────

const VERY_NEGATIVE_KEYWORDS = [
  "worst", "terrible", "awful", "useless", "hate", "ridiculous", "pathetic",
  "scam", "disgusting", "outrageous", "furious", "infuriating",
];

const NEGATIVE_KEYWORDS = [
  "angry", "frustrated", "frustrated", "disappointed", "unacceptable",
  "horrible", "bad", "failing", "broken", "incompetent", "waste",
  "never again", "cancel", "refund", "demand", "urgent", "immediately",
];

function isAllCaps(text: string): boolean {
  const words = text.split(/\s+/).filter((w) => w.length > 3);
  if (words.length < 2) return false;
  const capsWords = words.filter((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
  return capsWords.length / words.length >= 0.6;
}

export interface SentimentResult {
  sentiment: "positive" | "neutral" | "negative" | "very_negative";
  score: number;
  shouldEscalate: boolean;
  reasoning: string;
  emotions: string[];
}

export function mockAnalyzeSentiment(text: string, ticketTitle?: string): SentimentResult {
  const combined = `${text} ${ticketTitle ?? ""}`.toLowerCase();
  const allCaps = isAllCaps(text);

  const veryNegativeCount = VERY_NEGATIVE_KEYWORDS.filter((kw) => combined.includes(kw)).length;
  const negativeCount = NEGATIVE_KEYWORDS.filter((kw) => combined.includes(kw)).length;
  const totalNegative = veryNegativeCount * 2 + negativeCount;

  const detectedEmotions: string[] = [];
  if (combined.includes("frustrat")) detectedEmotions.push("frustrated");
  if (combined.includes("angry") || combined.includes("furious")) detectedEmotions.push("angry");
  if (combined.includes("disappoint")) detectedEmotions.push("disappointed");
  if (combined.includes("confus")) detectedEmotions.push("confused");
  if (combined.includes("urgent") || combined.includes("immediately")) detectedEmotions.push("urgent");
  if (combined.includes("worried") || combined.includes("concern")) detectedEmotions.push("worried");
  if (combined.includes("happy") || combined.includes("great") || combined.includes("thank")) detectedEmotions.push("satisfied");
  if (allCaps) detectedEmotions.push("agitated");

  if (totalNegative >= 3 || allCaps || veryNegativeCount >= 1) {
    return {
      sentiment: "very_negative",
      score: -(0.75 + Math.min(0.25, totalNegative * 0.05)),
      shouldEscalate: true,
      reasoning: allCaps
        ? "Customer is using all-caps language indicating high agitation and urgency."
        : `Customer message contains ${totalNegative} strong negative indicators suggesting significant frustration.`,
      emotions: detectedEmotions.length > 0 ? detectedEmotions : ["frustrated", "urgent"],
    };
  }

  if (totalNegative >= 1) {
    return {
      sentiment: "negative",
      score: -(0.3 + totalNegative * 0.1),
      shouldEscalate: false,
      reasoning: "Customer expresses some dissatisfaction but without extreme frustration.",
      emotions: detectedEmotions.length > 0 ? detectedEmotions : ["frustrated"],
    };
  }

  if (detectedEmotions.includes("satisfied")) {
    return {
      sentiment: "positive",
      score: 0.6,
      shouldEscalate: false,
      reasoning: "Customer appears satisfied or is expressing gratitude.",
      emotions: detectedEmotions,
    };
  }

  return {
    sentiment: "neutral",
    score: 0.0,
    shouldEscalate: false,
    reasoning: "Message tone is neutral with no significant emotional indicators.",
    emotions: detectedEmotions.length > 0 ? detectedEmotions : ["neutral"],
  };
}

// ─── 3. MOCK KB SUGGESTIONS ────────────────────────────────────────────────────

interface KBArticleInput {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface KBSuggestion {
  id: string;
  title: string;
  category: string;
  content: string;
  relevance: string;
  preview: string;
}

const KB_KEYWORD_MAP: { keywords: string[]; topics: string[] }[] = [
  {
    keywords: ["password", "reset", "login", "forgot", "locked", "sign in", "credential"],
    topics: ["password", "login", "authentication", "access", "credential", "security"],
  },
  {
    keywords: ["billing", "invoice", "payment", "charge", "refund", "subscription", "plan", "pricing"],
    topics: ["billing", "payment", "invoice", "refund", "subscription", "plan", "pricing"],
  },
  {
    keywords: ["account", "profile", "settings", "permission", "role", "team", "user"],
    topics: ["account", "profile", "setting", "permission", "role", "team", "user"],
  },
  {
    keywords: ["api", "error", "integration", "500", "bug", "crash", "rate limit", "timeout", "webhook"],
    topics: ["api", "error", "integration", "rate limit", "timeout", "webhook", "sdk", "endpoint"],
  },
  {
    keywords: ["install", "setup", "configure", "getting started", "onboard"],
    topics: ["install", "setup", "configure", "getting started", "guide", "tutorial"],
  },
];

function scoreArticle(
  article: KBArticleInput,
  ticketKeywords: string[],
  topicWords: string[]
): number {
  const haystack = `${article.title} ${article.content}`.toLowerCase();
  let score = 0;

  // Direct keyword hits in ticket text
  for (const kw of ticketKeywords) {
    if (haystack.includes(kw)) score += 3;
  }

  // Topic word hits
  for (const tw of topicWords) {
    if (haystack.includes(tw)) score += 1;
  }

  // Category match bonus
  if (ticketKeywords.some((kw) => article.category.toLowerCase().includes(kw))) score += 2;

  return score;
}

function buildRelevanceText(article: KBArticleInput, ticketTitle: string): string {
  const titleLower = ticketTitle.toLowerCase();
  const articleLower = article.title.toLowerCase();

  const relevanceTemplates = [
    `Directly addresses ${article.category.toLowerCase()} issues mentioned in your ticket.`,
    `Contains step-by-step guidance relevant to "${ticketTitle}".`,
    `Covers the ${article.category.toLowerCase()} topic in detail with troubleshooting steps.`,
    `This article's solutions are commonly used for issues similar to yours.`,
    `Recommended based on the keywords in your ticket description.`,
    `Frequently helps customers resolve "${articleLower}" related problems.`,
  ];

  if (titleLower.includes("password") || titleLower.includes("login")) {
    return `Provides direct guidance on authentication issues like the one you're experiencing.`;
  }
  if (titleLower.includes("billing") || titleLower.includes("charge")) {
    return `Explains billing processes relevant to your charge inquiry.`;
  }
  if (titleLower.includes("api") || titleLower.includes("error")) {
    return `Covers API error scenarios and recommended fixes for your integration.`;
  }
  if (titleLower.includes("rate limit")) {
    return `Explains rate limit policies and how to implement compliant retry logic.`;
  }

  return pick(relevanceTemplates);
}

export function mockKBSuggestions(
  articles: KBArticleInput[],
  ticketTitle: string,
  ticketDescription?: string,
  ticketCategory?: string
): KBSuggestion[] {
  const context = `${ticketTitle} ${ticketDescription ?? ""} ${ticketCategory ?? ""}`.toLowerCase();

  // Find which topic clusters match
  const matchedTopicWords: string[] = [];
  const ticketKeywords: string[] = [];

  for (const cluster of KB_KEYWORD_MAP) {
    const hitKeywords = cluster.keywords.filter((kw) => context.includes(kw));
    if (hitKeywords.length > 0) {
      ticketKeywords.push(...hitKeywords);
      matchedTopicWords.push(...cluster.topics);
    }
  }

  // Score every article
  const scored = articles.map((a) => ({
    article: a,
    score: scoreArticle(a, ticketKeywords, matchedTopicWords),
  }));

  // Sort by score desc, fall back to top 3 by views (original order) if no matches
  scored.sort((a, b) => b.score - a.score);

  const top3 = scored.slice(0, 3);

  return top3.map(({ article }) => ({
    ...article,
    relevance: buildRelevanceText(article, ticketTitle),
    preview: article.content.slice(0, 160) + "...",
  }));
}

// ─── 4. MOCK CATEGORIZATION ────────────────────────────────────────────────────

export interface CategorizationResult {
  category: "TECHNICAL" | "BILLING" | "ACCOUNT" | "GENERAL";
  confidence: number;
  reasoning: string;
}

interface CategoryRule {
  category: CategorizationResult["category"];
  keywords: string[];
  reasoning: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "ACCOUNT",
    keywords: ["password", "login", "sign in", "locked", "access", "permission", "account", "profile", "2fa", "two factor", "credential", "username", "logout", "session"],
    reasoning: "Ticket contains account access or authentication-related keywords.",
  },
  {
    category: "BILLING",
    keywords: ["charge", "billing", "payment", "invoice", "refund", "subscription", "plan", "pricing", "credit", "receipt", "discount", "coupon", "upgrade", "downgrade", "cancel"],
    reasoning: "Ticket describes a billing, payment, or subscription-related concern.",
  },
  {
    category: "TECHNICAL",
    keywords: ["error", "bug", "broken", "not working", "crash", "500", "api", "integration", "timeout", "fails", "failure", "issue", "exception", "stack trace", "sdk", "endpoint", "rate limit", "latency", "performance", "slow"],
    reasoning: "Ticket involves a technical error, API issue, or software malfunction.",
  },
];

export function mockCategorizeTicket(
  title: string,
  description?: string
): CategorizationResult {
  const combined = `${title} ${description ?? ""}`.toLowerCase();

  let bestMatch: CategoryRule | null = null;
  let bestCount = 0;

  for (const rule of CATEGORY_RULES) {
    const matchCount = rule.keywords.filter((kw) => combined.includes(kw)).length;
    if (matchCount > bestCount) {
      bestCount = matchCount;
      bestMatch = rule;
    }
  }

  if (!bestMatch || bestCount === 0) {
    return {
      category: "GENERAL",
      confidence: 0.62,
      reasoning: "No specific technical, billing, or account keywords detected. Defaulting to general inquiry.",
    };
  }

  // Confidence scales with number of keyword hits
  const confidence = Math.min(0.98, 0.72 + bestCount * 0.06);

  return {
    category: bestMatch.category,
    confidence,
    reasoning: bestMatch.reasoning,
  };
}

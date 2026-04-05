import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 7); // 7am–7pm
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

function minutesAfter(base: Date, min: number, max: number): Date {
  const d = new Date(base);
  d.setMinutes(d.getMinutes() + Math.floor(Math.random() * (max - min)) + min);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick<T>(items: { val: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.val;
  }
  return items[items.length - 1].val;
}

// ─── KB article content ──────────────────────────────────────────────────────

const KB_ARTICLES = [
  {
    title: "How to reset your password",
    content:
      "To reset your password, navigate to the login page and click 'Forgot Password'. Enter your email address and we'll send you a reset link within 5 minutes. Check your spam folder if you don't see it. The link expires after 24 hours. If you still can't log in, contact our support team with your account email and we'll manually verify your identity.",
    category: "ACCOUNT",
    views: 12400,
    helpfulCount: 9820,
  },
  {
    title: "Understanding your invoice",
    content:
      "Your monthly invoice includes all charges for the billing period. The invoice shows your base plan cost, any add-ons, usage-based charges, and applicable taxes. You can download PDF invoices from the Billing section of your account dashboard. Invoices are generated on the 1st of each month and payment is due within 30 days. We accept Visa, Mastercard, Amex, and ACH bank transfers.",
    category: "BILLING",
    views: 8760,
    helpfulCount: 6540,
  },
  {
    title: "API rate limits and how to handle them",
    content:
      "Our API enforces rate limits to ensure fair usage. Standard tier: 100 requests/minute. Pro tier: 1,000 requests/minute. Enterprise: unlimited. When you hit a rate limit, you'll receive a 429 status code. Implement exponential backoff with jitter in your integration. Check the X-RateLimit-Remaining and X-RateLimit-Reset headers in every response to proactively manage your quota.",
    category: "TECHNICAL",
    views: 23410,
    helpfulCount: 18760,
  },
  {
    title: "How to upgrade your plan",
    content:
      "To upgrade your plan, go to Settings > Billing > Change Plan. Select the plan that fits your needs and confirm. Changes take effect immediately and you'll be charged a prorated amount for the remainder of your billing cycle. Downgrades take effect at the end of your current billing period. You can also contact our sales team for custom Enterprise pricing.",
    category: "BILLING",
    views: 5430,
    helpfulCount: 4210,
  },
  {
    title: "Troubleshooting connection errors",
    content:
      "If you're experiencing connection errors, first check our status page at status.supportai.dev. Common causes: 1) Firewall blocking port 443, 2) Outdated TLS version (we require TLS 1.2+), 3) DNS resolution issues, 4) Expired SSL certificates on your end. Try flushing your DNS cache and ensuring your network allows outbound HTTPS. Our API base URL is api.supportai.dev.",
    category: "TECHNICAL",
    views: 16540,
    helpfulCount: 12340,
  },
  {
    title: "How to add team members",
    content:
      "Admins can add team members from Settings > Team. Click 'Invite Member', enter their email and select their role (Admin, Agent, or Viewer). They'll receive an invitation email valid for 48 hours. Team members on the Pro plan are included at no extra cost up to 10 seats. Enterprise plans have unlimited seats. You can revoke access at any time from the Team settings page.",
    category: "ACCOUNT",
    views: 7890,
    helpfulCount: 6120,
  },
  {
    title: "Setting up webhook integrations",
    content:
      "Webhooks allow you to receive real-time notifications when events occur in your account. Go to Settings > Integrations > Webhooks and click 'Add Endpoint'. Enter your HTTPS URL and select the events to subscribe to. We'll send a POST request with a JSON payload and include an X-Signature-256 header for verification. Retry failed deliveries up to 5 times with exponential backoff.",
    category: "TECHNICAL",
    views: 9870,
    helpfulCount: 7650,
  },
  {
    title: "Cancelling or pausing your subscription",
    content:
      "To cancel your subscription, go to Settings > Billing > Cancel Subscription. You'll retain access until the end of your current billing period. We don't offer refunds for partial months. To pause instead, select 'Pause Subscription' — you can pause for up to 3 months. Your data is retained for 90 days after cancellation. Contact support if you need a data export before cancelling.",
    category: "BILLING",
    views: 4320,
    helpfulCount: 3210,
  },
  {
    title: "Two-factor authentication setup",
    content:
      "Enable 2FA from Account Settings > Security > Two-Factor Authentication. We support authenticator apps (Google Authenticator, Authy, 1Password) and hardware security keys (WebAuthn/FIDO2). After enabling, you'll need to enter a 6-digit code on every login. Store your backup codes in a safe place — they can be used if you lose access to your authenticator. Admins can enforce 2FA for all team members.",
    category: "ACCOUNT",
    views: 6540,
    helpfulCount: 5430,
  },
  {
    title: "Exporting your data",
    content:
      "You can export your data from Settings > Data Export. Available formats: CSV, JSON, and XML. Exports include customer records, tickets, messages, and analytics data. Large exports are queued and you'll receive an email with a download link when ready (typically within 30 minutes). Download links expire after 7 days. For GDPR data subject access requests, use the 'GDPR Export' option which includes all personal data.",
    category: "GENERAL",
    views: 3450,
    helpfulCount: 2890,
  },
  {
    title: "SSO / SAML configuration guide",
    content:
      "SupportAI supports SAML 2.0 SSO with major identity providers including Okta, Azure AD, Google Workspace, and OneLogin. From Settings > Security > SSO, download our metadata XML and upload it to your IdP. Set the Entity ID to https://app.supportai.dev/saml and the ACS URL to https://app.supportai.dev/saml/callback. Map the email attribute to user.email. Test the connection before enabling for all users.",
    category: "TECHNICAL",
    views: 4560,
    helpfulCount: 3870,
  },
  {
    title: "Understanding priority levels",
    content:
      "Ticket priority determines response SLA targets. Urgent: 1-hour first response, 4-hour resolution target — reserved for production outages and critical business blockers. High: 4-hour first response, 24-hour resolution. Medium: 8-hour first response, 72-hour resolution. Low: 24-hour first response, best-effort resolution. Priority is set by the customer and may be adjusted by agents based on actual impact.",
    category: "GENERAL",
    views: 5670,
    helpfulCount: 4560,
  },
  {
    title: "Mobile app setup and troubleshooting",
    content:
      "Download the SupportAI mobile app from the App Store or Google Play. Sign in with your existing account credentials. The app supports push notifications for ticket updates — enable them in your phone's notification settings. If the app crashes on launch, try: 1) Updating to the latest version, 2) Clearing the app cache, 3) Reinstalling. Minimum requirements: iOS 15+ or Android 10+.",
    category: "TECHNICAL",
    views: 8900,
    helpfulCount: 7230,
  },
  {
    title: "Refund policy and how to request one",
    content:
      "We offer refunds within 30 days of initial purchase for annual subscriptions. Monthly subscriptions are non-refundable. To request a refund, open a billing support ticket with your invoice number and reason. Refunds are processed within 5-7 business days to your original payment method. We also offer account credits as an alternative to refunds, which can be applied to future invoices.",
    category: "BILLING",
    views: 6780,
    helpfulCount: 5430,
  },
  {
    title: "Integrating with Slack",
    content:
      "Connect SupportAI to Slack to receive ticket notifications and reply to customers directly from Slack. From Settings > Integrations > Slack, click 'Add to Slack' and authorize the app. Configure which channels receive notifications and which ticket events trigger alerts. Agents can use slash commands: /supportai view [ticket-id] and /supportai reply [ticket-id] [message] to manage tickets without leaving Slack.",
    category: "TECHNICAL",
    views: 7890,
    helpfulCount: 6540,
  },
  {
    title: "How to use the AI chatbot",
    content:
      "The AI assistant is available on every support ticket. It uses your knowledge base to provide instant answers before a human agent responds. You can ask the AI follow-up questions and it will maintain context throughout the conversation. The AI escalates to a human agent when it detects frustration, complex technical issues, or billing disputes. Agent responses override AI responses and the AI learns from successful resolutions.",
    category: "GENERAL",
    views: 11230,
    helpfulCount: 9870,
  },
  {
    title: "Billing dispute resolution process",
    content:
      "If you believe you've been incorrectly charged, open a billing ticket with: your invoice number, the disputed amount, and a brief explanation. Our billing team reviews all disputes within 2 business days. We can issue credits, refunds, or corrections depending on the situation. For disputed credit card charges, please contact us before filing a chargeback — chargebacks result in account suspension pending investigation.",
    category: "BILLING",
    views: 4320,
    helpfulCount: 3450,
  },
  {
    title: "Account deletion and data retention",
    content:
      "To delete your account, go to Account Settings > Danger Zone > Delete Account. You'll be asked to confirm by typing your email address. Account deletion is permanent and begins immediately. We retain certain data for legal and compliance purposes for up to 90 days. Within 30 days of deletion, you can request a copy of your data by emailing privacy@supportai.dev. Team accounts require admin authorization to delete.",
    category: "ACCOUNT",
    views: 2340,
    helpfulCount: 1890,
  },
];

// ─── ticket templates ────────────────────────────────────────────────────────

type TicketTemplate = {
  title: string;
  description: string;
  category: "TECHNICAL" | "BILLING" | "ACCOUNT" | "GENERAL";
  baseStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  basePriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
};

const TICKET_TEMPLATES: TicketTemplate[] = [
  // TECHNICAL
  { title: "API returning 500 errors intermittently", description: "Our integration has been getting sporadic 500 errors from the /v1/data endpoint for the past 3 days. Roughly 1 in 50 requests fails. This is impacting our production environment. Request ID: req_a9f83b2c.", category: "TECHNICAL", baseStatus: "IN_PROGRESS", basePriority: "URGENT" },
  { title: "Webhook not firing on order completion", description: "Our webhook endpoint stopped receiving events about 18 hours ago. Webhook ID: wh_9876543. Our endpoint is returning 200 and has been verified live. No changes were made on our end.", category: "TECHNICAL", baseStatus: "OPEN", basePriority: "HIGH" },
  { title: "SSO integration not working with Okta", description: "We're configuring SAML SSO with Okta and getting an 'Invalid audience URI' error. We've triple-checked the Entity ID and ACS URL from your docs. Can you provide the exact values for our environment?", category: "TECHNICAL", baseStatus: "IN_PROGRESS", basePriority: "HIGH" },
  { title: "Mobile app crashes on iOS 17.2", description: "After the iOS 17.2 update, your app crashes on launch. Reinstalling didn't help. Device: iPhone 15 Pro Max. Can reproduce consistently. This affects several users on our team.", category: "TECHNICAL", baseStatus: "OPEN", basePriority: "HIGH" },
  { title: "Request to increase API rate limit", description: "We're launching a major campaign next week expecting 10x normal API traffic. Current limit (100 req/min) won't be sufficient. Can we get a temporary increase to 1,000 req/min for 2 weeks?", category: "TECHNICAL", baseStatus: "RESOLVED", basePriority: "MEDIUM" },
  { title: "SDK throwing TypeErrors on Node 20", description: "After upgrading to Node.js 20, the SDK throws TypeError: Cannot read properties of undefined on initialization. Works fine on Node 18. Stack trace attached.", category: "TECHNICAL", baseStatus: "RESOLVED", basePriority: "HIGH" },
  { title: "Data export stuck in 'processing' state", description: "I requested a CSV export 6 hours ago and it's still showing 'processing'. I have a quarterly report due tomorrow. The export was for approximately 50,000 records.", category: "TECHNICAL", baseStatus: "RESOLVED", basePriority: "HIGH" },
  { title: "Slack integration not posting notifications", description: "After re-authorizing the Slack integration yesterday, ticket notifications stopped appearing in our #support channel. The integration shows 'Connected' in settings.", category: "TECHNICAL", baseStatus: "CLOSED", basePriority: "MEDIUM" },
  { title: "TLS handshake errors from your API", description: "Getting TLS handshake errors when connecting from our on-premise server (Ubuntu 20.04). Our TLS version is 1.2. Error: SSL_ERROR_HANDSHAKE_FAILURE_ALERT. This was working fine until last week.", category: "TECHNICAL", baseStatus: "RESOLVED", basePriority: "URGENT" },
  { title: "GraphQL subscription not receiving real-time updates", description: "Our GraphQL subscription for ticket updates stopped working. We're using Apollo Client 3.8. The initial query works fine but subscription events stopped arriving after a brief network blip.", category: "TECHNICAL", baseStatus: "OPEN", basePriority: "MEDIUM" },
  { title: "API pagination returning duplicate records", description: "When paginating through large result sets using cursor-based pagination, we're seeing duplicate records across pages. This is causing data integrity issues in our sync process.", category: "TECHNICAL", baseStatus: "IN_PROGRESS", basePriority: "HIGH" },
  { title: "CORS errors on preflight requests", description: "Getting CORS errors on preflight OPTIONS requests from our React app hosted on app.mycompany.com. Our domain should be whitelisted — we added it in integration settings last month.", category: "TECHNICAL", baseStatus: "RESOLVED", basePriority: "MEDIUM" },
  { title: "Bulk import failing at 10,000 records", description: "CSV bulk import consistently fails when the file exceeds 10,000 rows. Smaller files (under 5,000 rows) import successfully. Error: 'Gateway timeout'. Is there a batch size limit?", category: "TECHNICAL", baseStatus: "RESOLVED", basePriority: "HIGH" },
  { title: "Search API not returning recent records", description: "The search endpoint seems to have a delay — newly created records don't appear in search results for 5-10 minutes. We need near-real-time search for our use case.", category: "TECHNICAL", baseStatus: "CLOSED", basePriority: "LOW" },
  { title: "OAuth token refresh failing silently", description: "Our OAuth access tokens aren't being refreshed automatically despite implementing the refresh flow correctly. Tokens expire and users get logged out. The refresh endpoint returns 200 but the new token is invalid.", category: "TECHNICAL", baseStatus: "IN_PROGRESS", basePriority: "URGENT" },

  // BILLING
  { title: "Charged twice for the same invoice", description: "I see two identical charges of $149.00 on my credit card statement for invoice INV-2024-0892. Both charged on the same date. Please refund the duplicate charge.", category: "BILLING", baseStatus: "IN_PROGRESS", basePriority: "HIGH" },
  { title: "Subscription renewal failed - card declined", description: "Received an email saying my subscription couldn't renew because my card was declined. I've updated my payment method to a new card. Is the subscription still active or has it lapsed?", category: "BILLING", baseStatus: "RESOLVED", basePriority: "HIGH" },
  { title: "Invoice not reflecting applied discount code", description: "I used promo code SAVE20 during signup for 20% off the first 3 months. My first invoice shows full price ($149 instead of $119.20). Please apply the discount retroactively.", category: "BILLING", baseStatus: "RESOLVED", basePriority: "MEDIUM" },
  { title: "Need to update billing address for tax purposes", description: "We relocated offices last month. New billing address: 456 Innovation Ave, Suite 800, San Francisco, CA 94105. Our EIN is also changing — I'll provide it in a secure channel.", category: "BILLING", baseStatus: "CLOSED", basePriority: "MEDIUM" },
  { title: "Unexpected charge on my account", description: "I see an unrecognized charge of $49.00 from 2 weeks ago. I haven't added any new features or exceeded any usage limits. My plan is the Basic tier at $29/month.", category: "BILLING", baseStatus: "RESOLVED", basePriority: "HIGH" },
  { title: "Request for annual billing invoice", description: "We're paying monthly but want to switch to annual billing to get the discount. Can you generate a prorated invoice for the remainder of our current monthly cycle before switching?", category: "BILLING", baseStatus: "CLOSED", basePriority: "LOW" },
  { title: "VAT not applied on EU invoices", description: "We're a German company and VAT should be applied to our invoices per EU regulations. Our last 6 months of invoices show no VAT. We need corrected invoices for our tax filing.", category: "BILLING", baseStatus: "RESOLVED", basePriority: "HIGH" },
  { title: "Can't update payment method - card keeps failing", description: "I'm trying to update my credit card and getting 'Card verification failed' even though my bank confirmed the card is active and the charge is being approved. Tried Chrome and Firefox.", category: "BILLING", baseStatus: "IN_PROGRESS", basePriority: "HIGH" },
  { title: "Overcharged for API overage", description: "Our usage analytics show we stayed within the 1M API calls included in our plan, but we were charged $87 in overage fees. Can you share the raw usage data showing what triggered the overage?", category: "BILLING", baseStatus: "RESOLVED", basePriority: "MEDIUM" },
  { title: "Request for refund after accidental upgrade", description: "A team member accidentally clicked 'Upgrade to Enterprise' thinking it was a feature preview. We were charged $499 immediately. We need a refund and want to stay on Pro.", category: "BILLING", baseStatus: "RESOLVED", basePriority: "URGENT" },
  { title: "Invoice PDF not generating correctly", description: "When I try to download my invoice as PDF, the file downloads but shows only blank pages. Tried on Windows and Mac, multiple browsers. Other PDF files from our computer work fine.", category: "BILLING", baseStatus: "CLOSED", basePriority: "LOW" },
  { title: "Need itemized breakdown of Pro plan charges", description: "Our finance team needs an itemized breakdown of what's included in the $299/month Pro plan charge for budget approval purposes. Can you send a detailed cost breakdown?", category: "BILLING", baseStatus: "CLOSED", basePriority: "LOW" },

  // ACCOUNT
  { title: "Cannot login to my account after password change", description: "I changed my password yesterday and now I can't login. The reset email never arrives (checked spam). This is urgent — I need account access for a client demo in 2 hours.", category: "ACCOUNT", baseStatus: "OPEN", basePriority: "URGENT" },
  { title: "Account locked after too many login attempts", description: "I forgot my password and now my account appears to be locked after multiple failed attempts. Password reset emails are going to an old email I no longer have access to.", category: "ACCOUNT", baseStatus: "RESOLVED", basePriority: "HIGH" },
  { title: "Need to transfer account ownership", description: "Our account owner (the person who set it up) has left the company. We need to transfer ownership to a new admin. The former owner is no longer reachable.", category: "ACCOUNT", baseStatus: "IN_PROGRESS", basePriority: "HIGH" },
  { title: "2FA locked out - phone lost", description: "I lost my phone and can't access my authenticator app. I also can't find my backup codes. I need emergency access to our company account.", category: "ACCOUNT", baseStatus: "RESOLVED", basePriority: "URGENT" },
  { title: "Permissions not propagating to new sub-users", description: "When I create new sub-users and assign them the Agent role, they can't see the tickets queue even though their role should have that permission. Existing agents aren't affected.", category: "ACCOUNT", baseStatus: "CLOSED", basePriority: "MEDIUM" },
  { title: "Email notifications not being received", description: "I'm not receiving any email notifications for ticket updates despite having them enabled in notification settings. Other team members are receiving them fine. Checked spam and all folders.", category: "ACCOUNT", baseStatus: "RESOLVED", basePriority: "MEDIUM" },
  { title: "Change account email address", description: "I need to change the primary email on my account from my old company email to a new one. The old email domain is being decommissioned in 2 weeks.", category: "ACCOUNT", baseStatus: "CLOSED", basePriority: "MEDIUM" },
  { title: "Account access for departed employee", description: "A former employee still shows as having admin access to our account. We need to revoke their access immediately as they've left under difficult circumstances.", category: "ACCOUNT", baseStatus: "RESOLVED", basePriority: "URGENT" },
  { title: "Profile picture not uploading", description: "When I try to upload a profile photo, I get 'Upload failed' after a few seconds. I've tried JPG files under 2MB. Other users on my team can upload their photos fine.", category: "ACCOUNT", baseStatus: "CLOSED", basePriority: "LOW" },
  { title: "Cannot delete old team member accounts", description: "We have 12 old accounts from former employees that we want to deactivate. The 'Delete User' button is greyed out for these accounts. We need to free up the license seats.", category: "ACCOUNT", baseStatus: "RESOLVED", basePriority: "MEDIUM" },

  // GENERAL
  { title: "How do I export my data to CSV?", description: "I need to export all customer ticket history to CSV for a quarterly report. I've looked through Settings and can't find an export option. Is this available on the Pro plan?", category: "GENERAL", baseStatus: "RESOLVED", basePriority: "LOW" },
  { title: "Feature request: Dark mode for dashboard", description: "Many of our agents work late shifts and the bright interface is causing eye strain. A dark mode toggle would be greatly appreciated. Is this on your roadmap?", category: "GENERAL", baseStatus: "CLOSED", basePriority: "LOW" },
  { title: "What are the SLA guarantees for your API?", description: "We're evaluating SupportAI for an enterprise deployment. Can you share your SLA documentation including uptime guarantee, RTO/RPO, and how you handle planned maintenance?", category: "GENERAL", baseStatus: "RESOLVED", basePriority: "MEDIUM" },
  { title: "Is there a bulk ticket assignment feature?", description: "When a new agent joins, we need to reassign hundreds of tickets from the queue. Currently doing this one by one. Is there a way to bulk-assign tickets to an agent?", category: "GENERAL", baseStatus: "CLOSED", basePriority: "MEDIUM" },
  { title: "GDPR data deletion request", description: "A customer has submitted a GDPR right-to-erasure request. We need to ensure all their data is permanently deleted from your systems as well, as our data processor.", category: "GENERAL", baseStatus: "RESOLVED", basePriority: "HIGH" },
  { title: "Documentation for custom fields API", description: "We want to add custom fields to tickets (e.g., 'customer segment', 'account tier'). I can't find API documentation for custom fields. Do you support this and where are the docs?", category: "GENERAL", baseStatus: "CLOSED", basePriority: "LOW" },
  { title: "How do we set up automatic ticket routing?", description: "We want certain ticket categories to auto-assign to specific agents. For example, all billing tickets should go to our billing team. How do we configure routing rules?", category: "GENERAL", baseStatus: "RESOLVED", basePriority: "MEDIUM" },
  { title: "Request for onboarding call for new team", description: "We just upgraded to Enterprise and have 15 new agents to onboard. Can you schedule an onboarding call with your success team this week to walk through best practices?", category: "GENERAL", baseStatus: "CLOSED", basePriority: "LOW" },
  { title: "Ticket merge feature request", description: "When customers submit duplicate tickets for the same issue, we'd like to be able to merge them into a single ticket. Is this feature available or planned?", category: "GENERAL", baseStatus: "CLOSED", basePriority: "LOW" },
  { title: "HIPAA compliance documentation", description: "We're in the healthcare sector and need to confirm SupportAI is HIPAA compliant before processing any patient-related support tickets. Can you provide your BAA and compliance documentation?", category: "GENERAL", baseStatus: "RESOLVED", basePriority: "HIGH" },
];

// ─── agent response templates ────────────────────────────────────────────────

function getAgentResponse(category: string, status: string): string {
  const responses: Record<string, string[]> = {
    "TECHNICAL_IN_PROGRESS": [
      "Hi! I've reproduced this on our end and I'm escalating to our engineering team right now. Can you also share your account ID and the exact timestamp of failures so we can correlate with our server logs?",
      "Thanks for the detailed report. I've opened an internal incident ticket and our on-call engineer is investigating. I'll update you within 2 hours with findings.",
      "I can see the issue in our logs. It's related to a recent deployment. Our engineers are rolling back now — expect resolution within 30-60 minutes.",
    ],
    "TECHNICAL_RESOLVED": [
      "Great news! Our engineering team identified and fixed the root cause — a race condition in our queue processor. The fix has been deployed and verified. You should no longer see this issue.",
      "This has been resolved. The problem was a misconfigured load balancer rule that was introduced in last Thursday's deployment. Everything is back to normal.",
      "Fixed! Our team added better error handling and retries for this edge case. I've also credited your account for any disruption caused.",
    ],
    "TECHNICAL_CLOSED": [
      "Closing this ticket as the issue has been resolved and verified. We've updated our documentation with guidance to prevent this scenario. Don't hesitate to reach out if you have further questions!",
      "Marking this as closed. Our engineering team has also added monitoring alerts to catch this class of issue earlier in the future. Thanks for the report!",
    ],
    "BILLING_IN_PROGRESS": [
      "I've located the duplicate charge on your account and I'm processing the refund now. You should see the credit back within 3-5 business days. I'll send you a confirmation email.",
      "I can see the billing discrepancy. I'm escalating to our billing team to review and correct this. They'll reach out within 1 business day.",
      "I've pulled up your account and I can see the issue. I'll need to escalate this to our finance team for the correction — I'll follow up with you directly.",
    ],
    "BILLING_RESOLVED": [
      "The correction has been processed! You'll see the credit on your next statement and I've also updated your invoice to reflect the correct amount. A confirmation email is on its way.",
      "Refund processed successfully. It typically takes 3-5 business days to appear depending on your bank. Your account is in good standing.",
      "I've applied the discount retroactively and issued a credit for the difference. Future invoices will automatically reflect the correct price. Thank you for bringing this to our attention.",
    ],
    "BILLING_CLOSED": [
      "This billing matter has been fully resolved. Your account records have been updated and you'll see the correction on your next invoice. Thank you for your patience!",
      "All done! The billing issue is resolved and your account is in order. Feel free to reach out if you have any other questions.",
    ],
    "ACCOUNT_IN_PROGRESS": [
      "I've verified your identity and I'm working on restoring your access now. This will take about 15 minutes. I'll send a new password reset link to your verified backup email.",
      "I've escalated this to our account security team — account ownership transfers require additional verification steps for security purposes. They'll contact you within 4 hours.",
      "I can see your account. I'm setting up an emergency access code now. You'll receive a one-time code via SMS to the phone number on file.",
    ],
    "ACCOUNT_RESOLVED": [
      "Your account access has been fully restored! You should be able to log in now. For security, I've also reset your session tokens and sent a security alert email.",
      "Done! I've transferred account ownership and the new admin has received an invitation email. All permissions are now correctly assigned.",
      "Access restored and email updated. The old email has been removed from our systems. Please enable 2FA on your new account email for added security.",
    ],
    "ACCOUNT_CLOSED": [
      "Everything looks good on our end. Your account is fully functional. Thanks for your patience!",
      "This account issue has been fully resolved. We've also added a note to your account so our team is aware of the context if you reach out again.",
    ],
    "GENERAL_RESOLVED": [
      "I'm glad I could help! I've also forwarded your feature request to our product team — they track these and factor them into the roadmap. Thanks for the suggestion!",
      "Happy to help! I've shared the documentation you need. Let me know if you have any follow-up questions.",
      "Glad that's sorted! I've also flagged this to our documentation team to add a clearer guide for this workflow.",
    ],
    "GENERAL_CLOSED": [
      "Thank you for reaching out. This ticket has been closed. Don't hesitate to open a new one if you need further assistance.",
      "All taken care of! Closing this out. We really appreciate your feedback and patience.",
    ],
  };

  const key = `${category}_${status}`;
  const opts = responses[key] || ["Thank you for your patience. Our team is working on this and will update you shortly."];
  return pick(opts);
}

function getAIResponse(category: string): string {
  const responses: Record<string, string[]> = {
    TECHNICAL: [
      "Hi! I'm the AI assistant. I've reviewed your ticket and it looks like a technical integration issue. While a human engineer reviews this, here are some immediate steps to try: 1) Check our status page for any ongoing incidents, 2) Review the relevant section in our API documentation, 3) Test with minimal reproduction case. I'll have an engineer follow up within the hour for urgent issues.",
      "Thanks for reaching out! I can see this is a technical issue. Based on similar cases, it's often related to configuration or recent changes. Can you confirm: what changed 24-48 hours before the issue started? A human engineer will review this shortly.",
    ],
    BILLING: [
      "Hi! I've received your billing inquiry. For security, our billing team handles all financial matters directly. A billing specialist will review your account and respond within 1 business day. For urgent billing issues, you can also reach us at billing@supportai.dev.",
      "Thanks for flagging this billing concern. I've flagged it as high priority for our billing team. They'll have full visibility into your account transactions and can resolve this quickly.",
    ],
    ACCOUNT: [
      "Hello! I can see you're having trouble with account access. For security reasons, account verification is handled by our human support team. An agent will reach out within 2 hours to verify your identity and restore access. Please have a government ID ready for verification if prompted.",
      "Hi! I've received your account access request. Our security team will reach out shortly. In the meantime, please do NOT share your password with anyone — including our support team. We'll never ask for it.",
    ],
    GENERAL: [
      "Hi! Thanks for reaching out. I've reviewed your question and I'll try to help! You can also check our Knowledge Base at support.supportai.dev for instant answers to common questions. A human agent will follow up if I can't fully address your question.",
      "Hello! Great question. I've checked our knowledge base and found some relevant information. Let me share what I know, and a specialist will follow up if you need more detail.",
    ],
  };

  const opts = responses[category] || ["Thank you for reaching out! A support agent will review your ticket and respond shortly."];
  return pick(opts);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  // Clean
  await prisma.ticketAnalytics.deleteMany();
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.kBArticle.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ────────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash("admin123", 10);
  const agentPw = await bcrypt.hash("agent123", 10);
  const custPw = await bcrypt.hash("customer123", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@support.dev", name: "Alex Admin", passwordHash: adminPw, role: "ADMIN" },
  });
  void admin;

  const agents = await Promise.all([
    prisma.user.create({ data: { email: "sarah@support.dev", name: "Sarah Chen", passwordHash: agentPw, role: "AGENT" } }),
    prisma.user.create({ data: { email: "marcus@support.dev", name: "Marcus Williams", passwordHash: agentPw, role: "AGENT" } }),
    prisma.user.create({ data: { email: "priya@support.dev", name: "Priya Patel", passwordHash: agentPw, role: "AGENT" } }),
  ]);

  const customers = await Promise.all([
    prisma.user.create({ data: { email: "alice@example.com", name: "Alice Johnson", passwordHash: custPw, role: "CUSTOMER" } }),
    prisma.user.create({ data: { email: "bob@example.com", name: "Bob Smith", passwordHash: custPw, role: "CUSTOMER" } }),
    prisma.user.create({ data: { email: "carol@example.com", name: "Carol Davis", passwordHash: custPw, role: "CUSTOMER" } }),
    prisma.user.create({ data: { email: "david@example.com", name: "David Lee", passwordHash: custPw, role: "CUSTOMER" } }),
    prisma.user.create({ data: { email: "emma@example.com", name: "Emma Wilson", passwordHash: custPw, role: "CUSTOMER" } }),
    prisma.user.create({ data: { email: "frank@example.com", name: "Frank Martinez", passwordHash: custPw, role: "CUSTOMER" } }),
    prisma.user.create({ data: { email: "grace@example.com", name: "Grace Kim", passwordHash: custPw, role: "CUSTOMER" } }),
    prisma.user.create({ data: { email: "henry@example.com", name: "Henry Brown", passwordHash: custPw, role: "CUSTOMER" } }),
  ]);

  console.log("✅ Users created (1 admin, 3 agents, 8 customers)");

  // ── KB Articles ──────────────────────────────────────────────────────────
  await prisma.kBArticle.createMany({ data: KB_ARTICLES });
  console.log(`✅ Knowledge base created (${KB_ARTICLES.length} articles)`);

  // ── Tickets ──────────────────────────────────────────────────────────────

  // We'll spread tickets over the last 90 days
  // Distribution: more tickets in recent weeks, fewer in older weeks
  const ticketCreationConfig: Array<{ templateIdx: number; daysAgoRange: [number, number]; agentIdx: number | null; statusOverride?: string; priorityOverride?: string; customerIdx: number }> = [];

  // Build a varied list by cycling through templates and varying dates/agents
  let ticketCount = 0;
  const totalTargetTickets = 120;

  // Day ranges with weights — more recent = more tickets
  const dayRanges: Array<{ val: [number, number]; weight: number }> = [
    { val: [0, 7], weight: 30 },
    { val: [7, 14], weight: 20 },
    { val: [14, 30], weight: 25 },
    { val: [30, 60], weight: 15 },
    { val: [60, 90], weight: 10 },
  ];

  const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
  const statusWeights = [
    { val: "OPEN" as const, weight: 20 },
    { val: "IN_PROGRESS" as const, weight: 15 },
    { val: "RESOLVED" as const, weight: 40 },
    { val: "CLOSED" as const, weight: 25 },
  ];
  const priorityWeights = [
    { val: "LOW" as const, weight: 15 },
    { val: "MEDIUM" as const, weight: 35 },
    { val: "HIGH" as const, weight: 35 },
    { val: "URGENT" as const, weight: 15 },
  ];

  while (ticketCount < totalTargetTickets) {
    const template = TICKET_TEMPLATES[ticketCount % TICKET_TEMPLATES.length];
    const dayRange = weightedPick(dayRanges);
    const agentAssigned = Math.random() > 0.2; // 80% assigned
    const agentIdx = agentAssigned ? Math.floor(Math.random() * agents.length) : null;
    const customerIdx = Math.floor(Math.random() * customers.length);

    // For older tickets, bias toward resolved/closed
    const daysFrom = dayRange[0];
    const statusWeightsAdjusted =
      daysFrom >= 30
        ? [
            { val: "OPEN" as const, weight: 5 },
            { val: "IN_PROGRESS" as const, weight: 5 },
            { val: "RESOLVED" as const, weight: 50 },
            { val: "CLOSED" as const, weight: 40 },
          ]
        : statusWeights;

    ticketCreationConfig.push({
      templateIdx: ticketCount % TICKET_TEMPLATES.length,
      daysAgoRange: dayRange,
      agentIdx,
      customerIdx,
    });
    ticketCount++;
  }
  void statuses;

  let created = 0;
  for (const cfg of ticketCreationConfig) {
    const template = TICKET_TEMPLATES[cfg.templateIdx];
    const dayOffset = Math.floor(Math.random() * (cfg.daysAgoRange[1] - cfg.daysAgoRange[0])) + cfg.daysAgoRange[0];
    const createdAt = daysAgo(dayOffset);

    // Status: use template base but sometimes randomize
    const useTemplateStatus = Math.random() > 0.3;
    let status: string = useTemplateStatus ? template.baseStatus : weightedPick(statusWeights);
    // Older tickets lean resolved
    if (dayOffset >= 30 && status === "OPEN") status = Math.random() > 0.5 ? "RESOLVED" : "CLOSED";
    if (dayOffset >= 30 && status === "IN_PROGRESS") status = Math.random() > 0.5 ? "RESOLVED" : "CLOSED";

    const priority: string = Math.random() > 0.4 ? template.basePriority : weightedPick(priorityWeights);
    const agentId = cfg.agentIdx !== null ? agents[cfg.agentIdx].id : null;
    const customerId = customers[cfg.customerIdx].id;

    // Make title slightly unique if we're repeating templates
    const uniquifier = created > TICKET_TEMPLATES.length ? ` (#${Math.floor(Math.random() * 9000) + 1000})` : "";
    const title = `${template.title}${uniquifier}`;

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: template.description,
        category: template.category,
        status,
        priority,
        userId: customerId,
        agentId,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Initial customer message
    await prisma.message.create({
      data: { ticketId: ticket.id, senderId: customerId, content: template.description, isAI: false, createdAt },
    });

    const responseDelay = minutesAfter(createdAt, 1, 180);

    if (status === "OPEN" && !agentId) {
      // AI first response
      const aiTime = minutesAfter(createdAt, 0, 2);
      await prisma.message.create({
        data: {
          ticketId: ticket.id,
          senderId: null,
          content: getAIResponse(template.category),
          isAI: true,
          createdAt: aiTime,
        },
      });
    } else if (agentId && status !== "OPEN") {
      // Agent response
      await prisma.message.create({
        data: {
          ticketId: ticket.id,
          senderId: agentId,
          content: getAgentResponse(template.category, status),
          isAI: false,
          createdAt: responseDelay,
        },
      });

      // For in_progress, add a customer follow-up
      if (status === "IN_PROGRESS") {
        const followUp = minutesAfter(responseDelay, 30, 240);
        await prisma.message.create({
          data: {
            ticketId: ticket.id,
            senderId: customerId,
            content: pick([
              "Thanks for looking into this. Any update on the timeline?",
              "Appreciate the quick response. Let me know if you need any additional information from our side.",
              "I can provide more details if needed. The issue is still occurring as of this morning.",
              "We're seeing this affecting more users now — please prioritize this.",
            ]),
            isAI: false,
            createdAt: followUp,
          },
        });
      }

      // Analytics for resolved/closed
      const isResolved = status === "RESOLVED" || status === "CLOSED";
      const responseMinutes = Math.floor(
        (responseDelay.getTime() - createdAt.getTime()) / 60000
      );
      const resolutionHours = isResolved
        ? Math.floor(Math.random() * 24) + 1
        : null;

      // Satisfaction scores skewed positive (portfolio looks good)
      const satisfactionScore = isResolved
        ? weightedPick([
            { val: 5, weight: 40 },
            { val: 4, weight: 35 },
            { val: 3, weight: 15 },
            { val: 2, weight: 7 },
            { val: 1, weight: 3 },
          ])
        : null;

      await prisma.ticketAnalytics.create({
        data: {
          ticketId: ticket.id,
          responseTime: responseMinutes,
          resolutionTime: resolutionHours ? resolutionHours * 60 : null,
          satisfactionScore,
        },
      });
    } else if (agentId && status === "OPEN") {
      // Agent assigned but hasn't responded yet
      const aiTime = minutesAfter(createdAt, 0, 1);
      await prisma.message.create({
        data: {
          ticketId: ticket.id,
          senderId: null,
          content: getAIResponse(template.category),
          isAI: true,
          createdAt: aiTime,
        },
      });
    }

    created++;
  }

  console.log(`✅ Created ${created} tickets with messages and analytics`);

  console.log("\n🎉 Database seeded successfully!");
  console.log(`\n📊 Summary:`);
  console.log(`   Users:       1 admin, 3 agents, 8 customers`);
  console.log(`   Tickets:     ${created} across all categories`);
  console.log(`   KB Articles: ${KB_ARTICLES.length}`);
  console.log("\n📋 Demo accounts:");
  console.log("   Admin:    admin@support.dev    / admin123");
  console.log("   Agent:    sarah@support.dev    / agent123");
  console.log("   Customer: alice@example.com    / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

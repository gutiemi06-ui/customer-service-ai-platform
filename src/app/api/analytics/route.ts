import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Exported types (consumed by the dashboard page) ─────────────────────────

export interface MetricCard {
  value: number;
  change: number; // signed %, vs prior 30-day period
}

export interface VolumePoint {
  date: string; // e.g. "Apr 3"
  count: number;
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

export interface AgentBar {
  name: string;
  resolved: number;
  avgHours: number;
}

export interface RecentTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  agentName: string | null;
  createdAt: string;
}

export interface AnalyticsData {
  metrics: {
    totalTickets: MetricCard;
    avgResponseTime: MetricCard; // hours
    resolutionRate: MetricCard; // 0-100
    csat: MetricCard; // 0-5
  };
  volumeChart: VolumePoint[];
  categoryChart: CategorySlice[];
  agentChart: AgentBar[];
  recentTickets: RecentTicket[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctChange(current: number, prior: number): number {
  if (prior === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prior) / prior) * 100);
}

function shortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function avgOf(arr: (number | null)[], key?: never): number {
  const valid = arr.filter((v): v is number => v !== null);
  return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : 0;
}

// ─── GET /api/analytics ───────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "AGENT"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // ── All queries in parallel ───────────────────────────────────────────────
  const [
    allTickets,
    curTickets,
    priorTickets,
    allAnalytics,
    curAnalytics,
    priorAnalytics,
    agentUsers,
    recentRaw,
  ] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        id: true,
        status: true,
        category: true,
        createdAt: true,
        agentId: true,
      },
      orderBy: { createdAt: "asc" },
    }),

    prisma.ticket.findMany({
      where: { createdAt: { gte: d30 } },
      select: { id: true, status: true, createdAt: true, agentId: true },
    }),

    prisma.ticket.findMany({
      where: { createdAt: { gte: d60, lt: d30 } },
      select: { id: true, status: true },
    }),

    prisma.ticketAnalytics.findMany({
      select: {
        ticketId: true,
        resolutionTime: true,
        ticket: { select: { agentId: true } },
      },
    }),

    prisma.ticketAnalytics.findMany({
      where: { ticket: { createdAt: { gte: d30 } } },
      select: { responseTime: true, satisfactionScore: true },
    }),

    prisma.ticketAnalytics.findMany({
      where: { ticket: { createdAt: { gte: d60, lt: d30 } } },
      select: { responseTime: true, satisfactionScore: true },
    }),

    prisma.user.findMany({
      where: { role: { in: ["AGENT", "ADMIN"] } },
      select: { id: true, name: true },
    }),

    prisma.ticket.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        agent: { select: { name: true } },
      },
    }),
  ]);

  // ── Metric 1: Total Tickets ───────────────────────────────────────────────
  const totalTickets: MetricCard = {
    value: allTickets.length,
    change: pctChange(curTickets.length, priorTickets.length),
  };

  // ── Metric 2: Avg Response Time (hours, lower = better) ──────────────────
  const curRespMins = avgOf(curAnalytics.map((a) => a.responseTime));
  const priorRespMins = avgOf(priorAnalytics.map((a) => a.responseTime));
  const curRespHrs = Math.round((curRespMins / 60) * 10) / 10;
  const priorRespHrs = Math.round((priorRespMins / 60) * 10) / 10;
  const avgResponseTime: MetricCard = {
    value: curRespHrs,
    // Invert: improving (lower) time shows as positive green arrow
    change:
      priorRespHrs === 0
        ? 0
        : -Math.round(((curRespHrs - priorRespHrs) / priorRespHrs) * 100),
  };

  // ── Metric 3: Resolution Rate (%) ────────────────────────────────────────
  const isResolved = (s: string) => s === "RESOLVED" || s === "CLOSED";
  const curRate = curTickets.length
    ? Math.round((curTickets.filter((t) => isResolved(t.status)).length / curTickets.length) * 100)
    : 0;
  const priorRate = priorTickets.length
    ? Math.round(
        (priorTickets.filter((t) => isResolved(t.status)).length / priorTickets.length) * 100
      )
    : 0;
  const resolutionRate: MetricCard = { value: curRate, change: pctChange(curRate, priorRate) };

  // ── Metric 4: CSAT (0-5) ─────────────────────────────────────────────────
  const curCSAT = Math.round(avgOf(curAnalytics.map((a) => a.satisfactionScore)) * 10) / 10;
  const priorCSAT = Math.round(avgOf(priorAnalytics.map((a) => a.satisfactionScore)) * 10) / 10;
  const csat: MetricCard = {
    value: curCSAT,
    change: pctChange(Math.round(curCSAT * 10), Math.round(priorCSAT * 10)),
  };

  // ── Volume Chart: rolling 30 days ─────────────────────────────────────────
  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayMap.set(shortDate(d), 0);
  }
  for (const t of curTickets) {
    const key = shortDate(new Date(t.createdAt));
    if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const volumeChart: VolumePoint[] = Array.from(dayMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // ── Category Distribution ─────────────────────────────────────────────────
  const CAT_COLORS: Record<string, string> = {
    TECHNICAL: "#3B82F6",
    BILLING:   "#10B981",
    ACCOUNT:   "#8B5CF6",
    GENERAL:   "#F59E0B",
  };
  const catMap = new Map<string, number>();
  for (const t of allTickets) catMap.set(t.category, (catMap.get(t.category) ?? 0) + 1);
  const categoryChart: CategorySlice[] = Array.from(catMap.entries()).map(([cat, value]) => ({
    name: cat.charAt(0) + cat.slice(1).toLowerCase(),
    value,
    color: CAT_COLORS[cat] ?? "#6B7280",
  }));

  // ── Agent Performance ─────────────────────────────────────────────────────
  const agentNameMap = new Map(agentUsers.map((u) => [u.id, u.name]));
  const agentStats = new Map<
    string,
    { resolved: number; resMins: number; resCount: number }
  >();

  for (const t of allTickets) {
    if (!t.agentId) continue;
    if (!agentStats.has(t.agentId))
      agentStats.set(t.agentId, { resolved: 0, resMins: 0, resCount: 0 });
    const s = agentStats.get(t.agentId)!;
    if (isResolved(t.status)) s.resolved++;
  }
  for (const a of allAnalytics) {
    const agentId = a.ticket?.agentId;
    if (!agentId || !a.resolutionTime) continue;
    const s = agentStats.get(agentId);
    if (s) { s.resMins += a.resolutionTime; s.resCount++; }
  }

  const agentChart: AgentBar[] = Array.from(agentStats.entries())
    .map(([id, s]) => ({
      name: agentNameMap.get(id) ?? "Unknown",
      resolved: s.resolved,
      avgHours: s.resCount > 0 ? Math.round((s.resMins / s.resCount / 60) * 10) / 10 : 0,
    }))
    .filter((a) => a.resolved > 0)
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 8);

  // ── Recent Activity ───────────────────────────────────────────────────────
  const recentTickets: RecentTicket[] = recentRaw.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    category: t.category,
    agentName: t.agent?.name ?? null,
    createdAt: t.createdAt.toISOString(),
  }));

  return NextResponse.json({
    metrics: { totalTickets, avgResponseTime, resolutionRate, csat },
    volumeChart,
    categoryChart,
    agentChart,
    recentTickets,
  } satisfies AnalyticsData);
}

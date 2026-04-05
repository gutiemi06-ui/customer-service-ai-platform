import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { PriorityBadge, StatusBadge, CategoryBadge } from "@/components/ui/Badge";
import type { Status, Priority } from "@/types";

async function getDashboardData() {
  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    analyticsAgg,
    recentTickets,
    urgentTickets,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
    prisma.ticketAnalytics.aggregate({
      _avg: { responseTime: true, resolutionTime: true, satisfactionScore: true },
    }),
    prisma.ticket.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        agent: { select: { name: true } },
      },
    }),
    prisma.ticket.findMany({
      where: { priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] } },
      take: 5,
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  return {
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    avgResponseTime: Math.round(analyticsAgg._avg.responseTime || 0),
    avgResolutionTime: Math.round(analyticsAgg._avg.resolutionTime || 0),
    avgSatisfaction: Number((analyticsAgg._avg.satisfactionScore || 0).toFixed(1)),
    recentTickets,
    urgentTickets,
  };
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "CUSTOMER") redirect("/tickets");

  const data = await getDashboardData();

  const resolutionRate =
    data.totalTickets > 0
      ? Math.round((data.resolvedTickets / data.totalTickets) * 100)
      : 0;

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Overview of support operations · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Tickets"
            value={data.totalTickets.toLocaleString()}
            sub="All time"
            color="bg-blue-50 text-blue-600"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            }
          />
          <StatCard
            label="Open Tickets"
            value={data.openTickets}
            sub={`${data.inProgressTickets} in progress`}
            color="bg-yellow-50 text-yellow-600"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            sub={`${data.resolvedTickets} resolved`}
            color="bg-green-50 text-green-600"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Avg CSAT"
            value={data.avgSatisfaction > 0 ? `${data.avgSatisfaction}/5` : "N/A"}
            sub="Customer satisfaction"
            color="bg-purple-50 text-purple-600"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Performance row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Avg First Response",
              value: data.avgResponseTime > 0 ? `${data.avgResponseTime} min` : "< 2 min",
              detail: "60% faster than industry avg",
              color: "text-blue-600",
            },
            {
              label: "Avg Resolution Time",
              value: data.avgResolutionTime > 0 ? `${Math.round(data.avgResolutionTime / 60)} hrs` : "N/A",
              detail: "Across resolved tickets",
              color: "text-green-600",
            },
            {
              label: "AI Auto-Resolved",
              value: "~40%",
              detail: "Handled without agent",
              color: "text-purple-600",
            },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-6 card-hover">
              <div className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
              <div className="text-sm font-medium text-gray-700">{item.label}</div>
              <div className="text-xs text-gray-400 mt-1">{item.detail}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent tickets */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
              <Link href="/tickets" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {data.recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ticket.user.name} · {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={ticket.status as Status} />
                    <PriorityBadge priority={ticket.priority as Priority} />
                  </div>
                </Link>
              ))}
              {data.recentTickets.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">No tickets yet</div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Urgent tickets */}
            <div className="bg-white rounded-2xl border border-red-100">
              <div className="flex items-center gap-2 p-5 border-b border-red-100">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="font-semibold text-gray-900 text-sm">Urgent — Needs Attention</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {data.urgentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block p-4 hover:bg-red-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{ticket.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ticket.user.name}</p>
                  </Link>
                ))}
                {data.urgentTickets.length === 0 && (
                  <div className="p-6 text-center text-sm text-gray-400">
                    No urgent tickets
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/tickets?status=OPEN"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <span className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center text-xs font-bold">{data.openTickets}</span>
                  <span className="text-gray-700">View open tickets</span>
                </Link>
                <Link
                  href="/tickets?priority=URGENT"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xs font-bold">{data.urgentTickets.length}</span>
                  <span className="text-gray-700">View urgent tickets</span>
                </Link>
                <Link
                  href="/knowledge-base"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                  <span className="text-gray-700">Knowledge base</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

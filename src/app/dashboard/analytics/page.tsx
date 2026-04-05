"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import type { AnalyticsData } from "@/app/api/analytics/route";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function agentBarColor(hours: number): string {
  if (hours === 0) return "#3B82F6";
  if (hours < 2)   return "#10B981";
  if (hours < 6)   return "#F59E0B";
  if (hours < 24)  return "#F97316";
  return "#EF4444";
}

function formatChange(change: number) {
  const isPos = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isPos ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {isPos ? "↑" : "↓"} {Math.abs(change)}%
      <span className="font-normal text-gray-400 ml-1">vs last 30 days</span>
    </span>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(value) ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  OPEN:        "bg-blue-50 text-blue-700 border border-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border border-amber-200",
  RESOLVED:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CLOSED:      "bg-gray-100 text-gray-600 border border-gray-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW:    "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH:   "bg-orange-50 text-orange-700",
  URGENT: "bg-red-50 text-red-700",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function VolumeTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-blue-600">{payload[0].value} tickets</p>
    </div>
  );
}

function AgentTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; payload: { avgHours: number } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const hours = payload[0]?.payload?.avgHours ?? 0;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-gray-700">{payload[0].value} resolved</p>
      <p className="text-gray-500 text-xs">{hours > 0 ? `Avg ${hours}h` : "Time N/A"}</p>
    </div>
  );
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number;
  percent: number; name: string;
}) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={600}>
      {Math.round(percent * 100)}%
    </text>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load analytics");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Last 30 days · Updated just now
            </p>
          </div>
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ── Metric Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* Total Tickets */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Total Tickets</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            </div>
            {loading ? (
              <><Skeleton className="h-8 w-20 mb-2" /><Skeleton className="h-4 w-32" /></>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{data?.metrics.totalTickets.value ?? 0}</p>
                <div className="mt-1">{formatChange(data?.metrics.totalTickets.change ?? 0)}</div>
              </>
            )}
          </div>

          {/* Avg Response Time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Avg Response Time</span>
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {loading ? (
              <><Skeleton className="h-8 w-24 mb-2" /><Skeleton className="h-4 w-32" /></>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {data?.metrics.avgResponseTime.value
                    ? `${data.metrics.avgResponseTime.value}h`
                    : "—"}
                </p>
                <div className="mt-1">{formatChange(data?.metrics.avgResponseTime.change ?? 0)}</div>
              </>
            )}
          </div>

          {/* Resolution Rate */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Resolution Rate</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {loading ? (
              <><Skeleton className="h-8 w-20 mb-2" /><Skeleton className="h-4 w-32" /></>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {data?.metrics.resolutionRate.value ?? 0}%
                </p>
                <div className="mt-1">{formatChange(data?.metrics.resolutionRate.change ?? 0)}</div>
              </>
            )}
          </div>

          {/* CSAT */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Customer Satisfaction</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            {loading ? (
              <><Skeleton className="h-8 w-20 mb-2" /><Skeleton className="h-4 w-32" /></>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {data?.metrics.csat.value ? `${data.metrics.csat.value}/5` : "—"}
                </p>
                {data?.metrics.csat.value ? <StarRating value={data.metrics.csat.value} /> : null}
                <div className="mt-1">{formatChange(data?.metrics.csat.change ?? 0)}</div>
              </>
            )}
          </div>
        </div>

        {/* ── Row 2: Volume Chart + Category Pie ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Volume Line Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900">Ticket Volume</h2>
              <p className="text-xs text-gray-500 mt-0.5">New tickets created per day — last 30 days</p>
            </div>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data?.volumeChart ?? []} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<VolumeTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Pie */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900">By Category</h2>
              <p className="text-xs text-gray-500 mt-0.5">All-time distribution</p>
            </div>
            {loading ? (
              <Skeleton className="h-56 w-full rounded-full" />
            ) : !data?.categoryChart.length ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.categoryChart}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel as never}
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {data.categoryChart.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600 font-medium">{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} tickets`, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Row 3: Agent Performance Bar ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Agent Performance</h2>
              <p className="text-xs text-gray-500 mt-0.5">Resolved tickets per agent · bar colour = avg resolution time</p>
            </div>
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
              {[
                { color: "#10B981", label: "< 2h" },
                { color: "#F59E0B", label: "2–6h" },
                { color: "#F97316", label: "6–24h" },
                { color: "#EF4444", label: "> 24h" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : !data?.agentChart.length ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              No agent data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={data.agentChart} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<AgentTooltip />} cursor={{ fill: "#F8FAFC" }} />
                <Bar dataKey="resolved" radius={[6, 6, 0, 0]} maxBarSize={52}>
                  {(data.agentChart).map((entry, i) => (
                    <Cell key={i} fill={agentBarColor(entry.avgHours)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Row 4: Recent Activity Table ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Latest 10 tickets across all statuses</p>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <Skeleton className="h-4 w-24 flex-shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : !data?.recentTickets.length ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No tickets yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36 hidden md:table-cell">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24 hidden sm:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs text-gray-400">
                          {ticket.id.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-gray-900 line-clamp-1">{ticket.title}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            STATUS_STYLES[ticket.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            PRIORITY_STYLES[ticket.priority] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-gray-600">
                        {ticket.agentName ?? <span className="text-gray-300">Unassigned</span>}
                      </td>
                      <td className="px-6 py-3.5 hidden sm:table-cell text-gray-400 text-xs whitespace-nowrap">
                        {timeAgo(ticket.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40">
            <Link
              href="/tickets"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              View all tickets →
            </Link>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

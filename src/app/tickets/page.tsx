import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { PriorityBadge, StatusBadge, CategoryBadge } from "@/components/ui/Badge";
import type { Status, Priority, Category } from "@/types";

async function getTickets(
  role: string,
  userId: string,
  status?: string,
  category?: string,
  priority?: string
) {
  const where: Record<string, unknown> = {};

  if (role === "CUSTOMER") where.userId = userId;
  else if (role === "AGENT") {
    where.OR = [{ agentId: userId }, { agentId: null }];
  }

  if (status && status !== "ALL") where.status = status as Status;
  if (category && category !== "ALL") where.category = category as Category;
  if (priority && priority !== "ALL") where.priority = priority as Priority;

  return prisma.ticket.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      agent: { select: { id: true, name: true, email: true } },
      _count: { select: { messages: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string; priority?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const tickets = await getTickets(
    session.user.role,
    session.user.id,
    searchParams.status,
    searchParams.category,
    searchParams.priority
  );

  const statusOptions = [
    { value: "ALL", label: "All Statuses" },
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ];

  const categoryOptions = [
    { value: "ALL", label: "All Categories" },
    { value: "TECHNICAL", label: "Technical" },
    { value: "BILLING", label: "Billing" },
    { value: "ACCOUNT", label: "Account" },
    { value: "GENERAL", label: "General" },
  ];

  const priorityOptions = [
    { value: "ALL", label: "All Priorities" },
    { value: "URGENT", label: "Urgent" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
  ];

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {session.user.role === "CUSTOMER" ? "My Tickets" : "All Tickets"}
            </h1>
            <p className="text-gray-500 mt-1">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
              {searchParams.status && searchParams.status !== "ALL"
                ? ` · ${searchParams.status.toLowerCase().replace("_", " ")}`
                : ""}
            </p>
          </div>
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </Link>
        </div>

        {/* Filters */}
        <TicketFilters
          statusOptions={statusOptions}
          categoryOptions={categoryOptions}
          priorityOptions={priorityOptions}
          current={searchParams}
        />

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {tickets.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No tickets found</p>
              <p className="text-gray-400 text-sm mt-1">
                {session.user.role === "CUSTOMER"
                  ? "Submit a ticket and we'll get back to you quickly."
                  : "No tickets match the selected filters."}
              </p>
              <Link
                href="/tickets/new"
                className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm"
              >
                Create a ticket
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Ticket
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                      Category
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Priority
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                      Assigned
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/tickets/${ticket.id}`} className="group">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {ticket.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {ticket.user.name} · {ticket._count.messages} message{ticket._count.messages !== 1 ? "s" : ""}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <CategoryBadge category={ticket.category as Category} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={ticket.status as Status} />
                      </td>
                      <td className="px-4 py-4">
                        <PriorityBadge priority={ticket.priority as Priority} />
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">
                          {ticket.agent?.name || <span className="text-gray-300 italic">Unassigned</span>}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-400">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function TicketFilters({
  statusOptions,
  categoryOptions,
  priorityOptions,
  current,
}: {
  statusOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  current: { status?: string; category?: string; priority?: string };
}) {
  const buildUrl = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (key !== "status" && current.status) params.set("status", current.status);
    if (key !== "category" && current.category) params.set("category", current.category);
    if (key !== "priority" && current.priority) params.set("priority", current.priority);
    if (value !== "ALL") params.set(key, value);
    const qs = params.toString();
    return `/tickets${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {statusOptions.map((opt) => {
        const active = (current.status || "ALL") === opt.value;
        return (
          <Link
            key={opt.value}
            href={buildUrl("status", opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              active ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
      <div className="w-px bg-gray-200 mx-1" />
      {categoryOptions.slice(1).map((opt) => {
        const active = current.category === opt.value;
        return (
          <Link
            key={opt.value}
            href={buildUrl("category", opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              active ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PriorityBadge, StatusBadge, CategoryBadge } from "@/components/ui/Badge";
import type { Status, Priority, Category } from "@/types";
import Link from "next/link";
import { TicketActions } from "@/components/tickets/TicketActions";
import { MessageThread } from "@/components/tickets/MessageThread";
import { AIChat } from "@/components/ai/AIChat";
import { AIKBSuggestions } from "@/components/ai/AIKBSuggestions";

async function getTicket(id: string, userId: string, role: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      agent: { select: { id: true, name: true, email: true } },
      messages: {
        include: { sender: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      analytics: true,
    },
  });

  if (!ticket) return null;
  if (role === "CUSTOMER" && ticket.userId !== userId) return null;

  return ticket;
}

async function getAgents() {
  return prisma.user.findMany({
    where: { role: { in: ["AGENT", "ADMIN"] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [ticket, agents] = await Promise.all([
    getTicket(params.id, session.user.id, session.user.role),
    getAgents(),
  ]);

  if (!ticket) notFound();

  const isStaff = session.user.role === "AGENT" || session.user.role === "ADMIN";
  const isUrgent = ticket.priority === "URGENT";

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        {/* Back link */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/tickets"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All tickets
          </Link>
        </div>

        {/* Success banner */}
        {searchParams.created && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">Ticket submitted successfully!</p>
              <p className="text-xs text-green-600 mt-0.5">Our AI has processed your request. Try the AI Assistant below for instant answers while you wait.</p>
            </div>
          </div>
        )}

        {/* Urgent escalation banner (visible to staff) */}
        {isStaff && isUrgent && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">⚡ Urgent — AI Flagged for Immediate Attention</p>
              <p className="text-xs text-red-600 mt-0.5">Sentiment analysis detected high frustration. This ticket was automatically escalated.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex flex-wrap items-start gap-2 mb-4">
                <StatusBadge status={ticket.status as Status} />
                <PriorityBadge priority={ticket.priority as Priority} />
                <CategoryBadge category={ticket.category as Category} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{ticket.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span>Submitted by <span className="font-medium text-gray-700">{ticket.user.name}</span></span>
                <span>·</span>
                <span>{new Date(ticket.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                {ticket.agent && (
                  <>
                    <span>·</span>
                    <span>Assigned to <span className="font-medium text-gray-700">{ticket.agent.name}</span></span>
                  </>
                )}
              </div>
            </div>

            {/* AI Chat — customers see this; staff may also use it */}
            <AIChat
              ticketTitle={ticket.title}
              ticketDescription={ticket.description}
              ticketCategory={ticket.category}
            />

            {/* Human message thread */}
            <MessageThread
              ticketId={ticket.id}
              messages={ticket.messages}
              currentUserId={session.user.id}
              currentUserName={session.user.name}
              currentUserRole={session.user.role}
              ticketStatus={ticket.status}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions (agent/admin only) */}
            {isStaff && (
              <TicketActions
                ticketId={ticket.id}
                currentStatus={ticket.status}
                currentPriority={ticket.priority}
                currentAgentId={ticket.agentId}
                agents={agents}
                currentUserId={session.user.id}
              />
            )}

            {/* AI KB Suggestions */}
            <AIKBSuggestions
              ticketTitle={ticket.title}
              ticketDescription={ticket.description}
              ticketCategory={ticket.category}
            />

            {/* Ticket details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Ticket Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-500 mb-0.5">Ticket ID</dt>
                  <dd className="text-sm text-gray-700 font-mono">{ticket.id.slice(0, 8)}...</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-0.5">Created</dt>
                  <dd className="text-sm text-gray-700">{new Date(ticket.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-0.5">Last updated</dt>
                  <dd className="text-sm text-gray-700">{new Date(ticket.updatedAt).toLocaleString()}</dd>
                </div>
                {ticket.analytics && (
                  <>
                    {ticket.analytics.responseTime && (
                      <div>
                        <dt className="text-xs text-gray-500 mb-0.5">First response</dt>
                        <dd className="text-sm text-gray-700">{ticket.analytics.responseTime} min</dd>
                      </div>
                    )}
                    {ticket.analytics.resolutionTime && (
                      <div>
                        <dt className="text-xs text-gray-500 mb-0.5">Resolution time</dt>
                        <dd className="text-sm text-gray-700">
                          {ticket.analytics.resolutionTime < 60
                            ? `${ticket.analytics.resolutionTime} min`
                            : `${Math.round(ticket.analytics.resolutionTime / 60)} hrs`}
                        </dd>
                      </div>
                    )}
                    {ticket.analytics.satisfactionScore && (
                      <div>
                        <dt className="text-xs text-gray-500 mb-0.5">CSAT</dt>
                        <dd className="text-sm text-gray-700">
                          {"★".repeat(ticket.analytics.satisfactionScore)}{"☆".repeat(5 - ticket.analytics.satisfactionScore)} ({ticket.analytics.satisfactionScore}/5)
                        </dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

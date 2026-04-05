import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Status } from "@/types";

// GET /api/tickets/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      agent: { select: { id: true, name: true, email: true } },
      messages: {
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      analytics: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  // Check access: customers can only view their own tickets
  if (session.user.role === "CUSTOMER" && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

// PATCH /api/tickets/[id] — update ticket (status, priority, agentId)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, priority, agentId } = body;

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        ...(status && { status: status as Status }),
        ...(priority && { priority }),
        ...(agentId !== undefined && { agentId }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[TICKET PATCH]", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

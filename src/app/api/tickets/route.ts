import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Category, Priority, Status } from "@/types";

// GET /api/tickets — list tickets (filtered by role)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as Status | null;
  const category = searchParams.get("category") as Category | null;
  const priority = searchParams.get("priority") as Priority | null;
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Customers only see their own tickets
  if (session.user.role === "CUSTOMER") {
    where.userId = session.user.id;
  }
  // Agents see their assigned tickets + unassigned
  else if (session.user.role === "AGENT") {
    where.OR = [{ agentId: session.user.id }, { agentId: null }];
  }
  // Admins see all

  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return NextResponse.json({ tickets, total, page, limit });
}

// POST /api/tickets — create a ticket
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, category, priority } = await req.json();

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required." },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        category: category as Category,
        priority: (priority as Priority) || "MEDIUM",
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    // Create the initial customer message
    await prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderId: session.user.id,
        content: description,
        isAI: false,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("[TICKETS POST]", error);
    return NextResponse.json(
      { error: "Failed to create ticket." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Lightweight sentiment analysis (runs server-side, no round-trip to /api/ai/sentiment)
async function analyzeSentiment(
  text: string,
  ticketTitle: string
): Promise<{ shouldEscalate: boolean; sentiment: string }> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 128,
      system:
        "You are a sentiment classifier. Respond ONLY with valid JSON, no explanation.",
      messages: [
        {
          role: "user",
          content: `Classify this customer support message for ticket "${ticketTitle}":
"${text}"

JSON response:
{"sentiment":"positive"|"neutral"|"negative"|"very_negative","shouldEscalate":boolean}

Escalate=true if: highly angry, threatening to cancel/leave, expressing crisis, very urgent language.`,
        },
      ],
    });

    const raw =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { shouldEscalate: false, sentiment: "neutral" };
    return JSON.parse(match[0]);
  } catch {
    return { shouldEscalate: false, sentiment: "neutral" };
  }
}

// POST /api/tickets/[id]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Message content is required." },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    // Customers can only message their own tickets
    if (session.user.role === "CUSTOMER" && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        ticketId: params.id,
        senderId: session.user.id,
        content: content.trim(),
        isAI: false,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
    });

    // Update ticket status if agent is responding
    if (session.user.role === "AGENT" || session.user.role === "ADMIN") {
      await prisma.ticket.update({
        where: { id: params.id },
        data: {
          updatedAt: new Date(),
          ...(ticket.status === "OPEN" && { status: "IN_PROGRESS" }),
          ...(ticket.agentId === null && { agentId: session.user.id }),
        },
      });
    }

    // Run sentiment analysis on CUSTOMER messages (non-blocking — fire and respond)
    if (session.user.role === "CUSTOMER") {
      // Don't await — analyze in background and escalate if needed
      analyzeSentiment(content.trim(), ticket.title).then(async (result) => {
        if (result.shouldEscalate && ticket.priority !== "URGENT") {
          try {
            await prisma.ticket.update({
              where: { id: params.id },
              data: {
                priority: "URGENT",
                updatedAt: new Date(),
              },
            });
            console.log(
              `[SENTIMENT] Ticket ${params.id} escalated to URGENT — sentiment: ${result.sentiment}`
            );
          } catch (err) {
            console.error("[SENTIMENT ESCALATION]", err);
          }
        }
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[MESSAGES POST]", error);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}

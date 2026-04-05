import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mockKBSuggestions } from "@/lib/mock-ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ticketTitle, ticketDescription, ticketCategory } = await req.json();

    if (!ticketTitle) {
      return NextResponse.json(
        { error: "Ticket title is required." },
        { status: 400 }
      );
    }

    // Fetch all KB articles from the database
    const articles = await prisma.kBArticle.findMany({
      select: { id: true, title: true, category: true, content: true },
      orderBy: { views: "desc" },
    });

    if (articles.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Small delay to simulate API call
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 200));

    const suggestions = mockKBSuggestions(
      articles,
      ticketTitle,
      ticketDescription,
      ticketCategory
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[KB SUGGESTIONS POST]", error);
    return NextResponse.json({ suggestions: [] });
  }
}

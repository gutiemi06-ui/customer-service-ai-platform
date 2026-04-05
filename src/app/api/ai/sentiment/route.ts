import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mockAnalyzeSentiment } from "@/lib/mock-ai";

export type { SentimentResult } from "@/lib/mock-ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text, ticketTitle } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    // Small delay to simulate API call
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));

    const result = mockAnalyzeSentiment(text, ticketTitle);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[SENTIMENT POST]", error);
    // Return a safe fallback instead of erroring
    return NextResponse.json({
      sentiment: "neutral",
      score: 0,
      shouldEscalate: false,
      reasoning: "Analysis unavailable",
      emotions: [],
    });
  }
}

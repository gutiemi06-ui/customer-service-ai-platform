import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mockCategorizeTicket } from "@/lib/mock-ai";

export type { CategorizationResult } from "@/lib/mock-ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    // Delay to simulate API call (fires after debounce, feels natural)
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const result = mockCategorizeTicket(title, description);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[CATEGORIZE POST]", error);
    return NextResponse.json(
      { error: "Failed to categorize ticket." },
      { status: 500 }
    );
  }
}

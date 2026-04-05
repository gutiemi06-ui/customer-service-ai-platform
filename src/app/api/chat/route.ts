import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMockChatResponse, delay } from "@/lib/mock-ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { messages, ticketTitle, ticketDescription, ticketCategory } =
      await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the full mock response text
    const fullResponse = getMockChatResponse(messages, ticketTitle, ticketCategory);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Simulate network/thinking delay (1-2 seconds)
          await delay(800 + Math.random() * 600);

          // Stream word-by-word for a natural typing effect
          // Split on spaces but preserve newlines and markdown
          const tokens = fullResponse.split(/(\s+)/);

          for (const token of tokens) {
            if (token === "") continue;

            // Vary speed: slower for words, near-instant for whitespace
            const isWhitespace = /^\s+$/.test(token);
            if (!isWhitespace) {
              await delay(18 + Math.random() * 30);
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: token })}\n\n`)
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("[CHAT STREAM ERROR]", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[CHAT POST]", error);
    return new Response(JSON.stringify({ error: "Failed to process chat." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

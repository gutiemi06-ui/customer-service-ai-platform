"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  createdAt: Date;
  sender: { id: string; name: string; email: string } | null;
}

interface Props {
  ticketId: string;
  messages: Message[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  ticketStatus: string;
}

export function MessageThread({
  ticketId,
  messages,
  currentUserId,
  currentUserName,
  currentUserRole,
  ticketStatus,
}: Props) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isClosed = ticketStatus === "CLOSED" || ticketStatus === "RESOLVED";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    setError("");

    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to send message.");
      return;
    }

    setInput("");
    router.refresh();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-sm">
          Conversation · {messages.length} message{messages.length !== 1 ? "s" : ""}
        </h2>
      </div>

      {/* Messages */}
      <div className="p-5 space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        {messages.map((message) => {
          const isOwn = message.sender?.id === currentUserId;
          const isAI = message.isAI;

          if (isAI) {
            return (
              <div key={message.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-blue-600">AI Assistant</span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Auto</span>
                    <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-sm p-4 text-sm text-gray-700 leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            );
          }

          if (isOwn) {
            return (
              <div key={message.id} className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-semibold">
                  {currentUserName[0].toUpperCase()}
                </div>
                <div className="flex-1 flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
                    <span className="text-xs font-semibold text-gray-700">You</span>
                  </div>
                  <div className="bg-blue-600 rounded-2xl rounded-tr-sm p-4 text-sm text-white leading-relaxed max-w-[85%]">
                    {message.content}
                  </div>
                </div>
              </div>
            );
          }

          // Other person (agent / other customer)
          const senderName = message.sender?.name || "Support Agent";
          const isAgent = !isAI && message.sender !== null;

          return (
            <div key={message.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-gray-600 text-xs font-semibold">
                {senderName[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-gray-700">{senderName}</span>
                  {isAgent && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">Agent</span>
                  )}
                  <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm p-4 text-sm text-gray-700 leading-relaxed max-w-[85%]">
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <div className="p-4 border-t border-gray-100">
          {error && (
            <p className="text-sm text-red-600 mb-2">{error}</p>
          )}
          <form onSubmit={handleSend} className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 resize-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm self-end"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">
            {currentUserRole === "CUSTOMER"
              ? "Our team typically responds within 2 hours."
              : "Responding as a support agent · Ticket will be marked In Progress."}
          </p>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-100 text-center text-sm text-gray-400">
          This ticket is {ticketStatus.toLowerCase()}. Create a new ticket if you need further assistance.
        </div>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

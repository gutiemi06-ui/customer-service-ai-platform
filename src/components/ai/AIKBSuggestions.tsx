"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface KBSuggestion {
  id: string;
  title: string;
  category: string;
  relevance: string;
  preview: string;
}

interface Props {
  ticketTitle: string;
  ticketDescription: string;
  ticketCategory: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  TECHNICAL: "🔧",
  BILLING: "💳",
  ACCOUNT: "👤",
  GENERAL: "💬",
};

export function AIKBSuggestions({
  ticketTitle,
  ticketDescription,
  ticketCategory,
}: Props) {
  const [suggestions, setSuggestions] = useState<KBSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSuggestions() {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/kb-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketTitle,
            ticketDescription,
            ticketCategory,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (!cancelled) setSuggestions(data.suggestions || []);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [ticketTitle, ticketDescription, ticketCategory]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <h3 className="font-semibold text-gray-900 text-sm">
            Finding related articles…
          </h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded-xl animate-pulse"
              style={{ opacity: 1 - i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">📚</span>
          <h3 className="font-semibold text-gray-900 text-sm">
            Related Articles
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          No specific articles matched this ticket.
        </p>
        <Link
          href="/knowledge-base"
          className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
        >
          Browse knowledge base
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">
            AI-Suggested Articles
          </h3>
        </div>
        <span className="text-xs text-gray-400">{suggestions.length} found</span>
      </div>

      {/* Article list */}
      <div className="space-y-2">
        {suggestions.map((article) => (
          <div key={article.id} className="group">
            <button
              type="button"
              onClick={() =>
                setExpanded(expanded === article.id ? null : article.id)
              }
              className="w-full text-left p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
            >
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0 mt-0.5">
                  {CATEGORY_ICONS[article.category] || "📄"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
                    {article.title}
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5 line-clamp-1">
                    {article.relevance}
                  </p>
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${
                    expanded === article.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Expanded preview */}
              {expanded === article.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {article.preview}
                  </p>
                  <Link
                    href="/knowledge-base"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700"
                  >
                    Read full article
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      <Link
        href="/knowledge-base"
        className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        Browse all articles
      </Link>
    </div>
  );
}

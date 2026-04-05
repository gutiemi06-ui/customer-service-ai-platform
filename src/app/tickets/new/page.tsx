"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";

const categories = [
  {
    value: "TECHNICAL",
    label: "Technical Issue",
    desc: "Bugs, API errors, integration problems",
    icon: "🔧",
  },
  {
    value: "BILLING",
    label: "Billing & Payments",
    desc: "Invoices, charges, subscription changes",
    icon: "💳",
  },
  {
    value: "ACCOUNT",
    label: "Account & Access",
    desc: "Login, permissions, account settings",
    icon: "👤",
  },
  {
    value: "GENERAL",
    label: "General Question",
    desc: "How-to questions, feature requests",
    icon: "💬",
  },
];

const priorities = [
  {
    value: "LOW",
    label: "Low",
    desc: "Not urgent, whenever possible",
    color: "border-gray-200 hover:border-gray-400",
    activeColor: "border-gray-600 bg-gray-50",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    desc: "Normal priority",
    color: "border-gray-200 hover:border-blue-400",
    activeColor: "border-blue-500 bg-blue-50",
  },
  {
    value: "HIGH",
    label: "High",
    desc: "Impacting my work",
    color: "border-gray-200 hover:border-orange-400",
    activeColor: "border-orange-500 bg-orange-50",
  },
  {
    value: "URGENT",
    label: "Urgent",
    desc: "Critical, blocking everything",
    color: "border-gray-200 hover:border-red-400",
    activeColor: "border-red-500 bg-red-50",
  },
];

interface AISuggestion {
  category: string;
  confidence: number;
  reasoning: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  });

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDismissed, setAiDismissed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced AI categorization — fires 900ms after the user stops typing
  const triggerAISuggestion = useCallback(
    (title: string, description: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (title.length < 10) {
        setAiSuggestion(null);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setAiLoading(true);
        setAiDismissed(false);
        try {
          const res = await fetch("/api/ai/categorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description }),
          });
          if (!res.ok) throw new Error("Failed");
          const data: AISuggestion = await res.json();
          setAiSuggestion(data);
        } catch {
          setAiSuggestion(null);
        } finally {
          setAiLoading(false);
        }
      }, 900);
    },
    []
  );

  const handleTitleChange = (value: string) => {
    setForm((f) => ({ ...f, title: value }));
    triggerAISuggestion(value, form.description);
  };

  const handleDescriptionChange = (value: string) => {
    setForm((f) => ({ ...f, description: value }));
    triggerAISuggestion(form.title, value);
  };

  const acceptSuggestion = () => {
    if (aiSuggestion) {
      setForm((f) => ({ ...f, category: aiSuggestion.category }));
      setAiDismissed(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to submit ticket.");
      return;
    }

    router.push(`/tickets/${data.id}?created=true`);
  };

  const confidencePct = aiSuggestion
    ? Math.round(aiSuggestion.confidence * 100)
    : 0;
  const suggestedCat = categories.find(
    (c) => c.value === aiSuggestion?.category
  );
  const showBanner =
    aiSuggestion && !aiDismissed && form.category !== aiSuggestion.category;

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/tickets"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Submit a Ticket</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Tell us what&apos;s going on and we&apos;ll help you quickly.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Brief summary
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Can't log in after password reset"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              Be specific — this helps us route your ticket faster.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Detailed description
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={5}
              placeholder="Describe the issue in detail. Include any error messages, steps to reproduce, and what you've already tried."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                What type of issue are you having?
              </label>
              {/* AI loading indicator */}
              {aiLoading && (
                <span className="flex items-center gap-1.5 text-xs text-blue-500">
                  <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  AI analysing…
                </span>
              )}
            </div>

            {/* AI suggestion banner */}
            {showBanner && suggestedCat && (
              <div className="mb-3 flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-900">
                    AI suggests:{" "}
                    <span className="font-bold">
                      {suggestedCat.icon} {suggestedCat.label}
                    </span>
                    <span className="ml-2 text-xs font-normal text-indigo-500">
                      {confidencePct}% confident
                    </span>
                  </p>
                  <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                    {aiSuggestion.reasoning}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={acceptSuggestion}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Accept suggestion
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiDismissed(true)}
                      className="px-3 py-1.5 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Choose manually
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, category: cat.value });
                    setAiDismissed(true);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                    form.category === cat.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {/* AI suggestion ring on the suggested card */}
                  {aiSuggestion?.category === cat.value &&
                    !aiDismissed &&
                    form.category !== cat.value && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                      </span>
                    )}
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="font-medium text-gray-900 text-sm">{cat.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              How urgent is this?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.value })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    form.priority === p.value ? p.activeColor : p.color
                  }`}
                >
                  <div className="font-semibold text-gray-900 text-sm">{p.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={loading || !form.category || !form.title || !form.description}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Submitting…" : "Submit Ticket"}
            </button>
            <Link
              href="/tickets"
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

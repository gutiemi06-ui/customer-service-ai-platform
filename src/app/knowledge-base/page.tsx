import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { CategoryBadge } from "@/components/ui/Badge";
import type { Category } from "@/types";


async function getArticles(category?: string) {
  const where = category && category !== "ALL" ? { category } : {};
  return prisma.kBArticle.findMany({
    where,
    orderBy: { views: "desc" },
  });
}

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const articles = await getArticles(searchParams.category);

  const filtered = searchParams.q
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
          a.content.toLowerCase().includes(searchParams.q!.toLowerCase())
      )
    : articles;

  const categoryFilters = [
    { value: "ALL", label: "All" },
    { value: "TECHNICAL", label: "Technical" },
    { value: "BILLING", label: "Billing" },
    { value: "ACCOUNT", label: "Account" },
    { value: "GENERAL", label: "General" },
  ];

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 mt-1">Browse solutions and guides</p>
        </div>

        {/* Search */}
        <form className="mb-6">
          <div className="relative max-w-lg">
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
        </form>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categoryFilters.map((f) => {
            const active = (searchParams.category || "ALL") === f.value;
            return (
              <a
                key={f.value}
                href={`/knowledge-base${f.value !== "ALL" ? `?category=${f.value}` : ""}${searchParams.q ? `&q=${searchParams.q}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </a>
            );
          })}
        </div>

        {/* Articles grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 card-hover"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="font-semibold text-gray-900 leading-tight">{article.title}</h2>
                <CategoryBadge category={article.category as Category} />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">
                {article.content}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {article.views.toLocaleString()} views
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  {article.helpfulCount.toLocaleString()} helpful
                </span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No articles found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term or category.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

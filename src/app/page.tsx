import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-lg">SupportAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
            <a href="#stats" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Results</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 hero-bg grid-bg">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            AI-powered support, live
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 animate-fade-in-up delay-75">
            Customer support that{" "}
            <span className="gradient-text">resolves itself</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-150">
            SupportAI combines Claude AI with intelligent ticket routing to handle 60% of support queries automatically — so your team can focus on what matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-225">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 font-semibold text-lg transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-0.5"
            >
              Start free trial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 font-semibold text-lg border border-gray-200 transition-all hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5"
            >
              View demo
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4 animate-fade-in-up delay-300">
            Demo: <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">admin@support.dev</code> / <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">admin123</code>
          </p>

          {/* Mini dashboard preview */}
          <div className="mt-16 relative animate-fade-in-up delay-375">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10 pointer-events-none rounded-2xl" style={{top: '60%'}} />
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200 overflow-hidden text-left mx-auto max-w-3xl">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 ml-2 bg-white border border-gray-200 rounded px-3 py-1 text-xs text-gray-400">
                  app.supportai.dev/dashboard
                </div>
              </div>
              {/* Fake dashboard content */}
              <div className="p-5">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Total Tickets", value: "1,284", color: "bg-blue-50 text-blue-600" },
                    { label: "Open", value: "47", color: "bg-yellow-50 text-yellow-600" },
                    { label: "Resolution Rate", value: "87%", color: "bg-green-50 text-green-600" },
                    { label: "CSAT", value: "4.3/5", color: "bg-purple-50 text-purple-600" },
                  ].map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-3">
                      <div className={`w-7 h-7 rounded-lg ${card.color} flex items-center justify-center mb-2`}>
                        <div className="w-3 h-3 rounded-sm bg-current opacity-60" />
                      </div>
                      <div className="text-base font-bold text-gray-900">{card.value}</div>
                      <div className="text-xs text-gray-400">{card.label}</div>
                    </div>
                  ))}
                </div>
                {/* Fake ticket rows */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {[
                    { title: "API rate limit exceeded in production", status: "URGENT", statusColor: "bg-red-100 text-red-700" },
                    { title: "Cannot access account after 2FA reset", status: "HIGH", statusColor: "bg-orange-100 text-orange-700" },
                    { title: "Invoice shows incorrect discount amount", status: "MEDIUM", statusColor: "bg-blue-100 text-blue-700" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-medium text-gray-700">{row.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.statusColor}`}>{row.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "1,000+", label: "Tickets processed", icon: "🎫" },
              { value: "60%", label: "Reduction in response time", icon: "⚡" },
              { value: "4.8/5", label: "Customer satisfaction", icon: "⭐" },
              { value: "< 2 min", label: "AI first response time", icon: "🤖" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="text-3xl">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything your support team needs
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              From ticket creation to resolution, SupportAI handles the entire support lifecycle.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: "AI-Powered Responses",
                description: "Claude AI handles routine queries instantly — password resets, billing questions, how-to guides — with human-like responses, 24/7.",
                color: "blue",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                ),
                title: "Smart Ticket Routing",
                description: "Tickets are automatically categorized by topic and priority, then routed to the most qualified agent based on workload and expertise.",
                color: "purple",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Sentiment Analysis",
                description: "Real-time detection of frustrated customers triggers automatic escalation and priority boosts — before issues become complaints.",
                color: "orange",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Real-Time Analytics",
                description: "Track response times, resolution rates, CSAT scores, and agent performance with dashboards that update in real-time.",
                color: "green",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: "Knowledge Base",
                description: "A searchable library of solutions that the AI uses to give accurate answers. Admins can add and update articles anytime.",
                color: "teal",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: "Role-Based Access",
                description: "Customers, agents, and admins each get a tailored experience. Admins get full analytics, agents see their queue, customers track their tickets.",
                color: "indigo",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all group card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-50 text-${feature.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gray-50 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How SupportAI works
            </h2>
            <p className="text-xl text-gray-500">
              From ticket submission to resolution in minutes, not hours.
            </p>
          </div>
          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Customer submits a ticket",
                description: "Customers describe their issue through the portal or chat. The platform auto-categorizes it by topic and sets priority based on urgency keywords.",
              },
              {
                step: "02",
                title: "AI analyzes and responds",
                description: "Claude AI instantly reviews the ticket against the knowledge base. For common issues, it provides an accurate resolution within seconds. Complex issues are flagged for human review.",
              },
              {
                step: "03",
                title: "Smart escalation when needed",
                description: "If the AI can't fully resolve the issue — or detects frustration — it escalates to the best-matched human agent with full context and suggested responses.",
              },
              {
                step: "04",
                title: "Resolution & learning",
                description: "Once resolved, satisfaction scores feed back into the system. Successful AI resolutions improve the knowledge base. Analytics surface patterns for product improvements.",
              },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to transform your support?
          </h2>
          <p className="text-xl text-gray-500 mb-10">
            Join the demo to explore tickets, analytics, and the AI chatbot in action.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 font-semibold text-lg transition-all shadow-lg shadow-blue-200"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 font-semibold text-lg border border-gray-200 transition-all"
            >
              Sign in to demo
            </Link>
          </div>
          <div className="mt-8 p-4 bg-gray-50 rounded-xl inline-block text-left text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-2">Demo credentials:</p>
            <div className="space-y-1 font-mono text-xs">
              <p>Admin:    admin@support.dev / admin123</p>
              <p>Agent:    sarah@support.dev / agent123</p>
              <p>Customer: alice@example.com / customer123</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-700">SupportAI</span>
          </div>
          <p className="text-sm text-gray-400">
            Built with Next.js 14, Prisma, and Claude AI · Portfolio project
          </p>
        </div>
      </footer>
    </div>
  );
}

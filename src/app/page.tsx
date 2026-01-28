import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Key,
  Wrench,
  FileCheck,
  Shield,
  Bell,
  Smartphone,
  ArrowRight,
  Star,
  Home,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="LetLog"
              width={40}
              height={40}
              className="rounded-xl shadow-lg"
            />
            <span className="font-semibold text-xl tracking-tight">
              <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">
                Let
              </span>
              <span>Log</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Features
            </Link>
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </Link>
            <Link href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors">
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-full px-5">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-full px-5 bg-slate-900 hover:bg-slate-800">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FDF8F6] via-white to-slate-50" />
        <div className="relative container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Stop juggling spreadsheets.{" "}
              <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">
                Start managing.
              </span>
            </h1>
            <p className="mt-8 text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Gas safety expiring? Rent due? Leak reported at 11pm? LetLog keeps everything in one
              place — so you never miss a deadline, lose a document, or chase a contractor again.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 transition-all"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg text-slate-600 hover:text-slate-900"
                >
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#E8998D]/20 via-[#F4A261]/20 to-amber-300/20 rounded-[28px] blur-2xl" />
              <div className="relative bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-slate-400 text-sm ml-2">LetLog Dashboard</span>
                </div>
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {[
                      { label: "Properties", value: "12", icon: Home, color: "terracotta" },
                      { label: "Tenants", value: "8", icon: Key, color: "emerald" },
                      { label: "Open Issues", value: "3", icon: Bell, color: "amber" },
                      { label: "Reminders", value: "2", icon: Shield, color: "blue" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-xl p-4 md:p-5">
                        <stat.icon
                          className={`w-5 h-5 mb-3 ${
                            stat.color === "terracotta"
                              ? "text-[#E8998D]"
                              : stat.color === "emerald"
                                ? "text-emerald-400"
                                : stat.color === "amber"
                                  ? "text-amber-400"
                                  : "text-blue-400"
                          }`}
                        />
                        <div className="text-2xl md:text-3xl font-bold text-white">
                          {stat.value}
                        </div>
                        <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Types */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Everyone wins with LetLog
            </h2>
            <p className="text-slate-600 mt-4 text-lg">
              Landlords save time. Tenants get heard. Contractors get paid.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Home,
                title: "Landlords",
                desc: "Finally, everything in one place",
                color: "terracotta",
                features: [
                  "Track every property, tenant & lease",
                  "Never miss a compliance deadline",
                  "Share documents securely",
                  "Get competitive repair quotes",
                ],
              },
              {
                icon: Key,
                title: "Tenants",
                desc: "No more ignored emails",
                color: "emerald",
                features: [
                  "Report issues with photos in seconds",
                  "Track when repairs are happening",
                  "Access your tenancy documents 24/7",
                  "See exactly what's being done",
                ],
              },
              {
                icon: Wrench,
                title: "Contractors",
                desc: "More jobs, less hassle",
                color: "amber",
                features: [
                  "Get notified of local jobs instantly",
                  "Submit quotes in one click",
                  "Build your reputation with reviews",
                  "Get paid faster",
                ],
              },
            ].map((card, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-[24px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                    card.color === "terracotta"
                      ? "bg-[#F5E6E3]"
                      : card.color === "emerald"
                        ? "bg-emerald-100"
                        : "bg-amber-100"
                  }`}
                >
                  <card.icon
                    className={`w-7 h-7 ${
                      card.color === "terracotta"
                        ? "text-[#C17B6E]"
                        : card.color === "emerald"
                          ? "text-emerald-600"
                          : "text-amber-600"
                    }`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="text-slate-500 mt-2">{card.desc}</p>
                <ul className="mt-6 space-y-3">
                  {card.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-600">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          card.color === "terracotta"
                            ? "bg-[#F5E6E3] text-[#C17B6E]"
                            : card.color === "emerald"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-32 bg-slate-900 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Sound familiar?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              "Scrolling through WhatsApp to find that gas certificate",
              "Chasing tenants for rent with awkward texts",
              "Scrambling to book a gas check before it expires",
              "Calling three contractors for one leaky tap",
            ].map((pain, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-4">😩</div>
                <p className="text-slate-300 text-sm leading-relaxed">{pain}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <p className="text-2xl md:text-3xl font-semibold">There's a better way.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 bg-[#FDFBF9]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Everything in one place
            </h2>
            <p className="text-slate-600 mt-4 text-lg">
              No more spreadsheets. No more WhatsApp chaos. Just clarity.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileCheck,
                title: "Tenancy Management",
                desc: "Every lease, deposit, and tenant detail — organised and searchable. Know exactly what's happening across your portfolio.",
              },
              {
                icon: Shield,
                title: "Document Vault",
                desc: "Upload once, share forever. Tenancy agreements, certificates, inventories — always accessible, always secure.",
              },
              {
                icon: Bell,
                title: "Smart Issue Reporting",
                desc: "Tenants report problems with photos. You see them instantly. No more 'I texted you last week about the boiler.'",
              },
              {
                icon: Wrench,
                title: "Contractor Marketplace",
                desc: "Post a job, get quotes from verified local tradespeople, pick the best one. Simple.",
              },
              {
                icon: FileCheck,
                title: "Compliance Autopilot",
                desc: "Gas safety, EICR, EPC — get reminded before deadlines, not after. Stay legal without the stress.",
              },
              {
                icon: Smartphone,
                title: "Works Everywhere",
                desc: "Desktop, tablet, phone. Check your properties from the sofa, the office, or the beach.",
              },
            ].map((feature, i) => (
              <div key={i} className="flex gap-5 group">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow duration-300">
                  <feature.icon className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden bg-[#FDF8F6] rounded-[28px] p-12 md:p-20 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E8998D]/10 via-transparent to-[#F4A261]/10" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Ready to take control of your properties?
              </h2>
              <p className="text-slate-600 text-lg mb-10 max-w-xl mx-auto">
                Start your free trial today. No credit card required. Set up in under 5 minutes.
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-[#E8998D] to-[#F4A261] text-white hover:opacity-90 shadow-xl shadow-[#E8998D]/20 hover:shadow-2xl hover:shadow-[#E8998D]/30 transition-all"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FDFBF9] border-t border-slate-100/50 py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo.svg" alt="LetLog" width={40} height={40} className="rounded-xl" />
                <span className="font-semibold text-xl">
                  <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">
                    Let
                  </span>
                  <span>Log</span>
                </span>
              </Link>
              <p className="text-slate-500 mt-4 max-w-xs">
                Property management made simple for landlords, tenants, and contractors.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
                <ul className="space-y-3 text-slate-600">
                  <li>
                    <Link href="#features" className="hover:text-slate-900 transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="hover:text-slate-900 transition-colors">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Support</h4>
                <ul className="space-y-3 text-slate-600">
                  <li>
                    <Link href="/contact" className="hover:text-slate-900 transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="hover:text-slate-900 transition-colors">
                      Help Centre
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
                <ul className="space-y-3 text-slate-600">
                  <li>
                    <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-slate-900 transition-colors">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} LetLog. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

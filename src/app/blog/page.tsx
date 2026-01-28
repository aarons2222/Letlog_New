import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function BlogPage() {
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
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">LetLog Blog</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Tips, guides, and insights for landlords, tenants, and property professionals.
          </p>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Coming Soon</h2>
            <p className="text-slate-600 mb-6">
              We're working on helpful content for property management. Check back soon!
            </p>
            <Link href="/">
              <Button className="rounded-full px-6 bg-slate-900 hover:bg-slate-800">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} LetLog. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

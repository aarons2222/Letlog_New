import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    id: "basic",
    name: "Basic",
    description: "For landlords with 1-3 properties",
    price: "£4.99",
    period: "/month",
    features: [
      "Up to 3 properties",
      "Unlimited tenancies",
      "Document storage & sharing",
      "Compliance reminders",
      "Issue tracking",
      "Tenant invitations",
      "Email support",
    ],
    cta: "Start Free Trial",
    ctaLink: "/signup?plan=basic",
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    description: "For landlords with larger portfolios",
    price: "£9.99",
    period: "/month",
    features: [
      "Unlimited properties",
      "Unlimited tenancies",
      "Document storage & sharing",
      "Compliance reminders",
      "Issue tracking",
      "Tenant invitations",
      "Contractor marketplace",
      "Priority support",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    ctaLink: "/signup?plan=premium",
    popular: true,
  },
  {
    id: "contractor",
    name: "Contractor",
    description: "For tradespeople",
    price: "£0",
    period: "",
    features: [
      "Browse available jobs",
      "Submit quotes",
      "Build your reputation",
      "Get reviews from clients",
      "Verified badge (coming soon)",
    ],
    cta: "Get Started",
    ctaLink: "/signup",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="LetLog" width={40} height={40} className="rounded-xl shadow-lg" />
            <span className="font-semibold text-xl tracking-tight">
              <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">Let</span>
              <span>Log</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-full px-5">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-full px-5 bg-slate-900 hover:bg-slate-800">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Free for tenants and contractors. Affordable plans for landlords of any size.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`rounded-2xl relative ${
                  plan.popular 
                    ? 'border-2 border-[#E8998D] shadow-xl' 
                    : 'border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] text-white rounded-full px-4 py-1">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pt-8">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={plan.ctaLink} className="w-full">
                    <Button 
                      className={`w-full rounded-xl ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-[#E8998D] to-[#F4A261] hover:opacity-90' 
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Is there a free trial?",
                a: "Yes! Landlord plans come with a 14-day free trial. No credit card required to start.",
              },
              {
                q: "Can I change plans later?",
                a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "What happens if I exceed my property limit?",
                a: "We'll notify you and give you the option to upgrade. Your existing properties won't be affected.",
              },
              {
                q: "Is my data secure?",
                a: "Yes. We use industry-standard encryption and are fully GDPR compliant. Your data is yours.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to simplify property management?
          </h2>
          <p className="text-slate-600 mb-8">
            Start your free trial today. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8 bg-slate-900 hover:bg-slate-800">
              Get Started Free
            </Button>
          </Link>
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

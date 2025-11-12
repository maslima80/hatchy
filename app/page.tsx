import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, ShoppingBag, Rocket, Check } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F9FF] to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐣</span>
              <span className="text-xl font-bold text-[#6C5CE7]">Hatchy</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-[#6C5CE7] transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium hover:text-[#6C5CE7] transition-colors">
                Pricing
              </a>
              <Link href="/signup">
                <Button>Start Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7] text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Launch your next idea in minutes
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#111] mb-6 leading-tight">
            Launch your next idea
            <br />
            <span className="text-[#6C5CE7]">in minutes</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Add a product, get a store, start selling — no code, no setup.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button size="lg" className="text-base px-8 h-12">
                Start Free →
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-base px-8 h-12">
              Watch Demo
            </Button>
          </div>
          <div className="mt-16 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-2xl max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-[#6C5CE7]/20 to-[#F8F9FF] rounded-lg flex items-center justify-center">
              <p className="text-gray-500 font-medium">Screenshot / Animation Placeholder</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111] mb-4">How it works</h2>
            <p className="text-xl text-gray-600">Three simple steps to launch</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#6C5CE7]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-[#6C5CE7]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Add your product</h3>
              <p className="text-gray-600">Upload photos, set your price, and describe what you're selling.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#6C5CE7]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-[#6C5CE7]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Pick a template</h3>
              <p className="text-gray-600">Choose from beautiful pre-made designs that convert.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#6C5CE7]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-[#6C5CE7]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Go live with Stripe</h3>
              <p className="text-gray-600">Connect Stripe and start accepting payments instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-gradient-to-b from-white to-[#F8F9FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#111] mb-6">Why creators choose Hatchy</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Zap className="w-6 h-6 text-[#6C5CE7]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Launch fast</h3>
                    <p className="text-gray-600">Go from idea to live store in minutes, not weeks.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <ShoppingBag className="w-6 h-6 text-[#6C5CE7]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Manage multiple brands</h3>
                    <p className="text-gray-600">Test different ideas in one place without the complexity.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Check className="w-6 h-6 text-[#6C5CE7]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Keep 100% of your sales</h3>
                    <p className="text-gray-600">Stripe Connect sends payments directly to you. No commissions.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-xl">
              <div className="aspect-square bg-gradient-to-br from-[#6C5CE7]/20 to-[#F8F9FF] rounded-lg flex items-center justify-center">
                <p className="text-gray-500 font-medium">Benefits Illustration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template Previews */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111] mb-4">Beautiful templates</h2>
            <p className="text-xl text-gray-600">Pick the perfect style for your brand</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {["Hotsite", "Mini-Store", "Link-in-Bio"].map((template) => (
              <div key={template} className="rounded-2xl border-2 border-gray-200 bg-white p-6 hover:border-[#6C5CE7] transition-colors cursor-pointer">
                <div className="aspect-[3/4] bg-gradient-to-br from-[#6C5CE7]/10 to-[#F8F9FF] rounded-lg mb-4 flex items-center justify-center">
                  <p className="text-gray-500 font-medium">{template}</p>
                </div>
                <h3 className="font-bold text-lg text-center">{template}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-white to-[#F8F9FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111] mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">No commissions. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: "$19", features: ["1 brand", "Unlimited products", "Basic templates", "Stripe Connect"] },
              { name: "Pro", price: "$39", features: ["3 brands", "Unlimited products", "Premium templates", "Custom domain", "Priority support"], highlight: true },
              { name: "Studio", price: "$79", features: ["Unlimited brands", "Unlimited products", "All templates", "White-label", "API access", "Dedicated support"] },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 p-8 ${
                  plan.highlight ? "border-[#6C5CE7] bg-white shadow-xl scale-105" : "border-gray-200 bg-white"
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-[#6C5CE7]" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-[#111] mb-12 text-center">Frequently asked questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-3">Do I need technical skills?</h3>
              <p className="text-gray-600">
                Not at all! Hatchy is designed for creators, not developers. If you can upload a photo and write a description, you can launch a store.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Where does the money go?</h3>
              <p className="text-gray-600">
                Payments go directly to your Stripe account. We never touch your money. You keep 100% of your sales (minus Stripe's standard processing fees).
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Can I use my own domain?</h3>
              <p className="text-gray-600">
                Yes! Pro and Studio plans include custom domain support. You can use your own domain or a free hatchy.store subdomain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🐣</span>
            <span className="text-xl font-bold">Hatchy</span>
          </div>
          <p className="text-gray-400">
            © 2025 Hatchy. Built with ❤️ by a global team of dreamers and makers.
          </p>
        </div>
      </footer>
    </div>
  );
}

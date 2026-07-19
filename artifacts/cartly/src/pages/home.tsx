import { PageTransition } from "@/components/shared/page-transition";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, CalendarCheck, Store, Sparkles, ArrowRight, CheckCircle2, PartyPopper, Building2, Heart, Gift, Clock3, MessageCircleQuestion } from "lucide-react";
import { useGetTrendingVendors } from "@workspace/api-client-react";
import { VendorCard, VendorCardSkeleton } from "@/components/shared/vendor-card";
import { useState } from "react";

const CATEGORIES = [
  { icon: "🛻", name: "Coffee" },
  { icon: "🍹", name: "Mocktails" },
  { icon: "🥐", name: "Churros" },
  { icon: "☕", name: "Espresso" },
  { icon: "🍋", name: "Lemonade" },
  { icon: "🧇", name: "Mini Donuts" },
  { icon: "🥞", name: "Crepes" },
  { icon: "🌽", name: "Elote" },
  { icon: "🍫", name: "Hot Choco" },
  { icon: "🧃", name: "Juice Bar" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: trendingData, isLoading } = useGetTrendingVendors();
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.append("city", city);
    if (category) params.append("category", category);
    setLocation(`/find-a-cart?${params.toString()}&source=homepage-search`);
  };

  return (
    <PageTransition className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="hero-glow relative overflow-hidden bg-background pb-14 pt-16 md:pb-24 md:pt-24">
        <div className="grain-overlay"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
              <MapPin className="h-4 w-4" />
              Personal cart matching across Chicagoland
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-foreground md:text-7xl lg:text-8xl">
              The memorable part<br className="hidden md:block" /> of your event, <span className="text-primary italic font-normal">found.</span>
            </h1>
            <p className="mx-auto mb-9 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Tell us the cart you have in mind. We personally search for matching Chicago operators and connect you with interested options—free.
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3 max-w-3xl mx-auto bg-card p-3 rounded-3xl md:rounded-full cartly-shadow border border-border/50 mb-10">
              <div className="relative w-full md:flex-1 flex items-center bg-muted/30 rounded-full px-4 py-2 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-colors">
                <MapPin className="text-muted-foreground h-5 w-5 mr-3 shrink-0" />
                <Input 
                  placeholder="Event city (e.g. Chicago)"
                  className="border-none shadow-none focus-visible:ring-0 px-0 h-10 bg-transparent text-base"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="w-full h-[1px] md:w-[1px] md:h-10 bg-border shrink-0 my-1 md:my-0"></div>
              <div className="relative w-full md:flex-1 flex items-center bg-muted/30 rounded-full px-4 py-2 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-colors">
                <Search className="text-muted-foreground h-5 w-5 mr-3 shrink-0" />
                <Input 
                  placeholder="Cart type (e.g. Espresso)"
                  className="border-none shadow-none focus-visible:ring-0 px-0 h-10 bg-transparent text-base"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="w-full md:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-14 text-base font-semibold shadow-md">
                Find my cart
              </Button>
            </form>

            {/* Launch bar */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground md:gap-9">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                <span><strong className="text-foreground font-semibold">No account</strong> required</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span><strong className="text-foreground font-semibold">Personal matching</strong> for your event</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span><strong className="text-foreground font-semibold">Free to request</strong> with no obligation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/80 bg-foreground py-5 text-background">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm font-medium md:text-base">
          <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-accent" /> Weddings</span>
          <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-accent" /> Company events</span>
          <span className="flex items-center gap-2"><PartyPopper className="h-4 w-4 text-accent" /> Birthdays</span>
          <span className="flex items-center gap-2"><Gift className="h-4 w-4 text-accent" /> Showers & celebrations</span>
        </div>
      </section>

      {/* Category Pills */}
      <section className="border-b border-border bg-card py-7">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Popular ideas</p>
              <h2 className="mt-1 font-serif text-2xl font-bold">What sounds good?</h2>
            </div>
            <Link href="/find-a-cart?source=category-strip" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex">Not sure yet <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="flex overflow-x-auto pb-2 hide-scrollbar gap-3 snap-x">
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.name} 
                href={`/find-a-cart?category=${encodeURIComponent(cat.name)}&source=homepage-category`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-background border border-border whitespace-nowrap hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all snap-start font-medium text-sm cartly-shadow"
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-foreground">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Concierge Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Now launching in Chicago</p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-3">One request. A much shorter search.</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">Vended is building Chicago’s curated specialty-cart collection. While profiles are being added, we’ll personally look for carts that fit your event.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <VendorCardSkeleton key={i} />)
            ) : trendingData?.vendors?.length ? (
              trendingData.vendors.slice(0, 4).map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))
            ) : (
              <div className="col-span-full rounded-3xl border border-primary/15 bg-primary/5 px-6 py-12 text-center">
                <h3 className="mb-3 font-serif text-2xl font-bold text-foreground">Looking for something specific?</h3>
                <p className="mx-auto mb-6 max-w-xl text-muted-foreground">Coffee cart for a wedding? Mocktail bar for an office party? Churros after dinner? Send one request and let us start looking.</p>
                <Link href="/find-a-cart?source=homepage-concierge">
                  <Button size="lg" className="rounded-full px-8">Find carts for my event</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">How Vended works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">A simple, human process for hosts and local cart operators.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 md:gap-24 max-w-5xl mx-auto">
            {/* For Customers */}
            <div>
              <h3 className="text-2xl font-serif font-bold text-primary mb-8 border-b border-border pb-4">For Hosts</h3>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-foreground flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-lg">Tell us</h4>
                    <p className="text-muted-foreground">Share your event date, location, guest count, and ideal cart.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-lg">We search</h4>
                    <p className="text-muted-foreground">Vended looks for matching operators and checks interest.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-lg">Celebrate</h4>
                    <p className="text-muted-foreground">We connect you with interested operators so you can compare packages and decide.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Vendors */}
            <div>
              <h3 className="text-2xl font-serif font-bold text-secondary mb-8 border-b border-border pb-4">For Vendors</h3>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-foreground flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-lg">List your cart</h4>
                    <p className="text-muted-foreground">Create a free profile with photos, pricing, and service area. No trial or commission.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-lg">Receive requests</h4>
                    <p className="text-muted-foreground">Get booking requests directly to your dashboard.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-lg">Choose what fits</h4>
                    <p className="text-muted-foreground">Respond only to relevant requests. Vended charges no subscription or commission.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="container mx-auto grid max-w-5xl gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Good to know</p>
            <h2 className="font-serif text-4xl font-bold leading-tight md:text-5xl">Straight answers before you request.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">Vended is new, hands-on, and focused on making the first connection easier.</p>
          </div>
          <div className="divide-y divide-border rounded-3xl border border-border bg-card px-6 cartly-shadow md:px-8">
            {[
              ["Is Vended really free?", "Yes. Hosts pay nothing to request matches, and founding vendor profiles have no subscription or commission."],
              ["Does submitting mean I booked something?", "No. A request only gives us permission to look for interested operators. You decide whether to continue."],
              ["What happens after I submit?", "We review your details, identify relevant operators, check their interest, and follow up with matching options or questions."],
              ["What areas do you cover?", "Vended is currently focused on Chicago and the surrounding suburbs."],
            ].map(([question, answer]) => (
              <div key={question} className="py-6">
                <h3 className="flex items-start gap-3 text-lg font-bold"><MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{question}</h3>
                <p className="ml-8 mt-2 leading-relaxed text-muted-foreground">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-primary/15 bg-primary/5 py-14">
        <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-7 px-4 text-center md:flex-row md:text-left">
          <div>
            <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-primary md:justify-start"><Clock3 className="h-4 w-4" /> Takes about two minutes</div>
            <h2 className="font-serif text-3xl font-bold md:text-4xl">Ready to stop searching?</h2>
            <p className="mt-2 text-muted-foreground">Tell us what would make your event memorable.</p>
          </div>
          <Link href="/find-a-cart?source=homepage-final-cta">
            <Button size="lg" className="h-14 rounded-full px-8 text-base font-semibold">Find my cart <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      {/* CTA for vendors */}
      <section id="vendors" className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Run a specialty cart?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">Join Vended’s founding Chicago collection for free. We’ll help build your profile and send relevant event requests as they arrive.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:info@tryvended.com?subject=Chicago%20Founding%20Vendor">
              <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-8 h-12">
                Apply as a founding vendor
              </Button>
            </a>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-primary-foreground/80 text-sm">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No setup fee</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No commission</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No subscription</span>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

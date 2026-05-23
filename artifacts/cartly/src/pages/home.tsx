import { PageTransition } from "@/components/shared/page-transition";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, CalendarCheck, Store } from "lucide-react";
import { useGetTrendingVendors } from "@workspace/api-client-react";
import { VendorCard, VendorCardSkeleton } from "@/components/shared/vendor-card";
import { useState } from "react";

const CATEGORIES = [
  { icon: "🍵", name: "Matcha" },
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
    setLocation(`/explore?${params.toString()}`);
  };

  return (
    <PageTransition className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16 overflow-hidden bg-background">
        <div className="grain-overlay"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground leading-tight tracking-tight mb-6">
              Book the cart <br className="hidden md:block" />
              <span className="text-primary italic font-normal">everyone's talking about</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              From artisanal matcha bars to late-night churros, discover and book specialty carts for your next event, party, or pop-up.
            </p>
            
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3 max-w-3xl mx-auto bg-card p-3 rounded-3xl md:rounded-full cartly-shadow border border-border/50 mb-10">
              <div className="relative w-full md:flex-1 flex items-center bg-muted/30 rounded-full px-4 py-2 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-colors">
                <MapPin className="text-muted-foreground h-5 w-5 mr-3 shrink-0" />
                <Input 
                  placeholder="City (e.g. Austin)" 
                  className="border-none shadow-none focus-visible:ring-0 px-0 h-10 bg-transparent text-base"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="w-full h-[1px] md:w-[1px] md:h-10 bg-border shrink-0 my-1 md:my-0"></div>
              <div className="relative w-full md:flex-1 flex items-center bg-muted/30 rounded-full px-4 py-2 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-colors">
                <Search className="text-muted-foreground h-5 w-5 mr-3 shrink-0" />
                <Input 
                  placeholder="Cart type (e.g. Matcha)" 
                  className="border-none shadow-none focus-visible:ring-0 px-0 h-10 bg-transparent text-base"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="w-full md:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-14 text-base font-semibold shadow-md">
                Search
              </Button>
            </form>

            {/* Trust bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                <span><strong className="text-foreground font-semibold">50+</strong> carts listed</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span><strong className="text-foreground font-semibold">1,200+</strong> events booked</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span><strong className="text-foreground font-semibold">4.9</strong> avg rating</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Available in <strong className="text-foreground font-semibold">12 cities</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="py-6 border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto pb-2 hide-scrollbar gap-3 snap-x">
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.name} 
                href={`/explore?category=${cat.name}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-background border border-border whitespace-nowrap hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all snap-start font-medium text-sm cartly-shadow"
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-foreground">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">Trending near you</h2>
              <p className="text-muted-foreground text-lg">The most booked and highly rated carts right now.</p>
            </div>
            <Link href="/explore">
              <Button variant="outline" className="hidden md:flex rounded-full border-border hover:bg-accent hover:text-foreground">
                View all carts
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <VendorCardSkeleton key={i} />)
            ) : trendingData?.vendors?.length ? (
              trendingData.vendors.slice(0, 4).map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                No trending carts found at the moment.
              </div>
            )}
          </div>
          
          <div className="mt-8 md:hidden flex justify-center">
            <Link href="/explore">
              <Button variant="outline" className="rounded-full w-full">
                View all carts
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">How Vended works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Whether you're hosting an event or running a cart, we make it seamless.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 md:gap-24 max-w-5xl mx-auto">
            {/* For Customers */}
            <div>
              <h3 className="text-2xl font-serif font-bold text-primary mb-8 border-b border-border pb-4">For Hosts</h3>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-foreground flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-lg">Discover</h4>
                    <p className="text-muted-foreground">Browse curated carts in your city by vibe, price, and category.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-lg">Request</h4>
                    <p className="text-muted-foreground">Send a booking request with your event details and guest count.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1 text-lg">Celebrate</h4>
                    <p className="text-muted-foreground">The vendor confirms, shows up, and elevates your event.</p>
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
                    <p className="text-muted-foreground">Create a beautiful profile with photos, pricing, and service area.</p>
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
                    <h4 className="font-bold text-foreground mb-1 text-lg">Grow your business</h4>
                    <p className="text-muted-foreground">Manage bookings, collect reviews, and build your brand.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for vendors */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Run a specialty cart?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">Join Vended and get your cart in front of thousands of event hosts every month.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-8 h-12">
                List your cart — it's free
              </Button>
            </Link>
            <div className="flex items-center gap-6 text-primary-foreground/70 text-sm">
              <span>✓ No setup fees</span>
              <span>✓ Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}


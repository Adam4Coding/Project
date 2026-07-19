import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto pt-16 pb-24 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 text-primary mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                <path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                <path d="M17 17h-11v-14h-2" />
                <path d="M6 5l14 1l-1 7h-13" />
                <path d="M15 3c-1-1-2-1-3 0s-1 2 0 3s2 1 3 0s1-2 0-3z" className="text-secondary" fill="currentColor" />
              </svg>
              <span className="font-serif font-bold text-lg tracking-tight text-foreground">Vended</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Where discovery meets celebration. The curated marketplace for specialty carts.
            </p>
          </div>
          
          <div>
            <h4 className="font-serif font-semibold mb-4">Discover</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/explore" className="hover:text-primary transition-colors">All Carts</Link></li>
              <li><Link href="/explore?category=Coffee" className="hover:text-primary transition-colors">Coffee Carts</Link></li>
              <li><Link href="/explore?category=Espresso" className="hover:text-primary transition-colors">Espresso Carts</Link></li>
              <li><Link href="/explore?category=Mocktails" className="hover:text-primary transition-colors">Mocktail Bars</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-semibold mb-4">For Vendors</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/signup?role=vendor" className="hover:text-primary transition-colors">List Your Cart</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Vendor Login</Link></li>
              <li><a href="/#vendors" className="hover:text-primary transition-colors">Free Vendor Profiles</a></li>
              <li><Link href="/find-a-cart" className="hover:text-primary transition-colors">Free Host Matching</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="mailto:info@tryvended.com" className="hover:text-primary transition-colors">Contact Support</a></li>
              <li><a href="mailto:info@tryvended.com?subject=Trust%20%26%20Safety" className="hover:text-primary transition-colors">Trust & Safety</a></li>
              <li><a href="mailto:info@tryvended.com?subject=Terms%20of%20Service" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="mailto:info@tryvended.com?subject=Privacy%20Policy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Vended. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Compass, CalendarDays, Heart, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const CATEGORIES = [
  { icon: "🛻", name: "Coffee" },
  { icon: "🍹", name: "Mocktails" },
  { icon: "🥐", name: "Churros" },
  { icon: "☕", name: "Espresso" },
  { icon: "🍋", name: "Lemonade" },
  { icon: "🧇", name: "Mini Donuts" },
  { icon: "🥞", name: "Crepes" },
  { icon: "🌽", name: "Elote" },
];

function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
        <path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
        <path d="M17 17h-11v-14h-2" />
        <path d="M6 5l14 1l-1 7h-13" />
        <path d="M15 3c-1-1-2-1-3 0s-1 2 0 3s2 1 3 0s1-2 0-3z" className="text-secondary" fill="currentColor" />
      </svg>
      <span className="font-serif font-bold text-xl tracking-tight text-foreground">Vended</span>
    </div>
  );
}

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <Link href="/explore" className={`px-3 py-2 rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors ${location === "/explore" ? "text-foreground" : ""}`}>
              Explore
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none">
                  Categories
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 p-2">
                <DropdownMenuItem asChild>
                  <Link href="/explore" className="cursor-pointer flex items-center gap-2 font-medium text-foreground">
                    All Carts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {CATEGORIES.map((cat) => (
                  <DropdownMenuItem key={cat.name} asChild>
                    <Link href={`/explore?category=${cat.name}`} className="cursor-pointer flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      {cat.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/signup?role=vendor" className="px-3 py-2 rounded-lg hover:text-foreground hover:bg-muted/50 transition-colors">
              List your cart
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={user?.role === "vendor" ? "/dashboard/vendor" : "/dashboard/customer"} className="cursor-pointer w-full flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-foreground hover:bg-muted">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/explore" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
            <Compass className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Explore</span>
          </Link>
          {isAuthenticated && user?.role === "customer" && (
            <>
              <Link href="/dashboard/customer?tab=bookings" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
                <CalendarDays className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Bookings</span>
              </Link>
              <Link href="/dashboard/customer?tab=saved" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
                <Heart className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Saved</span>
              </Link>
            </>
          )}
          {isAuthenticated && user?.role === "vendor" && (
            <Link href="/dashboard/vendor" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
              <LayoutDashboard className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </Link>
          )}
          <Link href={isAuthenticated ? (user?.role === "vendor" ? "/dashboard/vendor" : "/dashboard/customer") : "/login"} className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors">
            <User className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">{isAuthenticated ? "Profile" : "Log in"}</span>
          </Link>
        </div>
      </div>
    </>
  );
}

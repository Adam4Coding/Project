import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { PageTransition } from "@/components/shared/page-transition";
import { VendorCard, VendorCardSkeleton } from "@/components/shared/vendor-card";
import { useListVendors, getListVendorsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, MapPin, Frown, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const CATEGORIES = [
  { icon: "🍵", name: "Matcha" },
  { icon: "🍹", name: "Mocktails" },
  { icon: "🥐", name: "Churros" },
  { icon: "☕", name: "Espresso" },
  { icon: "🍋", name: "Lemonade" },
  { icon: "🧇", name: "Mini Donuts" },
  { icon: "🥞", name: "Crepes" },
  { icon: "🌽", name: "Elote" },
];

export default function Explore() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(search);
  
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    city: searchParams.get("city") || "",
    minPrice: 0,
    maxPrice: 2000,
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const newCategory = params.get("category") || "";
    const newCity = params.get("city") || "";
    setFilters(prev => ({
      ...prev,
      category: newCategory,
      city: newCity,
    }));
  }, [search]);

  const { data, isLoading } = useListVendors(
    { 
      category: filters.category || undefined, 
      city: filters.city || undefined,
      minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice < 2000 ? filters.maxPrice : undefined,
    },
    { 
      query: { 
        queryKey: getListVendorsQueryKey({ 
          category: filters.category || undefined, 
          city: filters.city || undefined,
          minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
          maxPrice: filters.maxPrice < 2000 ? filters.maxPrice : undefined,
        }) 
      } 
    }
  );

  const clearFilters = () => {
    setFilters({ category: "", city: "", minPrice: 0, maxPrice: 2000 });
    setLocation("/explore");
  };

  const toggleCategory = (name: string) => {
    const newCat = filters.category === name ? "" : name;
    setFilters(prev => ({ ...prev, category: newCat }));
  };

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif font-bold text-lg mb-4">Filters</h3>
        <div className="space-y-6">

          {/* Category chips */}
          <div className="space-y-3">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = filters.category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* City input */}
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="city" 
                placeholder="Search city..." 
                className="pl-9 bg-background"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
            </div>
          </div>

          {/* Price range */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label>Price Range</Label>
              <span className="text-sm font-medium text-muted-foreground">
                ${filters.minPrice} – ${filters.maxPrice >= 2000 ? "2000+" : filters.maxPrice}
              </span>
            </div>
            <Slider
              defaultValue={[0, 2000]}
              max={2000}
              step={50}
              value={[filters.minPrice, filters.maxPrice]}
              onValueChange={(val) => setFilters({ ...filters, minPrice: val[0], maxPrice: val[1] })}
              className="mt-2"
            />
          </div>
        </div>
      </div>
      
      {(filters.category || filters.city || filters.minPrice > 0 || filters.maxPrice < 2000) && (
        <Button 
          variant="outline" 
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
          onClick={clearFilters}
        >
          <X className="h-3.5 w-3.5" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  const activeFiltersCount = [
    filters.category,
    filters.city,
    filters.minPrice > 0 || filters.maxPrice < 2000,
  ].filter(Boolean).length;

  return (
    <PageTransition className="flex-1 flex flex-col bg-muted/20">
      <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row gap-8">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 bg-card rounded-2xl p-6 border border-border shadow-sm">
            <FilterSidebar />
          </div>
        </aside>

        {/* Mobile Header with Filters */}
        <div className="md:hidden flex items-center justify-between">
          <h1 className="font-serif font-bold text-2xl">Explore Carts</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px]">
              <SheetHeader className="mb-6 text-left">
                <SheetTitle className="font-serif text-xl">Filter Carts</SheetTitle>
              </SheetHeader>
              <FilterSidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <h1 className="font-serif font-bold text-3xl text-foreground">Explore Carts</h1>
              {filters.category && (
                <p className="text-muted-foreground text-sm mt-1">
                  Showing results for <span className="font-medium text-primary">{filters.category}</span>
                  <button onClick={() => setFilters(p => ({ ...p, category: "" }))} className="ml-2 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3 inline" />
                  </button>
                </p>
              )}
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              {data?.total !== undefined ? `${data.total} carts found` : ""}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <VendorCardSkeleton key={i} />
              ))}
            </div>
          ) : data?.vendors?.length ? (
            <div className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.vendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
              {data.vendors.length < (data.total || 0) && (
                <div className="flex justify-center">
                  <Button variant="outline" size="lg" className="rounded-full px-8">
                    Load more carts
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-dashed border-border p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <Frown className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-xl mb-2">No carts found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                We couldn't find any carts matching your filters. Try a different category or city.
              </p>
              <Button onClick={clearFilters} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                Clear all filters
              </Button>
            </div>
          )}
        </main>

      </div>
    </PageTransition>
  );
}


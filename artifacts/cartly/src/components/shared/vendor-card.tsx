import { Link } from "wouter";
import type { VendorSummary } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleSavedVendor } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useState } from "react";

interface VendorCardProps {
  vendor: VendorSummary;
  isSaved?: boolean;
}

export function VendorCard({ vendor, isSaved: initialIsSaved = false }: VendorCardProps) {
  const { isAuthenticated } = useAuth();
  const toggleSaved = useToggleSavedVendor();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error("Please log in to save carts");
      return;
    }
    
    // Optimistic update
    setIsSaved(!isSaved);
    
    toggleSaved.mutate(
      { vendorId: vendor.id },
      {
        onError: () => {
          setIsSaved(isSaved);
          toast.error("Failed to save cart");
        }
      }
    );
  };

  return (
    <Link href={`/vendor/${vendor.id}`} className="group block">
      <div className="bg-card rounded-2xl overflow-hidden border border-border cartly-card-hover h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {vendor.coverPhoto ? (
            <img 
              src={vendor.coverPhoto} 
              alt={vendor.cartName} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-accent/50">
              No image
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className={`absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background ${isSaved ? 'text-secondary' : 'text-muted-foreground'}`}
            onClick={handleSave}
          >
            <Heart className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </Button>
          
          <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground hover:bg-secondary border-none rounded-full px-3 py-0.5 font-medium shadow-sm">
            {vendor.category}
          </Badge>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif font-bold text-xl text-foreground line-clamp-1">{vendor.cartName}</h3>
            {vendor.avgRating !== undefined && vendor.avgRating > 0 && (
              <div className="flex items-center gap-1 text-sm font-medium">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>{vendor.avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center text-muted-foreground text-sm mb-4">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            <span className="line-clamp-1">{vendor.city}</span>
          </div>
          
          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">From </span>
              <span className="font-bold text-foreground">${vendor.startingPrice || 0}</span>
            </div>
            
            <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-5">
              Book
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function VendorCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border h-full flex flex-col">
      <div className="aspect-[4/3] bg-muted animate-pulse"></div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="h-6 bg-muted animate-pulse rounded w-2/3 mb-3"></div>
        <div className="h-4 bg-muted animate-pulse rounded w-1/3 mb-4"></div>
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <div className="h-5 bg-muted animate-pulse rounded w-1/4"></div>
          <div className="h-8 bg-muted animate-pulse rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );
}

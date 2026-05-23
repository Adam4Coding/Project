import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { PageTransition } from "@/components/shared/page-transition";
import { VendorCard, VendorCardSkeleton } from "@/components/shared/vendor-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useGetMyBookings, useGetSavedVendors, useCreateReview, getGetMyBookingsQueryKey, getGetSavedVendorsQueryKey } from "@workspace/api-client-react";
import { Star, Calendar, MapPin, Users, HeartCrack, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/utils";

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");

  const { data: bookingsData, isLoading: isLoadingBookings } = useGetMyBookings(
    { query: { enabled: isAuthenticated && user?.role === "customer", queryKey: getGetMyBookingsQueryKey() } }
  );
  
  const { data: savedData, isLoading: isLoadingSaved } = useGetSavedVendors(
    { query: { enabled: isAuthenticated && user?.role === "customer", queryKey: getGetSavedVendorsQueryKey() } }
  );

  const createReview = useCreateReview();

  if (!isAuthenticated || user?.role !== "customer") {
    setLocation("/login");
    return null;
  }

  const handleReviewSubmit = () => {
    if (!reviewBookingId) return;
    
    createReview.mutate(
      { data: { bookingId: reviewBookingId, rating, body: reviewBody } },
      {
        onSuccess: () => {
          toast.success("Review submitted successfully!");
          setReviewBookingId(null);
          setReviewBody("");
          setRating(5);
          queryClient.invalidateQueries({ queryKey: getGetMyBookingsQueryKey() });
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Failed to submit review"));
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Confirmed 🟢</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">Pending 🟡</Badge>;
      case "declined":
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">Declined 🔴</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageTransition className="flex-1 bg-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage your bookings and saved carts.</p>
        </div>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="bg-card border border-border p-1 rounded-xl mb-8 w-full justify-start h-auto overflow-x-auto">
            <TabsTrigger value="bookings" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
              Saved Carts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {isLoadingBookings ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-card rounded-2xl border border-border animate-pulse"></div>
                ))}
              </div>
            ) : bookingsData?.bookings && bookingsData.bookings.length > 0 ? (
              <div className="space-y-4">
                {bookingsData.bookings.map((booking) => (
                  <div key={booking.id} className="bg-card rounded-2xl border border-border p-6 cartly-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-serif font-bold text-xl">{booking.vendorCartName}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-primary" />
                          {new Date(booking.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-primary" />
                          {booking.location}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-primary" />
                          {booking.guestCount} guests
                        </div>
                      </div>
                      
                      {booking.vendorNote && (
                        <div className="text-sm bg-muted/50 p-3 rounded-lg mt-2 border border-border/50">
                          <span className="font-medium text-foreground">Vendor Note:</span> {booking.vendorNote}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <Button variant="outline" className="w-full" onClick={() => setLocation(`/vendor/${booking.vendorId}`)}>
                        View Cart
                      </Button>
                      
                      {booking.status === "confirmed" && new Date(booking.eventDate) < new Date() && !booking.hasReview && (
                        <Dialog open={reviewBookingId === booking.id} onOpenChange={(open) => !open && setReviewBookingId(null)}>
                          <DialogTrigger asChild>
                            <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={() => setReviewBookingId(booking.id)}>
                              Leave Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle className="font-serif text-2xl">Review {booking.vendorCartName}</DialogTitle>
                              <DialogDescription>
                                Share your experience to help others discover great carts.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                  >
                                    <Star className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`} />
                                  </button>
                                ))}
                              </div>
                              <Textarea
                                placeholder="What did you love about this cart? Was the service great?"
                                className="resize-none h-32"
                                value={reviewBody}
                                onChange={(e) => setReviewBody(e.target.value)}
                              />
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setReviewBookingId(null)}>Cancel</Button>
                              <Button type="button" onClick={handleReviewSubmit} className="bg-primary hover:bg-primary/90" disabled={createReview.isPending}>
                                {createReview.isPending ? "Submitting..." : "Submit Review"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-xl mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">You haven't requested any carts yet. Explore our curated selection to find the perfect addition to your next event.</p>
                <Button onClick={() => setLocation("/explore")} className="bg-primary hover:bg-primary/90 rounded-full px-8">
                  Explore Carts
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {isLoadingSaved ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => <VendorCardSkeleton key={i} />)}
              </div>
            ) : savedData?.vendors && savedData.vendors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedData.vendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} isSaved={true} />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-4">
                  <HeartCrack className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-xl mb-2">No saved carts</h3>
                <p className="text-muted-foreground mb-6 max-w-md">Save your favorite carts to easily find them later when you're planning an event.</p>
                <Button onClick={() => setLocation("/explore")} className="bg-primary hover:bg-primary/90 rounded-full px-8">
                  Explore Carts
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}

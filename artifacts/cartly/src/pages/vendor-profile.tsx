import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { useGetVendor, useGetVendorReviews, useToggleSavedVendor, useCreateBooking, getGetVendorQueryKey } from "@workspace/api-client-react";
import { Star, MapPin, Heart, Share, ShieldCheck, ChevronRight, Calendar, Users, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

const bookingSchema = z.object({
  eventDate: z.string().min(1, "Please select an event date"),
  eventType: z.string().min(1, "Please select an event type"),
  guestCount: z.coerce.number().min(1, "Guest count must be at least 1"),
  location: z.string().min(2, "Please enter the venue/location"),
  message: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function VendorProfile() {
  const [, params] = useRoute("/vendor/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const vendorId = Number(params?.id);
  
  const { data: vendorData, isLoading: isVendorLoading } = useGetVendor(
    vendorId,
    { query: { enabled: !!vendorId, queryKey: getGetVendorQueryKey(vendorId) } }
  );
  
  const { data: reviewsData } = useGetVendorReviews(
    vendorId,
    { query: { enabled: !!vendorId } }
  );
  
  const toggleSaved = useToggleSavedVendor();
  const createBooking = useCreateBooking();
  
  const [isSaved, setIsSaved] = useState(vendorData?.vendor.isSaved || false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      eventDate: "",
      eventType: "",
      guestCount: 50,
      location: "",
      message: "",
    },
  });

  const handleSave = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save carts");
      setLocation("/login");
      return;
    }
    
    setIsSaved(!isSaved);
    toggleSaved.mutate(
      { vendorId },
      {
        onError: () => {
          setIsSaved(isSaved);
          toast.error("Failed to save cart");
        }
      }
    );
  };

  const onSubmitBooking = (data: BookingFormValues) => {
    if (!isAuthenticated) {
      toast.error("Please log in to request a booking");
      setLocation("/login");
      return;
    }

    createBooking.mutate(
      { data: { ...data, vendorId } },
      {
        onSuccess: () => {
          setIsBookingOpen(false);
          toast.success("Booking request sent! The vendor will review it shortly.");
          form.reset();
        },
        onError: (err) => {
          toast.error(err.data?.message || "Failed to send booking request");
        }
      }
    );
  };

  if (isVendorLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!vendorData?.vendor) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-serif mb-2">Cart not found</h2>
          <Link href="/explore"><Button variant="outline">Back to explore</Button></Link>
        </div>
      </div>
    );
  }

  const vendor = vendorData.vendor;
  const reviews = reviewsData?.reviews || [];

  return (
    <PageTransition className="flex-1 bg-background pb-24">
      {/* Cover Photo */}
      <div className="h-[40vh] md:h-[50vh] relative bg-muted w-full">
        {vendor.coverPhoto ? (
          <img src={vendor.coverPhoto} alt={vendor.cartName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl">No cover photo</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="text-white">
                <Badge className="bg-secondary hover:bg-secondary text-white border-none rounded-full px-3 py-1 mb-4 shadow-sm">
                  {vendor.category}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2 tracking-tight">{vendor.cartName}</h1>
                <div className="flex items-center text-white/90 gap-4 text-sm font-medium">
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {vendor.city}</div>
                  <div className="flex items-center"><Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" /> {vendor.avgRating > 0 ? vendor.avgRating.toFixed(1) : "New"} ({vendor.totalReviews} reviews)</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
                  onClick={() => toast.success("Link copied!")}
                >
                  <Share className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`rounded-full bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 ${isSaved ? "text-secondary" : "text-white"}`}
                  onClick={handleSave}
                >
                  <Heart className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About */}
            <section>
              <h2 className="text-2xl font-serif font-bold mb-4">About this cart</h2>
              <div className="prose prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
                <p>{vendor.bio || "No description provided."}</p>
              </div>
            </section>

            {/* Gallery */}
            {vendor.galleryPhotos && vendor.galleryPhotos.length > 0 && (
              <section>
                <h2 className="text-2xl font-serif font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {vendor.galleryPhotos.map((photo, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-muted">
                      <img src={photo} alt="Gallery image" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold">Reviews</h2>
                <div className="flex items-center gap-1 font-medium">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg">{vendor.avgRating > 0 ? vendor.avgRating.toFixed(1) : "No rating"}</span>
                  <span className="text-muted-foreground">({vendor.totalReviews})</span>
                </div>
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-border last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-foreground">{review.customerName || "Customer"}</div>
                        <div className="flex text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "fill-muted text-muted"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">{review.body}</p>
                      <div className="text-xs text-muted-foreground/60">{new Date(review.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
                  No reviews yet. Be the first to book and review!
                </div>
              )}
            </section>
          </div>

          {/* Sticky Booking Sidebar */}
          <div className="lg:col-span-1 relative">
            <div className="sticky top-24 bg-card border border-border rounded-3xl p-6 cartly-shadow">
              <div className="mb-6">
                <div className="text-3xl font-serif font-bold text-foreground mb-1">
                  ${vendor.startingPrice || 0}<span className="text-lg text-muted-foreground font-sans font-normal"> starting</span>
                </div>
                <p className="text-sm text-muted-foreground">Perfect for parties, pop-ups, and corporate events.</p>
              </div>

              {vendor.packages && vendor.packages.length > 0 && (
                <div className="mb-8 space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Pricing Packages</h3>
                  {vendor.packages.map((pkg, i) => (
                    <div key={i} className="bg-muted/30 rounded-xl p-4 border border-border/50">
                      <div className="flex justify-between font-bold text-foreground mb-1">
                        <span>{pkg.name}</span>
                        <span>${pkg.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{pkg.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                    Book This Cart
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Request to book {vendor.cartName}</DialogTitle>
                    <DialogDescription>
                      Fill out your event details. The vendor will review and confirm availability.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitBooking)} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="eventDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} className="bg-background" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="guestCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Guest Count</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} className="bg-background" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="eventType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Birthday">Birthday Party</SelectItem>
                                <SelectItem value="Wedding">Wedding</SelectItem>
                                <SelectItem value="Corporate">Corporate Event</SelectItem>
                                <SelectItem value="Baby Shower">Baby Shower</SelectItem>
                                <SelectItem value="Pop-up">Brand Pop-up</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location / Venue</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Backyard, Office Building, Park" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message for Vendor (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any special requests, allergies, or details about the vibe?" 
                                className="resize-none bg-background h-24"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsBookingOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createBooking.isPending} className="bg-primary hover:bg-primary/90">
                          {createBooking.isPending ? "Sending..." : "Send Request"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground border-t border-border pt-6">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <p>Vended Secure Booking guarantees peace of mind.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}


import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetVendorStats, 
  useGetBookingRequests, 
  useRespondToBooking, 
  useGetMyVendorProfile, 
  useUpdateMyVendorProfile, 
  getGetBookingRequestsQueryKey,
  getGetVendorStatsQueryKey,
  getGetMyVendorProfileQueryKey
} from "@workspace/api-client-react";
import { Star, Calendar, Users, Eye, TrendingUp, Check, X as XIcon, Settings, Image as ImageIcon, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getApiErrorMessage } from "@/lib/utils";

const profileSchema = z.object({
  cartName: z.string().min(2, "Name is required"),
  category: z.string().min(2, "Category is required"),
  bio: z.string().optional(),
  city: z.string().min(2, "City is required"),
  startingPrice: z.coerce.number().min(0).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * (end - start) + start));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{count}</>;
}

export default function VendorDashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isLoadingAuth, user, vendorProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const [declineBookingId, setDeclineBookingId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const { data: statsData, isLoading: isLoadingStats } = useGetVendorStats(
    { query: { enabled: isAuthenticated && user?.role === "vendor", queryKey: getGetVendorStatsQueryKey() } }
  );
  
  const { data: bookingsData, isLoading: isLoadingBookings } = useGetBookingRequests(
    { query: { enabled: isAuthenticated && user?.role === "vendor", queryKey: getGetBookingRequestsQueryKey() } }
  );

  const { data: profileData, isLoading: isLoadingProfile } = useGetMyVendorProfile(
    { query: { enabled: isAuthenticated && user?.role === "vendor", queryKey: getGetMyVendorProfileQueryKey() } }
  );

  const respondToBooking = useRespondToBooking();
  const updateProfile = useUpdateMyVendorProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      cartName: "",
      category: "",
      bio: "",
      city: "",
      startingPrice: 0,
    },
  });

  useEffect(() => {
    if (profileData?.vendor) {
      form.reset({
        cartName: profileData.vendor.cartName,
        category: profileData.vendor.category,
        bio: profileData.vendor.bio || "",
        city: profileData.vendor.city,
        startingPrice: profileData.vendor.startingPrice || 0,
      });
    }
  }, [profileData, form]);

  if (isLoadingAuth) {
    return (
      <PageTransition className="flex-1 bg-muted/20 py-8">
        <div className="container mx-auto px-4 max-w-6xl text-muted-foreground">Loading your dashboard...</div>
      </PageTransition>
    );
  }

  if (!isAuthenticated || user?.role !== "vendor") {
    setLocation("/login");
    return null;
  }

  // Redirect to onboarding if not complete
  if (vendorProfile && !vendorProfile.onboardingComplete) {
    setLocation("/onboarding");
    return null;
  }

  const handleRespond = (id: number, status: "confirmed" | "declined", note?: string) => {
    respondToBooking.mutate(
      { id, data: { status, vendorNote: note } },
      {
        onSuccess: () => {
          toast.success(`Booking ${status}`);
          setDeclineBookingId(null);
          setDeclineReason("");
          queryClient.invalidateQueries({ queryKey: getGetBookingRequestsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetVendorStatsQueryKey() });
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Failed to update booking"));
        }
      }
    );
  };

  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfile.mutate(
      { data },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
          queryClient.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() });
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Failed to update profile"));
        }
      }
    );
  };

  return (
    <PageTransition className="flex-1 bg-muted/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">Your Cart Dashboard</h1>
            <p className="text-muted-foreground text-lg">See new booking requests and keep your free public profile up to date.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setLocation(`/vendor/${profileData?.vendor?.id}`)}>
            <Eye className="w-4 h-4" /> View Public Profile
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-6 border border-border cartly-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Bookings</h3>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-serif font-bold">
              {isLoadingStats ? "-" : <AnimatedCounter value={statsData?.totalBookings || 0} />}
            </div>
          </div>
          <div className="bg-card rounded-2xl p-6 border border-border cartly-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            </div>
            <div className="text-3xl font-serif font-bold">
              {isLoadingStats ? "-" : <AnimatedCounter value={statsData?.pendingRequests || 0} />}
            </div>
          </div>
          <div className="bg-card rounded-2xl p-6 border border-border cartly-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Profile Views</h3>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-serif font-bold">
              {isLoadingStats ? "-" : <AnimatedCounter value={statsData?.profileViews || 0} />}
            </div>
          </div>
          <div className="bg-card rounded-2xl p-6 border border-border cartly-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Avg Rating</h3>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="text-3xl font-serif font-bold">
              {isLoadingStats ? "-" : (statsData?.avgRating ? statsData.avgRating.toFixed(1) : "New")}
            </div>
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="bg-card border border-border p-1 rounded-xl mb-8 w-full justify-start h-auto overflow-x-auto">
            <TabsTrigger value="requests" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
              Booking Requests
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
              Your Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
              Free Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <div className="bg-card rounded-2xl border border-border overflow-hidden cartly-shadow">
              {isLoadingBookings ? (
                <div className="p-8 text-center text-muted-foreground animate-pulse">Loading requests...</div>
              ) : bookingsData?.bookings && bookingsData.bookings.length > 0 ? (
                <div className="divide-y divide-border">
                  {bookingsData.bookings.map((booking) => (
                    <div key={booking.id} className="p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{booking.customerName || "Customer"}</h3>
                            {booking.status === "pending" && <Badge className="bg-amber-500/10 text-amber-600 border-none">Pending</Badge>}
                            {booking.status === "confirmed" && <Badge className="bg-emerald-500/10 text-emerald-600 border-none">Confirmed</Badge>}
                            {booking.status === "declined" && <Badge className="bg-red-500/10 text-red-600 border-none">Declined</Badge>}
                          </div>
                          {(booking as { customerEmail?: string }).customerEmail && (
                            <a
                              href={`mailto:${(booking as { customerEmail?: string }).customerEmail}`}
                              className="text-sm font-medium text-primary hover:underline mb-4 inline-block"
                            >
                              {(booking as { customerEmail?: string }).customerEmail}
                            </a>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary/70" />
                              {new Date(booking.eventDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary/70" />
                              {booking.location}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary/70" />
                              {booking.guestCount} guests
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-normal">{booking.eventType}</Badge>
                            </div>
                          </div>
                          
                          {booking.message && (
                            <div className="bg-muted/50 p-3 rounded-lg text-sm border border-border/50 max-w-2xl">
                              <span className="font-semibold text-foreground">Message:</span> "{booking.message}"
                            </div>
                          )}
                          
                          {booking.vendorNote && booking.status !== "pending" && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Your note:</span> {booking.vendorNote}
                            </div>
                          )}
                        </div>
                        
                        {booking.status === "pending" && (
                          <div className="flex flex-col gap-2 min-w-[140px] shrink-0">
                            {declineBookingId === booking.id ? (
                              <div className="space-y-2 bg-card p-3 rounded-xl border border-border shadow-sm animate-in fade-in zoom-in duration-200">
                                <Label className="text-xs">Reason for declining</Label>
                                <Input 
                                  size={1} 
                                  placeholder="e.g. Already booked" 
                                  className="h-8 text-sm"
                                  value={declineReason}
                                  onChange={(e) => setDeclineReason(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => setDeclineBookingId(null)}>Cancel</Button>
                                  <Button size="sm" variant="destructive" className="flex-1 h-8" onClick={() => handleRespond(booking.id, "declined", declineReason)}>Confirm</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Button 
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                                  onClick={() => handleRespond(booking.id, "confirmed")}
                                  disabled={respondToBooking.isPending}
                                >
                                  <Check className="w-4 h-4" /> Accept
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                                  onClick={() => setDeclineBookingId(booking.id)}
                                  disabled={respondToBooking.isPending}
                                >
                                  <XIcon className="w-4 h-4" /> Decline
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif font-bold text-xl mb-2">No booking requests yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    When customers ask to book your cart, their requests will appear here. A complete profile helps customers feel ready to reach out.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 cartly-shadow">
              <h2 className="font-serif font-bold text-2xl mb-6">Update Your Profile</h2>
              
              {isLoadingProfile ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-muted rounded w-full"></div>
                  <div className="h-32 bg-muted rounded w-full"></div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6 max-w-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="cartName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cart Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City / Service Area</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="startingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Starting Price ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio / Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="h-32 bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4 border-t border-border flex justify-end">
                      <Button type="submit" disabled={updateProfile.isPending} className="bg-primary hover:bg-primary/90 px-8">
                        {updateProfile.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscription">
            <div className="bg-card rounded-2xl border border-border p-8 cartly-shadow max-w-3xl">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <h2 className="font-serif font-bold text-2xl mb-2">Free Founding Vendor Plan</h2>
                  <p className="text-muted-foreground">Your Vended profile is free with no trial, credit card, subscription, or commission.</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none">Free</Badge>
              </div>
              <div className="text-4xl font-serif font-bold mb-6">
                $0 <span className="text-lg text-muted-foreground font-sans font-normal">forever</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Public listing on the Explore page</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Unlimited booking requests</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Custom portfolio gallery</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Vendor dashboard analytics</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}

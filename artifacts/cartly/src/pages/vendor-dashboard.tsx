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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

function formatTrialEnd(date?: string) {
  if (!date) return "30 days";
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function VendorDashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isLoadingAuth, user, vendorProfile, token } = useAuth();
  const queryClient = useQueryClient();
  
  const [declineBookingId, setDeclineBookingId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [promoPlatform, setPromoPlatform] = useState("Instagram");
  const [promoHandle, setPromoHandle] = useState("");
  const [promoProofUrl, setPromoProofUrl] = useState("");
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const [isOpeningBillingPortal, setIsOpeningBillingPortal] = useState(false);
  const [hasHandledCheckoutReturn, setHasHandledCheckoutReturn] = useState(false);

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

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "vendor" || !token || hasHandledCheckoutReturn) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    const sessionId = params.get("session_id");

    if (checkoutStatus === "cancelled") {
      setHasHandledCheckoutReturn(true);
      toast.info("Stripe Checkout was cancelled. You can start your free month whenever you're ready.");
      window.history.replaceState({}, "", "/dashboard/vendor");
      return;
    }

    if (checkoutStatus !== "success" || !sessionId) {
      return;
    }

    setHasHandledCheckoutReturn(true);
    fetch("/api/subscription/reconcile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || "Could not confirm your Stripe Checkout yet.");
        }
        toast.success("Your free month is active. Your cart is now live.");
        queryClient.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetVendorStatsQueryKey() });
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not confirm your Stripe Checkout yet.");
      })
      .finally(() => {
        window.history.replaceState({}, "", "/dashboard/vendor");
      });
  }, [hasHandledCheckoutReturn, isAuthenticated, queryClient, token, user?.role]);

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

  const handleActivateSub = () => {
    setIsOpeningCheckout(true);
    fetch("/api/subscription/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || "Could not open Stripe Checkout");
        }
        if (!data?.url) {
          throw new Error("Stripe Checkout did not return a checkout link.");
        }
        window.location.assign(data.url);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not open Stripe Checkout");
      })
      .finally(() => {
        setIsOpeningCheckout(false);
      });
  };

  const handleOpenBillingPortal = () => {
    setIsOpeningBillingPortal(true);
    fetch("/api/subscription/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || "Could not open billing settings");
        }
        if (!data?.url) {
          throw new Error("Stripe did not return a billing link.");
        }
        window.location.assign(data.url);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not open billing settings");
      })
      .finally(() => {
        setIsOpeningBillingPortal(false);
      });
  };

  const handleSubmitSocialPromo = async () => {
    if (!promoPlatform.trim() || !promoHandle.trim() || !promoProofUrl.trim()) {
      toast.error("Add your platform, handle, and proof link.");
      return;
    }

    setIsSubmittingPromo(true);
    try {
      const response = await fetch("/api/subscription/social-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          platform: promoPlatform,
          handle: promoHandle,
          proofUrl: promoProofUrl,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Could not submit your promo request");
      }

      toast.success("Promo proof submitted. We will review it for your bonus month.");
      setPromoProofUrl("");
      queryClient.invalidateQueries({ queryKey: getGetMyVendorProfileQueryKey() });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your promo request");
    } finally {
      setIsSubmittingPromo(false);
    }
  };

  const subscriptionStatus = profileData?.vendor?.subscriptionStatus;
  const isProfileUnavailable = profileData?.vendor?.isActive === false;
  const isFreeProfile = subscriptionStatus === "inactive";
  const isTrialing = subscriptionStatus === "trialing";
  const isPlanActive = subscriptionStatus === "active";
  const trialEndsAt = profileData?.vendor?.trialEndsAt;
  const hasUsedFreeTrial = Boolean(profileData?.vendor?.trialStartedAt || trialEndsAt);
  const canStartFreeTrial = isFreeProfile && !hasUsedFreeTrial;
  const hasStripeSubscription = Boolean((profileData?.vendor as { stripeSubscriptionId?: string } | undefined)?.stripeSubscriptionId);
  const promoStatus = (profileData?.vendor as { socialPromoStatus?: string } | undefined)?.socialPromoStatus ?? "none";
  const promoSubmittedAt = (profileData?.vendor as { socialPromoSubmittedAt?: string } | undefined)?.socialPromoSubmittedAt;
  const bonusTrialEndsAt = (profileData?.vendor as { bonusTrialEndsAt?: string } | undefined)?.bonusTrialEndsAt;

  return (
    <PageTransition className="flex-1 bg-muted/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {isProfileUnavailable && (
          <Alert className="mb-8 bg-amber-50 border-amber-200 text-amber-900 shadow-sm">
            <AlertTitle className="font-serif font-bold text-lg flex items-center gap-2">
              Your cart is not showing to customers yet
            </AlertTitle>
            <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span>
                {canStartFreeTrial
                  ? "Start your free month to show your cart in Explore and start receiving booking requests."
                  : "Your free month has ended, so your cart is hidden until Stripe billing is connected."}
              </span>
              {canStartFreeTrial ? (
                <Button size="sm" onClick={handleActivateSub} disabled={isOpeningCheckout} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                {isOpeningCheckout ? "Opening Stripe..." : "Start 30-day free trial"}
                </Button>
              ) : (
                <span className="text-sm font-medium">Stripe setup is needed to turn your cart back on after the free month.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">Your Cart Dashboard</h1>
            <p className="text-muted-foreground text-lg">See new booking requests, update your profile, and manage Vended Pro.</p>
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
              Vended Pro
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-card rounded-2xl border border-border p-8 cartly-shadow">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="font-serif font-bold text-2xl mb-2">Vended Pro</h2>
                    <p className="text-muted-foreground">Vended Pro — first month free, then $29/month. Cancel anytime.</p>
                  </div>
                  <Badge className={isFreeProfile ? "bg-slate-500/10 text-slate-600 border-none" : "bg-emerald-500/10 text-emerald-600 border-none"}>
                    {isFreeProfile ? "Free profile" : isTrialing ? "Free month" : "Pro is on"}
                  </Badge>
                </div>
                
                <div className="mb-6">
                  <div className="text-4xl font-serif font-bold">
                    {isPlanActive ? "$29" : "$0"} <span className="text-lg text-muted-foreground font-sans font-normal">{isPlanActive ? "/month" : "today"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isPlanActive ? "You are on Vended Pro." : "Vended Pro — first month free, then $29/month. Cancel anytime."}
                  </p>
                  {isTrialing && (
                    <p className="text-sm font-medium text-primary mt-2">Your free month ends on {formatTrialEnd(trialEndsAt)}.</p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Listing on Explore page</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Unlimited booking requests</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Custom portfolio gallery</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Vendor dashboard analytics</li>
                </ul>
                
                {canStartFreeTrial ? (
                  <Button onClick={handleActivateSub} disabled={isOpeningCheckout} className="w-full h-12 text-lg bg-primary hover:bg-primary/90">
                    {isOpeningCheckout ? "Opening Stripe..." : "Start 30-day free trial"}
                  </Button>
                ) : hasStripeSubscription ? (
                  <Button onClick={handleOpenBillingPortal} variant="outline" disabled={isOpeningBillingPortal} className="w-full">
                    {isOpeningBillingPortal ? "Opening billing..." : "Manage billing"}
                  </Button>
                ) : isFreeProfile ? (
                  <Button variant="outline" className="w-full" disabled>
                    Stripe setup needed for paid plan
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    {isTrialing ? "Your free month is on" : "You are on Vended Pro"}
                  </Button>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-8 cartly-shadow">
                <div className="flex justify-between items-start gap-4 mb-6">
                  <div>
                    <h2 className="font-serif font-bold text-2xl mb-2">Bonus Month</h2>
                    <p className="text-muted-foreground">Share Vended to your story, tag @tryvended, and submit proof for one extra free month.</p>
                  </div>
                  <Badge className={promoStatus === "approved" ? "bg-emerald-500/10 text-emerald-600 border-none" : promoStatus === "pending" ? "bg-amber-500/10 text-amber-600 border-none" : "bg-slate-500/10 text-slate-600 border-none"}>
                    {promoStatus === "approved" ? "Approved" : promoStatus === "pending" ? "Under review" : "Available"}
                  </Badge>
                </div>

                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Tag @tryvended in your story or post</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Keep it live for at least 24 hours</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Maximum one bonus month per vendor</li>
                </ul>

                {promoStatus === "approved" ? (
                  <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900">
                    <AlertTitle>Bonus month approved</AlertTitle>
                    <AlertDescription>
                      {bonusTrialEndsAt ? `Your extended free period runs through ${formatTrialEnd(bonusTrialEndsAt)}.` : "Your bonus month has been added."}
                    </AlertDescription>
                  </Alert>
                ) : promoStatus === "pending" ? (
                  <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                    <AlertTitle>We have your proof</AlertTitle>
                    <AlertDescription>
                      {promoSubmittedAt ? `Submitted ${formatTrialEnd(promoSubmittedAt)}. ` : ""}We will review it before adding the extra month.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="promoPlatform">Platform</Label>
                        <Input id="promoPlatform" value={promoPlatform} onChange={(e) => setPromoPlatform(e.target.value)} placeholder="Instagram" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promoHandle">Your handle</Label>
                        <Input id="promoHandle" value={promoHandle} onChange={(e) => setPromoHandle(e.target.value)} placeholder="@yourcart" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promoProofUrl">Proof link or screenshot URL</Label>
                      <Input id="promoProofUrl" value={promoProofUrl} onChange={(e) => setPromoProofUrl(e.target.value)} placeholder="Paste the story link or uploaded screenshot link" />
                    </div>
                    <Button onClick={handleSubmitSocialPromo} disabled={isSubmittingPromo} className="w-full h-12 bg-primary hover:bg-primary/90">
                      {isSubmittingPromo ? "Submitting..." : "Submit for bonus month"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}

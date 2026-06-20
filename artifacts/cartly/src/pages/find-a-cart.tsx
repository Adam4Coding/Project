import { useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2, Search, ShieldCheck } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type HostRequestForm = {
  name: string;
  email: string;
  phone: string;
  city: string;
  eventDate: string;
  eventType: string;
  cartType: string;
  guestCount: string;
  budget: string;
  message: string;
  website: string;
};

const emptyForm: HostRequestForm = {
  name: "",
  email: "",
  phone: "",
  city: "Chicago, IL",
  eventDate: "",
  eventType: "",
  cartType: "",
  guestCount: "",
  budget: "",
  message: "",
  website: "",
};

export default function FindACart() {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const source = searchParams.get("source") ?? "website";
  const [form, setForm] = useState({
    ...emptyForm,
    city: searchParams.get("city") || emptyForm.city,
    cartType: searchParams.get("category") || emptyForm.cartType,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState<number | null>(null);

  const update = (field: keyof HostRequestForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/host-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestCount: Number(form.guestCount),
          source,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "We couldn't submit your request.");
      }

      setRequestId(result.requestId ?? 0);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn't submit your request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestId !== null) {
    return (
      <PageTransition className="flex-1 bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 text-center cartly-shadow md:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Request received
          </p>
          <h1 className="mb-4 font-serif text-4xl font-bold text-foreground">
            We’re looking for your cart.
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-lg text-muted-foreground">
            Vended will review your event and contact matching cart operators. There’s no fee or obligation.
          </p>
          <Link href="/">
            <Button className="rounded-full px-8">Back to Vended</Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex-1 bg-muted/30">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
        <div className="self-start lg:sticky lg:top-28">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Free cart matching
          </p>
          <h1 className="mb-5 font-serif text-5xl font-bold leading-tight text-foreground">
            Tell us about your event. We’ll find the cart.
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
            Share what you’re planning and Vended will look for matching specialty carts in Chicago. No account, endless searching, or booking fee.
          </p>
          <div className="space-y-5 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <Search className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>We search for operators that fit your event, date, and budget.</span>
            </div>
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>Available vendors can respond directly with their packages and next steps.</span>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>Submitting a request is free and doesn’t commit you to a booking.</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 cartly-shadow md:p-10">
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-bold text-foreground">Event details</h2>
            <p className="mt-2 text-muted-foreground">The more detail you share, the better the match.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(312) 555-0123" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Event city</Label>
              <Input id="city" required value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Chicago, IL" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event date</Label>
              <Input id="eventDate" type="date" required value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event type</Label>
              <Input id="eventType" required value={form.eventType} onChange={(e) => update("eventType", e.target.value)} placeholder="Wedding, office party…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartType">What kind of cart?</Label>
              <Input id="cartType" required value={form.cartType} onChange={(e) => update("cartType", e.target.value)} placeholder="Espresso, mocktails, churros…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount">Estimated guests</Label>
              <Input id="guestCount" type="number" min="1" required value={form.guestCount} onChange={(e) => update("guestCount", e.target.value)} placeholder="120" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="budget">Estimated budget <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="budget" value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="$800–$1,500 or “not sure”" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="message">Anything else we should know? <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="message" rows={5} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Venue, service duration, indoor/outdoor setup, dietary needs…" />
            </div>
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="website">Website</Label>
              <Input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} />
            </div>
          </div>

          {error && (
            <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-8 h-13 w-full rounded-full text-base font-semibold">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending request…
              </>
            ) : (
              "Find carts for my event"
            )}
          </Button>
          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            By submitting, you agree that Vended may contact you about this request and share relevant event details with potential vendors.
          </p>
        </form>
      </div>
    </PageTransition>
  );
}

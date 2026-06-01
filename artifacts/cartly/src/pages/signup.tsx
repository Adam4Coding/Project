import { useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Store, UserRound } from "lucide-react";
import { getApiErrorMessage } from "@/lib/utils";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["customer", "vendor"]),
  cartName: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "vendor") {
    if (!data.cartName || data.cartName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cart name is required",
        path: ["cartName"],
      });
    }
    if (!data.category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category is required",
        path: ["category"],
      });
    }
    if (!data.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City is required",
        path: ["city"],
      });
    }
  }
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { login } = useAuth();
  const signupMutation = useSignup();
  const initialRole = new URLSearchParams(search).get("role") === "vendor" ? "vendor" : "customer";
  const [role, setRole] = useState<"customer" | "vendor">(initialRole);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: initialRole,
      cartName: "",
      category: "",
      city: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    signupMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token, res.user, res.vendorProfile);
          toast.success("Account created successfully!");
          
          if (res.user.role === "vendor") {
            setLocation("/onboarding");
          } else {
            setLocation("/explore");
          }
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Failed to create account. Please try again."));
        }
      }
    );
  };

  return (
    <PageTransition className="flex-1 flex flex-col justify-center py-12 px-4 bg-muted/30">
      <div className="w-full max-w-lg mx-auto bg-card rounded-2xl p-8 md:p-10 cartly-shadow border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Join Vended</h1>
          <p className="text-muted-foreground">Create an account to start booking or listing</p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            type="button"
            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              role === "customer" 
                ? "border-primary bg-primary/5 text-primary" 
                : "border-border hover:border-primary/50 text-muted-foreground"
            }`}
            onClick={() => {
              setRole("customer");
              form.setValue("role", "customer");
              form.clearErrors();
            }}
          >
            <UserRound className="w-6 h-6 mb-2" />
            <span className="font-semibold">I'm looking for carts</span>
          </button>
          
          <button
            type="button"
            className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              role === "vendor" 
                ? "border-secondary bg-secondary/5 text-secondary" 
                : "border-border hover:border-secondary/50 text-muted-foreground"
            }`}
            onClick={() => {
              setRole("vendor");
              form.setValue("role", "vendor");
              form.clearErrors();
            }}
          >
            <Store className="w-6 h-6 mb-2" />
            <span className="font-semibold">I'm a vendor</span>
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} className="h-11 bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="jane@example.com" type="email" {...field} className="h-11 bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" autoComplete="new-password" {...field} className="h-11 bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === "vendor" && (
              <div className="space-y-5 pt-4 border-t border-border mt-6">
                <h3 className="font-serif font-bold text-lg text-foreground">Cart Details</h3>
                <FormField
                  control={form.control}
                  name="cartName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cart Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane's Matcha Bar" {...field} className="h-11 bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Matcha, Espresso..." {...field} className="h-11 bg-background" />
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
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Austin, TX" {...field} className="h-11 bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className={`w-full h-12 mt-6 text-base font-semibold rounded-xl shadow-md ${
                role === "vendor" 
                  ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating account...</>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}

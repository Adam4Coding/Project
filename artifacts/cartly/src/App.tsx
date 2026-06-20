import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import VendorProfile from "@/pages/vendor-profile";
import CustomerDashboard from "@/pages/customer-dashboard";
import VendorDashboard from "@/pages/vendor-dashboard";
import Onboarding from "@/pages/onboarding";
import FindACart from "@/pages/find-a-cart";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/vendor/:id" component={VendorProfile} />
          <Route path="/dashboard/customer" component={CustomerDashboard} />
          <Route path="/dashboard/vendor" component={VendorDashboard} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/find-a-cart" component={FindACart} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

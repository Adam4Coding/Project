import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { Store, Camera, DollarSign, Rocket, CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, vendorProfile, updateVendorProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const completeOnboarding = useCompleteOnboarding();

  // Form State
  const [formData, setFormData] = useState({
    cartName: vendorProfile?.cartName || "",
    category: vendorProfile?.category || "",
    city: vendorProfile?.city || "",
    bio: "",
    startingPrice: "",
    packages: [{ name: "Standard Package", price: "500", description: "2 hours of service for up to 50 guests." }],
    coverPhoto: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1000&auto=format&fit=crop", // Using unsplash as a placeholder for the demo to bypass file upload complexity in this env
  });

  const [isCompleted, setIsCompleted] = useState(false);

  if (!isAuthenticated || user?.role !== "vendor") {
    setLocation("/login");
    return null;
  }

  if (vendorProfile?.onboardingComplete && !isCompleted) {
    setLocation("/dashboard/vendor");
    return null;
  }

  const handleNext = () => {
    // Basic validation
    if (step === 1 && (!formData.cartName || !formData.category || !formData.city)) {
      toast.error("Please fill out all required fields");
      return;
    }
    if (step === 3 && !formData.startingPrice) {
      toast.error("Please enter a starting price");
      return;
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setStep(s => s - 1);
  };

  const handleFinish = () => {
    completeOnboarding.mutate(
      { 
        data: {
          cartName: formData.cartName,
          category: formData.category,
          city: formData.city,
          bio: formData.bio,
          startingPrice: Number(formData.startingPrice),
          packages: formData.packages.map(p => ({ ...p, price: Number(p.price) })),
          coverPhoto: formData.coverPhoto,
          activateSubscription: true
        } 
      },
      {
        onSuccess: (res) => {
          // Fire confetti pure CSS approach via DOM
          createConfetti();
          setIsCompleted(true);
          
          if (res.vendor) {
            updateVendorProfile(res.vendor as any);
          }
          
          setTimeout(() => {
            setLocation("/dashboard/vendor");
          }, 3000);
        },
        onError: (err) => {
          toast.error(err.data?.message || "Failed to complete setup");
        }
      }
    );
  };

  // Pure DOM Confetti without external dependency
  const createConfetti = () => {
    const colors = ['#2d6a4f', '#c1440e', '#e9c46a', '#f9f6f1'];
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    for (let i = 0; i < 100; i++) {
      const conf = document.createElement('div');
      conf.style.position = 'absolute';
      conf.style.width = Math.random() * 10 + 5 + 'px';
      conf.style.height = Math.random() * 10 + 5 + 'px';
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.left = Math.random() * 100 + 'vw';
      conf.style.top = '-20px';
      conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      conf.style.opacity = Math.random() + 0.5 + '';
      
      const duration = Math.random() * 3 + 2;
      conf.style.transition = `transform ${duration}s ease-in, opacity ${duration}s ease-in`;
      
      container.appendChild(conf);
      
      // Trigger animation
      requestAnimationFrame(() => {
        const rot = Math.random() * 360 * 5;
        const y = window.innerHeight + 100;
        conf.style.transform = `translateY(${y}px) rotate(${rot}deg)`;
        conf.style.opacity = '0';
      });
    }

    setTimeout(() => {
      document.body.removeChild(container);
    }, 5000);
  };

  const steps = [
    { title: "Basics", icon: <Store className="w-5 h-5" /> },
    { title: "Photos", icon: <Camera className="w-5 h-5" /> },
    { title: "Pricing", icon: <DollarSign className="w-5 h-5" /> },
    { title: "Launch", icon: <Rocket className="w-5 h-5" /> },
  ];

  if (isCompleted) {
    return (
      <PageTransition className="flex-1 flex items-center justify-center bg-background py-12 px-4">
        <div className="text-center max-w-md animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold mb-4">You're Live!</h1>
          <p className="text-xl text-muted-foreground mb-8">Your cart profile is beautifully set up and ready to receive bookings.</p>
          <p className="text-sm text-muted-foreground animate-pulse">Redirecting to your dashboard...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex-1 flex flex-col bg-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        
        {/* Progress Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-serif font-bold text-center mb-8">Set up your Cart profile</h1>
          
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border z-0 rounded-full"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-500 rounded-full"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            {steps.map((s, i) => {
              const isCurrent = step === i + 1;
              const isPassed = step > i + 1;
              return (
                <div key={i} className="relative z-10 flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-300 ${
                    isCurrent ? "bg-background border-primary text-primary" : 
                    isPassed ? "bg-primary border-primary text-primary-foreground" : 
                    "bg-background border-border text-muted-foreground"
                  }`}>
                    {isPassed ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                  </div>
                  <span className={`absolute -bottom-6 text-xs font-semibold whitespace-nowrap ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-card rounded-3xl border border-border p-8 md:p-10 cartly-shadow min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-serif font-bold mb-2">The Basics</h2>
                  <p className="text-muted-foreground">Tell customers about your business and where you operate.</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cartName">Cart Name <span className="text-destructive">*</span></Label>
                    <Input 
                      id="cartName" 
                      value={formData.cartName} 
                      onChange={e => setFormData({...formData, cartName: e.target.value})} 
                      className="bg-background h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                    <Input 
                      id="category" 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      placeholder="e.g. Matcha, Espresso"
                      className="bg-background h-12"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City / Service Area <span className="text-destructive">*</span></Label>
                  <Input 
                    id="city" 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    className="bg-background h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / Description</Label>
                  <Textarea 
                    id="bio" 
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})} 
                    className="bg-background h-32 resize-none"
                    placeholder="What makes your cart special? Tell your story..."
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-serif font-bold mb-2">Showcase your cart</h2>
                  <p className="text-muted-foreground">Upload a great cover photo. (Simulated for this demo)</p>
                </div>
                
                <div className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-muted/20">
                  <div className="w-16 h-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Click to upload cover photo</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">High quality photos increase booking rates by 3x. Use bright, well-lit photos.</p>
                  
                  <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden border border-border">
                    <img src={formData.coverPhoto} alt="Cover preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white font-medium">Change Photo</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-serif font-bold mb-2">Pricing Packages</h2>
                  <p className="text-muted-foreground">Set your starting price and define packages.</p>
                </div>
                
                <div className="space-y-2 mb-8 bg-primary/5 p-6 rounded-2xl border border-primary/20">
                  <Label htmlFor="startingPrice" className="text-lg text-primary">Starting Price ($) <span className="text-destructive">*</span></Label>
                  <p className="text-sm text-muted-foreground mb-3">This is the "From $X" price shown on your search card.</p>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="startingPrice" 
                      type="number"
                      value={formData.startingPrice} 
                      onChange={e => setFormData({...formData, startingPrice: e.target.value})} 
                      className="bg-background h-14 pl-12 text-lg font-bold"
                      placeholder="500"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Add a standard package</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Package Name</Label>
                      <Input 
                        value={formData.packages[0].name}
                        onChange={e => {
                          const newPkgs = [...formData.packages];
                          newPkgs[0].name = e.target.value;
                          setFormData({...formData, packages: newPkgs});
                        }}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input 
                        type="number"
                        value={formData.packages[0].price}
                        onChange={e => {
                          const newPkgs = [...formData.packages];
                          newPkgs[0].price = e.target.value;
                          setFormData({...formData, packages: newPkgs});
                        }}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>What's included?</Label>
                    <Textarea 
                      value={formData.packages[0].description}
                      onChange={e => {
                        const newPkgs = [...formData.packages];
                        newPkgs[0].description = e.target.value;
                        setFormData({...formData, packages: newPkgs});
                      }}
                      className="bg-background h-20 resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-10 h-10 text-secondary" />
                </div>
                <h2 className="text-3xl font-serif font-bold mb-4">Ready to launch?</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                  Your profile looks amazing. Activate your Vended Pro subscription to go live and start accepting bookings.
                </p>
                
                <div className="bg-card border-2 border-primary rounded-3xl p-8 max-w-sm mx-auto cartly-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                  <h3 className="font-serif font-bold text-2xl mb-2">Vended Pro</h3>
                  <div className="text-4xl font-serif font-bold mb-6">$59<span className="text-lg text-muted-foreground font-sans font-normal">/mo</span></div>
                  
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Listing on Explore page</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Unlimited bookings</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Custom gallery</li>
                  </ul>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              disabled={step === 1 || completeOnboarding.isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              Back
            </Button>
            
            {step < 4 ? (
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-xl h-12">
                Continue
              </Button>
            ) : (
              <Button 
                onClick={handleFinish} 
                disabled={completeOnboarding.isPending}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 rounded-xl h-12 text-lg shadow-md"
              >
                {completeOnboarding.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  "Activate & Launch"
                )}
              </Button>
            )}
          </div>
        </div>

      </div>
    </PageTransition>
  );
}


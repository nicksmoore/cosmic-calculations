import { useState } from "react";
import { motion } from "framer-motion";
import { Headphones, Star, Clock, Sparkles, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BirthData } from "@/components/intake/BirthDataForm";

interface PodcastUpsellProps {
  birthData?: BirthData;
}

const PodcastUpsell = ({ birthData }: PodcastUpsellProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-podcast-checkout", {
        body: { birthData },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: "Unable to start checkout. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="mt-12 mb-8"
    >
      <div className="glass-panel rounded-2xl overflow-hidden border border-primary/20">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 px-6 py-3 border-b border-primary/20">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Gift className="w-4 h-4" />
            <span className="text-sm font-medium">Limited Time: 57% Off Launch Price</span>
            <Gift className="w-4 h-4" />
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Headphones className="w-6 h-6 text-primary" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Personalized Audio Experience
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-foreground">
                  Your Birth Chart,{" "}
                  <span className="text-ethereal">Narrated</span>
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  Transform your cosmic blueprint into an immersive audio journey. 
                  Our expert astrologers craft a deeply personal 60+ minute podcast 
                  episode exploring every planet, house, and aspect in your unique chart.
                </p>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">60+ Minutes</p>
                    <p className="text-xs text-muted-foreground">Deep dive analysis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Personalized</p>
                    <p className="text-xs text-muted-foreground">Your exact birth data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Listen Anywhere</p>
                    <p className="text-xs text-muted-foreground">Download & keep forever</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Expert Insight</p>
                    <p className="text-xs text-muted-foreground">Professional astrologers</p>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-3 py-3 px-4 bg-muted/30 rounded-lg">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 border-2 border-background flex items-center justify-center"
                    >
                      <Star className="w-3 h-3 text-primary" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">2,847</span> happy listeners
                  </p>
                </div>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="relative">
              <div className="glass-panel rounded-xl p-6 sm:p-8 border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-2xl text-muted-foreground line-through">$129</span>
                    <span className="text-5xl font-bold text-foreground">$55</span>
                  </div>
                  <p className="text-sm text-muted-foreground">One-time payment • Instant delivery</p>
                </div>

                {/* CTA Button */}
                <Button 
                  size="lg" 
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full text-lg py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Headphones className="w-5 h-5 mr-2" />
                  )}
                  {isLoading ? "Starting Checkout..." : "Get Your Personalized Podcast"}
                </Button>

                {/* Guarantee */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  🔒 Secure checkout • 30-day money-back guarantee
                </p>

                {/* What's Included */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground mb-3">What's Included:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      60+ minute personalized audio reading
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      All planets, houses & major aspects
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Downloadable MP3 file
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      PDF chart summary included
                    </li>
                  </ul>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default PodcastUpsell;

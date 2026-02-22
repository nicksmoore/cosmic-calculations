import { useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import StarField from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { useSignExplanation } from "@/hooks/useAstroCopy";

const SIGN_META: Record<string, { element: string; modality: string; polarity: string }> = {
  Aries: { element: "Fire", modality: "Cardinal", polarity: "Masculine" },
  Taurus: { element: "Earth", modality: "Fixed", polarity: "Feminine" },
  Gemini: { element: "Air", modality: "Mutable", polarity: "Masculine" },
  Cancer: { element: "Water", modality: "Cardinal", polarity: "Feminine" },
  Leo: { element: "Fire", modality: "Fixed", polarity: "Masculine" },
  Virgo: { element: "Earth", modality: "Mutable", polarity: "Feminine" },
  Libra: { element: "Air", modality: "Cardinal", polarity: "Masculine" },
  Scorpio: { element: "Water", modality: "Fixed", polarity: "Feminine" },
  Sagittarius: { element: "Fire", modality: "Mutable", polarity: "Masculine" },
  Capricorn: { element: "Earth", modality: "Cardinal", polarity: "Feminine" },
  Aquarius: { element: "Air", modality: "Fixed", polarity: "Masculine" },
  Pisces: { element: "Water", modality: "Mutable", polarity: "Feminine" },
};

export default function PlacementMeaning() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const sign = params.get("sign");
  const label = params.get("label") || (sign ? `Placement in ${sign}` : "Placement meaning");
  const { data: explanation, isLoading } = useSignExplanation(sign, label, true);
  const signMeta = sign ? SIGN_META[sign] : null;

  const title = useMemo(() => {
    if (!label) return "Placement Meaning";
    return label;
  }, [label]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:px-8 md:pb-10 relative z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="glass-panel rounded-xl p-5 sm:p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {sign ? `${sign} Signature` : "Placement Signature"}
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif text-ethereal mb-4">{title}</h1>
          {signMeta && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="rounded-full border border-border/50 bg-card/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-foreground/90">
                Element: {signMeta.element}
              </span>
              <span className="rounded-full border border-border/50 bg-card/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-foreground/90">
                Modality: {signMeta.modality}
              </span>
              <span className="rounded-full border border-border/50 bg-card/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-foreground/90">
                Polarity: {signMeta.polarity}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Writing interpretation...
            </div>
          ) : (
            <p className="text-base leading-relaxed text-foreground/95">
              {explanation || "No interpretation available yet."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

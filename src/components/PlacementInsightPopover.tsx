import { useState, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSignExplanation } from "@/hooks/useAstroCopy";

interface PlacementInsightPopoverProps {
  sign: string | null;
  placementLabel: string;
  children: ReactNode;
  className?: string;
}

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

export default function PlacementInsightPopover({
  sign,
  placementLabel,
  children,
  className,
}: PlacementInsightPopoverProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useSignExplanation(sign, placementLabel, open);
  const signMeta = sign ? SIGN_META[sign] : null;

  if (!sign) return <>{children}</>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={className} aria-label={`Explain ${placementLabel}`}>
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs leading-relaxed text-muted-foreground">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating interpretation...
          </div>
        ) : (
          <div className="space-y-2.5">
            {signMeta && (
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-border/50 bg-card/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/90">
                  Element: {signMeta.element}
                </span>
                <span className="rounded-full border border-border/50 bg-card/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/90">
                  Modality: {signMeta.modality}
                </span>
                <span className="rounded-full border border-border/50 bg-card/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/90">
                  Polarity: {signMeta.polarity}
                </span>
              </div>
            )}
            <p>{data || `No interpretation available for ${placementLabel} yet.`}</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

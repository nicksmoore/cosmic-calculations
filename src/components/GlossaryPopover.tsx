import { findGlossaryEntry } from "@/data/astrologyGlossary";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
}

const GlossaryTerm = ({ term, children }: GlossaryTermProps) => {
  const entry = findGlossaryEntry(term);
  const isMobile = useIsMobile();

  if (!entry) return <>{children ?? term}</>;

  const categoryColors: Record<string, string> = {
    aspect: "bg-primary/20 text-primary-foreground border-primary/30",
    pattern: "bg-accent/20 text-accent border-accent/30",
    general: "bg-secondary text-secondary-foreground border-border",
    planet: "bg-primary/20 text-primary-foreground border-primary/30",
    sign: "bg-accent/20 text-accent border-accent/30",
    house: "bg-secondary text-secondary-foreground border-border",
  };

  const content = (
    <div className="space-y-2 max-w-xs">
      <div className="flex items-center gap-2">
        <span className="font-serif font-semibold text-foreground">{entry.term}</span>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryColors[entry.category]}`}>
          {entry.category}
        </Badge>
      </div>
      <p className="text-sm font-medium text-foreground/90">{entry.shortDef}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{entry.details}</p>
    </div>
  );

  // Use Popover on mobile (tap), Tooltip on desktop (hover)
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline underline decoration-dotted decoration-accent/50 underline-offset-2 hover:decoration-accent cursor-help transition-colors"
          >
            {children ?? term}
          </button>
        </PopoverTrigger>
        <PopoverContent className="glass-panel border-border/50 w-80" side="top">
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline underline decoration-dotted decoration-accent/50 underline-offset-2 hover:decoration-accent cursor-help transition-colors"
          >
            {children ?? term}
          </button>
        </TooltipTrigger>
        <TooltipContent className="glass-panel border-border/50 p-4 max-w-sm" side="top">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GlossaryTerm;

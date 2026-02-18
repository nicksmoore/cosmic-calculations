import figma from "@figma/code-connect";
import SynastryAspectLines from "@/components/SynastryAspectLines";

figma.connect(SynastryAspectLines, "FIGMA_NODE_URL", {
  example: () => (
    <SynastryAspectLines
      natalPlanets={[] as any}
      partnerPlanets={[] as any}
      center={300}
      natalPositions={{} as any}
      partnerPositions={{} as any}
    />
  ),
});

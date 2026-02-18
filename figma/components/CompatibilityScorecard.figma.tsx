import figma from "@figma/code-connect";
import CompatibilityScorecard from "@/components/CompatibilityScorecard";

figma.connect(CompatibilityScorecard, "FIGMA_NODE_URL", {
  example: () => (
    <CompatibilityScorecard
      natalPlanets={[] as any}
      partnerPlanets={[] as any}
      partnerName="Partner"
      userName="You"
    />
  ),
});

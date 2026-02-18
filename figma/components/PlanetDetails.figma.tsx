import figma from "@figma/code-connect";
import PlanetDetails from "@/components/PlanetDetails";

figma.connect(PlanetDetails, "FIGMA_NODE_URL", {
  example: () => (
    <PlanetDetails planet={null as any} />
  ),
});

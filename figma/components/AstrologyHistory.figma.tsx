import figma from "@figma/code-connect";
import AstrologyHistory from "@/components/AstrologyHistory";

figma.connect(AstrologyHistory, "FIGMA_NODE_URL", {
  example: () => <AstrologyHistory />,
});

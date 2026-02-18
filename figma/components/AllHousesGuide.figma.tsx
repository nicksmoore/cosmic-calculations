import figma from "@figma/code-connect";
import AllHousesGuide from "@/components/AllHousesGuide";

figma.connect(AllHousesGuide, "FIGMA_NODE_URL", {
  example: () => <AllHousesGuide houses={[] as any} planets={[] as any} />,
});

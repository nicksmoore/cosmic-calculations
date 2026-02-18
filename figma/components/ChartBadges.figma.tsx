import figma from "@figma/code-connect";
import ChartBadges from "@/components/ChartBadges";

figma.connect(ChartBadges, "FIGMA_NODE_URL", {
  example: () => (
    <ChartBadges planets={[] as any} />
  ),
});

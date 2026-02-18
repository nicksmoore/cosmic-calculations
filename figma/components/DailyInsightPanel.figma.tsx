import figma from "@figma/code-connect";
import DailyInsightPanel from "@/components/DailyInsightPanel";

figma.connect(DailyInsightPanel, "FIGMA_NODE_URL", {
  example: () => <DailyInsightPanel chartData={null as any} />,
});

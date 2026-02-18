import figma from "@figma/code-connect";
import NatalChartExplainer from "@/components/NatalChartExplainer";

figma.connect(NatalChartExplainer, "FIGMA_NODE_URL", {
  example: () => <NatalChartExplainer chartData={null as any} />,
});

import figma from "@figma/code-connect";
import ChartDashboard from "@/components/ChartDashboard";

figma.connect(ChartDashboard, "FIGMA_NODE_URL", {
  example: () => <ChartDashboard birthData={null as any} />,
});

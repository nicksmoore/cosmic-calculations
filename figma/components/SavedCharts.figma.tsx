import figma from "@figma/code-connect";
import SavedCharts from "@/components/SavedCharts";

figma.connect(SavedCharts, "FIGMA_NODE_URL", {
  example: () => <SavedCharts />,
});

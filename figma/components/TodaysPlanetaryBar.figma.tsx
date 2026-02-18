import figma from "@figma/code-connect";
import TodaysPlanetaryBar from "@/components/TodaysPlanetaryBar";

figma.connect(TodaysPlanetaryBar, "FIGMA_NODE_URL", {
  example: () => <TodaysPlanetaryBar chartData={null as any} />,
});

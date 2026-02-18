import figma from "@figma/code-connect";
import NatalChartWheel from "@/components/NatalChartWheel";

figma.connect(NatalChartWheel, "FIGMA_NODE_URL", {
  props: {
    houseSystem: figma.enum("House System", {
      placidus: "placidus",
      "whole-sign": "whole-sign",
      equal: "equal",
    }),
  },
  example: ({ houseSystem }) => (
    <NatalChartWheel
      chartData={null as any}
      houseSystem={houseSystem}
      onSelectPlanet={() => {}}
      onSelectHouse={() => {}}
      selectedPlanet={null}
      selectedHouse={null}
    />
  ),
});

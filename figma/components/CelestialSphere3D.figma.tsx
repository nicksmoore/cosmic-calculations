import figma from "@figma/code-connect";
import CelestialSphere3D from "@/components/CelestialSphere3D";

figma.connect(CelestialSphere3D, "FIGMA_NODE_URL", {
  props: {
    houseSystem: figma.enum("House System", {
      placidus: "placidus",
      "whole-sign": "whole-sign",
      equal: "equal",
    }),
  },
  example: ({ houseSystem }) => (
    <CelestialSphere3D
      chartData={null as any}
      houseSystem={houseSystem}
      onSelectPlanet={() => {}}
      selectedPlanet={null}
    />
  ),
});

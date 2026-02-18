import figma from "@figma/code-connect";
import PlanetsList from "@/components/PlanetsList";

figma.connect(PlanetsList, "FIGMA_NODE_URL", {
  example: () => (
    <PlanetsList
      planets={[] as any}
      onSelectPlanet={() => {}}
      selectedPlanet={null}
    />
  ),
});

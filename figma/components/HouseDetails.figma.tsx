import figma from "@figma/code-connect";
import HouseDetails from "@/components/HouseDetails";

figma.connect(HouseDetails, "FIGMA_NODE_URL", {
  example: () => (
    <HouseDetails
      house={null as any}
      planets={[] as any}
    />
  ),
});

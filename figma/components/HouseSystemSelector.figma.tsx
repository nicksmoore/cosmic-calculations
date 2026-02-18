import figma from "@figma/code-connect";
import HouseSystemSelector from "@/components/HouseSystemSelector";

figma.connect(HouseSystemSelector, "FIGMA_NODE_URL", {
  props: {
    value: figma.enum("Value", {
      placidus: "placidus",
      "whole-sign": "whole-sign",
      equal: "equal",
    }),
  },
  example: ({ value }) => (
    <HouseSystemSelector value={value} onChange={() => {}} />
  ),
});

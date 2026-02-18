import figma from "@figma/code-connect";
import ZodiacSystemSelector from "@/components/ZodiacSystemSelector";

figma.connect(ZodiacSystemSelector, "FIGMA_NODE_URL", {
  props: {
    value: figma.enum("Value", {
      tropical: "tropical",
      sidereal: "sidereal",
    }),
  },
  example: ({ value }) => (
    <ZodiacSystemSelector value={value} onChange={() => {}} />
  ),
});

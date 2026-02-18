import figma from "@figma/code-connect";
import StarField from "@/components/StarField";

figma.connect(StarField, "FIGMA_NODE_URL", {
  props: {
    density: figma.enum("Density", {
      low: "low",
      medium: "medium",
      high: "high",
    }),
    animated: figma.boolean("Animated"),
  },
  example: ({ density, animated }) => (
    <StarField density={density} animated={animated} />
  ),
});

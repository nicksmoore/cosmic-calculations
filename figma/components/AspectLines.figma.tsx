import figma from "@figma/code-connect";
import AspectLines from "@/components/AspectLines";

figma.connect(AspectLines, "FIGMA_NODE_URL", {
  example: () => (
    <AspectLines
      planets={[] as any}
      center={300}
      innerRadius={200}
      planetPositions={{} as any}
    />
  ),
});

import figma from "@figma/code-connect";
import AstrocartographyMap from "@/components/AstrocartographyMap";

figma.connect(AstrocartographyMap, "FIGMA_NODE_URL", {
  example: () => (
    <AstrocartographyMap chartData={null as any} birthData={null as any} />
  ),
});

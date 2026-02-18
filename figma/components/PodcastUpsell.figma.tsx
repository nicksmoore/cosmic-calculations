import figma from "@figma/code-connect";
import PodcastUpsell from "@/components/PodcastUpsell";

figma.connect(PodcastUpsell, "FIGMA_NODE_URL", {
  example: () => <PodcastUpsell birthData={null as any} />,
});

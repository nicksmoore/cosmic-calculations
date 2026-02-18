import figma from "@figma/code-connect";
import GlossaryPopover from "@/components/GlossaryPopover";

figma.connect(GlossaryPopover, "FIGMA_NODE_URL", {
  props: {
    term: figma.string("Term"),
  },
  example: ({ term }) => (
    <GlossaryPopover term={term}>
      <span>{term}</span>
    </GlossaryPopover>
  ),
});

import figma from "@figma/code-connect";
import UserMenu from "@/components/UserMenu";

figma.connect(UserMenu, "FIGMA_NODE_URL", {
  example: () => <UserMenu />,
});

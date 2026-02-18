import figma from "@figma/code-connect";
import AuthGate from "@/components/AuthGate";

figma.connect(AuthGate, "FIGMA_NODE_URL", {
  example: () => (
    <AuthGate>
      <div>Protected content</div>
    </AuthGate>
  ),
});

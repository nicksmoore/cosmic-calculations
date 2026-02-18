import figma from "@figma/code-connect";
import SynastryPartnerForm from "@/components/SynastryPartnerForm";

figma.connect(SynastryPartnerForm, "FIGMA_NODE_URL", {
  example: () => (
    <SynastryPartnerForm
      onSubmit={() => {}}
      onClear={() => {}}
      partnerData={null}
    />
  ),
});

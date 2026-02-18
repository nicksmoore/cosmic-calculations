import figma from "@figma/code-connect";
import NavLink from "@/components/NavLink";

figma.connect(NavLink, "FIGMA_NODE_URL", {
  props: {
    children: figma.string("Label"),
    active: figma.boolean("Active"),
  },
  example: ({ children, active }) => (
    <NavLink to="/" active={active}>
      {children}
    </NavLink>
  ),
});

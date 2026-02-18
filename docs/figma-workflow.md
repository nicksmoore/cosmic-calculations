# CelestialSync × Figma Workflow

## One-Time Setup

### 1. Import Tokens into Figma
1. Open Figma Desktop
2. Install **Tokens Studio for Figma** (free, from Figma Community)
3. Open the plugin → **Load from File** → select `figma/tokens.json`
4. Click **Sync Variables** — your Figma Variables panel now has all CelestialSync tokens

### 2. Publish Code Connect (after creating your Figma component library)
```bash
npx figma connect publish
```
This links your React components to Figma components so the MCP plugin generates real code.

---

## Design → Implement Loop

```
1. Design a new feature in Figma Desktop using Variables + linked components
2. Select the frame (no URL needed — MCP reads active selection)
3. Tell Claude: "implement this" or "build this from the selected Figma frame"
4. Claude calls get_design_context + get_screenshot automatically
5. Claude translates to React/TypeScript using your real components + CSS tokens
6. Validate the output against the Figma screenshot
7. Done — commit
```

---

## Token Reference

All tokens are available in Figma Variables after importing `figma/tokens.json`.

### Brand Tokens (use these for new designs)
| Figma Variable | CSS equivalent | Use for |
|---|---|---|
| `semantic/color/nebula/default` | `hsl(var(--nebula))` | Primary brand, planet highlights |
| `semantic/color/nebula/glow` | `hsl(var(--nebula-glow))` | Glow effects, ring color |
| `semantic/color/gold/default` | `hsl(var(--gold))` | Accent, selected states, CTA |
| `semantic/color/gold/dim` | `hsl(var(--gold-dim))` | Subdued gold, hover states |
| `semantic/color/obsidian/default` | `hsl(var(--obsidian))` | Main background |
| `semantic/color/obsidian/light` | `hsl(var(--obsidian-light))` | Card backgrounds |

### Semantic Tokens (Tailwind/shadcn compatible)
| Figma Variable | CSS equivalent | Tailwind class |
|---|---|---|
| `semantic/color/background` | `hsl(var(--background))` | `bg-background` |
| `semantic/color/foreground` | `hsl(var(--foreground))` | `text-foreground` |
| `semantic/color/primary/default` | `hsl(var(--primary))` | `bg-primary` |
| `semantic/color/accent/default` | `hsl(var(--accent))` | `bg-accent` |
| `semantic/color/muted/foreground` | `hsl(var(--muted-foreground))` | `text-muted-foreground` |
| `semantic/color/card/default` | `hsl(var(--card))` | `bg-card` |
| `semantic/color/border` | `hsl(var(--border))` | `border-border` |

### Glassmorphism Panel
For glass-effect cards (`.glass-panel` class in code), use in Figma:
- Fill: `semantic/color/glass/bg` with backdrop blur effect
- Border: `semantic/color/glass/border`
- Blur: 20px background blur

### Typography
| Font | Weight | Use for |
|---|---|---|
| Cormorant Garamond | 400–700 | Headings, chart labels, mystical text |
| Inter | 300–600 | Body, UI labels, data |

### Border Radius
| Token | Value | Tailwind |
|---|---|---|
| `base/borderRadius/sm` | 8px | `rounded-sm` |
| `base/borderRadius/md` | 10px | `rounded-md` |
| `base/borderRadius/lg` | 12px | `rounded-lg` |

---

## Adding a New Component to Code Connect

1. Create `figma/components/YourComponent.figma.tsx`
2. Add the `figma.connect()` call with the Figma node URL from your file
3. Map visual props using `figma.string()`, `figma.boolean()`, `figma.enum()`
4. Run `npx figma connect publish`

### Template
```tsx
import figma from "@figma/code-connect";
import YourComponent from "@/components/YourComponent";

figma.connect(YourComponent, "FIGMA_NODE_URL_HERE", {
  props: {
    label: figma.string("Label"),
    variant: figma.enum("Variant", {
      default: "default",
      outline: "outline",
    }),
  },
  example: ({ label, variant }) => (
    <YourComponent label={label} variant={variant} />
  ),
});
```

---

## Connecting Figma Node URLs

After creating components in your Figma file:
1. Right-click a component → **Copy/Paste as** → **Copy link**
2. Replace `"FIGMA_NODE_URL"` in the relevant `.figma.tsx` stub
3. Re-run `npx figma connect publish`

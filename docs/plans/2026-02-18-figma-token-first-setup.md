# Figma Token-First Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish a design-first Figma workflow by exporting all CelestialSync design tokens into a Figma-importable `tokens.json`, scaffolding Code Connect stubs for all 25 components, and documenting the design→implement loop.

**Architecture:** Extract CSS variables and Tailwind config into Token Studio JSON → user imports via Tokens Studio Figma plugin → sets up Figma Variables. Code Connect stubs scaffold the component-to-Figma link so the MCP plugin generates real component code. A workflow cheatsheet documents the ongoing loop.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS + shadcn/ui, `@figma/code-connect` CLI, Tokens Studio Figma plugin (user-installed), Figma Desktop MCP server

---

### Task 1: Install @figma/code-connect

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

```bash
npm install --save-dev @figma/code-connect
```

**Step 2: Verify install**

```bash
npx figma connect --version
```

Expected: prints a version number (e.g. `1.x.x`). If you see "command not found", re-run npm install.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @figma/code-connect"
```

---

### Task 2: Create Design Token Export (`figma/tokens.json`)

**Files:**
- Create: `figma/tokens.json`

This file maps every CSS variable from `src/index.css` and every custom token from `tailwind.config.ts` into Token Studio JSON format. Users import this file into the free [Tokens Studio for Figma](https://tokens.studio/) plugin to create native Figma Variables.

**Step 1: Create the figma/ directory and tokens.json**

Create `figma/tokens.json` with this exact content:

```json
{
  "$metadata": {
    "tokenSetOrder": ["base", "semantic", "components"]
  },
  "base": {
    "color": {
      "nebula": {
        "25": { "value": "hsl(275, 80%, 60%)", "type": "color" },
        "50": { "value": "hsl(275, 80%, 50%)", "type": "color" },
        "100": { "value": "hsl(275, 80%, 40%)", "type": "color" },
        "200": { "value": "hsl(275, 100%, 25%)", "type": "color" },
        "300": { "value": "hsl(275, 100%, 15%)", "type": "color" }
      },
      "gold": {
        "25": { "value": "hsl(45, 100%, 70%)", "type": "color" },
        "50": { "value": "hsl(45, 100%, 60%)", "type": "color" },
        "100": { "value": "hsl(45, 100%, 50%)", "type": "color" },
        "200": { "value": "hsl(45, 80%, 35%)", "type": "color" }
      },
      "obsidian": {
        "25": { "value": "hsl(235, 20%, 20%)", "type": "color" },
        "50": { "value": "hsl(235, 20%, 18%)", "type": "color" },
        "75": { "value": "hsl(235, 20%, 15%)", "type": "color" },
        "100": { "value": "hsl(235, 20%, 12%)", "type": "color" },
        "125": { "value": "hsl(235, 20%, 11%)", "type": "color" },
        "150": { "value": "hsl(235, 25%, 8%)", "type": "color" },
        "200": { "value": "hsl(235, 25%, 7%)", "type": "color" }
      },
      "cream": {
        "100": { "value": "hsl(45, 20%, 95%)", "type": "color" },
        "200": { "value": "hsl(45, 20%, 90%)", "type": "color" }
      },
      "muted-text": { "value": "hsl(235, 10%, 55%)", "type": "color" },
      "danger": { "value": "hsl(0, 72%, 51%)", "type": "color" }
    },
    "borderRadius": {
      "sm": { "value": "8px", "type": "borderRadius" },
      "md": { "value": "10px", "type": "borderRadius" },
      "lg": { "value": "12px", "type": "borderRadius" }
    },
    "fontFamily": {
      "serif": { "value": "Cormorant Garamond, Georgia, serif", "type": "fontFamilies" },
      "sans": { "value": "Inter, system-ui, sans-serif", "type": "fontFamilies" }
    },
    "fontWeight": {
      "light": { "value": "300", "type": "fontWeights" },
      "regular": { "value": "400", "type": "fontWeights" },
      "medium": { "value": "500", "type": "fontWeights" },
      "semibold": { "value": "600", "type": "fontWeights" },
      "bold": { "value": "700", "type": "fontWeights" }
    }
  },
  "semantic": {
    "color": {
      "background": {
        "value": "{base.color.obsidian.200}",
        "type": "color",
        "description": "CSS: --background"
      },
      "foreground": {
        "value": "{base.color.cream.100}",
        "type": "color",
        "description": "CSS: --foreground"
      },
      "card": {
        "default": { "value": "{base.color.obsidian.125}", "type": "color", "description": "CSS: --card" },
        "foreground": { "value": "{base.color.cream.100}", "type": "color", "description": "CSS: --card-foreground" }
      },
      "popover": {
        "default": { "value": "{base.color.obsidian.125}", "type": "color", "description": "CSS: --popover" },
        "foreground": { "value": "{base.color.cream.100}", "type": "color", "description": "CSS: --popover-foreground" }
      },
      "primary": {
        "default": { "value": "{base.color.nebula.200}", "type": "color", "description": "CSS: --primary" },
        "foreground": { "value": "{base.color.cream.100}", "type": "color", "description": "CSS: --primary-foreground" }
      },
      "secondary": {
        "default": { "value": "{base.color.obsidian.75}", "type": "color", "description": "CSS: --secondary" },
        "foreground": { "value": "{base.color.cream.100}", "type": "color", "description": "CSS: --secondary-foreground" }
      },
      "muted": {
        "default": { "value": "{base.color.obsidian.50}", "type": "color", "description": "CSS: --muted" },
        "foreground": { "value": "{base.color.muted-text}", "type": "color", "description": "CSS: --muted-foreground" }
      },
      "accent": {
        "default": { "value": "{base.color.gold.100}", "type": "color", "description": "CSS: --accent" },
        "foreground": { "value": "{base.color.obsidian.200}", "type": "color", "description": "CSS: --accent-foreground" }
      },
      "destructive": {
        "default": { "value": "{base.color.danger}", "type": "color", "description": "CSS: --destructive" },
        "foreground": { "value": "{base.color.cream.100}", "type": "color", "description": "CSS: --destructive-foreground" }
      },
      "border": { "value": "hsl(275, 30%, 20%)", "type": "color", "description": "CSS: --border" },
      "input": { "value": "{base.color.obsidian.75}", "type": "color", "description": "CSS: --input" },
      "ring": { "value": "{base.color.nebula.100}", "type": "color", "description": "CSS: --ring" },
      "nebula": {
        "default": { "value": "{base.color.nebula.200}", "type": "color", "description": "CSS: --nebula" },
        "glow": { "value": "{base.color.nebula.100}", "type": "color", "description": "CSS: --nebula-glow" }
      },
      "gold": {
        "default": { "value": "{base.color.gold.100}", "type": "color", "description": "CSS: --gold" },
        "dim": { "value": "{base.color.gold.200}", "type": "color", "description": "CSS: --gold-dim" }
      },
      "obsidian": {
        "default": { "value": "{base.color.obsidian.200}", "type": "color", "description": "CSS: --obsidian" },
        "light": { "value": "{base.color.obsidian.100}", "type": "color", "description": "CSS: --obsidian-light" }
      },
      "sidebar": {
        "background": { "value": "{base.color.obsidian.150}", "type": "color", "description": "CSS: --sidebar-background" },
        "foreground": { "value": "{base.color.cream.200}", "type": "color", "description": "CSS: --sidebar-foreground" },
        "primary": { "value": "{base.color.nebula.200}", "type": "color", "description": "CSS: --sidebar-primary" },
        "primary-foreground": { "value": "{base.color.cream.100}", "type": "color", "description": "CSS: --sidebar-primary-foreground" },
        "accent": { "value": "{base.color.obsidian.75}", "type": "color", "description": "CSS: --sidebar-accent" },
        "accent-foreground": { "value": "{base.color.cream.200}", "type": "color", "description": "CSS: --sidebar-accent-foreground" },
        "border": { "value": "hsl(275, 30%, 20%)", "type": "color", "description": "CSS: --sidebar-border" },
        "ring": { "value": "{base.color.nebula.100}", "type": "color", "description": "CSS: --sidebar-ring" }
      }
    },
    "glass": {
      "bg": {
        "value": "rgba(38, 43, 66, 0.6)",
        "type": "color",
        "description": "CSS: --glass-bg. Glass panel background for glassmorphism cards."
      },
      "border": {
        "value": "rgba(102, 51, 153, 0.3)",
        "type": "color",
        "description": "CSS: --glass-border. Glass panel border."
      },
      "blur": {
        "value": "20px",
        "type": "other",
        "description": "CSS: --glass-blur. backdrop-filter blur value."
      }
    }
  }
}
```

**Step 2: Verify the JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('figma/tokens.json', 'utf8')); console.log('✓ Valid JSON')"
```

Expected output: `✓ Valid JSON`

**Step 3: Commit**

```bash
git add figma/tokens.json
git commit -m "feat(figma): add Token Studio design token export"
```

---

### Task 3: Create `figma.config.json`

**Files:**
- Create: `figma.config.json` (project root)

**Step 1: Create the config**

Create `figma.config.json` at the project root:

```json
{
  "codeConnect": {
    "include": ["figma/components/**/*.figma.tsx"],
    "exclude": ["node_modules/**"],
    "parser": "react",
    "importPaths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Step 2: Verify it's readable**

```bash
node -e "JSON.parse(require('fs').readFileSync('figma.config.json', 'utf8')); console.log('✓ Valid')"
```

**Step 3: Commit**

```bash
git add figma.config.json
git commit -m "feat(figma): add Code Connect config"
```

---

### Task 4: Create Code Connect Stubs — Core UI Components

**Files:**
- Create: `figma/components/StarField.figma.tsx`
- Create: `figma/components/NavLink.figma.tsx`
- Create: `figma/components/AuthGate.figma.tsx`
- Create: `figma/components/UserMenu.figma.tsx`
- Create: `figma/components/GlossaryPopover.figma.tsx`
- Create: `figma/components/PodcastUpsell.figma.tsx`

**Step 1: Create figma/components/ directory**

```bash
mkdir -p figma/components
```

**Step 2: Create StarField.figma.tsx**

```tsx
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
```

**Step 3: Create NavLink.figma.tsx**

```tsx
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
```

**Step 4: Create AuthGate.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import AuthGate from "@/components/AuthGate";

figma.connect(AuthGate, "FIGMA_NODE_URL", {
  example: () => (
    <AuthGate>
      <div>Protected content</div>
    </AuthGate>
  ),
});
```

**Step 5: Create UserMenu.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import UserMenu from "@/components/UserMenu";

figma.connect(UserMenu, "FIGMA_NODE_URL", {
  example: () => <UserMenu />,
});
```

**Step 6: Create GlossaryPopover.figma.tsx**

```tsx
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
```

**Step 7: Create PodcastUpsell.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import PodcastUpsell from "@/components/PodcastUpsell";

figma.connect(PodcastUpsell, "FIGMA_NODE_URL", {
  example: () => <PodcastUpsell birthData={null as any} />,
});
```

**Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see errors about missing `figma` types, ensure `@figma/code-connect` is installed (Task 1).

**Step 9: Commit**

```bash
git add figma/components/
git commit -m "feat(figma): add Code Connect stubs for core UI components"
```

---

### Task 5: Create Code Connect Stubs — Chart & Data Components

**Files:**
- Create: `figma/components/NatalChartWheel.figma.tsx`
- Create: `figma/components/ChartDashboard.figma.tsx`
- Create: `figma/components/CelestialSphere3D.figma.tsx`
- Create: `figma/components/AspectLines.figma.tsx`
- Create: `figma/components/SynastryAspectLines.figma.tsx`
- Create: `figma/components/PlanetsList.figma.tsx`
- Create: `figma/components/PlanetDetails.figma.tsx`
- Create: `figma/components/HouseDetails.figma.tsx`
- Create: `figma/components/ChartBadges.figma.tsx`

**Step 1: Create NatalChartWheel.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import NatalChartWheel from "@/components/NatalChartWheel";

// Replace FIGMA_NODE_URL with the node URL from your Figma file
// e.g. https://figma.com/design/FILE_KEY/Name?node-id=1-2
figma.connect(NatalChartWheel, "FIGMA_NODE_URL", {
  props: {
    houseSystem: figma.enum("House System", {
      placidus: "placidus",
      "whole-sign": "whole-sign",
      equal: "equal",
    }),
  },
  example: ({ houseSystem }) => (
    <NatalChartWheel
      chartData={null as any}
      houseSystem={houseSystem}
      onSelectPlanet={() => {}}
      onSelectHouse={() => {}}
      selectedPlanet={null}
      selectedHouse={null}
    />
  ),
});
```

**Step 2: Create ChartDashboard.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import ChartDashboard from "@/components/ChartDashboard";

figma.connect(ChartDashboard, "FIGMA_NODE_URL", {
  example: () => <ChartDashboard birthData={null as any} />,
});
```

**Step 3: Create CelestialSphere3D.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import CelestialSphere3D from "@/components/CelestialSphere3D";

figma.connect(CelestialSphere3D, "FIGMA_NODE_URL", {
  example: () => (
    <CelestialSphere3D
      chartData={null as any}
      houseSystem="placidus"
      onSelectPlanet={() => {}}
      selectedPlanet={null}
    />
  ),
});
```

**Step 4: Create AspectLines.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import AspectLines from "@/components/AspectLines";

figma.connect(AspectLines, "FIGMA_NODE_URL", {
  example: () => (
    <AspectLines
      planets={[]}
      center={400}
      innerRadius={90}
      planetPositions={{}}
    />
  ),
});
```

**Step 5: Create SynastryAspectLines.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import SynastryAspectLines from "@/components/SynastryAspectLines";

figma.connect(SynastryAspectLines, "FIGMA_NODE_URL", {
  example: () => (
    <SynastryAspectLines
      natalPlanets={[]}
      partnerPlanets={[]}
      center={400}
      natalPositions={{}}
      partnerPositions={{}}
    />
  ),
});
```

**Step 6: Create PlanetsList.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import PlanetsList from "@/components/PlanetsList";

figma.connect(PlanetsList, "FIGMA_NODE_URL", {
  example: () => <PlanetsList planets={[]} onSelectPlanet={() => {}} selectedPlanet={null} />,
});
```

**Step 7: Create PlanetDetails.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import PlanetDetails from "@/components/PlanetDetails";

figma.connect(PlanetDetails, "FIGMA_NODE_URL", {
  example: () => <PlanetDetails planet={null as any} />,
});
```

**Step 8: Create HouseDetails.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import HouseDetails from "@/components/HouseDetails";

figma.connect(HouseDetails, "FIGMA_NODE_URL", {
  example: () => <HouseDetails house={null as any} planets={[]} />,
});
```

**Step 9: Create ChartBadges.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import ChartBadges from "@/components/ChartBadges";

figma.connect(ChartBadges, "FIGMA_NODE_URL", {
  example: () => <ChartBadges planets={[]} />,
});
```

**Step 10: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 11: Commit**

```bash
git add figma/components/
git commit -m "feat(figma): add Code Connect stubs for chart components"
```

---

### Task 6: Create Code Connect Stubs — Feature Panels

**Files:**
- Create: `figma/components/DailyInsightPanel.figma.tsx`
- Create: `figma/components/TodaysPlanetaryBar.figma.tsx`
- Create: `figma/components/NatalChartExplainer.figma.tsx`
- Create: `figma/components/AllHousesGuide.figma.tsx`
- Create: `figma/components/AstrologyHistory.figma.tsx`
- Create: `figma/components/CompatibilityScorecard.figma.tsx`
- Create: `figma/components/SavedCharts.figma.tsx`
- Create: `figma/components/AstrocartographyMap.figma.tsx`

**Step 1: Create DailyInsightPanel.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import DailyInsightPanel from "@/components/DailyInsightPanel";

figma.connect(DailyInsightPanel, "FIGMA_NODE_URL", {
  example: () => <DailyInsightPanel chartData={null as any} />,
});
```

**Step 2: Create TodaysPlanetaryBar.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import TodaysPlanetaryBar from "@/components/TodaysPlanetaryBar";

figma.connect(TodaysPlanetaryBar, "FIGMA_NODE_URL", {
  example: () => <TodaysPlanetaryBar chartData={null as any} />,
});
```

**Step 3: Create NatalChartExplainer.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import NatalChartExplainer from "@/components/NatalChartExplainer";

figma.connect(NatalChartExplainer, "FIGMA_NODE_URL", {
  example: () => <NatalChartExplainer chartData={null as any} />,
});
```

**Step 4: Create AllHousesGuide.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import AllHousesGuide from "@/components/AllHousesGuide";

figma.connect(AllHousesGuide, "FIGMA_NODE_URL", {
  props: {
    houseSystem: figma.enum("House System", {
      placidus: "placidus",
      "whole-sign": "whole-sign",
      equal: "equal",
    }),
  },
  example: ({ houseSystem }) => (
    <AllHousesGuide houseSystem={houseSystem} />
  ),
});
```

**Step 5: Create AstrologyHistory.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import AstrologyHistory from "@/components/AstrologyHistory";

figma.connect(AstrologyHistory, "FIGMA_NODE_URL", {
  example: () => <AstrologyHistory />,
});
```

**Step 6: Create CompatibilityScorecard.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import CompatibilityScorecard from "@/components/CompatibilityScorecard";

figma.connect(CompatibilityScorecard, "FIGMA_NODE_URL", {
  props: {
    userName: figma.string("User Name"),
    partnerName: figma.string("Partner Name"),
  },
  example: ({ userName, partnerName }) => (
    <CompatibilityScorecard
      natalPlanets={[]}
      partnerPlanets={[]}
      userName={userName}
      partnerName={partnerName}
    />
  ),
});
```

**Step 7: Create SavedCharts.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import SavedCharts from "@/components/SavedCharts";

figma.connect(SavedCharts, "FIGMA_NODE_URL", {
  example: () => <SavedCharts />,
});
```

**Step 8: Create AstrocartographyMap.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import AstrocartographyMap from "@/components/AstrocartographyMap";

figma.connect(AstrocartographyMap, "FIGMA_NODE_URL", {
  example: () => (
    <AstrocartographyMap chartData={null as any} birthData={null as any} />
  ),
});
```

**Step 9: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 10: Commit**

```bash
git add figma/components/
git commit -m "feat(figma): add Code Connect stubs for feature panel components"
```

---

### Task 7: Create Code Connect Stubs — Form & Selector Components

**Files:**
- Create: `figma/components/HouseSystemSelector.figma.tsx`
- Create: `figma/components/ZodiacSystemSelector.figma.tsx`
- Create: `figma/components/SynastryPartnerForm.figma.tsx`

**Step 1: Create HouseSystemSelector.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import HouseSystemSelector from "@/components/HouseSystemSelector";

figma.connect(HouseSystemSelector, "FIGMA_NODE_URL", {
  props: {
    value: figma.enum("Value", {
      placidus: "placidus",
      "whole-sign": "whole-sign",
      equal: "equal",
    }),
  },
  example: ({ value }) => (
    <HouseSystemSelector value={value} onChange={() => {}} />
  ),
});
```

**Step 2: Create ZodiacSystemSelector.figma.tsx**

```tsx
import figma from "@figma/code-connect";
import ZodiacSystemSelector from "@/components/ZodiacSystemSelector";

figma.connect(ZodiacSystemSelector, "FIGMA_NODE_URL", {
  props: {
    value: figma.enum("Value", {
      tropical: "tropical",
      sidereal: "sidereal",
    }),
  },
  example: ({ value }) => (
    <ZodiacSystemSelector value={value} onChange={() => {}} />
  ),
});
```

**Step 3: Create SynastryPartnerForm.figma.tsx**

```tsx
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
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add figma/components/
git commit -m "feat(figma): add Code Connect stubs for form and selector components"
```

---

### Task 8: Create Workflow Cheatsheet

**Files:**
- Create: `docs/figma-workflow.md`

**Step 1: Create the cheatsheet**

Create `docs/figma-workflow.md`:

```markdown
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

All tokens are available in Figma Variables after importing `tokens.json`.

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
| Font | Weight | Figma style name | Use for |
|---|---|---|---|
| Cormorant Garamond | 400–700 | Serif / * | Headings, chart labels, mystical text |
| Inter | 300–600 | Sans / * | Body, UI labels, data |

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
```

**Step 2: Commit**

```bash
git add docs/figma-workflow.md
git commit -m "docs: add Figma workflow cheatsheet"
```

---

### Task 9: Final Validation

**Step 1: Verify all TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

**Step 2: Verify token JSON is valid**

```bash
node -e "const t = JSON.parse(require('fs').readFileSync('figma/tokens.json', 'utf8')); console.log('Token sets:', Object.keys(t).join(', '))"
```

Expected: `Token sets: $metadata, base, semantic`

**Step 3: Verify figma stubs count**

```bash
ls figma/components/*.figma.tsx | wc -l
```

Expected: `25`

**Step 4: Dry-run Code Connect (no Figma file needed)**

```bash
npx figma connect --dry-run 2>&1 || true
```

This may warn about missing Figma URLs — that's expected. We're just checking the CLI runs without crashing.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(figma): complete token-first foundation setup"
```

---

## Next Steps (After Completing This Plan)

1. **Import tokens into Figma** — Open Figma Desktop → Tokens Studio plugin → Load `figma/tokens.json` → Sync Variables
2. **Create your component library** in Figma using those Variables
3. **Fill in Figma node URLs** — Right-click each Figma component → Copy link → paste into the matching `.figma.tsx` stub
4. **Publish Code Connect** — `npx figma connect publish`
5. **Design a feature** → Select frame in Figma Desktop → tell Claude to implement it

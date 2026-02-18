# Figma Integration Design

**Date:** 2026-02-18
**Project:** CelestialSync (cosmic-calculations)
**Approach:** Token-First Foundation

## Goal

Establish a design-first workflow using Figma Desktop + Figma MCP plugin. Design new features in Figma, implement them with pixel-perfect accuracy using the MCP plugin's `get_design_context` and `get_screenshot` tools.

## Deliverables

### 1. Design Token Export (`tokens.json`)

Extract all tokens from `tailwind.config.ts` and `src/index.css` into Token Studio JSON format for import into Figma via the free Tokens Studio plugin.

**Tokens covered:**
- Colors: background, foreground, primary, secondary, muted, accent, card, border, ring, sidebar, nebula, gold, obsidian, glassmorphism
- Typography: Cormorant Garamond (serif), Inter (sans-serif), weights
- Border radius: `--radius` system (lg, md, sm)
- Animations: glow-pulse, orbit, fade-in, fade-out, scale-in, slide-up (documented as notes)

**Location:** `figma/tokens.json`

**Import steps:**
1. Install "Tokens Studio for Figma" plugin (free) in Figma Desktop
2. Open plugin → Load from File → select `figma/tokens.json`
3. Click "Sync Variables" → tokens become native Figma Variables

### 2. Code Connect Scaffold

**`figma.config.json`** — Code Connect config at project root. User fills in Figma file URL once created.

**`figma/` directory** — `.figma.tsx` stub for each component:

| Component | Props Mapped |
|-----------|-------------|
| NatalChartWheel | planets, houses, aspects |
| SynastryAspectLines | chart1, chart2, aspects |
| ChartDashboard | chartData, view |
| CelestialSphere3D | planets, interactive |
| AstrocartographyMap | birthData, overlays |
| DailyInsightPanel | date, insights |
| CompatibilityScorecard | scores, summary |
| PlanetsList | planets, selected |
| PlanetDetails | planet, position |
| HouseDetails | house, planets |
| AllHousesGuide | houseSystem |
| HouseSystemSelector | value, onChange |
| ZodiacSystemSelector | value, onChange |
| NatalChartExplainer | section |
| ChartBadges | aspects, count |
| SavedCharts | charts, onSelect |
| TodaysPlanetaryBar | transits |
| AspectLines | aspects, width, height |
| StarField | density, animated |
| GlossaryPopover | term, children |
| NavLink | to, children, active |
| UserMenu | user, onSignOut |
| AuthGate | children |
| PodcastUpsell | — |
| SynastryPartnerForm | onSubmit |

**Publish command:**
```bash
npx figma connect publish
```

### 3. Workflow Cheatsheet (`docs/figma-workflow.md`)

Step-by-step guide for the design → implement loop, token reference, and instructions for adding new components to Code Connect.

## Design → Implement Loop

```
Design frame in Figma Desktop
        ↓
Select frame (no URL needed — MCP reads active selection)
        ↓
"Implement this" → get_design_context + get_screenshot
        ↓
Translate to React/TypeScript using real component names + CSS variable tokens
        ↓
Validate against Figma screenshot
        ↓
Done
```

## Key Token Reference

| Code Token | Figma Variable |
|-----------|---------------|
| `hsl(var(--nebula))` | `nebula/default` |
| `hsl(var(--nebula-glow))` | `nebula/glow` |
| `hsl(var(--gold))` | `gold/default` |
| `hsl(var(--gold-dim))` | `gold/dim` |
| `hsl(var(--obsidian))` | `obsidian/default` |
| `hsl(var(--obsidian-light))` | `obsidian/light` |
| `hsl(var(--primary))` | `primary/default` |
| `hsl(var(--background))` | `background` |
| `hsl(var(--foreground))` | `foreground` |

## Stack

- React 18 + TypeScript + Vite
- shadcn/ui (Radix UI primitives)
- Tailwind CSS with CSS variables
- Custom theme: "Modern Ethereal" dark mode only
- Fonts: Cormorant Garamond (serif headings) + Inter (sans body)

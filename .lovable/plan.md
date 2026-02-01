

# Enhanced Astrocartography Experience

This plan transforms the current flat, static astrocartography map into an immersive, cosmic experience that connects celestial and terrestrial energies.

## Overview

We'll implement three major enhancements:

1. **Cosmic Planetary Alignments Bar** - A dynamic header showing today's planetary positions and how they interact with your natal chart
2. **Immersive Globe Experience** - Transform the map from flat Mercator to a 3D globe floating in space with atmospheric effects
3. **Glowing Celestial Lines** - Upgrade planetary lines from basic strokes to luminous energy beams with animations

---

## Feature 1: Today's Planetary Alignments Bar

A horizontal bar displayed above the map showing current (transiting) planet positions and their relationship to your birth chart.

**What it shows:**
- Current positions of Sun, Moon, and planets with their zodiac signs
- Highlighting when a transiting planet activates one of your natal ACG lines
- Visual indication of beneficial vs challenging transits

**User value:** Helps users understand "Why should I care about this map TODAY?" by connecting real-time celestial movements to their personal chart.

**Design approach:**
- Horizontally scrollable on mobile, full-width on desktop
- Planet symbols with colored backgrounds matching the line colors
- Subtle pulse animation when a transit is active on a visible line

---

## Feature 2: Globe Projection with Space Atmosphere

Transform the map into a 3D globe that feels like it's floating in space.

**Visual enhancements:**
- Globe projection instead of flat Mercator
- Starfield background using Mapbox's fog/atmosphere API
- Gentle auto-rotation when the map is idle (can be paused on interaction)
- Smooth "fly-to" camera animations when exploring locations

**Technical approach:**
- Switch from `projection: "mercator"` to `projection: "globe"`
- Configure `setFog()` with deep space colors and star intensity
- Add idle spin animation using `requestAnimationFrame` with easing
- Use `flyTo()` for cinematic camera movements when clicking locations

---

## Feature 3: Glowing Planetary Lines

Make the planetary lines feel like energy meridians crossing the Earth.

**Visual upgrades:**
- Dual-layer glow effect: thin bright core + wider transparent outer glow
- Subtle animated pulse along active/highlighted lines
- Line intensity based on proximity to clicked location

**Technical approach:**
- Each line becomes two map layers: a "glow" layer (wide, semi-transparent) and a "core" layer (thin, bright)
- Use `line-blur` and `line-opacity` properties for the ethereal effect
- Animate via periodic style updates or CSS-based animations

---

## Technical Implementation Details

### New Component: `TodaysPlanetaryBar.tsx`

A new component that:
- Calculates current planetary positions using the existing ephemeris module
- Compares transiting positions to natal positions to find active aspects
- Renders a horizontal bar with planet icons and transit indicators

```text
+------------------------------------------------------------------+
| Today: Sun in Leo  |  Moon in Pisces  |  Mars conjunct your MC!  |
+------------------------------------------------------------------+
```

### Map Configuration Changes

Current setup:
```
projection: "mercator"
style: "mapbox://styles/mapbox/dark-v11"
```

Enhanced setup:
```
projection: "globe"
style: "mapbox://styles/mapbox/dark-v11"  (with custom fog/atmosphere)
```

Fog configuration for space atmosphere:
- Star intensity: 0.8 (visible stars)
- Space color: Deep purple/black (#0a0020)
- Horizon blend: Subtle blue glow at Earth's edge

### Line Rendering Enhancement

Current: Single line layer per planetary line
```
{
  "line-color": "#FFD700",
  "line-width": 2,
  "line-opacity": 0.8
}
```

Enhanced: Two layers (glow + core) per line
```
// Outer glow layer
{
  "line-color": "#FFD700",
  "line-width": 12,
  "line-opacity": 0.15,
  "line-blur": 8
}

// Inner core layer  
{
  "line-color": "#FFD700",
  "line-width": 2,
  "line-opacity": 0.9
}
```

### Idle Globe Spin Animation

When the user hasn't interacted for 5 seconds:
- Begin slow rotation (0.5 degrees per second)
- Stop immediately on any user interaction
- Resume after another idle period

### Camera Animations

When clicking a location:
- Use `flyTo()` with a 2-second duration
- Zoom to level 4-5 for regional context
- Slight camera pitch (15-20 degrees) for perspective

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/TodaysPlanetaryBar.tsx` | Create | New component for transit display bar |
| `src/components/AstrocartographyMap.tsx` | Modify | Globe projection, atmosphere, glowing lines, animations |
| `src/lib/astrocartography/transits.ts` | Create | Calculate current planetary positions and aspects to natal chart |

---

## User Experience Flow

1. User navigates to Map view
2. **Planetary Alignments Bar** appears at top showing today's cosmic weather
3. **Globe fades in** with a gentle rotation, stars visible in the background
4. **Glowing lines** trace across the Earth's surface
5. Bar highlights any planets currently activating the user's lines
6. User clicks a location - camera **flies smoothly** to that point
7. Location panel shows nearby influences with distance orbs

---

## Accessibility Considerations

- Globe rotation can be paused via a toggle button
- Reduced motion preference will disable auto-spin
- High contrast mode will use solid lines instead of glow effects
- All interactive elements remain keyboard accessible

---

## Performance Notes

- Globe projection is GPU-accelerated in Mapbox GL JS
- Line glow effect uses two layers per line (acceptable for ~44 lines max)
- Idle animation uses `requestAnimationFrame` with throttling
- Transit calculations run once on mount, not continuously


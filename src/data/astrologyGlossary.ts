export interface GlossaryEntry {
  term: string;
  shortDef: string;
  details: string;
  category: "aspect" | "planet" | "sign" | "house" | "pattern" | "general";
}

export const glossary: Record<string, GlossaryEntry> = {
  conjunction: {
    term: "Conjunction",
    shortDef: "Two planets at the same degree (0°)",
    details:
      "A conjunction fuses the energies of two planets together, amplifying and blending their themes. It's the most powerful aspect—neither harmonious nor challenging on its own, but intensely focused.",
    category: "aspect",
  },
  opposition: {
    term: "Opposition",
    shortDef: "Two planets 180° apart",
    details:
      "An opposition creates a tug-of-war between two planetary energies. It highlights polarity and demands integration—learning to balance both sides rather than swinging between extremes.",
    category: "aspect",
  },
  trine: {
    term: "Trine",
    shortDef: "Two planets 120° apart — harmonious flow",
    details:
      "A trine connects planets in signs of the same element, creating effortless talent and natural gifts. The energy flows so smoothly it can sometimes be taken for granted.",
    category: "aspect",
  },
  square: {
    term: "Square",
    shortDef: "Two planets 90° apart — dynamic tension",
    details:
      "A square creates friction and internal conflict between two planetary energies. While challenging, squares are the engine of growth—they push you to take action and overcome obstacles.",
    category: "aspect",
  },
  sextile: {
    term: "Sextile",
    shortDef: "Two planets 60° apart — opportunity",
    details:
      "A sextile offers gentle, cooperative energy between two planets. Unlike the automatic trine, sextiles represent latent opportunities that bloom when you actively engage them.",
    category: "aspect",
  },
  quincunx: {
    term: "Quincunx",
    shortDef: "Two planets 150° apart — adjustment needed",
    details:
      "Also called an inconjunct, this aspect links signs with nothing in common. It creates a nagging sense that two parts of your life don't fit together, requiring constant creative adjustment.",
    category: "aspect",
  },
  retrograde: {
    term: "Retrograde",
    shortDef: "A planet appearing to move backward",
    details:
      "When a planet is retrograde (Rx), its energy turns inward. It's a time for review, revision, and reflection in the areas that planet governs. It doesn't mean things go wrong—it means they go deeper.",
    category: "general",
  },
  ascendant: {
    term: "Ascendant (Rising Sign)",
    shortDef: "The sign on your 1st house cusp",
    details:
      "Your Ascendant is the mask you wear and how others first perceive you. It sets the entire house layout of your chart and is just as important as your Sun sign for understanding your personality.",
    category: "general",
  },
  midheaven: {
    term: "Midheaven (MC)",
    shortDef: "The highest point of your chart — career & public image",
    details:
      "The Midheaven represents your public reputation, career path, and legacy. It's the sign at the top of your chart, showing how the world sees your achievements and ambitions.",
    category: "general",
  },
  stellium: {
    term: "Stellium",
    shortDef: "3+ planets in the same sign or house",
    details:
      "A stellium concentrates enormous energy in one area of your chart. It creates a dominant theme in your life—a zone of intense focus, talent, and sometimes obsession.",
    category: "pattern",
  },
  "grand trine": {
    term: "Grand Trine",
    shortDef: "Three planets forming an equilateral triangle (120° each)",
    details:
      "A Grand Trine links three planets in signs of the same element, creating a closed circuit of flowing, harmonious energy. It's a rare gift of natural talent, though it can sometimes lead to complacency.",
    category: "pattern",
  },
  "t-square": {
    term: "T-Square",
    shortDef: "Two planets in opposition with a third squaring both",
    details:
      "A T-Square is one of the most dynamic chart patterns. The planet at the apex (the one squaring both) becomes the pressure release valve—the area of life where tension drives action and achievement.",
    category: "pattern",
  },
  "grand cross": {
    term: "Grand Cross",
    shortDef: "Four planets forming a cross pattern with two oppositions and four squares",
    details:
      "A Grand Cross creates enormous internal tension pulling in four directions simultaneously. People with this pattern often have extraordinary drive and resilience born from navigating constant challenges.",
    category: "pattern",
  },
  yod: {
    term: "Yod (Finger of God)",
    shortDef: "Two planets sextile each other, both quincunx a third",
    details:
      "A Yod points to a fated mission or a specific talent that demands expression. The apex planet holds the key—it's an area of life that feels destined, requiring constant adjustment and growth.",
    category: "pattern",
  },
  cusp: {
    term: "Cusp",
    shortDef: "The starting boundary of a house",
    details:
      "Each house begins at its cusp—the zodiac degree where it starts. The sign on the cusp colors how you experience that house's themes. The 1st house cusp is your Ascendant.",
    category: "house",
  },
  element: {
    term: "Element",
    shortDef: "Fire, Earth, Air, or Water — a sign's core energy",
    details:
      "The four elements describe fundamental temperaments. Fire signs (Aries, Leo, Sagittarius) are passionate; Earth (Taurus, Virgo, Capricorn) is practical; Air (Gemini, Libra, Aquarius) is intellectual; Water (Cancer, Scorpio, Pisces) is emotional.",
    category: "general",
  },
  modality: {
    term: "Modality",
    shortDef: "Cardinal, Fixed, or Mutable — a sign's operating style",
    details:
      "Cardinal signs initiate, Fixed signs sustain, and Mutable signs adapt. Your dominant modality shapes whether you're a starter, a maintainer, or a flexible improviser.",
    category: "general",
  },
  orb: {
    term: "Orb",
    shortDef: "The allowed margin of error for an aspect",
    details:
      "An orb is how many degrees away from exact an aspect can be and still count. Tighter orbs (1-2°) are more powerful. Wider orbs (6-8°) still have influence but are subtler.",
    category: "general",
  },
  "north node": {
    term: "North Node",
    shortDef: "Your soul's growth direction in this lifetime",
    details:
      "The North Node represents the qualities, themes, and experiences your soul is growing toward. It often feels uncomfortable because it's unfamiliar territory—but leaning into it brings deep fulfillment.",
    category: "general",
  },
  chiron: {
    term: "Chiron",
    shortDef: "The 'Wounded Healer' — your deepest wound and gift",
    details:
      "Chiron shows where you carry a core wound that never fully heals, but through working with it, you develop the ability to help others with similar pain. It turns vulnerability into wisdom.",
    category: "planet",
  },
};

/** Look up a glossary term (case-insensitive, partial match) */
export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
  const key = term.toLowerCase().trim();
  return glossary[key];
}

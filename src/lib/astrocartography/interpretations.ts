/**
 * Astrological Interpretations for Transits and ACG Lines
 * Provides personalized meanings based on natal + transit combinations
 */

import { TransitAspect, TransitAspectType } from "./transits";

// Planet archetype meanings
export const PLANET_ARCHETYPES: Record<string, {
  keyword: string;
  energy: string;
  themes: string[];
}> = {
  Sun: {
    keyword: "Identity",
    energy: "Vitality, purpose, self-expression",
    themes: ["ego", "creativity", "leadership", "vitality", "father figures"],
  },
  Moon: {
    keyword: "Emotions",
    energy: "Feelings, intuition, nurturing",
    themes: ["home", "mother", "habits", "instincts", "comfort"],
  },
  Mercury: {
    keyword: "Communication",
    energy: "Thinking, learning, connecting",
    themes: ["intellect", "siblings", "travel", "writing", "commerce"],
  },
  Venus: {
    keyword: "Love",
    energy: "Beauty, harmony, attraction",
    themes: ["relationships", "money", "art", "pleasure", "values"],
  },
  Mars: {
    keyword: "Action",
    energy: "Drive, assertion, courage",
    themes: ["energy", "competition", "anger", "passion", "initiative"],
  },
  Jupiter: {
    keyword: "Expansion",
    energy: "Growth, wisdom, opportunity",
    themes: ["luck", "travel", "philosophy", "abundance", "optimism"],
  },
  Saturn: {
    keyword: "Structure",
    energy: "Discipline, responsibility, mastery",
    themes: ["limits", "authority", "time", "karma", "achievements"],
  },
  Uranus: {
    keyword: "Liberation",
    energy: "Innovation, awakening, change",
    themes: ["rebellion", "technology", "freedom", "surprise", "genius"],
  },
  Neptune: {
    keyword: "Transcendence",
    energy: "Dreams, spirituality, imagination",
    themes: ["illusion", "compassion", "art", "escapism", "intuition"],
  },
  Pluto: {
    keyword: "Transformation",
    energy: "Power, rebirth, depth",
    themes: ["death/rebirth", "psychology", "secrets", "control", "regeneration"],
  },
  Chiron: {
    keyword: "Healing",
    energy: "Wounds, wisdom, teaching",
    themes: ["pain", "mentorship", "alternative healing", "vulnerability", "gifts"],
  },
};

// Aspect interpretations
const ASPECT_MEANINGS: Record<TransitAspectType, {
  nature: "harmonious" | "challenging" | "powerful";
  keyword: string;
  effect: string;
}> = {
  conjunction: {
    nature: "powerful",
    keyword: "Fusion",
    effect: "intensifies and merges energies",
  },
  opposition: {
    nature: "challenging",
    keyword: "Awareness",
    effect: "creates tension requiring balance",
  },
  trine: {
    nature: "harmonious",
    keyword: "Flow",
    effect: "brings ease and natural talent",
  },
  square: {
    nature: "challenging",
    keyword: "Growth",
    effect: "creates friction that builds strength",
  },
  sextile: {
    nature: "harmonious",
    keyword: "Opportunity",
    effect: "opens doors when you take action",
  },
};

// ACG Line type meanings
export const LINE_TYPE_MEANINGS: Record<string, {
  name: string;
  keyword: string;
  description: string;
  lifeArea: string;
}> = {
  MC: {
    name: "Midheaven",
    keyword: "Career & Reputation",
    description: "Where this planet culminates at the highest point in the sky",
    lifeArea: "Your public image, career, achievements, and how the world sees you",
  },
  IC: {
    name: "Imum Coeli",
    keyword: "Home & Roots",
    description: "Where this planet is at the lowest point, beneath the Earth",
    lifeArea: "Your private life, family, ancestry, emotional foundations",
  },
  ASC: {
    name: "Ascendant",
    keyword: "Self & Body",
    description: "Where this planet was rising on the eastern horizon",
    lifeArea: "Your identity, appearance, first impressions, personal approach",
  },
  DSC: {
    name: "Descendant",
    keyword: "Relationships",
    description: "Where this planet was setting on the western horizon",
    lifeArea: "Your partnerships, collaborations, what you attract in others",
  },
};

/**
 * Generate a personalized transit interpretation
 */
export function getTransitInterpretation(
  transitPlanet: string,
  natalPlanet: string,
  aspectType: TransitAspectType,
  orb: number
): {
  headline: string;
  description: string;
  advice: string;
  intensity: "strong" | "moderate" | "mild";
} {
  const transit = PLANET_ARCHETYPES[transitPlanet];
  const natal = PLANET_ARCHETYPES[natalPlanet];
  const aspect = ASPECT_MEANINGS[aspectType];

  if (!transit || !natal || !aspect) {
    return {
      headline: `${transitPlanet} ${aspectType} ${natalPlanet}`,
      description: "A significant celestial alignment affecting your chart.",
      advice: "Stay aware of changes in this area of life.",
      intensity: orb < 1 ? "strong" : orb < 3 ? "moderate" : "mild",
    };
  }

  const intensity: "strong" | "moderate" | "mild" = 
    orb < 1 ? "strong" : orb < 3 ? "moderate" : "mild";

  // Generate contextual interpretation
  const headlines: Record<string, string> = {
    conjunction: `${transit.keyword} meets your ${natal.keyword}`,
    opposition: `${transit.keyword} challenges your ${natal.keyword}`,
    trine: `${transit.keyword} supports your ${natal.keyword}`,
    square: `${transit.keyword} pushes your ${natal.keyword}`,
    sextile: `${transit.keyword} opens doors for your ${natal.keyword}`,
  };

  const descriptions: Record<TransitAspectType, string> = {
    conjunction: `Transiting ${transitPlanet}'s ${transit.energy} is merging directly with your natal ${natalPlanet}. This ${intensity === "strong" ? "powerful" : "notable"} fusion ${aspect.effect}. Themes of ${transit.themes.slice(0, 2).join(" and ")} blend with your innate ${natal.themes.slice(0, 2).join(" and ")}.`,
    opposition: `Transiting ${transitPlanet} opposes your natal ${natalPlanet}, creating awareness through contrast. The ${transit.energy} pulls against your ${natal.energy}, asking you to find balance between these forces.`,
    trine: `Transiting ${transitPlanet} flows harmoniously with your natal ${natalPlanet}. This easy aspect brings natural opportunities where ${transit.themes[0]} supports your ${natal.themes[0]}.`,
    square: `Transiting ${transitPlanet} squares your natal ${natalPlanet}, creating productive tension. This aspect ${aspect.effect} around themes of ${transit.themes[0]} and ${natal.themes[0]}.`,
    sextile: `Transiting ${transitPlanet} offers opportunity to your natal ${natalPlanet}. This gentle aspect ${aspect.effect} if you actively engage with ${transit.themes[0]}.`,
  };

  const adviceMap: Record<TransitAspectType, string> = {
    conjunction: `Embrace this merging of energies. Channel the combined force of ${transitPlanet} and ${natalPlanet} into focused action.`,
    opposition: `Seek balance rather than choosing sides. Both perspectives have value—integrate them.`,
    trine: `Take advantage of this flowing energy. It won't push you, so consciously use this gift.`,
    square: `Work with the tension, not against it. Growth comes through meeting this challenge directly.`,
    sextile: `This is an invitation, not a guarantee. Take small steps to activate this opportunity.`,
  };

  return {
    headline: headlines[aspectType] || `${transitPlanet} ${aspectType} ${natalPlanet}`,
    description: descriptions[aspectType],
    advice: adviceMap[aspectType],
    intensity,
  };
}

/**
 * Get interpretation for an ACG line
 */
export function getACGLineInterpretation(
  planet: string,
  lineType: string
): {
  title: string;
  summary: string;
  benefits: string[];
  challenges: string[];
  bestFor: string[];
} {
  const planetInfo = PLANET_ARCHETYPES[planet];
  const lineInfo = LINE_TYPE_MEANINGS[lineType];

  if (!planetInfo || !lineInfo) {
    return {
      title: `${planet} ${lineType} Line`,
      summary: "A significant location for planetary energy.",
      benefits: ["Enhanced planetary influence"],
      challenges: ["May intensify related themes"],
      bestFor: ["Exploration"],
    };
  }

  // Planet-specific line interpretations
  const interpretations: Record<string, Record<string, {
    summary: string;
    benefits: string[];
    challenges: string[];
    bestFor: string[];
  }>> = {
    Sun: {
      MC: {
        summary: "Your identity shines in public life. Recognition and career success come naturally here.",
        benefits: ["Career advancement", "Public recognition", "Leadership opportunities"],
        challenges: ["Ego conflicts", "Pressure to perform", "Visibility of mistakes"],
        bestFor: ["Career moves", "Starting businesses", "Public roles"],
      },
      IC: {
        summary: "Deep connection to roots and family. Home life becomes central to identity.",
        benefits: ["Strong family bonds", "Sense of belonging", "Emotional security"],
        challenges: ["Family obligations", "Past patterns resurface", "Privacy needs"],
        bestFor: ["Settling down", "Family matters", "Inner work"],
      },
      ASC: {
        summary: "Vitality and confidence radiate from you. Others see your authentic self.",
        benefits: ["Charisma", "Physical vitality", "Natural leadership"],
        challenges: ["Self-focus", "Ego sensitivity", "Burnout risk"],
        bestFor: ["Personal branding", "Health focus", "New beginnings"],
      },
      DSC: {
        summary: "Relationships become central to growth. Partners who empower you appear.",
        benefits: ["Magnetic partnerships", "Marriage luck", "Collaborative success"],
        challenges: ["Dependency on others", "Partner's ego", "Losing self in others"],
        bestFor: ["Finding partners", "Business partnerships", "Collaborations"],
      },
    },
    Moon: {
      MC: {
        summary: "Emotional intelligence becomes your public gift. Nurturing professions thrive.",
        benefits: ["Public empathy", "Care-based careers", "Emotional recognition"],
        challenges: ["Mood visibility", "Emotional exhaustion", "Boundary issues"],
        bestFor: ["Counseling", "Hospitality", "Public care roles"],
      },
      IC: {
        summary: "The heart of your emotional world. Deep comfort and ancestral connection.",
        benefits: ["Emotional fulfillment", "Intuitive home life", "Ancestral healing"],
        challenges: ["Over-attachment to past", "Moodiness at home", "Family enmeshment"],
        bestFor: ["Home-making", "Family healing", "Emotional retreat"],
      },
      ASC: {
        summary: "Emotions are visible and compelling. You wear your heart on your sleeve.",
        benefits: ["Emotional authenticity", "Intuitive presence", "Approachability"],
        challenges: ["Mood swings visible", "Over-sensitivity", "Need for comfort"],
        bestFor: ["Nurturing roles", "Intuitive work", "Caring for others"],
      },
      DSC: {
        summary: "Deeply nurturing relationships. Partners who provide emotional security.",
        benefits: ["Caring partnerships", "Emotional intimacy", "Family-oriented partners"],
        challenges: ["Co-dependency", "Smothering dynamics", "Partner's moods"],
        bestFor: ["Marriage", "Family building", "Emotional partnerships"],
      },
    },
    Venus: {
      MC: {
        summary: "Beauty and harmony define your public image. Arts and relationships flourish professionally.",
        benefits: ["Career in arts", "Public charm", "Financial success"],
        challenges: ["Superficial judgments", "Vanity", "Pleasure-seeking reputation"],
        bestFor: ["Art careers", "Fashion", "Diplomatic roles"],
      },
      IC: {
        summary: "A beautiful home life. Harmony in family and deep appreciation for comfort.",
        benefits: ["Beautiful home", "Family harmony", "Artistic environment"],
        challenges: ["Overindulgence", "Avoiding conflict", "Material attachment"],
        bestFor: ["Interior design", "Family peace", "Luxury living"],
      },
      ASC: {
        summary: "Natural beauty and grace. You attract love and resources effortlessly.",
        benefits: ["Physical beauty", "Natural charm", "Relationship magnetism"],
        challenges: ["Vanity", "Laziness", "Over-accommodation"],
        bestFor: ["Romance", "Beautification", "Social success"],
      },
      DSC: {
        summary: "Love and partnership are your destiny here. Soul-mate connections likely.",
        benefits: ["True love potential", "Harmonious partners", "Artistic collaborations"],
        challenges: ["Idealizing partners", "Relationship dependency", "Avoiding alone time"],
        bestFor: ["Finding love", "Marriage", "Creative partnerships"],
      },
    },
    Mars: {
      MC: {
        summary: "Ambition and drive fuel your career. Leadership through action and courage.",
        benefits: ["Career drive", "Competitive success", "Leadership"],
        challenges: ["Work conflicts", "Aggression", "Burnout"],
        bestFor: ["Entrepreneurship", "Athletics", "Military/police"],
      },
      IC: {
        summary: "Home becomes a base for action. Family life may be intense or conflictual.",
        benefits: ["Active home life", "DIY projects", "Protective instincts"],
        challenges: ["Family conflicts", "Restlessness at home", "Anger issues"],
        bestFor: ["Home renovation", "Family defense", "Active lifestyle"],
      },
      ASC: {
        summary: "Courage and assertiveness define you. Physical vitality and competitive spirit.",
        benefits: ["Physical strength", "Courage", "Initiative"],
        challenges: ["Impulsiveness", "Aggression", "Injury risk"],
        bestFor: ["Sports", "Physical challenges", "Bold moves"],
      },
      DSC: {
        summary: "Passionate relationships. Partners who challenge and energize you.",
        benefits: ["Passionate romance", "Energizing partners", "Dynamic collaborations"],
        challenges: ["Relationship conflicts", "Power struggles", "Volatile dynamics"],
        bestFor: ["Passionate love", "Business partnerships", "Competitive teamwork"],
      },
    },
    Jupiter: {
      MC: {
        summary: "Luck and expansion in career. Public success and recognition come abundantly.",
        benefits: ["Career luck", "Expansion opportunities", "Fame potential"],
        challenges: ["Over-promising", "Excess", "Arrogance"],
        bestFor: ["Career growth", "International work", "Teaching"],
      },
      IC: {
        summary: "Abundance in home life. Large families, generous living, philosophical roots.",
        benefits: ["Large home", "Family abundance", "Wisdom traditions"],
        challenges: ["Excess at home", "Over-indulgence", "Restlessness"],
        bestFor: ["Large gatherings", "Cultural home life", "Family expansion"],
      },
      ASC: {
        summary: "Natural optimism and luck. You expand and grow wherever you go.",
        benefits: ["Natural luck", "Optimistic presence", "Growth opportunities"],
        challenges: ["Weight gain", "Over-confidence", "Excess"],
        bestFor: ["Travel", "Education", "Spiritual growth"],
      },
      DSC: {
        summary: "Lucky in partnerships. Generous, wise, or wealthy partners appear.",
        benefits: ["Lucky partners", "Expanding through others", "International relationships"],
        challenges: ["Partner excess", "Over-reliance on luck", "Different beliefs"],
        bestFor: ["Finding mentors", "Business expansion", "Cross-cultural relationships"],
      },
    },
    Saturn: {
      MC: {
        summary: "Serious career ambitions. Slow but lasting success through discipline and hard work.",
        benefits: ["Career authority", "Lasting achievements", "Respected reputation"],
        challenges: ["Heavy responsibilities", "Slow progress", "Public criticism"],
        bestFor: ["Building legacy", "Authority positions", "Long-term goals"],
      },
      IC: {
        summary: "Structured home life. Responsibilities to family, traditional or restrictive roots.",
        benefits: ["Stable foundations", "Family duty honored", "Ancestral wisdom"],
        challenges: ["Cold home life", "Family burdens", "Emotional restriction"],
        bestFor: ["Property investment", "Family business", "Establishing roots"],
      },
      ASC: {
        summary: "Serious demeanor and mature presence. You take on responsibility naturally.",
        benefits: ["Maturity", "Self-discipline", "Respected appearance"],
        challenges: ["Depression", "Self-criticism", "Isolation"],
        bestFor: ["Taking on authority", "Self-mastery", "Professional image"],
      },
      DSC: {
        summary: "Serious, committed relationships. Partners who are older, mature, or demanding.",
        benefits: ["Committed partners", "Lasting marriages", "Responsible collaborations"],
        challenges: ["Relationship burdens", "Cold partners", "Delays in love"],
        bestFor: ["Long-term commitment", "Business partnerships", "Karmic relationships"],
      },
    },
    Uranus: {
      MC: {
        summary: "Unconventional career path. Innovation, technology, or rebellion in public life.",
        benefits: ["Unique career", "Innovation success", "Freedom in work"],
        challenges: ["Career instability", "Reputation shocks", "Unpredictability"],
        bestFor: ["Tech careers", "Freelancing", "Activist roles"],
      },
      IC: {
        summary: "Unconventional home life. Freedom, change, or disruption in family patterns.",
        benefits: ["Freedom at home", "Breaking family patterns", "Unique living"],
        challenges: ["Unstable home", "Family disruptions", "Rootlessness"],
        bestFor: ["Alternative living", "Breaking traditions", "Tech home"],
      },
      ASC: {
        summary: "Eccentric, unique presence. You stand out as different, innovative, free.",
        benefits: ["Originality", "Magnetic uniqueness", "Independence"],
        challenges: ["Alienation", "Erratic behavior", "Instability"],
        bestFor: ["Being yourself", "Innovation", "Breaking molds"],
      },
      DSC: {
        summary: "Unconventional relationships. Partners who are unique, freedom-loving, or unstable.",
        benefits: ["Exciting partners", "Freedom in relationships", "Unique connections"],
        challenges: ["Relationship instability", "Commitment issues", "Sudden endings"],
        bestFor: ["Open relationships", "Creative partnerships", "Meeting unusual people"],
      },
    },
    Neptune: {
      MC: {
        summary: "Spiritual or artistic career. Public image is dreamy, idealized, or confusing.",
        benefits: ["Artistic success", "Spiritual reputation", "Glamour"],
        challenges: ["Career confusion", "Deception", "Impractical image"],
        bestFor: ["Arts", "Healing", "Spiritual work"],
      },
      IC: {
        summary: "Mystical home life. Spiritual family connections, but possible confusion or secrets.",
        benefits: ["Spiritual home", "Intuitive family", "Artistic environment"],
        challenges: ["Family secrets", "Confusion at home", "Escapism"],
        bestFor: ["Meditation retreat", "Artistic sanctuary", "Spiritual healing"],
      },
      ASC: {
        summary: "Dreamy, mystical presence. You appear ethereal, artistic, or hard to pin down.",
        benefits: ["Artistic aura", "Spiritual magnetism", "Compassionate presence"],
        challenges: ["Identity confusion", "Victim mentality", "Escapism"],
        bestFor: ["Spiritual work", "Arts", "Healing others"],
      },
      DSC: {
        summary: "Idealized or confusing relationships. Soul-mate dreams or deceptive partners.",
        benefits: ["Spiritual partners", "Soul-mate potential", "Artistic collaborations"],
        challenges: ["Deceptive partners", "Idealization", "Boundary issues"],
        bestFor: ["Spiritual partnerships", "Artistic collaborations", "Compassionate love"],
      },
    },
    Pluto: {
      MC: {
        summary: "Powerful, transformative career. You hold power or face power struggles publicly.",
        benefits: ["Career power", "Transformation through work", "Influence"],
        challenges: ["Power struggles", "Public enemies", "Obsession with status"],
        bestFor: ["Psychology", "Research", "Power positions"],
      },
      IC: {
        summary: "Intense home life. Deep transformation through family, possible secrets or control.",
        benefits: ["Deep family bonds", "Ancestral healing", "Transformative home"],
        challenges: ["Family secrets", "Control issues", "Intense dynamics"],
        bestFor: ["Deep healing", "Uncovering family patterns", "Personal transformation"],
      },
      ASC: {
        summary: "Intense, magnetic presence. You transform and are transformed by your environment.",
        benefits: ["Personal power", "Magnetism", "Regenerative ability"],
        challenges: ["Intimidating others", "Power struggles", "Obsession"],
        bestFor: ["Personal reinvention", "Depth work", "Influencing others"],
      },
      DSC: {
        summary: "Intense, transformative relationships. Partners who transform you—for better or worse.",
        benefits: ["Deep intimacy", "Transformative partners", "Powerful connections"],
        challenges: ["Obsessive relationships", "Control dynamics", "Power struggles"],
        bestFor: ["Deep intimacy", "Therapeutic relationships", "Soul-level connections"],
      },
    },
    Chiron: {
      MC: {
        summary: "Healing becomes your public gift. Career as a wounded healer or mentor.",
        benefits: ["Healing reputation", "Teaching from experience", "Helping professions"],
        challenges: ["Public wounds visible", "Imposter syndrome", "Over-giving"],
        bestFor: ["Healing arts", "Mentoring", "Alternative medicine"],
      },
      IC: {
        summary: "Healing family wounds. Deep work on ancestral pain and childhood patterns.",
        benefits: ["Family healing", "Breaking cycles", "Wisdom from pain"],
        challenges: ["Family wounds active", "Childhood issues", "Feeling different"],
        bestFor: ["Therapy", "Family constellation work", "Ancestral healing"],
      },
      ASC: {
        summary: "Your wounds are visible but so is your healing wisdom. You help by being authentic.",
        benefits: ["Authentic vulnerability", "Healing presence", "Teaching through example"],
        challenges: ["Visible wounds", "Sensitivity", "Feeling exposed"],
        bestFor: ["Authentic expression", "Helping professions", "Healing self and others"],
      },
      DSC: {
        summary: "Healing through relationships. Partners who wound but also catalyze growth.",
        benefits: ["Healing partnerships", "Learning through relating", "Mutual growth"],
        challenges: ["Attracting wounded partners", "Healing addiction", "Savior complex"],
        bestFor: ["Therapeutic relationships", "Learning about self through others", "Mutual healing"],
      },
    },
  };

  // Get specific interpretation or generate default
  const specific = interpretations[planet]?.[lineType];
  if (specific) {
    return {
      title: `${planet} ${lineInfo.name} Line`,
      ...specific,
    };
  }

  // Default interpretation
  return {
    title: `${planet} ${lineInfo.name} Line`,
    summary: `${planetInfo.energy} expresses through ${lineInfo.lifeArea.toLowerCase()}.`,
    benefits: [`Enhanced ${planetInfo.keyword.toLowerCase()} in ${lineInfo.keyword.toLowerCase()}`],
    challenges: [`${planetInfo.themes[0]} themes may intensify`],
    bestFor: [`Exploring ${planetInfo.keyword.toLowerCase()} through ${lineInfo.keyword.toLowerCase()}`],
  };
}

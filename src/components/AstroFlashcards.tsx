import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Flashcard {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  aura: string;
  glyphs: string[];
}

const FLASHCARDS: Flashcard[] = [
  {
    id: "snapshot",
    question: "What is a natal chart, technically?",
    choices: [
      "A weekly horoscope based only on your sun sign.",
      "A sky snapshot from exact birth time, date, and place.",
      "A prediction tool that ignores planetary positions.",
      "A compatibility score between two people.",
    ],
    correctIndex: 1,
    explanation: "A natal chart maps exact planetary placements at birth and becomes the base layer for interpretation.",
    aura: "from-indigo-500/35 via-blue-500/20 to-cyan-400/20",
    glyphs: ["Sun", "Moon", "Asc"],
  },
  {
    id: "core",
    question: "What are the core components of natal interpretation?",
    choices: [
      "Tarot cards, lunar phases, and numerology only.",
      "Celestial bodies, signs, houses, aspects, and angles.",
      "Only planets and houses.",
      "Only signs and retrogrades.",
    ],
    correctIndex: 1,
    explanation: "Interpretation integrates bodies/points, signs, houses, aspects, and chart angles into one system.",
    aura: "from-fuchsia-500/35 via-rose-500/20 to-amber-400/20",
    glyphs: ["Bodies", "Signs", "Houses"],
  },
  {
    id: "sign-structure",
    question: "How are signs structurally interpreted?",
    choices: [
      "Through only elements.",
      "Through houses and aspects only.",
      "Through element, modality, and polarity.",
      "Through degree and house ruler only.",
    ],
    correctIndex: 2,
    explanation: "Sign structure uses element, modality, and polarity together.",
    aura: "from-emerald-500/35 via-teal-500/20 to-sky-400/20",
    glyphs: ["Elements", "Modalities", "Polarities"],
  },
  {
    id: "house-groups",
    question: "How are houses grouped?",
    choices: [
      "Cardinal, Fixed, Mutable.",
      "Angular, Succedent, Cadent.",
      "Inner, Outer, Evolutionary.",
      "Personal, Social, Transpersonal only.",
    ],
    correctIndex: 1,
    explanation: "House groups are Angular (1/4/7/10), Succedent (2/5/8/11), and Cadent (3/6/9/12).",
    aura: "from-orange-500/35 via-amber-500/20 to-rose-400/20",
    glyphs: ["Angular", "Succedent", "Cadent"],
  },
  {
    id: "lenses",
    question: "Which set lists major interpretive lenses?",
    choices: [
      "Traditional, modern/psychological, evolutionary.",
      "Astronomy, geology, biology.",
      "Tarot, runes, palmistry.",
      "Sun, Moon, Rising.",
    ],
    correctIndex: 0,
    explanation: "These three are common high-level frameworks used to read the same chart differently.",
    aura: "from-violet-500/35 via-purple-500/20 to-indigo-400/20",
    glyphs: ["Traditional", "Modern", "Evolutionary"],
  },
  {
    id: "extensions",
    question: "What methods extend natal reading over time and relationships?",
    choices: [
      "Only yearly sun-sign forecasts.",
      "Transits, progressions, returns, and synastry/composite.",
      "Only house overlays.",
      "Only declination aspects.",
    ],
    correctIndex: 1,
    explanation: "Those methods track timing, cycles, and interpersonal dynamics beyond the birth snapshot.",
    aura: "from-cyan-500/35 via-sky-500/20 to-blue-400/20",
    glyphs: ["Transits", "Returns", "Synastry"],
  },
  {
    id: "dignity-overview-domicile",
    question: `What is a planet's "domicile"?`,
    choices: [
      "The sign where a planet rules and expresses naturally.",
      "The sign opposite to exaltation where a planet is weakened.",
      "A random sign assigned by house placement.",
      "The sign where a planet is always retrograde.",
    ],
    correctIndex: 0,
    explanation: "Domicile is a planet's home base where its core style is direct and resourced.",
    aura: "from-emerald-500/35 via-teal-500/20 to-cyan-400/20",
    glyphs: ["Domicile", "Rulership", "Essential"],
  },
  {
    id: "dignity-overview-exaltation",
    question: `What is a planet's "exaltation"?`,
    choices: [
      "The sign where a planet is elevated and performs at its best.",
      "The sign opposite to domicile.",
      "The house where the Ascendant is located.",
      "A temporary transit condition only.",
    ],
    correctIndex: 0,
    explanation: "Exaltation heightens the planet's expression, often describing refined or amplified functioning.",
    aura: "from-amber-500/35 via-orange-500/20 to-rose-400/20",
    glyphs: ["Exaltation", "Strength", "Dignity"],
  },
  {
    id: "dignity-overview-detriment",
    question: `What is a planet's "detriment"?`,
    choices: [
      "The sign opposite to domicile where expression is strained.",
      "The sign where the planet is strongest.",
      "A favorable aspect to Jupiter.",
      "A house grouping type.",
    ],
    correctIndex: 0,
    explanation: "Detriment marks the opposite terrain to rulership, where a planet has to work harder to express clearly.",
    aura: "from-fuchsia-500/35 via-violet-500/20 to-indigo-400/20",
    glyphs: ["Detriment", "Opposition", "Debility"],
  },
  {
    id: "dignity-overview-fall",
    question: `What is a planet's "fall"?`,
    choices: [
      "The sign opposite exaltation where planetary energy is challenged.",
      "The sign of domicile.",
      "A minor aspect between planets.",
      "A transit that lasts one day.",
    ],
    correctIndex: 0,
    explanation: "Fall is opposite exaltation and can show places where the planet's confidence or ease is reduced.",
    aura: "from-sky-500/35 via-blue-500/20 to-indigo-400/20",
    glyphs: ["Fall", "Challenge", "Debility"],
  },
  {
    id: "sun-domicile",
    question: "Sun's sign of domicile?",
    choices: ["Leo", "Aries", "Aquarius", "Libra"],
    correctIndex: 0,
    explanation: "The Sun rules Leo.",
    aura: "from-yellow-500/35 via-amber-500/20 to-orange-400/20",
    glyphs: ["Sun", "Domicile", "Leo"],
  },
  {
    id: "sun-exaltation",
    question: "Sun's sign of exaltation?",
    choices: ["Aries", "Leo", "Libra", "Aquarius"],
    correctIndex: 0,
    explanation: "The Sun is exalted in Aries.",
    aura: "from-orange-500/35 via-rose-500/20 to-yellow-400/20",
    glyphs: ["Sun", "Exaltation", "Aries"],
  },
  {
    id: "sun-detriment",
    question: "Sun's sign of detriment?",
    choices: ["Aquarius", "Leo", "Aries", "Libra"],
    correctIndex: 0,
    explanation: "The Sun is in detriment in Aquarius.",
    aura: "from-cyan-500/35 via-sky-500/20 to-blue-400/20",
    glyphs: ["Sun", "Detriment", "Aquarius"],
  },
  {
    id: "sun-fall",
    question: "Sun's sign of fall?",
    choices: ["Libra", "Aries", "Leo", "Aquarius"],
    correctIndex: 0,
    explanation: "The Sun is in fall in Libra.",
    aura: "from-slate-500/35 via-indigo-500/20 to-violet-400/20",
    glyphs: ["Sun", "Fall", "Libra"],
  },
  {
    id: "moon-domicile",
    question: "Moon's sign of domicile?",
    choices: ["Cancer", "Taurus", "Capricorn", "Scorpio"],
    correctIndex: 0,
    explanation: "The Moon rules Cancer.",
    aura: "from-cyan-500/35 via-blue-500/20 to-indigo-400/20",
    glyphs: ["Moon", "Domicile", "Cancer"],
  },
  {
    id: "moon-exaltation",
    question: "Moon's sign of exaltation?",
    choices: ["Taurus", "Cancer", "Scorpio", "Capricorn"],
    correctIndex: 0,
    explanation: "The Moon is exalted in Taurus.",
    aura: "from-emerald-500/35 via-teal-500/20 to-cyan-400/20",
    glyphs: ["Moon", "Exaltation", "Taurus"],
  },
  {
    id: "moon-detriment",
    question: "Moon's sign of detriment?",
    choices: ["Capricorn", "Cancer", "Taurus", "Scorpio"],
    correctIndex: 0,
    explanation: "The Moon is in detriment in Capricorn.",
    aura: "from-zinc-500/35 via-slate-500/20 to-stone-400/20",
    glyphs: ["Moon", "Detriment", "Capricorn"],
  },
  {
    id: "moon-fall",
    question: "Moon's sign of fall?",
    choices: ["Scorpio", "Taurus", "Cancer", "Capricorn"],
    correctIndex: 0,
    explanation: "The Moon is in fall in Scorpio.",
    aura: "from-rose-500/35 via-fuchsia-500/20 to-purple-400/20",
    glyphs: ["Moon", "Fall", "Scorpio"],
  },
  {
    id: "mercury-domicile",
    question: "Mercury's signs of domicile?",
    choices: ["Gemini & Virgo", "Sagittarius & Pisces", "Taurus & Libra", "Aries & Scorpio"],
    correctIndex: 0,
    explanation: "Mercury rules Gemini and Virgo.",
    aura: "from-lime-500/35 via-emerald-500/20 to-cyan-400/20",
    glyphs: ["Mercury", "Domicile", "Gemini/Virgo"],
  },
  {
    id: "mercury-exaltation",
    question: "Mercury's sign of exaltation?",
    choices: ["Virgo", "Gemini", "Pisces", "Sagittarius"],
    correctIndex: 0,
    explanation: "Mercury is exalted in Virgo.",
    aura: "from-green-500/35 via-teal-500/20 to-lime-400/20",
    glyphs: ["Mercury", "Exaltation", "Virgo"],
  },
  {
    id: "mercury-detriment",
    question: "Mercury's signs of detriment?",
    choices: ["Sagittarius & Pisces", "Gemini & Virgo", "Aries & Scorpio", "Taurus & Libra"],
    correctIndex: 0,
    explanation: "Mercury is in detriment in Sagittarius and Pisces.",
    aura: "from-sky-500/35 via-blue-500/20 to-indigo-400/20",
    glyphs: ["Mercury", "Detriment", "Sag/Pisces"],
  },
  {
    id: "mercury-fall",
    question: "Mercury's sign of fall?",
    choices: ["Pisces", "Virgo", "Gemini", "Sagittarius"],
    correctIndex: 0,
    explanation: "Mercury is in fall in Pisces.",
    aura: "from-indigo-500/35 via-violet-500/20 to-fuchsia-400/20",
    glyphs: ["Mercury", "Fall", "Pisces"],
  },
  {
    id: "venus-domicile",
    question: "Venus's signs of domicile?",
    choices: ["Taurus & Libra", "Aries & Scorpio", "Gemini & Virgo", "Sagittarius & Pisces"],
    correctIndex: 0,
    explanation: "Venus rules Taurus and Libra.",
    aura: "from-pink-500/35 via-rose-500/20 to-fuchsia-400/20",
    glyphs: ["Venus", "Domicile", "Taurus/Libra"],
  },
  {
    id: "venus-exaltation",
    question: "Venus's sign of exaltation?",
    choices: ["Pisces", "Libra", "Taurus", "Virgo"],
    correctIndex: 0,
    explanation: "Venus is exalted in Pisces.",
    aura: "from-fuchsia-500/35 via-pink-500/20 to-sky-400/20",
    glyphs: ["Venus", "Exaltation", "Pisces"],
  },
  {
    id: "venus-detriment",
    question: "Venus's signs of detriment?",
    choices: ["Aries & Scorpio", "Taurus & Libra", "Gemini & Virgo", "Sagittarius & Pisces"],
    correctIndex: 0,
    explanation: "Venus is in detriment in Aries and Scorpio.",
    aura: "from-red-500/35 via-rose-500/20 to-purple-400/20",
    glyphs: ["Venus", "Detriment", "Aries/Scorpio"],
  },
  {
    id: "venus-fall",
    question: "Venus's sign of fall?",
    choices: ["Virgo", "Pisces", "Libra", "Taurus"],
    correctIndex: 0,
    explanation: "Venus is in fall in Virgo.",
    aura: "from-zinc-500/35 via-stone-500/20 to-neutral-400/20",
    glyphs: ["Venus", "Fall", "Virgo"],
  },
  {
    id: "mars-domicile",
    question: "Mars's signs of domicile?",
    choices: ["Aries & Scorpio", "Taurus & Libra", "Gemini & Virgo", "Sagittarius & Pisces"],
    correctIndex: 0,
    explanation: "Mars rules Aries and Scorpio.",
    aura: "from-red-500/35 via-orange-500/20 to-rose-400/20",
    glyphs: ["Mars", "Domicile", "Aries/Scorpio"],
  },
  {
    id: "mars-exaltation",
    question: "Mars's sign of exaltation?",
    choices: ["Capricorn", "Aries", "Cancer", "Libra"],
    correctIndex: 0,
    explanation: "Mars is exalted in Capricorn.",
    aura: "from-amber-500/35 via-orange-500/20 to-red-400/20",
    glyphs: ["Mars", "Exaltation", "Capricorn"],
  },
  {
    id: "mars-detriment",
    question: "Mars's signs of detriment?",
    choices: ["Taurus & Libra", "Aries & Scorpio", "Gemini & Virgo", "Cancer & Leo"],
    correctIndex: 0,
    explanation: "Mars is in detriment in Taurus and Libra.",
    aura: "from-rose-500/35 via-red-500/20 to-pink-400/20",
    glyphs: ["Mars", "Detriment", "Taurus/Libra"],
  },
  {
    id: "mars-fall",
    question: "Mars's sign of fall?",
    choices: ["Cancer", "Capricorn", "Aries", "Libra"],
    correctIndex: 0,
    explanation: "Mars is in fall in Cancer.",
    aura: "from-blue-500/35 via-cyan-500/20 to-indigo-400/20",
    glyphs: ["Mars", "Fall", "Cancer"],
  },
  {
    id: "jupiter-domicile",
    question: "Jupiter's signs of domicile?",
    choices: ["Sagittarius & Pisces", "Gemini & Virgo", "Capricorn & Aquarius", "Cancer & Leo"],
    correctIndex: 0,
    explanation: "Jupiter rules Sagittarius and Pisces.",
    aura: "from-violet-500/35 via-purple-500/20 to-indigo-400/20",
    glyphs: ["Jupiter", "Domicile", "Sag/Pisces"],
  },
  {
    id: "jupiter-exaltation",
    question: "Jupiter's sign of exaltation?",
    choices: ["Cancer", "Sagittarius", "Capricorn", "Gemini"],
    correctIndex: 0,
    explanation: "Jupiter is exalted in Cancer.",
    aura: "from-cyan-500/35 via-blue-500/20 to-violet-400/20",
    glyphs: ["Jupiter", "Exaltation", "Cancer"],
  },
  {
    id: "jupiter-detriment",
    question: "Jupiter's signs of detriment?",
    choices: ["Gemini & Virgo", "Sagittarius & Pisces", "Capricorn & Aquarius", "Aries & Scorpio"],
    correctIndex: 0,
    explanation: "Jupiter is in detriment in Gemini and Virgo.",
    aura: "from-slate-500/35 via-zinc-500/20 to-stone-400/20",
    glyphs: ["Jupiter", "Detriment", "Gemini/Virgo"],
  },
  {
    id: "jupiter-fall",
    question: "Jupiter's sign of fall?",
    choices: ["Capricorn", "Cancer", "Sagittarius", "Pisces"],
    correctIndex: 0,
    explanation: "Jupiter is in fall in Capricorn.",
    aura: "from-stone-500/35 via-zinc-500/20 to-slate-400/20",
    glyphs: ["Jupiter", "Fall", "Capricorn"],
  },
  {
    id: "saturn-domicile",
    question: "Saturn's signs of domicile?",
    choices: ["Capricorn & Aquarius", "Cancer & Leo", "Aries & Scorpio", "Taurus & Libra"],
    correctIndex: 0,
    explanation: "Saturn rules Capricorn and Aquarius.",
    aura: "from-slate-500/35 via-indigo-500/20 to-blue-400/20",
    glyphs: ["Saturn", "Domicile", "Cap/Aquarius"],
  },
  {
    id: "saturn-exaltation",
    question: "Saturn's sign of exaltation?",
    choices: ["Libra", "Capricorn", "Aries", "Cancer"],
    correctIndex: 0,
    explanation: "Saturn is exalted in Libra.",
    aura: "from-indigo-500/35 via-violet-500/20 to-slate-400/20",
    glyphs: ["Saturn", "Exaltation", "Libra"],
  },
  {
    id: "saturn-detriment",
    question: "Saturn's signs of detriment?",
    choices: ["Cancer & Leo", "Capricorn & Aquarius", "Aries & Scorpio", "Taurus & Libra"],
    correctIndex: 0,
    explanation: "Saturn is in detriment in Cancer and Leo.",
    aura: "from-amber-500/35 via-orange-500/20 to-rose-400/20",
    glyphs: ["Saturn", "Detriment", "Cancer/Leo"],
  },
  {
    id: "saturn-fall",
    question: "Saturn's sign of fall?",
    choices: ["Aries", "Libra", "Capricorn", "Aquarius"],
    correctIndex: 0,
    explanation: "Saturn is in fall in Aries.",
    aura: "from-red-500/35 via-orange-500/20 to-zinc-400/20",
    glyphs: ["Saturn", "Fall", "Aries"],
  },
];

export default function AstroFlashcards() {
  const [index, setIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctByCard, setCorrectByCard] = useState<Record<string, boolean>>({});
  const card = FLASHCARDS[index];
  const isCorrect = selectedChoice === card.correctIndex;

  const mastered = useMemo(
    () => FLASHCARDS.filter((c) => correctByCard[c.id]).length,
    [correctByCard]
  );
  const progress = Math.round((mastered / FLASHCARDS.length) * 100);
  const ringStyle = {
    background: `conic-gradient(hsl(var(--primary)) ${progress * 3.6}deg, hsl(var(--muted)) 0deg)`,
  };

  const nextCard = () => {
    setIndex((prev) => (prev + 1) % FLASHCARDS.length);
    setSelectedChoice(null);
    setRevealed(false);
  };

  const prevCard = () => {
    setIndex((prev) => (prev - 1 + FLASHCARDS.length) % FLASHCARDS.length);
    setSelectedChoice(null);
    setRevealed(false);
  };

  const reveal = () => {
    if (selectedChoice === null) return;
    setRevealed(true);
    setCorrectByCard((prev) => ({ ...prev, [card.id]: selectedChoice === card.correctIndex }));
  };

  return (
    <section className="relative overflow-hidden rounded-2xl p-4 sm:p-6 mt-2 space-y-5 border border-border/40 bg-gradient-to-br from-background via-background/80 to-background/70">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -left-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 right-2 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl text-foreground tracking-tight">Starseed Flashcards</h3>
          <p className="text-sm text-muted-foreground">Multiple choice mode with animated answer reveal.</p>
        </div>
        <div className="relative h-14 w-14 rounded-full p-1.5" style={ringStyle}>
          <div className="h-full w-full rounded-full bg-background/95 grid place-items-center border border-border/40">
            <span className="text-xs font-medium">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="relative space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Mastery {mastered}/{FLASHCARDS.length}</span>
          <span>Card {index + 1}/{FLASHCARDS.length}</span>
        </div>
        <Progress value={progress} className="h-2 bg-secondary/60" />

        <motion.div
          key={card.id}
          className="group relative w-full min-h-[260px] rounded-2xl text-left [transform-style:preserve-3d]"
          whileHover={{ y: -4, rotateX: 3, rotateY: -3 }}
          transition={{ type: "spring", stiffness: 250, damping: 18 }}
        >
          <div className={`absolute inset-0 rounded-2xl border border-white/20 bg-gradient-to-br ${card.aura}`} />
          <div className="absolute inset-[1px] rounded-2xl bg-black/25 backdrop-blur-lg" />

          <div className="relative z-10 h-full rounded-2xl p-5 sm:p-6 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {card.glyphs.map((g) => (
                <span key={g} className="text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border border-white/25 bg-white/10 text-white/90">
                  {g}
                </span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${card.id}-question`}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mt-1"
              >
                <p className="text-[10px] uppercase tracking-widest text-white/70 mb-3">Question</p>
                <p className="text-base sm:text-lg leading-relaxed text-white">{card.question}</p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-5 grid gap-2">
              {card.choices.map((choice, choiceIndex) => {
                const selected = selectedChoice === choiceIndex;
                const correctChoice = revealed && choiceIndex === card.correctIndex;
                const wrongChoice = revealed && selected && choiceIndex !== card.correctIndex;
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => !revealed && setSelectedChoice(choiceIndex)}
                    className={`rounded-xl border px-3 py-2.5 text-sm text-left transition-all ${
                      correctChoice
                        ? "border-emerald-300/80 bg-emerald-400/20 text-emerald-50"
                        : wrongChoice
                        ? "border-rose-300/80 bg-rose-400/20 text-rose-50"
                        : selected
                        ? "border-white/70 bg-white/20 text-white"
                        : "border-white/25 bg-white/10 text-white/90 hover:bg-white/15"
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className={`mt-4 rounded-xl border px-3 py-3 text-sm ${
                    isCorrect
                      ? "border-emerald-300/70 bg-emerald-500/15 text-emerald-50"
                      : "border-amber-300/70 bg-amber-500/15 text-amber-50"
                  }`}
                >
                  <p className="font-medium mb-1">{isCorrect ? "Correct" : "Not quite"}</p>
                  <p className="text-white/90">{card.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-auto pt-4 flex items-center justify-between text-xs text-white/70">
              <span>{revealed ? "Answer revealed" : "Choose one answer"}</span>
              <span>{correctByCard[card.id] ? "Mastered" : "In practice"}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-2 relative">
        <Button type="button" variant="outline" onClick={prevCard}>Previous</Button>
        <Button type="button" variant="outline" onClick={nextCard}>Next</Button>
        <Button
          type="button"
          onClick={reveal}
          disabled={selectedChoice === null || revealed}
          variant="default"
        >
          {revealed ? "Revealed" : "Reveal Answer"}
        </Button>
      </div>
    </section>
  );
}

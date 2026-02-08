import { motion } from "framer-motion";
import { Clock, Globe, Scroll, FlaskConical, Sparkles } from "lucide-react";

interface HistorySection {
  era: string;
  title: string;
  period: string;
  icon: React.ReactNode;
  content: string[];
  highlight?: string;
}

const historySections: HistorySection[] = [
  {
    era: "Origins",
    title: "The Mesopotamian Roots",
    period: "c. 2400 BCE",
    icon: <Scroll className="h-6 w-6" />,
    content: [
      "It all started in Babylonia. The Sumerians and Babylonians were the first to systematically record celestial movements. Initially, astrology was \"mundane,\" meaning it was used to predict large-scale events like famines, wars, or the fate of the king.",
      "By the 7th century BCE, they developed the concept of the Zodiac—the \"circle of little animals\"—dividing the sky into 12 equal segments based on the constellations the sun passed through."
    ],
    highlight: "The birth of the zodiac"
  },
  {
    era: "Synthesis",
    title: "The Hellenistic Period",
    period: "300 BCE – 100 CE",
    icon: <Globe className="h-6 w-6" />,
    content: [
      "When Alexander the Great conquered Egypt and the Middle East, Babylonian omen-reading collided with Greek mathematics and Egyptian philosophy. This \"Hellenistic\" period changed everything.",
      "Individual Horoscopes: Astrology shifted from predicting the fate of nations to the fate of the individual based on their exact birth time.",
      "Ptolemy's Influence: In the 2nd century CE, Claudius Ptolemy wrote the Tetrabiblos, which systematized astrological rules (houses, aspects, and signs) into a format that persists today."
    ],
    highlight: "Birth of personal horoscopes"
  },
  {
    era: "Preservation",
    title: "The Islamic Golden Age",
    period: "8th – 13th Century",
    icon: <Clock className="h-6 w-6" />,
    content: [
      "While astrology faded in Europe after the fall of Rome, it flourished in the Islamic world. Scholars in Baghdad and Cairo translated Greek texts and perfected the Astrolabe, an instrument used to calculate the positions of stars.",
      "They added incredible mathematical precision to the practice, which eventually leaked back into Europe during the Renaissance."
    ],
    highlight: "Mathematical refinement"
  },
  {
    era: "Division",
    title: "The Scientific Schism",
    period: "17th – 18th Century",
    icon: <FlaskConical className="h-6 w-6" />,
    content: [
      "For most of history, astrology and astronomy were the same discipline. Renowned scientists like Johannes Kepler and Isaac Newton practiced both.",
      "However, the Enlightenment brought a sharp divide. As the heliocentric model (the Earth revolving around the sun) became proven fact, the symbolic, geocentric (Earth-centered) worldview of astrology lost its scientific standing. It was relegated to the realm of \"superstition\" for nearly two centuries."
    ],
    highlight: "Astronomy & astrology diverge"
  },
  {
    era: "Renaissance",
    title: "The Modern Revival",
    period: "20th Century – Today",
    icon: <Sparkles className="h-6 w-6" />,
    content: [
      "Astrology underwent a massive \"rebrand\" in the early 1900s:",
      "Psychological Astrology: Influenced by Carl Jung, astrology shifted from \"predicting your death\" to \"understanding your personality.\"",
      "The Sun Sign Column: In 1930, a British newspaper published a horoscope for Princess Margaret's birth that was so popular it led to the \"Sun Sign\" columns we see in magazines today.",
      "The Digital Age: Today, astrology is experiencing a massive resurgence via social media and apps, fueled by a modern desire for self-reflection and community in a digital world."
    ],
    highlight: "From prediction to psychology"
  }
];

const AstrologyHistory = () => {
  return (
    <div className="glass-panel rounded-xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 sm:mb-12"
      >
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-ethereal mb-3">
          The History of Astrology
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Astrology is one of the oldest attempts by humanity to find order in the chaos of the universe. 
          It isn't just a single "invention" but a complex evolution of celestial observation that moved 
          from survival-based tracking to spiritual mapping.
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line for desktop */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50" />

        <div className="space-y-6 sm:space-y-8 lg:space-y-0">
          {historySections.map((section, index) => (
            <motion.div
              key={section.era}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`lg:grid lg:grid-cols-2 lg:gap-8 lg:py-8 ${
                index % 2 === 0 ? "" : "lg:direction-rtl"
              }`}
            >
              {/* Content Card */}
              <div
                className={`${
                  index % 2 === 0 ? "lg:pr-12 lg:text-right" : "lg:pl-12 lg:col-start-2"
                }`}
              >
                <div className="bg-secondary/60 border border-border/50 rounded-xl p-5 sm:p-6 hover:bg-secondary/80 transition-colors">
                  {/* Era Badge & Icon */}
                  <div className={`flex items-center gap-3 mb-4 ${index % 2 === 0 ? "lg:justify-end" : ""}`}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border border-primary/40 text-primary">
                      {section.icon}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                        {section.era}
                      </span>
                      <p className="text-xs text-muted-foreground">{section.period}</p>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-lg sm:text-xl font-serif text-foreground mb-3 ${index % 2 === 0 ? "lg:text-right" : ""}`}>
                    {section.title}
                  </h3>

                  {/* Highlight */}
                  {section.highlight && (
                    <div className={`mb-4 ${index % 2 === 0 ? "lg:flex lg:justify-end" : ""}`}>
                      <span className="inline-block text-xs font-medium bg-accent/20 text-accent border border-accent/30 px-3 py-1 rounded-full">
                        ✦ {section.highlight}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className={`space-y-3 text-foreground/80 text-sm sm:text-base leading-relaxed ${index % 2 === 0 ? "lg:text-right" : ""}`}>
                    {section.content.map((paragraph, pIndex) => (
                      <p key={pIndex}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline Node (desktop only) */}
              <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2" style={{ top: `${index * 200 + 100}px` }}>
                <div className="w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg shadow-primary/30" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 sm:mt-12 text-center"
      >
        <div className="inline-block bg-primary/10 border border-primary/30 rounded-xl p-6 max-w-xl">
          <p className="text-foreground/90 font-serif text-base sm:text-lg italic">
            "Astrology has transitioned from a tool for kings to a language of psychology and self-discovery—
            connecting us to both the cosmos and to each other."
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AstrologyHistory;

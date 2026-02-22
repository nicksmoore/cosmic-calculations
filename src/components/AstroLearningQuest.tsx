import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface LearningModule {
  id: string;
  title: string;
  description: string;
  challenge: string;
  options: string[];
  answer: string;
  xp: number;
}

const MODULES: LearningModule[] = [
  {
    id: "snapshot",
    title: "Birth Chart Snapshot",
    description:
      "Natal astrology reads your chart as a sky snapshot from your exact birth time, date, and place to map personality, strengths, challenges, and potential.",
    challenge: "What makes natal interpretation personal?",
    options: ["Current moon phase only", "Exact birth time, date, and place", "Your favorite zodiac meme"],
    answer: "Exact birth time, date, and place",
    xp: 20,
  },
  {
    id: "core",
    title: "Core Components",
    description:
      "Core chart pieces include celestial bodies and points, zodiac signs, houses, aspects, and angles such as Ascendant and Midheaven.",
    challenge: "Which set is part of the core framework?",
    options: ["Planets, signs, houses, aspects, angles", "Only moon phases", "Only tarot cards"],
    answer: "Planets, signs, houses, aspects, angles",
    xp: 20,
  },
  {
    id: "sign-structure",
    title: "Sign Structure",
    description:
      "Each sign is interpreted through element (Fire/Earth/Air/Water), modality (Cardinal/Fixed/Mutable), and polarity (Masculine/Feminine).",
    challenge: "Which is a modality?",
    options: ["Mutable", "Water", "Masculine"],
    answer: "Mutable",
    xp: 20,
  },
  {
    id: "house-groups",
    title: "House Groupings",
    description:
      "Houses are grouped as angular (1,4,7,10), succedent (2,5,8,11), and cadent (3,6,9,12), each with a different expression style.",
    challenge: "Which houses are angular?",
    options: ["1, 4, 7, 10", "2, 5, 8, 11", "3, 6, 9, 12"],
    answer: "1, 4, 7, 10",
    xp: 20,
  },
  {
    id: "lenses",
    title: "Interpretive Lenses",
    description:
      "Reading style can differ across traditional, modern/psychological, and evolutionary schools while using the same chart data.",
    challenge: "Which is an interpretive lens?",
    options: ["Evolutionary astrology", "Coffee astrology", "Only numerology"],
    answer: "Evolutionary astrology",
    xp: 20,
  },
  {
    id: "extensions",
    title: "Advanced Extensions",
    description:
      "Extensions include progressions, transits, solar/lunar returns, and relationship systems like synastry/composite.",
    challenge: "Which is an extension technique?",
    options: ["Transits", "Planet emojis", "Birthstone colors"],
    answer: "Transits",
    xp: 20,
  },
];

export default function AstroLearningQuest() {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const completedCount = useMemo(
    () => MODULES.filter((m) => answers[m.id] && answers[m.id] === m.answer).length,
    [answers]
  );
  const totalXp = useMemo(
    () => MODULES.reduce((sum, m) => sum + (answers[m.id] === m.answer ? m.xp : 0), 0),
    [answers]
  );
  const progress = Math.round((completedCount / MODULES.length) * 100);

  return (
    <section className="glass-panel rounded-xl p-4 sm:p-6 mt-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg text-foreground">Astro Learning Quest</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Complete concept challenges to master the natal framework.
          </p>
        </div>
        <Badge variant="secondary">XP {totalXp}</Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{completedCount}/{MODULES.length} complete</span>
        </div>
        <Progress value={progress} className="h-2 bg-secondary/60" />
      </div>

      <div className="grid gap-3">
        {MODULES.map((module) => {
          const selected = answers[module.id];
          const isCorrect = selected === module.answer;
          const isWrong = !!selected && !isCorrect;

          return (
            <article key={module.id} className="rounded-lg border border-border/40 bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-medium text-foreground">{module.title}</h4>
                <Badge variant={isCorrect ? "default" : "outline"}>{module.xp} XP</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{module.description}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{module.challenge}</p>

              <div className="flex flex-wrap gap-2">
                {module.options.map((option) => {
                  const active = selected === option;
                  return (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => setAnswers((prev) => ({ ...prev, [module.id]: option }))}
                      className="text-xs"
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>

              {isCorrect && (
                <p className="text-xs text-emerald-300">Correct. This concept is now unlocked.</p>
              )}
              {isWrong && (
                <p className="text-xs text-amber-300">
                  Not quite. Recheck this concept and try again.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

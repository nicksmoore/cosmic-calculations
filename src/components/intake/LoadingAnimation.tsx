import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingAnimationProps {
  userName: string;
}

const loadingMessages = [
  "Consulting the celestial spheres...",
  "Mapping your cosmic coordinates...",
  "Calculating planetary positions...",
  "Weaving your stellar narrative...",
  "Aligning the houses of destiny...",
  "Preparing your cosmic blueprint...",
];

const LoadingAnimation = ({ userName }: LoadingAnimationProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Create orbital paths for planets
  const planets = [
    { size: 8, orbitRadius: 60, duration: 8, color: "hsl(45, 100%, 50%)" },    // Sun - Gold
    { size: 5, orbitRadius: 90, duration: 12, color: "hsl(200, 60%, 60%)" },   // Moon
    { size: 4, orbitRadius: 120, duration: 5, color: "hsl(30, 70%, 50%)" },    // Mercury
    { size: 6, orbitRadius: 150, duration: 10, color: "hsl(330, 60%, 60%)" },  // Venus
    { size: 5, orbitRadius: 180, duration: 14, color: "hsl(0, 70%, 50%)" },    // Mars
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Solar System Animation */}
      <div className="relative w-80 h-80 mb-12">
        {/* Center star/glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full bg-accent"
            animate={{
              boxShadow: [
                "0 0 30px hsl(45 100% 50% / 0.5), 0 0 60px hsl(45 100% 50% / 0.3)",
                "0 0 50px hsl(45 100% 50% / 0.7), 0 0 100px hsl(45 100% 50% / 0.5)",
                "0 0 30px hsl(45 100% 50% / 0.5), 0 0 60px hsl(45 100% 50% / 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Orbit rings */}
        {planets.map((planet, index) => (
          <div
            key={`orbit-${index}`}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/20"
            style={{
              width: planet.orbitRadius * 2,
              height: planet.orbitRadius * 2,
            }}
          />
        ))}

        {/* Orbiting planets */}
        {planets.map((planet, index) => (
          <motion.div
            key={`planet-${index}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: planet.orbitRadius * 2,
              height: planet.orbitRadius * 2,
              marginLeft: -planet.orbitRadius,
              marginTop: -planet.orbitRadius,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: planet.duration,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="absolute rounded-full"
              style={{
                width: planet.size,
                height: planet.size,
                backgroundColor: planet.color,
                top: 0,
                left: "50%",
                marginLeft: -planet.size / 2,
                boxShadow: `0 0 ${planet.size * 2}px ${planet.color}`,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-4">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl md:text-3xl font-serif text-ethereal"
        >
          Preparing {userName}'s Chart
        </motion.h2>
        
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-muted-foreground"
        >
          {loadingMessages[messageIndex]}
        </motion.p>

        {/* Loading bar */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden mx-auto mt-8">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;

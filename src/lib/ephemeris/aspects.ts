/**
 * Aspect calculations
 */

import { Aspect, AspectType, MAJOR_ASPECTS, MINOR_ASPECTS, PlanetaryPosition } from "./types";
import { normalize360 } from "./sidereal";

/**
 * Calculate the angular distance between two points
 */
export function angularDistance(long1: number, long2: number): number {
  const diff = Math.abs(normalize360(long1) - normalize360(long2));
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Check if two points form an aspect
 */
export function checkAspect(
  long1: number,
  long2: number,
  aspectType: AspectType,
  orbModifier: number = 0
): { isAspect: boolean; orb: number } {
  const distance = angularDistance(long1, long2);
  const targetAngle = aspectType.angle;
  const maxOrb = aspectType.orb + orbModifier;

  const orb = Math.abs(distance - targetAngle);

  return {
    isAspect: orb <= maxOrb,
    orb,
  };
}

/**
 * Determine if an aspect is applying or separating
 * (requires daily motion/speed data)
 */
export function isApplying(
  point1Long: number,
  point2Long: number,
  point1Speed: number,
  point2Speed: number,
  aspectAngle: number
): boolean {
  // Calculate current angular distance
  const currentDistance = angularDistance(point1Long, point2Long);

  // Simulate positions after 1 day
  const futureLong1 = normalize360(point1Long + point1Speed);
  const futureLong2 = normalize360(point2Long + point2Speed);
  const futureDistance = angularDistance(futureLong1, futureLong2);

  // If the distance to the exact aspect is decreasing, it's applying
  const currentOrb = Math.abs(currentDistance - aspectAngle);
  const futureOrb = Math.abs(futureDistance - aspectAngle);

  return futureOrb < currentOrb;
}

/**
 * Calculate all aspects between planets
 */
export function calculateAspects(
  planets: PlanetaryPosition[],
  options: {
    includeMajor?: boolean;
    includeMinor?: boolean;
    sunMoonOrbBonus?: number;
  } = {}
): Aspect[] {
  const {
    includeMajor = true,
    includeMinor = false,
    sunMoonOrbBonus = 2,
  } = options;

  const aspects: Aspect[] = [];
  const aspectTypes = [
    ...(includeMajor ? MAJOR_ASPECTS : []),
    ...(includeMinor ? MINOR_ASPECTS : []),
  ];

  // Check each pair of planets
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];

      // Calculate orb modifier for luminaries
      let orbModifier = 0;
      if (
        planet1.name === "sun" ||
        planet1.name === "moon" ||
        planet2.name === "sun" ||
        planet2.name === "moon"
      ) {
        orbModifier = sunMoonOrbBonus;
      }

      // Check each aspect type
      for (const aspectType of aspectTypes) {
        const result = checkAspect(
          planet1.longitude,
          planet2.longitude,
          aspectType,
          orbModifier
        );

        if (result.isAspect) {
          aspects.push({
            point1: planet1.name,
            point2: planet2.name,
            type: aspectType,
            angle: angularDistance(planet1.longitude, planet2.longitude),
            orb: result.orb,
          });
          break; // Only record one aspect per pair
        }
      }
    }
  }

  // Sort by orb (tighter aspects first)
  aspects.sort((a, b) => a.orb - b.orb);

  return aspects;
}

/**
 * Calculate aspects to a specific point (like Ascendant or MC)
 */
export function calculateAspectsToPoint(
  pointLongitude: number,
  pointName: string,
  planets: PlanetaryPosition[],
  aspectTypes: AspectType[] = MAJOR_ASPECTS
): Aspect[] {
  const aspects: Aspect[] = [];

  for (const planet of planets) {
    for (const aspectType of aspectTypes) {
      const result = checkAspect(
        planet.longitude,
        pointLongitude,
        aspectType
      );

      if (result.isAspect) {
        aspects.push({
          point1: planet.name,
          point2: pointName,
          type: aspectType,
          angle: angularDistance(planet.longitude, pointLongitude),
          orb: result.orb,
        });
        break;
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

/**
 * Get aspect color for visualization
 */
export function getAspectColor(aspectName: string): string {
  switch (aspectName.toLowerCase()) {
    case "conjunction":
      return "#FFD700"; // Gold
    case "opposition":
      return "#FF4444"; // Red
    case "trine":
      return "#4488FF"; // Blue
    case "square":
      return "#FF6644"; // Orange-red
    case "sextile":
      return "#44DD44"; // Green
    case "quincunx":
      return "#AA44AA"; // Purple
    default:
      return "#888888"; // Gray
  }
}

/**
 * Format orb for display
 */
export function formatOrb(orb: number): string {
  const degrees = Math.floor(orb);
  const minutes = Math.round((orb - degrees) * 60);
  return `${degrees}°${minutes.toString().padStart(2, "0")}'`;
}

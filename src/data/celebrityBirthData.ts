/**
 * Celebrity birth data for synastry "Celebrity Crush" feature.
 * Longitudes are approximate positions based on publicly known birth data.
 */

export interface CelebrityData {
  name: string;
  birthDate: string;
  planetLongitudes: Record<string, number>; // planet name → ecliptic longitude
  imageEmoji: string; // placeholder visual
}

// Approximate planetary longitudes for well-known celebrities
export const CELEBRITIES: CelebrityData[] = [
  {
    name: "Beyoncé",
    birthDate: "Sep 4, 1981",
    planetLongitudes: {
      Sun: 161, Moon: 205, Mercury: 174, Venus: 190, Mars: 150,
      Jupiter: 207, Saturn: 194, Uranus: 236, Neptune: 262, Pluto: 212,
    },
    imageEmoji: "👑",
  },
  {
    name: "Harry Styles",
    birthDate: "Feb 1, 1994",
    planetLongitudes: {
      Sun: 312, Moon: 194, Mercury: 318, Venus: 336, Mars: 316,
      Jupiter: 218, Saturn: 333, Uranus: 291, Neptune: 291, Pluto: 237,
    },
    imageEmoji: "🎸",
  },
  {
    name: "Taylor Swift",
    birthDate: "Dec 13, 1989",
    planetLongitudes: {
      Sun: 261, Moon: 243, Mercury: 252, Venus: 272, Mars: 216,
      Jupiter: 108, Saturn: 280, Uranus: 278, Neptune: 280, Pluto: 226,
    },
    imageEmoji: "🎤",
  },
  {
    name: "Timothée Chalamet",
    birthDate: "Dec 27, 1995",
    planetLongitudes: {
      Sun: 275, Moon: 150, Mercury: 258, Venus: 305, Mars: 275,
      Jupiter: 270, Saturn: 356, Uranus: 300, Neptune: 294, Pluto: 241,
    },
    imageEmoji: "🎬",
  },
  {
    name: "Zendaya",
    birthDate: "Sep 1, 1996",
    planetLongitudes: {
      Sun: 159, Moon: 14, Mercury: 175, Venus: 140, Mars: 103,
      Jupiter: 278, Saturn: 4, Uranus: 300, Neptune: 295, Pluto: 241,
    },
    imageEmoji: "✨",
  },
  {
    name: "Ryan Gosling",
    birthDate: "Nov 12, 1980",
    planetLongitudes: {
      Sun: 230, Moon: 310, Mercury: 243, Venus: 210, Mars: 264,
      Jupiter: 187, Saturn: 187, Uranus: 234, Neptune: 261, Pluto: 204,
    },
    imageEmoji: "🌟",
  },
  {
    name: "Rihanna",
    birthDate: "Feb 20, 1988",
    planetLongitudes: {
      Sun: 331, Moon: 12, Mercury: 319, Venus: 356, Mars: 269,
      Jupiter: 29, Saturn: 278, Uranus: 268, Neptune: 278, Pluto: 223,
    },
    imageEmoji: "💎",
  },
  {
    name: "Keanu Reeves",
    birthDate: "Sep 2, 1964",
    planetLongitudes: {
      Sun: 160, Moon: 298, Mercury: 175, Venus: 103, Mars: 108,
      Jupiter: 56, Saturn: 336, Uranus: 159, Neptune: 225, Pluto: 164,
    },
    imageEmoji: "🕶️",
  },
  {
    name: "Lady Gaga",
    birthDate: "Mar 28, 1986",
    planetLongitudes: {
      Sun: 7, Moon: 210, Mercury: 356, Venus: 22, Mars: 280,
      Jupiter: 341, Saturn: 248, Uranus: 251, Neptune: 274, Pluto: 217,
    },
    imageEmoji: "🦋",
  },
  {
    name: "Leonardo DiCaprio",
    birthDate: "Nov 11, 1974",
    planetLongitudes: {
      Sun: 228, Moon: 194, Mercury: 222, Venus: 258, Mars: 219,
      Jupiter: 332, Saturn: 118, Uranus: 213, Neptune: 248, Pluto: 187,
    },
    imageEmoji: "🏆",
  },
  {
    name: "Ariana Grande",
    birthDate: "Jun 26, 1993",
    planetLongitudes: {
      Sun: 94, Moon: 194, Mercury: 109, Venus: 70, Mars: 159,
      Jupiter: 186, Saturn: 332, Uranus: 289, Neptune: 289, Pluto: 233,
    },
    imageEmoji: "🌙",
  },
  {
    name: "Chris Hemsworth",
    birthDate: "Aug 11, 1983",
    planetLongitudes: {
      Sun: 138, Moon: 160, Mercury: 153, Venus: 120, Mars: 90,
      Jupiter: 246, Saturn: 208, Uranus: 244, Neptune: 266, Pluto: 217,
    },
    imageEmoji: "⚡",
  },
];

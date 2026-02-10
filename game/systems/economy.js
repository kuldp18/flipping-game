// ============================================
// ECONOMY.JS — Economy Simulation & Trends
// ============================================

import { CATEGORIES, roll, pick, chance } from "./items.js";

// ── Trend Templates ──────────────────────────
const TREND_NAMES = {
  electronics: [
    "Retro Tech Revival",
    "Vintage Gaming Craze",
    "Lo-Fi Tech Boom",
    "E-Waste Gold Rush",
  ],
  clothes: [
    "Y2K Fashion Wave",
    "Cottagecore Trend",
    "Vintage Streetwear Hype",
    "Thrift Chic Movement",
  ],
  furniture: [
    "Mid-Century Modern Mania",
    "Cozy Home Boom",
    "Upcycle Revolution",
    "Antique Furniture Surge",
  ],
  collectibles: [
    "Collector Frenzy",
    "Nostalgia Market Spike",
    "Auction House Boom",
    "Museum Buyback Wave",
  ],
  misc: [
    "Oddity Craze",
    "Mystery Box Trend",
    "Curio Market Spike",
    "Junk-to-Treasure Hype",
  ],
};

// ── Season Definitions ───────────────────────
const SEASONS = [
  {
    name: "Spring",
    dayStart: 0,
    icon: "🌱",
    categoryBonus: { furniture: 0.1, clothes: 0.05 },
  },
  {
    name: "Summer",
    dayStart: 30,
    icon: "☀️",
    categoryBonus: { clothes: 0.15, misc: 0.05 },
  },
  {
    name: "Fall",
    dayStart: 60,
    icon: "🍂",
    categoryBonus: { electronics: 0.1, collectibles: 0.1 },
  },
  {
    name: "Winter",
    dayStart: 90,
    icon: "❄️",
    categoryBonus: { collectibles: 0.2, furniture: 0.05 },
  },
];
const SEASON_LENGTH = 120; // full cycle

// ── Create initial economy state ─────────────
export function createEconomy() {
  return {
    inflationRate: 1.0,
    currentTrends: [],
    activeEvents: [],
    lastTrendDay: 0,
    marketSentiment: 50, // 0=bearish, 100=bullish
  };
}

// ── Get current season ───────────────────────
export function getSeason(day) {
  const cycleDay = day % SEASON_LENGTH;
  let season = SEASONS[0];
  for (const s of SEASONS) {
    if (cycleDay >= s.dayStart) season = s;
  }
  return season;
}

// ── Update economy each day ──────────────────
export function updateEconomy(economy, day) {
  // Inflation: slowly increases over time
  economy.inflationRate = 1.0 + Math.floor(day / 10) * 0.01;

  // Market sentiment drift
  economy.marketSentiment += roll(-5, 5);
  economy.marketSentiment = Math.max(10, Math.min(90, economy.marketSentiment));

  // Generate new trends periodically
  if (day - economy.lastTrendDay >= roll(5, 10)) {
    economy.lastTrendDay = day;

    // Remove expired trends
    economy.currentTrends = economy.currentTrends.filter((t) => day < t.endDay);

    // Maybe add a new trend (cap at 2 active)
    if (economy.currentTrends.length < 2 && chance(60)) {
      const catKeys = Object.keys(CATEGORIES);
      const cat = pick(catKeys);
      const trendName = pick(TREND_NAMES[cat]);
      const duration = roll(5, 15);
      const bonus = roll(15, 50) / 100; // 15-50% bonus

      economy.currentTrends.push({
        name: trendName,
        category: cat,
        bonus,
        startDay: day,
        endDay: day + duration,
        icon: CATEGORIES[cat].icon,
      });
    }
  }

  return economy;
}

// ── Get total market multiplier for a category ──
export function getCategoryMultiplier(category, economy, day) {
  let mult = 1.0;

  // Inflation
  mult *= economy.inflationRate;

  // Sentiment
  mult *= 0.85 + (economy.marketSentiment / 100) * 0.3;

  // Active trends
  for (const trend of economy.currentTrends) {
    if (trend.category === category) {
      mult *= 1 + trend.bonus;
    }
  }

  // Seasonal bonus
  const season = getSeason(day);
  if (season.categoryBonus[category]) {
    mult *= 1 + season.categoryBonus[category];
  }

  return Math.round(mult * 100) / 100;
}

// ── Get trend display info ───────────────────
export function getTrendInfo(economy, day) {
  return economy.currentTrends
    .filter((t) => day < t.endDay)
    .map((t) => ({
      name: t.name,
      category: t.category,
      categoryName: CATEGORIES[t.category].name,
      bonus: `+${Math.round(t.bonus * 100)}%`,
      daysLeft: t.endDay - day,
      icon: t.icon,
    }));
}

// ── Get season display info ──────────────────
export function getSeasonInfo(day) {
  const season = getSeason(day);
  const bonuses = Object.entries(season.categoryBonus).map(
    ([cat, bonus]) => `${CATEGORIES[cat].name} +${Math.round(bonus * 100)}%`,
  );
  return {
    name: season.name,
    icon: season.icon,
    bonuses,
  };
}

// ============================================
// EVENTS.JS — Random Events System
// ============================================

import { CATEGORIES, roll, pick, chance } from "./items.js";

// ── Event Definitions ────────────────────────
export const EVENT_TYPES = [
  {
    id: "viral_trend",
    name: "Viral TikTok Trend",
    icon: "📱",
    description: (cat) =>
      `${cat} are blowing up on social media! Values spike temporarily.`,
    probability: 12,
    duration: { min: 3, max: 6 },
    effect: { type: "category_boost", bonus: 0.4 },
    category: "random", // will be assigned randomly on trigger
  },
  {
    id: "market_crash",
    name: "Market Downturn",
    icon: "📉",
    description: () =>
      "The resale market takes a hit. Everything is worth less for a while.",
    probability: 8,
    duration: { min: 3, max: 5 },
    effect: { type: "global_penalty", penalty: -0.25 },
    category: null,
  },
  {
    id: "collector_convention",
    name: "Collector Convention",
    icon: "🏆",
    description: () =>
      "Collectors are in town! Collectibles fetch premium prices.",
    probability: 10,
    duration: { min: 2, max: 4 },
    effect: {
      type: "category_boost",
      bonus: 0.6,
      fixedCategory: "collectibles",
    },
    category: "collectibles",
  },
  {
    id: "holiday_season",
    name: "Holiday Shopping Surge",
    icon: "🎄",
    description: () =>
      "Holiday buyers are out in force. Everything sells faster!",
    probability: 7,
    duration: { min: 4, max: 7 },
    effect: { type: "speed_boost", speedReduction: 1 },
    category: null,
  },
  {
    id: "supply_shortage",
    name: "Supply Shortage",
    icon: "🚫",
    description: (cat) =>
      `${cat} are in short supply! Remaining stock is worth more.`,
    probability: 10,
    duration: { min: 2, max: 5 },
    effect: { type: "category_boost", bonus: 0.35 },
    category: "random",
  },
  {
    id: "scam_wave",
    name: "Online Scam Wave",
    icon: "⚠️",
    description: () =>
      "A wave of scams hits online platforms. Risk of failed sales increases.",
    probability: 6,
    duration: { min: 2, max: 4 },
    effect: { type: "risk_increase", riskAdd: 15 },
    category: null,
  },
  {
    id: "rival_flipper",
    name: "Rival Flipper Alert",
    icon: "👤",
    description: () =>
      "A rival reseller is working the same stores. Prices go up, good items disappear faster.",
    probability: 12,
    duration: { min: 2, max: 4 },
    effect: { type: "price_increase", increase: 0.15 },
    category: null,
  },
  {
    id: "garage_sale_season",
    name: "Garage Sale Season",
    icon: "🏡",
    description: () =>
      "Everyone is cleaning out! Store inventories are bigger and cheaper.",
    probability: 8,
    duration: { min: 3, max: 5 },
    effect: { type: "price_decrease", decrease: 0.2 },
    category: null,
  },
  {
    id: "lucky_day",
    name: "Lucky Day",
    icon: "🍀",
    description: () =>
      "You woke up feeling lucky. All skill checks are easier today.",
    probability: 5,
    duration: { min: 1, max: 1 },
    effect: { type: "skill_boost", bonus: 15 },
    category: null,
  },
  {
    id: "antique_roadshow",
    name: "Antique Roadshow in Town",
    icon: "📺",
    description: () =>
      "An appraisal show is filming nearby. Hidden item values are revealed more accurately.",
    probability: 7,
    duration: { min: 2, max: 3 },
    effect: { type: "appraisal_boost" },
    category: null,
  },
];

// ── Check for new events each day ────────────
export function checkForEvents(activeEvents, day) {
  const newEvents = [];

  // Limit active events to 3
  if (activeEvents.length >= 3) return newEvents;

  // Check each event type
  for (const eventType of EVENT_TYPES) {
    // Don't duplicate active events of the same type
    if (activeEvents.some((e) => e.id === eventType.id)) continue;

    if (chance(eventType.probability)) {
      const duration = roll(eventType.duration.min, eventType.duration.max);

      // Assign random category if needed
      let category = eventType.category;
      let categoryName = "";
      if (category === "random") {
        const catKeys = Object.keys(CATEGORIES);
        category = pick(catKeys);
        categoryName = CATEGORIES[category].name;
      } else if (category) {
        categoryName = CATEGORIES[category]?.name || "";
      }

      const event = {
        id: eventType.id,
        name: eventType.name,
        icon: eventType.icon,
        description: eventType.description(categoryName),
        startDay: day,
        endDay: day + duration,
        effect: { ...eventType.effect },
        category,
        categoryName,
      };

      // Set fixed category for category_boost effects
      if (
        event.effect.type === "category_boost" &&
        !event.effect.fixedCategory
      ) {
        event.effect.fixedCategory = category;
      }

      newEvents.push(event);
      break; // Only one new event per day
    }
  }

  return newEvents;
}

// ── Remove expired events ────────────────────
export function cleanupExpiredEvents(activeEvents, day) {
  return activeEvents.filter((e) => day < e.endDay);
}

// ── Get category boost from active events ────
export function getEventCategoryBoost(activeEvents, category) {
  let boost = 0;
  for (const event of activeEvents) {
    if (
      event.effect.type === "category_boost" &&
      event.effect.fixedCategory === category
    ) {
      boost += event.effect.bonus;
    }
  }
  return boost;
}

// ── Get global effects ───────────────────────
export function getEventEffects(activeEvents) {
  const effects = {
    globalPriceModifier: 0,
    speedReduction: 0,
    riskIncrease: 0,
    skillBonus: 0,
    priceIncrease: 0,
    priceDecrease: 0,
    appraisalBoost: false,
  };

  for (const event of activeEvents) {
    switch (event.effect.type) {
      case "global_penalty":
        effects.globalPriceModifier += event.effect.penalty;
        break;
      case "speed_boost":
        effects.speedReduction += event.effect.speedReduction;
        break;
      case "risk_increase":
        effects.riskIncrease += event.effect.riskAdd;
        break;
      case "skill_boost":
        effects.skillBonus += event.effect.bonus;
        break;
      case "price_increase":
        effects.priceIncrease += event.effect.increase;
        break;
      case "price_decrease":
        effects.priceDecrease += event.effect.decrease;
        break;
      case "appraisal_boost":
        effects.appraisalBoost = true;
        break;
    }
  }

  return effects;
}

// ── Format events for display ────────────────
export function getActiveEventDisplay(activeEvents, day) {
  return activeEvents.map((e) => ({
    ...e,
    daysLeft: e.endDay - day,
  }));
}

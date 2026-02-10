// ============================================
// NEGOTIATION.JS — Bargaining System
// ============================================

import { skillCheck } from "./player.js";
import { roll, chance, pick } from "./items.js";

// ── Negotiation Strategies ───────────────────
export const NEGOTIATION_OPTIONS = {
  buy: [
    {
      id: "accept",
      name: "Accept Price",
      description: "Pay the asking price. No drama.",
      icon: "✓",
      discount: 0,
      skillRequired: null,
      difficulty: 0,
      riskOfFailure: false,
    },
    {
      id: "fair_offer",
      name: "Fair Offer",
      description: "Suggest a reasonable discount. Low risk.",
      icon: "🤝",
      discountRange: [0.08, 0.18],
      skillRequired: "charisma",
      difficultyMod: 0,
      riskOfFailure: false,
    },
    {
      id: "lowball",
      name: "Lowball",
      description: "Go way under asking. High risk, high reward.",
      icon: "💰",
      discountRange: [0.25, 0.45],
      skillRequired: "charisma",
      difficultyMod: 20,
      riskOfFailure: true,
      failPenalty: "price_increase",
    },
    {
      id: "bluff",
      name: "Bluff",
      description: '"I saw this cheaper elsewhere." Needs luck.',
      icon: "🎭",
      discountRange: [0.15, 0.3],
      skillRequired: "luck",
      difficultyMod: 10,
      riskOfFailure: true,
      failPenalty: "item_removed",
    },
    {
      id: "walk_away",
      name: "Walk Away",
      description: "Leave it. Maybe next time.",
      icon: "🚪",
      discount: null,
      skillRequired: null,
      difficulty: 0,
      riskOfFailure: false,
    },
  ],
};

// ── Negotiation Response Texts ───────────────
const ACCEPT_RESPONSES = [
  '"Deal! It\'s all yours."',
  '"Sold! Good choice."',
  '"Pleasure doing business."',
  '"That\'ll do. Take it."',
];

const FAIR_SUCCESS_RESPONSES = [
  '"Alright, that seems fair. You got yourself a deal."',
  '"Hmm... fine. I can do that."',
  '"Not bad. I\'ll take it."',
  '"You drive a decent bargain. Done."',
];

const FAIR_FAIL_RESPONSES = [
  '"Nah, that\'s too low for me. Price stays."',
  '"Can\'t go that low. Take it or leave it."',
  '"I\'ve had better offers. Final price."',
];

const LOWBALL_SUCCESS_RESPONSES = [
  '"Ugh... fine. I just want it gone."',
  '"You\'re killing me, but okay."',
  '"That\'s highway robbery, but deal."',
  "\"...I can't believe I'm doing this.\"",
];

const LOWBALL_FAIL_RESPONSES = [
  '"Are you serious? Get outta here with that."',
  '"That\'s insulting. Price just went up 10%."',
  '"Not a chance. Don\'t waste my time."',
  '"You think I\'m desperate? Price is firm now."',
];

const BLUFF_SUCCESS_RESPONSES = [
  '"Really? Where? ...Fine, I\'ll match."',
  '"Alright, alright. I\'ll drop it."',
  '"I don\'t believe you, but... fine."',
  '"Can\'t lose a sale. Okay, deal."',
];

const BLUFF_FAIL_RESPONSES = [
  '"Nice try. I know my market. Item\'s gone."',
  "\"You're bluffing. We're done here.\"",
  '"I just sold that to someone else while you were talking."',
  "\"That's the oldest trick. Item's off the table.\"",
];

// ── Execute a negotiation ────────────────────
export function negotiate(player, item, strategyId, storeDifficulty) {
  const strategy = NEGOTIATION_OPTIONS.buy.find((s) => s.id === strategyId);
  if (!strategy) return { success: false, message: "Invalid strategy." };

  const result = {
    success: false,
    finalPrice: item.storePrice,
    message: "",
    response: "",
    discount: 0,
    priceChanged: false,
    itemRemoved: false,
    skillResult: null,
  };

  // Accept — always succeeds
  if (strategyId === "accept") {
    result.success = true;
    result.finalPrice = item.storePrice;
    result.response = pick(ACCEPT_RESPONSES);
    result.message = "You paid the asking price.";
    return result;
  }

  // Walk Away — always "succeeds" but no purchase
  if (strategyId === "walk_away") {
    result.success = false;
    result.message = "You decided to pass on this one.";
    result.response = '"Suit yourself."';
    return result;
  }

  // Skill-based negotiation
  const difficulty = storeDifficulty + (strategy.difficultyMod || 0);
  const upgradeBonus = player.upgrades?.negotiation_boost ? 8 : 0;
  const check = skillCheck(
    player,
    strategy.skillRequired,
    difficulty,
    upgradeBonus,
  );
  result.skillResult = check;

  if (check.success) {
    // Calculate discount
    const [minDisc, maxDisc] = strategy.discountRange;
    const discountPct = minDisc + Math.random() * (maxDisc - minDisc);
    const discount = Math.round(item.storePrice * discountPct * 100) / 100;
    result.success = true;
    result.discount = discount;
    result.finalPrice = Math.round((item.storePrice - discount) * 100) / 100;
    result.priceChanged = true;

    // Response text
    if (strategyId === "fair_offer") {
      result.response = pick(FAIR_SUCCESS_RESPONSES);
      result.message = `Negotiated ${Math.round(discountPct * 100)}% off!`;
    } else if (strategyId === "lowball") {
      result.response = pick(LOWBALL_SUCCESS_RESPONSES);
      result.message = `Massive ${Math.round(discountPct * 100)}% discount!`;
    } else if (strategyId === "bluff") {
      result.response = pick(BLUFF_SUCCESS_RESPONSES);
      result.message = `Bluff worked! ${Math.round(discountPct * 100)}% off!`;
    }
  } else {
    // Failed negotiation
    if (strategy.failPenalty === "price_increase") {
      const increase = Math.round(item.storePrice * 0.1 * 100) / 100;
      result.finalPrice = item.storePrice + increase;
      result.priceChanged = true;
      result.response = pick(LOWBALL_FAIL_RESPONSES);
      result.message = "Lowball backfired! Price went up 10%.";
    } else if (strategy.failPenalty === "item_removed") {
      result.itemRemoved = true;
      result.response = pick(BLUFF_FAIL_RESPONSES);
      result.message = "They called your bluff! Item is no longer available.";
    } else {
      result.finalPrice = item.storePrice;
      result.response = pick(FAIR_FAIL_RESPONSES);
      result.message = "They wouldn't budge. Price stays the same.";
    }
  }

  return result;
}

// ── Skill gain from negotiating ──────────────
export function getNegotiationSkillGain(strategyId, success) {
  if (strategyId === "accept" || strategyId === "walk_away") return {};
  const gain = {};
  if (strategyId === "lowball" || strategyId === "fair_offer") {
    gain.charisma = success ? 0.15 : 0.05;
  }
  if (strategyId === "bluff") {
    gain.luck = success ? 0.1 : 0.03;
  }
  gain.marketKnowledge = 0.03;
  return gain;
}

// ── Apply skill gains ────────────────────────
export function applySkillGains(player, gains) {
  for (const [skill, amount] of Object.entries(gains)) {
    if (player.skills[skill] !== undefined) {
      player.skills[skill] =
        Math.round((player.skills[skill] + amount) * 100) / 100;
      // Cap skills at 20
      player.skills[skill] = Math.min(20, player.skills[skill]);
    }
  }
}

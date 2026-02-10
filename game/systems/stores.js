// ============================================
// STORES.JS — Location Definitions & Inventory
// ============================================

import { generateItem, getStorePrice, roll, pick, chance } from "./items.js";

// ── Store Definitions ────────────────────────
export const STORES = [
  {
    id: "dusty_thrift",
    name: "Dusty Thrift Mart",
    vibe: "Cheap junk, hidden gems",
    description:
      "A cramped shop smelling of mothballs and broken dreams. Mountains of stuff everywhere.",
    itemCount: { min: 4, max: 7 },
    priceMultiplier: 0.7,
    rarityBias: 0,
    conditionBias: -1,
    negotiationDifficulty: 25,
    energyCost: 2,
    restockDays: 2,
    unlockRep: 0,
    categoryWeights: {
      electronics: 15,
      clothes: 25,
      furniture: 15,
      collectibles: 15,
      misc: 30,
    },
    keeperName: "Marge",
    keeperLine: '"Take your time, hon. Everything\'s gotta go."',
    icon: "🏪",
  },
  {
    id: "garage_sale",
    name: "Old Man's Garage Sale",
    vibe: "Low prices, high randomness",
    description:
      "A suburban driveway covered in folding tables. The old man sits in a lawn chair, half asleep.",
    itemCount: { min: 3, max: 6 },
    priceMultiplier: 0.5,
    rarityBias: -1,
    conditionBias: -2,
    negotiationDifficulty: 15,
    energyCost: 2,
    restockDays: 3,
    unlockRep: 0,
    categoryWeights: {
      electronics: 20,
      clothes: 15,
      furniture: 25,
      collectibles: 10,
      misc: 30,
    },
    keeperName: "Earl",
    keeperLine: '"Just make me an offer. Wife says it all has to go."',
    icon: "🏠",
  },
  {
    id: "urban_vintage",
    name: "Urban Vintage Store",
    vibe: "Higher prices, trend-based demand",
    description:
      "An Instagram-ready boutique with curated displays. Everything is overpriced but occasionally worth it.",
    itemCount: { min: 5, max: 8 },
    priceMultiplier: 1.3,
    rarityBias: 1,
    conditionBias: 2,
    negotiationDifficulty: 45,
    energyCost: 2,
    restockDays: 2,
    unlockRep: 5,
    categoryWeights: {
      electronics: 10,
      clothes: 35,
      furniture: 20,
      collectibles: 25,
      misc: 10,
    },
    keeperName: "Zoe",
    keeperLine:
      '"Everything here tells a story. Prices reflect the narrative."',
    icon: "🏬",
  },
  {
    id: "night_flea",
    name: "Night Flea Market",
    vibe: "Rare items, shady deals",
    description:
      "Dim lights, loud music, questionable vendors. You might find gold—or get played.",
    itemCount: { min: 4, max: 7 },
    priceMultiplier: 1.0,
    rarityBias: 2,
    conditionBias: 0,
    negotiationDifficulty: 55,
    energyCost: 3,
    restockDays: 3,
    unlockRep: 10,
    categoryWeights: {
      electronics: 25,
      clothes: 15,
      furniture: 5,
      collectibles: 35,
      misc: 20,
    },
    keeperName: "Marco",
    keeperLine: "\"You didn't see me. I didn't see you. Let's do business.\"",
    icon: "🌙",
  },
  {
    id: "estate_sale",
    name: "Estate Sale",
    vibe: "High risk, high reward",
    description:
      "A once-grand house now being picked clean. Every room hides potential treasure.",
    itemCount: { min: 6, max: 10 },
    priceMultiplier: 1.1,
    rarityBias: 3,
    conditionBias: 1,
    negotiationDifficulty: 40,
    energyCost: 4,
    restockDays: 5,
    unlockRep: 25,
    categoryWeights: {
      electronics: 10,
      clothes: 10,
      furniture: 30,
      collectibles: 35,
      misc: 15,
    },
    keeperName: "Estate Agent",
    keeperLine: '"The family wants everything gone by Sunday. Make it quick."',
    icon: "🏛️",
  },
  {
    id: "surplus_auction",
    name: "Online Surplus Auction",
    vibe: "Bulk items, mixed quality",
    description:
      "Pallets of returned merchandise. Could be gold, could be garbage. You won't know until you bid.",
    itemCount: { min: 5, max: 9 },
    priceMultiplier: 0.8,
    rarityBias: 1,
    conditionBias: -1,
    negotiationDifficulty: 60,
    energyCost: 2,
    restockDays: 2,
    unlockRep: 40,
    categoryWeights: {
      electronics: 35,
      clothes: 20,
      furniture: 10,
      collectibles: 15,
      misc: 20,
    },
    keeperName: "System",
    keeperLine: '"LOT #4471 — MIXED ELECTRONICS — STARTING BID: $12"',
    icon: "💻",
  },
  {
    id: "collectors_vault",
    name: "The Collector's Vault",
    vibe: "Ultra rare, premium prices",
    description:
      "A climate-controlled basement behind an unmarked door. Everything here is authenticated.",
    itemCount: { min: 3, max: 5 },
    priceMultiplier: 1.8,
    rarityBias: 5,
    conditionBias: 3,
    negotiationDifficulty: 70,
    energyCost: 3,
    restockDays: 7,
    unlockRep: 60,
    categoryWeights: {
      electronics: 15,
      clothes: 5,
      furniture: 10,
      collectibles: 60,
      misc: 10,
    },
    keeperName: "Mr. Chen",
    keeperLine: '"Ah, a serious buyer. Let me show you the back room."',
    icon: "🔒",
  },
];

// ── Generate store inventory ─────────────────
export function generateStoreInventory(store, economyState = null) {
  const count = roll(store.itemCount.min, store.itemCount.max);
  const items = [];
  const inflation = economyState?.inflationRate || 1.0;

  // Build weighted category list
  const catEntries = Object.entries(store.categoryWeights);
  const totalWeight = catEntries.reduce((s, [, w]) => s + w, 0);

  for (let i = 0; i < count; i++) {
    // Pick category based on store weights
    let r = Math.random() * totalWeight;
    let chosenCategory = catEntries[0][0];
    for (const [cat, weight] of catEntries) {
      r -= weight;
      if (r <= 0) {
        chosenCategory = cat;
        break;
      }
    }

    const item = generateItem({
      categoryKey: chosenCategory,
      rarityBias: store.rarityBias,
      conditionBias: store.conditionBias,
      priceMult: 1.0,
      inflation,
    });

    // Calculate store asking price
    item.storePrice = getStorePrice(item, store.priceMultiplier);
    items.push(item);
  }

  return items;
}

// ── Get available (unlocked) stores ──────────
export function getAvailableStores(reputation) {
  return STORES.filter((s) => reputation >= s.unlockRep);
}

// ── Check if store has restocked ─────────────
export function canVisitStore(storeId, currentDay, lastVisited = {}) {
  const store = STORES.find((s) => s.id === storeId);
  if (!store) return false;
  if (!lastVisited[storeId]) return true; // never visited — always available
  return currentDay - lastVisited[storeId] >= store.restockDays;
}

// ── Get store restock countdown ──────────────
export function getRestockCountdown(storeId, currentDay, lastVisited = {}) {
  const store = STORES.find((s) => s.id === storeId);
  if (!store) return 0;
  if (!lastVisited[storeId]) return 0; // never visited — ready now
  const remaining = store.restockDays - (currentDay - lastVisited[storeId]);
  return Math.max(0, remaining);
}

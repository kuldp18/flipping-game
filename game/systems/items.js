// ============================================
// ITEMS.JS — Item Database & Procedural Generation
// ============================================

// ── Utility helpers ──────────────────────────
export function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function chance(percent) {
  return Math.random() * 100 < percent;
}
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function weightedPick(items, weightFn) {
  const total = items.reduce((s, i) => s + weightFn(i), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= weightFn(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
export function formatCash(n) {
  return "$" + n.toFixed(2);
}

// ── Rarity Tiers ─────────────────────────────
export const RARITIES = [
  {
    tier: 0,
    name: "Common",
    weight: 60,
    valueMult: 1.0,
    color: "#8b8b8b",
    symbol: "○",
  },
  {
    tier: 1,
    name: "Uncommon",
    weight: 25,
    valueMult: 1.8,
    color: "#4ade80",
    symbol: "◆",
  },
  {
    tier: 2,
    name: "Rare",
    weight: 10,
    valueMult: 3.5,
    color: "#60a5fa",
    symbol: "★",
  },
  {
    tier: 3,
    name: "Epic",
    weight: 4,
    valueMult: 8.0,
    color: "#c084fc",
    symbol: "◈",
  },
  {
    tier: 4,
    name: "Mythic",
    weight: 1,
    valueMult: 20.0,
    color: "#fbbf24",
    symbol: "✦",
  },
];

// ── Condition Levels ─────────────────────────
export const CONDITIONS = [
  { level: 0, name: "Broken", valueMult: 0.2, repairCostPct: 0.35, icon: "✗" },
  { level: 1, name: "Poor", valueMult: 0.5, repairCostPct: 0.2, icon: "▽" },
  { level: 2, name: "Fair", valueMult: 0.75, repairCostPct: 0.1, icon: "△" },
  { level: 3, name: "Good", valueMult: 1.0, repairCostPct: 0.0, icon: "▲" },
  { level: 4, name: "Mint", valueMult: 1.5, repairCostPct: 0.0, icon: "◆" },
];

// ── Categories ───────────────────────────────
export const CATEGORIES = {
  electronics: { name: "Electronics", icon: "⚡", color: "#00e5ff" },
  clothes: { name: "Clothes", icon: "👔", color: "#ff6ec7" },
  furniture: { name: "Furniture", icon: "🪑", color: "#c49b5c" },
  collectibles: { name: "Collectibles", icon: "★", color: "#ffd700" },
  misc: { name: "Misc", icon: "?", color: "#b0b0b0" },
};

// ── Item Sizes ───────────────────────────────
export const SIZES = [
  { id: 1, name: "Small", slots: 1 },
  { id: 2, name: "Medium", slots: 2 },
  { id: 3, name: "Large", slots: 3 },
];

// ── Item Template Database ───────────────────
export const ITEM_TEMPLATES = {
  electronics: [
    { name: "Cracked iPod Classic", baseValue: 45, size: 1 },
    { name: "Old Game Boy", baseValue: 38, size: 1 },
    { name: "Vintage Walkman", baseValue: 32, size: 1 },
    { name: "Broken Laptop", baseValue: 65, size: 2 },
    { name: "Retro CRT Monitor", baseValue: 80, size: 3 },
    { name: "Tangled Headphones", baseValue: 12, size: 1 },
    { name: "Mystery USB Drive", baseValue: 5, size: 1 },
    { name: "Dusty Mechanical Keyboard", baseValue: 40, size: 1 },
    { name: "Faded Calculator Watch", baseValue: 18, size: 1 },
    { name: "Dead Flip Phone", baseValue: 8, size: 1 },
    { name: "Vintage Tube Radio", baseValue: 55, size: 2 },
    { name: "Polaroid Camera", baseValue: 42, size: 1 },
    { name: "Portable CD Player", baseValue: 15, size: 1 },
    { name: "Mini CRT Television", baseValue: 70, size: 3 },
    { name: "Retro Alarm Clock", baseValue: 10, size: 1 },
    { name: "Handheld CB Radio", baseValue: 22, size: 1 },
    { name: "Broken Digital Camera", baseValue: 20, size: 1 },
    { name: "VHS Camcorder", baseValue: 50, size: 2 },
    { name: "Tape Recorder", baseValue: 25, size: 1 },
    { name: "Electric Typewriter", baseValue: 60, size: 2 },
  ],
  clothes: [
    { name: "Unbranded Leather Jacket", baseValue: 55, size: 2 },
    { name: "Faded Band Tee", baseValue: 18, size: 1 },
    { name: "Vintage Denim Jacket", baseValue: 42, size: 2 },
    { name: "Moth-Eaten Sweater", baseValue: 8, size: 1 },
    { name: "Retro Sneakers", baseValue: 35, size: 1 },
    { name: "Silk Scarf", baseValue: 22, size: 1 },
    { name: "Military Surplus Coat", baseValue: 48, size: 2 },
    { name: "Hawaiian Shirt", baseValue: 15, size: 1 },
    { name: "Cowboy Boots", baseValue: 40, size: 2 },
    { name: "Wool Fedora", baseValue: 20, size: 1 },
    { name: "Corduroy Blazer", baseValue: 30, size: 2 },
    { name: "Vintage Sunglasses", baseValue: 25, size: 1 },
    { name: "Embroidered Vest", baseValue: 28, size: 1 },
    { name: "Platform Shoes", baseValue: 32, size: 1 },
    { name: "Fur-Lined Gloves", baseValue: 16, size: 1 },
    { name: "Paisley Necktie", baseValue: 10, size: 1 },
    { name: "Canvas Backpack", baseValue: 24, size: 2 },
    { name: "Sequined Dress", baseValue: 38, size: 1 },
    { name: "Woven Belt", baseValue: 12, size: 1 },
    { name: "Trench Coat", baseValue: 50, size: 2 },
  ],
  furniture: [
    { name: "Wobbly End Table", baseValue: 20, size: 2 },
    { name: "Art Deco Lamp", baseValue: 35, size: 2 },
    { name: "Velvet Armchair", baseValue: 75, size: 3 },
    { name: "Rusty Filing Cabinet", baseValue: 15, size: 3 },
    { name: "Antique Mirror", baseValue: 55, size: 2 },
    { name: "Mid-Century Stool", baseValue: 40, size: 2 },
    { name: "Wooden Jewelry Box", baseValue: 18, size: 1 },
    { name: "Brass Candelabra", baseValue: 28, size: 1 },
    { name: "Rattan Basket Chair", baseValue: 45, size: 3 },
    { name: "Oak Bookshelf", baseValue: 85, size: 3 },
    { name: "Ceramic Table Lamp", baseValue: 22, size: 1 },
    { name: "Folding Card Table", baseValue: 12, size: 2 },
    { name: "Teak Coffee Table", baseValue: 60, size: 3 },
    { name: "Wicker Magazine Rack", baseValue: 10, size: 2 },
    { name: "Standing Coat Rack", baseValue: 25, size: 2 },
    { name: "Mosaic Side Table", baseValue: 32, size: 2 },
    { name: "Brass Floor Lamp", baseValue: 38, size: 2 },
    { name: "Vintage Desk Fan", baseValue: 20, size: 1 },
    { name: "Ornate Picture Frame", baseValue: 14, size: 1 },
    { name: "Cast Iron Doorstop", baseValue: 8, size: 1 },
  ],
  collectibles: [
    { name: "Weird Ceramic Frog", baseValue: 5, size: 1 },
    { name: "Vintage Analog Camera", baseValue: 65, size: 1 },
    { name: "First Edition Paperback", baseValue: 30, size: 1 },
    { name: "Signed Baseball Card", baseValue: 80, size: 1 },
    { name: "Porcelain Figurine", baseValue: 25, size: 1 },
    { name: "Vinyl Record (Unknown)", baseValue: 10, size: 1 },
    { name: "Antique Pocket Watch", baseValue: 90, size: 1 },
    { name: "Old Movie Poster", baseValue: 35, size: 1 },
    { name: "Comic Book (Bagged)", baseValue: 45, size: 1 },
    { name: "Foreign Coin Collection", baseValue: 50, size: 1 },
    { name: "Vintage Snow Globe", baseValue: 15, size: 1 },
    { name: "Hand-Carved Chess Set", baseValue: 70, size: 2 },
    { name: "Antique Map (Framed)", baseValue: 55, size: 2 },
    { name: "Silver Cigarette Case", baseValue: 40, size: 1 },
    { name: "WWI Era Compass", baseValue: 60, size: 1 },
    { name: "Victorian Music Box", baseValue: 85, size: 1 },
    { name: "Tin Soldier Set", baseValue: 20, size: 1 },
    { name: "Jade Amulet", baseValue: 75, size: 1 },
    { name: "Brass Telescope", baseValue: 95, size: 2 },
    { name: "Crystal Decanter", baseValue: 48, size: 1 },
  ],
  misc: [
    { name: "Box of Random Cables", baseValue: 3, size: 1 },
    { name: "Bag of Buttons", baseValue: 2, size: 1 },
    { name: "Mysterious Locked Box", baseValue: 15, size: 1 },
    { name: "Stack of Postcards", baseValue: 6, size: 1 },
    { name: "Broken Music Box", baseValue: 12, size: 1 },
    { name: "Tarnished Silver Spoon", baseValue: 8, size: 1 },
    { name: "Hand-Painted Tile", baseValue: 10, size: 1 },
    { name: "Vintage Tin Lunchbox", baseValue: 18, size: 1 },
    { name: "Typewriter Ribbon", baseValue: 4, size: 1 },
    { name: "Leather-Bound Journal", baseValue: 20, size: 1 },
    { name: "Rusted Skeleton Key", baseValue: 7, size: 1 },
    { name: "Stained Glass Fragment", baseValue: 14, size: 1 },
    { name: "Wooden Pipe", baseValue: 11, size: 1 },
    { name: "Set of Dice (Bone)", baseValue: 9, size: 1 },
    { name: "Jar of Marbles", baseValue: 5, size: 1 },
    { name: "Velvet Pouch (Empty)", baseValue: 3, size: 1 },
    { name: "Antique Doorknob", baseValue: 6, size: 1 },
    { name: "Faded World Map", baseValue: 8, size: 1 },
    { name: "Bundle of Old Letters", baseValue: 12, size: 1 },
    { name: "Copper Wind Chime", baseValue: 16, size: 1 },
  ],
};

// ── Flavor Text Fragments ────────────────────
const FLAVOR_ADJECTIVES = [
  "Someone scratched initials into it.",
  "Smells faintly of lavender.",
  "There's a price sticker from 1997.",
  "Surprisingly heavy for its size.",
  "You can see fingerprints on it.",
  "It rattles when you shake it.",
  "A small crack runs along one side.",
  "It glows under UV light.",
  "Wrapped in old newspaper.",
  "Has a mysterious stain.",
  "Warm to the touch for some reason.",
  "A tiny spider crawls out when you pick it up.",
  "Previous owner's name is scratched underneath.",
  "Dusty but promising on closer look.",
  "The patina suggests real age.",
  "Could be a replica... or the real thing.",
  "No visible brand markings.",
  "Still has the original packaging.",
  "Slightly damp. Concerning.",
  'There\'s a note taped to it: "DO NOT SELL".',
  "The label is in a language you can't read.",
  "Part of it is held together with tape.",
  "It's heavier than it looks.",
  "Definitely been repainted at least once.",
  "You've seen this on a collector forum.",
];

const FLAVOR_ORIGINS = [
  "Found buried under a pile of magazines.",
  "Sitting on a dusty shelf in the back.",
  "The store owner seemed reluctant to sell it.",
  "Hidden behind a stack of old books.",
  "Displayed prominently in the window.",
  "Tucked into the bottom of a cardboard box.",
  "Hanging from a rusty nail on the wall.",
  "Sitting in a shopping cart with other junk.",
  "On a folding table in the parking lot.",
  "Wedged between two heavy appliances.",
];

// ── Item ID Counter ──────────────────────────
let _nextId = 1;
export function resetItemIdCounter(val = 1) {
  _nextId = val;
}

// ── Generate a single item ───────────────────
export function generateItem(options = {}) {
  const {
    categoryKey = null,
    rarityBias = 0, // shift in tier probability
    conditionBias = 0, // shift toward better conditions
    priceMult = 1.0,
    inflation = 1.0,
  } = options;

  // Pick category
  const catKeys = Object.keys(ITEM_TEMPLATES);
  const cat = categoryKey || pick(catKeys);
  const templates = ITEM_TEMPLATES[cat];
  const template = pick(templates);

  // Determine rarity (weighted with bias)
  const biasedRarities = RARITIES.map((r) => ({
    ...r,
    weight: Math.max(
      1,
      r.weight + (r.tier <= 1 ? -rarityBias * 5 : rarityBias * 3),
    ),
  }));
  const rarity = weightedPick(biasedRarities, (r) => r.weight);

  // Determine condition (weighted toward lower conditions, bias shifts up)
  const condWeights = CONDITIONS.map((c, i) => {
    let w = i <= 1 ? 30 : i === 2 ? 25 : i === 3 ? 12 : 3;
    w += conditionBias * (i * 2);
    return Math.max(1, w);
  });
  const condTotalW = condWeights.reduce((a, b) => a + b, 0);
  let cRoll = Math.random() * condTotalW;
  let condition = CONDITIONS[0];
  for (let i = 0; i < CONDITIONS.length; i++) {
    cRoll -= condWeights[i];
    if (cRoll <= 0) {
      condition = CONDITIONS[i];
      break;
    }
  }

  // Base value calculation
  const baseValue =
    template.baseValue *
    rarity.valueMult *
    condition.valueMult *
    priceMult *
    inflation;

  // Hidden modifiers
  const trendBoost = chance(15) ? roll(10, 40) / 100 : 0;
  const collectorInterest = chance(10 + rarity.tier * 5)
    ? roll(20, 60) / 100
    : 0;

  // Calculate demand (influenced by rarity and hidden mods)
  let demand = roll(20, 80);
  if (rarity.tier >= 2) demand += 15;
  if (rarity.tier >= 4) demand += 25;
  if (collectorInterest > 0) demand += 20;
  demand = clamp(demand, 0, 100);

  // Flavor text
  const flavor = pick(FLAVOR_ADJECTIVES) + " " + pick(FLAVOR_ORIGINS);

  // Size
  const size = SIZES.find((s) => s.id === template.size) || SIZES[0];

  return {
    id: _nextId++,
    name: template.name,
    category: cat,
    baseValue: Math.round(baseValue * 100) / 100,
    condition: condition.level,
    demand,
    rarity: rarity.tier,
    size: size.id,
    flavorText: flavor,
    hiddenMods: { trendBoost, collectorInterest },
    buyPrice: 0, // filled when purchased
    repaired: false,
    listedAt: null, // day listed for sale
    listingChannel: null,
  };
}

// ── Get the "true" market value of an item ───
export function getMarketValue(item, economyState = null) {
  let value = item.baseValue;

  // Apply hidden modifiers
  value *= 1 + item.hiddenMods.trendBoost;
  value *= 1 + item.hiddenMods.collectorInterest;

  // Economy-driven trend bonus
  if (economyState && economyState.currentTrends) {
    for (const trend of economyState.currentTrends) {
      if (trend.category === item.category) {
        value *= 1 + trend.bonus;
      }
    }
  }

  // Economy inflation
  if (economyState) {
    value *= economyState.inflationRate || 1.0;
  }

  return Math.round(value * 100) / 100;
}

// ── Get a store's asking price (marked up from base) ─
export function getStorePrice(item, storeMarkup = 1.0) {
  // Store price is a fraction of market value (stores underprice)
  const market = item.baseValue;
  const storeFraction = 0.4 + Math.random() * 0.35; // 40-75% of base
  return Math.round(market * storeFraction * storeMarkup * 100) / 100;
}

// ── Repair an item ───────────────────────────
export function getRepairCost(
  item,
  hasRepairBench = false,
  hasAutoRepair = false,
) {
  const cond = CONDITIONS[item.condition];
  if (cond.repairCostPct === 0) return 0; // already Good or Mint
  let cost = item.baseValue * cond.repairCostPct;
  if (hasRepairBench) cost *= 0.6;
  if (hasAutoRepair) cost *= 0.5;
  return Math.round(cost * 100) / 100;
}

export function repairItem(item) {
  // Repair raises condition to Good (3)
  if (item.condition < 3) {
    const oldMult = CONDITIONS[item.condition].valueMult;
    item.condition = 3;
    item.repaired = true;
    // Reverse old condition multiplier, then apply new one
    item.baseValue =
      Math.round((item.baseValue / oldMult) * CONDITIONS[3].valueMult * 100) /
      100;
  }
  return item;
}

// ── Get display info for an item ─────────────
export function getItemDisplay(item) {
  const rarity = RARITIES[item.rarity];
  const condition = CONDITIONS[item.condition];
  const category = CATEGORIES[item.category];
  const size = SIZES[item.size - 1];

  return {
    name: item.name,
    rarity: rarity.name,
    rarityColor: rarity.color,
    raritySymbol: rarity.symbol,
    condition: condition.name,
    conditionIcon: condition.icon,
    category: category.name,
    categoryIcon: category.icon,
    categoryColor: category.color,
    size: size.name,
    sizeSlots: size.slots,
  };
}

// ── Check if player can see hidden value ─────
export function getValueEstimate(
  item,
  marketKnowledge = 1,
  hasScanner = false,
  economyState = null,
) {
  const trueValue = getMarketValue(item, economyState);
  const accuracy = Math.min(
    0.95,
    0.3 + marketKnowledge * 0.08 + (hasScanner ? 0.25 : 0),
  );
  const variance = trueValue * (1 - accuracy);
  const low = Math.max(1, Math.round((trueValue - variance) * 100) / 100);
  const high = Math.round((trueValue + variance) * 100) / 100;
  return { low, high, accuracy };
}

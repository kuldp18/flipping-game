// ============================================
// UPGRADES.JS — Shop Upgrades & Cosmetics
// ============================================

import { formatCash } from "./items.js";

// ── Upgrade Definitions ──────────────────────
export const UPGRADES = [
  // ─── Gameplay Upgrades ───
  {
    id: "inventory_1",
    name: "Bigger Backpack",
    description: "+3 inventory slots.",
    category: "gameplay",
    icon: "🎒",
    cost: 80,
    maxLevel: 1,
    effect: { inventorySlots: 3 },
    requires: null,
  },
  {
    id: "inventory_2",
    name: "Storage Locker",
    description: "+5 inventory slots.",
    category: "gameplay",
    icon: "🗄️",
    cost: 250,
    maxLevel: 1,
    effect: { inventorySlots: 5 },
    requires: "inventory_1",
  },
  {
    id: "inventory_3",
    name: "Cargo Van",
    description: "+8 inventory slots. Now you're serious.",
    category: "gameplay",
    icon: "🚐",
    cost: 800,
    maxLevel: 1,
    effect: { inventorySlots: 8 },
    requires: "inventory_2",
  },
  {
    id: "repair_bench",
    name: "Repair Bench",
    description: "Unlock item repairs. Fix broken items for profit.",
    category: "gameplay",
    icon: "🔧",
    cost: 120,
    maxLevel: 1,
    effect: { unlockRepair: true },
    requires: null,
  },
  {
    id: "repair_tools",
    name: "Pro Repair Tools",
    description: "Reduce repair costs by 40%.",
    category: "gameplay",
    icon: "🛠️",
    cost: 350,
    maxLevel: 1,
    effect: { repairDiscount: 0.4 },
    requires: "repair_bench",
  },
  {
    id: "market_scanner",
    name: "Market Scanner",
    description: "Reveals estimated value ranges on items.",
    category: "gameplay",
    icon: "📡",
    cost: 200,
    maxLevel: 1,
    effect: { unlockScanner: true },
    requires: null,
  },
  {
    id: "negotiation_boost",
    name: "Smooth Talker Guide",
    description: "+8 bonus to all negotiation checks.",
    category: "gameplay",
    icon: "🗣️",
    cost: 150,
    maxLevel: 1,
    effect: { negotiationBonus: 8 },
    requires: null,
  },
  {
    id: "fast_listings",
    name: "Priority Shipping",
    description: "Online & auction sales complete 1 day faster.",
    category: "gameplay",
    icon: "📦",
    cost: 300,
    maxLevel: 1,
    effect: { fasterSales: 1 },
    requires: null,
  },
  {
    id: "trend_analyzer",
    name: "Trend Analyzer",
    description: "See upcoming market trends before they hit.",
    category: "gameplay",
    icon: "📊",
    cost: 500,
    maxLevel: 1,
    effect: { unlockTrends: true },
    requires: "market_scanner",
  },
  {
    id: "energy_drink",
    name: "Energy Drink Subscription",
    description: "+3 max energy per day.",
    category: "gameplay",
    icon: "⚡",
    cost: 180,
    maxLevel: 1,
    effect: { maxEnergy: 3 },
    requires: null,
  },
  {
    id: "energy_boost_2",
    name: "Fitness Routine",
    description: "+4 more max energy per day.",
    category: "gameplay",
    icon: "💪",
    cost: 450,
    maxLevel: 1,
    effect: { maxEnergy: 4 },
    requires: "energy_drink",
  },
  {
    id: "lucky_charm",
    name: "Lucky Rabbit's Foot",
    description: "+2 Luck permanently.",
    category: "gameplay",
    icon: "🍀",
    cost: 400,
    maxLevel: 1,
    effect: { luck: 2 },
    requires: null,
  },
  {
    id: "intuition_boost",
    name: "Antique Appraisal Course",
    description: "+2 Intuition permanently.",
    category: "gameplay",
    icon: "🎓",
    cost: 350,
    maxLevel: 1,
    effect: { intuition: 2 },
    requires: null,
  },

  // ─── Cosmetic Upgrades ───
  {
    id: "theme_neon",
    name: "Neon Nights Theme",
    description: "Hot pink and electric blue palette.",
    category: "cosmetic",
    icon: "🌃",
    cost: 100,
    maxLevel: 1,
    effect: { theme: "neon" },
    requires: null,
  },
  {
    id: "theme_forest",
    name: "Forest Green Theme",
    description: "Earthy greens and warm browns.",
    category: "cosmetic",
    icon: "🌲",
    cost: 100,
    maxLevel: 1,
    effect: { theme: "forest" },
    requires: null,
  },
  {
    id: "theme_amber",
    name: "Amber Terminal Theme",
    description: "Classic amber-on-black terminal look.",
    category: "cosmetic",
    icon: "🖥️",
    cost: 100,
    maxLevel: 1,
    effect: { theme: "amber" },
    requires: null,
  },
  {
    id: "theme_ocean",
    name: "Deep Ocean Theme",
    description: "Cool blues and aqua highlights.",
    category: "cosmetic",
    icon: "🌊",
    cost: 100,
    maxLevel: 1,
    effect: { theme: "ocean" },
    requires: null,
  },
];

// ── Check if player owns an upgrade ──────────
export function hasUpgrade(player, upgradeId) {
  return !!player.upgrades[upgradeId];
}

// ── Check if prerequisites are met ───────────
export function canPurchaseUpgrade(player, upgradeId) {
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return { canBuy: false, reason: "Upgrade not found." };
  if (hasUpgrade(player, upgradeId))
    return { canBuy: false, reason: "Already owned." };
  if (upgrade.requires && !hasUpgrade(player, upgrade.requires)) {
    const req = UPGRADES.find((u) => u.id === upgrade.requires);
    return {
      canBuy: false,
      reason: `Requires: ${req?.name || upgrade.requires}`,
    };
  }
  if (player.cash < upgrade.cost)
    return { canBuy: false, reason: `Need ${formatCash(upgrade.cost)}.` };
  return { canBuy: true, reason: "" };
}

// ── Purchase an upgrade ──────────────────────
export function purchaseUpgrade(player, upgradeId) {
  const check = canPurchaseUpgrade(player, upgradeId);
  if (!check.canBuy) return { success: false, message: check.reason };

  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  player.cash = Math.round((player.cash - upgrade.cost) * 100) / 100;
  player.upgrades[upgradeId] = true;

  // Apply effects
  applyUpgradeEffect(player, upgrade.effect);

  return {
    success: true,
    message: `Purchased ${upgrade.name}!`,
    upgrade,
  };
}

// ── Apply upgrade effect to player ───────────
function applyUpgradeEffect(player, effect) {
  if (effect.inventorySlots) player.inventorySlots += effect.inventorySlots;
  if (effect.maxEnergy) player.maxEnergy += effect.maxEnergy;
  if (effect.luck) player.skills.luck += effect.luck;
  if (effect.intuition) player.skills.intuition += effect.intuition;
  if (effect.theme) player.theme = effect.theme;
  // Other effects are checked dynamically (unlockRepair, unlockScanner, etc.)
}

// ── Get upgrade categories for display ───────
export function getUpgradesByCategory() {
  const gameplay = UPGRADES.filter((u) => u.category === "gameplay");
  const cosmetic = UPGRADES.filter((u) => u.category === "cosmetic");
  return { gameplay, cosmetic };
}

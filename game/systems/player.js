// ============================================
// PLAYER.JS — Player State Management
// ============================================

import { CATEGORIES, SIZES, clamp } from "./items.js";

// ── Player Titles (progression milestones) ───
export const TITLES = [
  { name: "Street Hustler", minProfit: 0 },
  { name: "Garage Warrior", minProfit: 500 },
  { name: "Thrift Lord", minProfit: 2000 },
  { name: "Market Maven", minProfit: 10000 },
  { name: "Flip King", minProfit: 50000 },
  { name: "Regional Reseller", minProfit: 200000 },
  { name: "Legendary Flipper", minProfit: 1000000 },
];

// ── Create a new player state ────────────────
export function createPlayer() {
  return {
    cash: 50.0,
    day: 1,
    energy: 10,
    maxEnergy: 10,
    skills: {
      charisma: 1,
      marketKnowledge: 1,
      luck: 1,
      intuition: 1,
    },
    inventory: [],
    inventorySlots: 8,
    upgrades: {},
    reputation: 0,
    totalProfit: 0,
    totalSpent: 0,
    totalEarned: 0,
    itemsFlipped: 0,
    itemsBought: 0,
    bestFlip: 0,
    pendingSales: [], // { item, channel, listedDay, completionDay, expectedPrice }
    theme: "default",
    storesVisited: {}, // { storeId: lastVisitDay }
    statsHistory: [], // daily summaries
  };
}

// ── Get player's current title ───────────────
export function getTitle(totalProfit) {
  let title = TITLES[0];
  for (const t of TITLES) {
    if (totalProfit >= t.minProfit) title = t;
  }
  return title;
}

// ── Get next title milestone ─────────────────
export function getNextTitle(totalProfit) {
  for (const t of TITLES) {
    if (totalProfit < t.minProfit) return t;
  }
  return null; // maxed out
}

// ── Inventory helpers ────────────────────────
export function getUsedSlots(inventory) {
  return inventory.reduce(
    (sum, item) => sum + (SIZES[item.size - 1]?.slots || 1),
    0,
  );
}

export function getFreeSlots(player) {
  return player.inventorySlots - getUsedSlots(player.inventory);
}

export function canAddItem(player, item) {
  const itemSlots = SIZES[item.size - 1]?.slots || 1;
  return getFreeSlots(player) >= itemSlots;
}

export function addItemToInventory(player, item) {
  if (!canAddItem(player, item)) return false;
  player.inventory.push({ ...item });
  return true;
}

export function removeItemFromInventory(player, itemId) {
  const idx = player.inventory.findIndex((i) => i.id === itemId);
  if (idx === -1) return null;
  return player.inventory.splice(idx, 1)[0];
}

// ── Energy management ────────────────────────
export function useEnergy(player, amount) {
  if (player.energy < amount) return false;
  player.energy -= amount;
  return true;
}

export function restoreEnergy(player) {
  player.energy = player.maxEnergy;
}

// ── Cash management ──────────────────────────
export function spendCash(player, amount) {
  if (player.cash < amount) return false;
  player.cash = Math.round((player.cash - amount) * 100) / 100;
  player.totalSpent = Math.round((player.totalSpent + amount) * 100) / 100;
  return true;
}

export function earnCash(player, amount) {
  player.cash = Math.round((player.cash + amount) * 100) / 100;
  player.totalEarned = Math.round((player.totalEarned + amount) * 100) / 100;
}

// ── Record a successful flip ─────────────────
export function recordFlip(player, buyPrice, sellPrice) {
  const profit = sellPrice - buyPrice;
  player.totalProfit = Math.round((player.totalProfit + profit) * 100) / 100;
  player.itemsFlipped++;
  if (profit > player.bestFlip) {
    player.bestFlip = Math.round(profit * 100) / 100;
  }
  // Reputation gain
  if (profit > 0) {
    player.reputation += Math.ceil(profit / 20);
  }
}

// ── Advance to next day ──────────────────────
export function advanceDay(player) {
  player.day++;
  restoreEnergy(player);

  // Process pending sales
  const completed = [];
  const remaining = [];
  for (const sale of player.pendingSales) {
    if (player.day >= sale.completionDay) {
      completed.push(sale);
    } else {
      remaining.push(sale);
    }
  }
  player.pendingSales = remaining;

  return completed; // caller handles cash + notifications
}

// ── Skill check (returns { success, roll, threshold }) ──
export function skillCheck(player, skillName, difficulty, bonusMod = 0) {
  const skillValue = player.skills[skillName] || 1;
  const luckBonus = player.skills.luck * 0.5;
  const playerRoll = Math.random() * 100;
  const threshold = difficulty - skillValue * 6 - luckBonus - bonusMod;
  const success = playerRoll >= Math.max(5, threshold);
  return {
    success,
    roll: Math.round(playerRoll),
    threshold: Math.round(Math.max(5, threshold)),
    margin: Math.round(playerRoll - Math.max(5, threshold)),
  };
}

// ── Day Summary ──────────────────────────────
export function createDaySummary(
  player,
  dayEarnings,
  daySpending,
  salesCompleted,
) {
  return {
    day: player.day,
    cash: player.cash,
    earned: dayEarnings,
    spent: daySpending,
    salesCompleted,
    inventoryCount: player.inventory.length,
    pendingSales: player.pendingSales.length,
  };
}

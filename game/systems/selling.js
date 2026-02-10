// ============================================
// SELLING.JS — Selling Channels & Sales Logic
// ============================================

import { getMarketValue, chance, pick } from "./items.js";
import { earnCash, recordFlip } from "./player.js";

// ── Selling Channels ─────────────────────────
export const CHANNELS = [
  {
    id: "street",
    name: "Street Buyer",
    description: "Quick cash, low margins. They always want a deal.",
    icon: "🧑",
    speed: 0,
    feePercent: 0,
    priceRange: [0.45, 0.65],
    minRep: 0,
    risk: 0,
    flavor: "A guy in a hoodie waves you over.",
  },
  {
    id: "online",
    name: "Online Listing",
    description: "Post it online. Good margins, takes a few days.",
    icon: "💻",
    speed: 2,
    feePercent: 12,
    priceRange: [0.8, 1.15],
    minRep: 0,
    risk: 5,
    flavor: "Listed with 3 photos and a catchy headline.",
  },
  {
    id: "collector",
    name: "Collector Network",
    description: "Very picky buyers who pay premium for the right item.",
    icon: "🔍",
    speed: 3,
    feePercent: 5,
    priceRange: [1.2, 2.5],
    minRep: 15,
    risk: 2,
    requiresRarity: 2,
    flavor: "Sent to the collector mailing list.",
  },
  {
    id: "bulk",
    name: "Bulk Reseller",
    description: "Sell multiple items at once. Volume over value.",
    icon: "📦",
    speed: 0,
    feePercent: 0,
    priceRange: [0.25, 0.4],
    minRep: 5,
    risk: 0,
    flavor: "They pull up in a van and take everything.",
  },
  {
    id: "auction",
    name: "Auction Event",
    description: "High volatility. Could be a jackpot or a dud.",
    icon: "🔨",
    speed: 1,
    feePercent: 18,
    priceRange: [0.5, 2.0],
    minRep: 20,
    risk: 8,
    flavor: "Going once... going twice...",
  },
];

export function getAvailableChannels(player) {
  return CHANNELS.filter((ch) => player.reputation >= ch.minRep);
}

export function canSellOnChannel(item, channel) {
  if (channel.requiresRarity && item.rarity < channel.requiresRarity) {
    return false;
  }
  return true;
}

function applyFee(rawPrice, channel) {
  if (channel.feePercent <= 0) return rawPrice;
  return rawPrice * (1 - channel.feePercent / 100);
}

function getMarginAdjustment(item, channel, targetMarginPct = 0) {
  const clamped = Math.max(-40, Math.min(180, Number(targetMarginPct) || 0));
  const marketValue = getMarketValue(item);
  const buyPrice = Math.max(0.01, item.buyPrice || marketValue * 0.7);
  const targetPrice = buyPrice * (1 + clamped / 100);

  const baseline = (channel.priceRange[0] + channel.priceRange[1]) / 2;
  const baselineAfterFee = applyFee(marketValue * baseline, channel);

  const pressure = baselineAfterFee <= 0 ? 0 : (targetPrice - baselineAfterFee) / baselineAfterFee;

  return {
    marginPct: clamped,
    pressure,
    targetPrice,
  };
}

function getSaleChance(channel, pressure, player) {
  const intuition = player?.skills?.intuition || 1;
  const charisma = player?.skills?.charisma || 1;
  const skillBoost = intuition * 0.02 + charisma * 0.015;
  const patienceBonus = channel.speed > 0 ? 0.08 : 0;
  const baseChance = 0.88 - channel.risk / 140 + skillBoost + patienceBonus;

  const pressurePenalty = pressure > 0 ? pressure * 0.55 : pressure * 0.12;
  const finalChance = Math.max(0.12, Math.min(0.98, baseChance - pressurePenalty));
  return finalChance;
}

export function getSellPriceEstimate(item, channel, economy = null, targetMarginPct = 0) {
  const marketValue = getMarketValue(item, economy);
  const [minF, maxF] = channel.priceRange;
  let low = applyFee(marketValue * minF, channel);
  let high = applyFee(marketValue * maxF, channel);

  const { pressure, targetPrice, marginPct } = getMarginAdjustment(
    item,
    channel,
    targetMarginPct,
  );
  const pricingBias = Math.max(0.65, Math.min(1.6, 1 + pressure * 0.4));
  low *= pricingBias;
  high *= pricingBias;

  const saleChance = getSaleChance(channel, pressure, null);

  return {
    low: Math.round(Math.max(0.5, low) * 100) / 100,
    high: Math.round(Math.max(1.0, high) * 100) / 100,
    targetPrice: Math.round(Math.max(0.5, targetPrice) * 100) / 100,
    saleChance: Math.round(saleChance * 100),
    marginPct,
  };
}

export function listItemForSale(player, item, channel, economy = null, options = {}) {
  const targetMarginPct = options.targetMarginPct ?? 0;
  const marketValue = getMarketValue(item, economy);
  const { pressure, targetPrice, marginPct } = getMarginAdjustment(
    item,
    channel,
    targetMarginPct,
  );
  const saleChance = getSaleChance(channel, pressure, player);

  const randomFactor = 0.85 + Math.random() * 0.35;
  const expectedPrice = Math.round(
    Math.max(0.5, applyFee(targetPrice * randomFactor, channel)) * 100,
  ) / 100;

  if (channel.speed === 0) {
    const listedButNoBuyer = Math.random() > saleChance;
    if (listedButNoBuyer) {
      return {
        instant: true,
        success: false,
        price: 0,
        message:
          marginPct > 40
            ? "Your ask was too aggressive. No one bit today."
            : "No buyers closed today. Try another channel or adjust margin.",
        item,
        channel: channel.id,
        returnedToInventory: true,
      };
    }

    const scammed = channel.risk > 0 && chance(channel.risk);
    if (scammed) {
      return {
        instant: true,
        success: false,
        price: 0,
        message: "SCAM! The buyer vanished with your item and didn't pay!",
        item,
        channel: channel.id,
        returnedToInventory: false,
      };
    }

    return {
      instant: true,
      success: true,
      price: expectedPrice,
      message: `Sold for $${expectedPrice.toFixed(2)}!`,
      item,
      channel: channel.id,
      marginPct,
    };
  }

  const completionDay = player.day + channel.speed;
  const pendingSale = {
    item: { ...item },
    channelId: channel.id,
    channelName: channel.name,
    listedDay: player.day,
    completionDay,
    expectedPrice,
    risk: channel.risk,
    saleChance,
    marginPct,
  };

  player.pendingSales.push(pendingSale);

  return {
    instant: false,
    success: true,
    price: expectedPrice,
    completionDay,
    message: `Listed on ${channel.name} at ${marginPct >= 0 ? "+" : ""}${marginPct}% margin. Expected ~$${expectedPrice.toFixed(2)} in ${channel.speed} day(s).`,
    item,
    channel: channel.id,
    saleChance,
    marginPct,
  };
}

export function processCompletedSales(completedSales, player) {
  const results = [];

  for (const sale of completedSales) {
    const noBuyer = sale.saleChance !== undefined && Math.random() > sale.saleChance;
    if (noBuyer) {
      player.inventory.push({ ...sale.item, relisted: true });
      results.push({
        success: false,
        item: sale.item,
        channel: sale.channelName,
        message: `${sale.item.name} did not sell at your ask. Item returned to inventory.`,
        earnings: 0,
      });
      continue;
    }

    const scammed = sale.risk > 0 && chance(sale.risk);
    if (scammed) {
      results.push({
        success: false,
        item: sale.item,
        channel: sale.channelName,
        message: `Return/scam on ${sale.item.name}! No payment received.`,
        earnings: 0,
      });
      continue;
    }

    const earnings = sale.expectedPrice;
    earnCash(player, earnings);
    recordFlip(player, sale.item.buyPrice, earnings);

    results.push({
      success: true,
      item: sale.item,
      channel: sale.channelName,
      message: `${sale.item.name} sold on ${sale.channelName} for $${earnings.toFixed(2)}!`,
      earnings,
    });
  }

  return results;
}

const SELL_SUCCESS_FLAVORS = [
  "Ka-ching! Another flip in the books.",
  "The buyer looked thrilled. You got the better deal.",
  "Money changes hands. The hustle continues.",
  "Clean flip. Solid margin.",
  "You read the market perfectly.",
];

const SELL_FAIL_FLAVORS = [
  "The lead went cold. Maybe next time.",
  "Bad luck. The deal fell through.",
  "Market's rough today.",
  "Timing wasn't right for this one.",
  "Some flips miss. Keep moving.",
];

export function getSellFlavor(success) {
  return success ? pick(SELL_SUCCESS_FLAVORS) : pick(SELL_FAIL_FLAVORS);
}

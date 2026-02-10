// ============================================
// SELLING.JS — Selling Channels & Sales Logic
// ============================================

import { getMarketValue, chance, pick, clamp } from "./items.js";
import { earnCash, recordFlip } from "./player.js";

// ── Selling Channels ─────────────────────────
export const CHANNELS = [
  {
    id: "street",
    name: "Street Buyer",
    description: "Quick cash, low margins. They always want a deal.",
    icon: "🧑",
    speed: 0, // instant
    feePercent: 0,
    priceRange: [0.45, 0.65], // fraction of market value
    minRep: 0,
    risk: 0,
    flavor: "A guy in a hoodie waves you over.",
  },
  {
    id: "online",
    name: "Online Listing",
    description: "Post it online. Good margins, takes a few days.",
    icon: "💻",
    speed: 2, // days to complete
    feePercent: 12,
    priceRange: [0.8, 1.15],
    minRep: 0,
    risk: 5, // % chance of scam/return
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
    requiresRarity: 2, // minimum rarity tier
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

// ── Check if a channel is available ──────────
export function getAvailableChannels(player) {
  return CHANNELS.filter((ch) => player.reputation >= ch.minRep);
}

// ── Check if an item qualifies for a channel ─
export function canSellOnChannel(item, channel) {
  if (channel.requiresRarity && item.rarity < channel.requiresRarity) {
    return false;
  }
  return true;
}

// ── Calculate expected sell price ────────────
export function getExpectedSellPrice(item, channel, economy = null) {
  const marketValue = getMarketValue(item, economy);
  const [minF, maxF] = channel.priceRange;
  const fraction = minF + Math.random() * (maxF - minF);
  let price = marketValue * fraction;

  // Apply listing fee
  if (channel.feePercent > 0) {
    price *= 1 - channel.feePercent / 100;
  }

  return Math.round(Math.max(0.5, price) * 100) / 100;
}

// ── Get a price estimate range for display ───
export function getSellPriceEstimate(item, channel, economy = null) {
  const marketValue = getMarketValue(item, economy);
  const [minF, maxF] = channel.priceRange;
  let low = marketValue * minF;
  let high = marketValue * maxF;

  if (channel.feePercent > 0) {
    const feeMult = 1 - channel.feePercent / 100;
    low *= feeMult;
    high *= feeMult;
  }

  return {
    low: Math.round(Math.max(0.5, low) * 100) / 100,
    high: Math.round(Math.max(1.0, high) * 100) / 100,
  };
}

// ── List an item for sale ────────────────────
function getChannelTargetMargin(channel) {
  const avgRange = (channel.priceRange[0] + channel.priceRange[1]) / 2;
  return Math.round((avgRange - 1) * 100);
}

export function getSalePreview(player, item, channel, marginPercent, economy = null) {
  const marketValue = getMarketValue(item, economy);
  const feeMultiplier = 1 - channel.feePercent / 100;
  const askMultiplier = 1 + marginPercent / 100;
  const requestedPrice = Math.max(0.5, marketValue * askMultiplier);

  const channelTargetMargin = getChannelTargetMargin(channel);
  const marginDelta = marginPercent - channelTargetMargin;
  const statsBoost =
    player.skills.charisma * 2.4 +
    player.skills.marketKnowledge * 1.8 +
    player.skills.intuition * 1.2;
  const riskPenalty = channel.risk * 0.6;
  const baseChance = channel.speed === 0 ? 84 : 75;
  const successChance = clamp(
    Math.round(baseChance + statsBoost - riskPenalty - Math.max(0, marginDelta) * 1.1 + Math.max(0, -marginDelta) * 0.45),
    8,
    97,
  );

  const minMarket = marketValue * Math.max(0.2, channel.priceRange[0]);
  const maxMarket = marketValue * Math.max(channel.priceRange[1], askMultiplier * 1.1);
  const expectedOnSuccess = clamp(requestedPrice, minMarket, maxMarket) * feeMultiplier;

  return {
    successChance,
    expectedOnSuccess: Math.round(expectedOnSuccess * 100) / 100,
    requestedPrice: Math.round(requestedPrice * 100) / 100,
    channelTargetMargin,
  };
}

export function listItemForSale(
  player,
  item,
  channel,
  marginPercent = 0,
  economy = null,
) {
  const preview = getSalePreview(
    player,
    item,
    channel,
    marginPercent,
    economy,
  );
  const expectedPrice = preview.expectedOnSuccess;
  const successRoll = Math.random() * 100;
  const success = successRoll <= preview.successChance;

  if (channel.speed === 0) {
    // Instant sale
    const scammed = success && channel.risk > 0 && chance(channel.risk);
    if (!success) {
      return {
        instant: true,
        success: false,
        price: 0,
        message: `No deal — buyers balked at ${marginPercent}% margin.`,
        item,
        channel: channel.id,
        marginPercent,
        successChance: preview.successChance,
      };
    }

    if (scammed) {
      return {
        instant: true,
        success: false,
        price: 0,
        message: "SCAM! The buyer vanished with your item and didn't pay!",
        item,
        channel: channel.id,
      };
    }

    return {
      instant: true,
      success: true,
      price: expectedPrice,
      message: `Sold for $${expectedPrice.toFixed(2)} at ${marginPercent}% margin!`,
      item,
      channel: channel.id,
      marginPercent,
      successChance: preview.successChance,
    };
  }

  // Pending sale
  const completionDay = player.day + channel.speed;
  const pendingSale = {
    item: { ...item },
    channelId: channel.id,
    channelName: channel.name,
    listedDay: player.day,
    completionDay,
    expectedPrice,
    successChance: preview.successChance,
    marginPercent,
    risk: channel.risk,
  };

  player.pendingSales.push(pendingSale);

  return {
    instant: false,
    success: true,
    price: expectedPrice,
    completionDay,
    message: `Listed on ${channel.name} at ${marginPercent}% margin. ~${preview.successChance}% chance to close for ~$${expectedPrice.toFixed(2)} in ${channel.speed} day(s).`,
    item,
    channel: channel.id,
    marginPercent,
    successChance: preview.successChance,
  };
}

// ── Process completed sales (called on day advance) ──
export function processCompletedSales(completedSales, player) {
  const results = [];

  for (const sale of completedSales) {
    const sold = Math.random() * 100 <= (sale.successChance || 60);
    if (!sold) {
      results.push({
        success: false,
        item: sale.item,
        channel: sale.channelName,
        message: `${sale.item.name} expired unsold at ${sale.marginPercent || 0}% margin.`,
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

    // Successful sale
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

// ── Sell result flavor text ──────────────────
const SELL_SUCCESS_FLAVORS = [
  "Ka-ching! Another flip in the books.",
  "The buyer looked thrilled. You got the better deal.",
  "Money changes hands. The hustle continues.",
  "Smooth transaction. You're getting good at this.",
  "Sold! Time to reinvest.",
];

const SELL_FAIL_FLAVORS = [
  "That didn't go as planned...",
  "Sometimes the flip flips you.",
  "A hard lesson in the resale game.",
];

export function getSellFlavor(success) {
  return success ? pick(SELL_SUCCESS_FLAVORS) : pick(SELL_FAIL_FLAVORS);
}

// ============================================
// MAIN.JS — Game Controller & State Machine
// ============================================

import {
  createPlayer,
  advanceDay,
  spendCash,
  earnCash,
  addItemToInventory,
  removeItemFromInventory,
  recordFlip,
  canAddItem,
  getFreeSlots,
} from "./systems/player.js";
import { createEconomy, updateEconomy } from "./systems/economy.js";
import {
  generateItem,
  getRepairCost,
  repairItem,
  getMarketValue,
  formatCash,
  resetItemIdCounter,
} from "./systems/items.js";
import {
  STORES,
  generateStoreInventory,
  canVisitStore,
} from "./systems/stores.js";
import {
  negotiate,
  getNegotiationSkillGain,
  applySkillGains,
} from "./systems/negotiation.js";
import {
  CHANNELS,
  getAvailableChannels,
  canSellOnChannel,
  listItemForSale,
  processCompletedSales,
  getSellFlavor,
} from "./systems/selling.js";
import { hasUpgrade, purchaseUpgrade } from "./systems/upgrades.js";
import {
  checkForEvents,
  cleanupExpiredEvents,
  getEventEffects,
} from "./systems/events.js";
import { saveGame, loadGame, hasSave, deleteSave } from "./systems/save.js";
import {
  initUI,
  renderHeader,
  renderTitleScreen,
  renderHubScreen,
  renderStoreSelection,
  renderStoreBrowse,
  renderNegotiation,
  renderNegotiationResult,
  renderInventory,
  renderSellScreen,
  renderShopScreen,
  renderStatsScreen,
  renderDayEndSummary,
  showNotification,
  showConfirm,
  showSellResult,
  showEventPopup,
  animateCashChange,
  screenTransition,
  applyTheme,
} from "./systems/ui.js";
import { playSfx, setSoundEnabled, isSoundEnabled } from "./systems/audio.js";

// ── Game State ───────────────────────────────
let state = {
  player: null,
  economy: null,
  activeEvents: [],
  currentScreen: "title",
  currentStoreId: null,
  currentStoreItems: [],
  dayEarnings: 0,
  daySpending: 0,
};

// ── Initialize ───────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initUI();
  showTitleScreen();
});

// ── Keyboard Navigation ──────────────────────
document.addEventListener("keydown", (e) => {
  // Number keys for quick actions on hub
  if (state.currentScreen === "hub") {
    switch (e.key) {
      case "1":
        document.getElementById("btn-stores")?.click();
        break;
      case "2":
        document.getElementById("btn-inventory")?.click();
        break;
      case "3":
        document.getElementById("btn-sell")?.click();
        break;
      case "4":
        document.getElementById("btn-shop")?.click();
        break;
      case "5":
        document.getElementById("btn-stats")?.click();
        break;
      case "r":
      case "R":
        document.getElementById("btn-rest")?.click();
        break;
    }
  }
  // Escape to go back
  if (e.key === "Escape") {
    document.getElementById("btn-back")?.click();
  }
});

// ── Screen Navigation ────────────────────────


function refreshHeader() {
  renderHeader(state.player, state.economy);
  const btn = document.getElementById("btn-sound");
  if (btn) {
    btn.textContent = isSoundEnabled() ? "🔊 SFX" : "🔇 SFX";
    btn.onclick = () => {
      const next = !isSoundEnabled();
      setSoundEnabled(next);
      btn.textContent = next ? "🔊 SFX" : "🔇 SFX";
      playSfx("click");
    };
  }
}


function showTitleScreen() {
  state.currentScreen = "title";
  document.getElementById("header-bar").style.display = "none";
  renderTitleScreen(startNewGame, continueGame);
}

function startNewGame() {
  resetItemIdCounter();
  state.player = createPlayer();
  state.economy = createEconomy();
  state.activeEvents = [];
  state.dayEarnings = 0;
  state.daySpending = 0;
  document.getElementById("header-bar").style.display = "";
  applyTheme("default");
  autoSave();
  showHub();
}

function continueGame() {
  const saved = loadGame();
  if (!saved) {
    showNotification("No save found! Starting new game.", "error");
    startNewGame();
    return;
  }
  state.player = saved.player;
  state.economy = saved.economy || createEconomy();
  state.activeEvents = saved.activeEvents || [];
  state.dayEarnings = 0;
  state.daySpending = 0;
  document.getElementById("header-bar").style.display = "";
  applyTheme(state.player.theme || "default");
  showHub();
}

function showHub() {
  state.currentScreen = "hub";
  state.currentStoreId = null;
  state.currentStoreItems = [];
  refreshHeader();
  screenTransition(() => {
    renderHubScreen(state.player, state.economy, state.activeEvents, {
      onStores: showStoreSelection,
      onInventory: showInventory,
      onSell: showSellScreen,
      onShop: showShopScreen,
      onStats: showStatsScreen,
      onRest: doRest,
    });
  });
}

// ── Store Flow ───────────────────────────────

function showStoreSelection() {
  state.currentScreen = "storeSelect";
  screenTransition(() => {
    renderStoreSelection(state.player, {
      onBack: showHub,
      onSelectStore: enterStore,
    });
  });
}

function enterStore(storeId) {
  const store = STORES.find((s) => s.id === storeId);
  if (!store) return;

  // Check energy
  if (state.player.energy < store.energyCost) {
    showNotification("Not enough energy! Rest to restore.", "error");
    return;
  }

  // Check restock
  const unlockedStoreIds = STORES.filter((s) => state.player.reputation >= s.unlockRep).map((s) => s.id);
  if (!canVisitStore(storeId, state.player.day, state.player.storesVisited, unlockedStoreIds)) {
    showNotification("Store hasn't restocked yet.", "error");
    return;
  }

  // Spend energy
  state.player.energy -= store.energyCost;

  // Mark visit
  state.player.storesVisited[storeId] = state.player.day;

  // Generate inventory
  state.currentStoreId = storeId;
  state.currentStoreItems = generateStoreInventory(store, state.economy);

  state.currentScreen = "storeBrowse";
  refreshHeader();
  screenTransition(() => {
    renderStoreBrowse(
      store,
      state.currentStoreItems,
      state.player,
      state.economy,
      {
        onBack: showStoreSelection,
        onSelectItem: (index) => showNegotiation(index),
      },
    );
  });
}

function showNegotiation(itemIndex) {
  const item = state.currentStoreItems[itemIndex];
  if (!item) return;
  const store = STORES.find((s) => s.id === state.currentStoreId);

  state.currentScreen = "negotiation";
  state._negotiatingItemIndex = itemIndex;

  screenTransition(() => {
    renderNegotiation(item, store, state.player, {
      onBack: () => {
        const store = STORES.find((s) => s.id === state.currentStoreId);
        state.currentScreen = "storeBrowse";
        renderStoreBrowse(
          store,
          state.currentStoreItems,
          state.player,
          state.economy,
          {
            onBack: showStoreSelection,
            onSelectItem: (index) => showNegotiation(index),
          },
        );
      },
      onNegotiate: (strategyId) => doNegotiate(itemIndex, strategyId),
    });
  });
}

function doNegotiate(itemIndex, strategyId) {
  const item = state.currentStoreItems[itemIndex];
  const store = STORES.find((s) => s.id === state.currentStoreId);
  if (!item || !store) return;

  const result = negotiate(
    state.player,
    item,
    strategyId,
    store.negotiationDifficulty,
  );

  // Apply skill gains
  const gains = getNegotiationSkillGain(strategyId, result.success);
  applySkillGains(state.player, gains);

  // Update store item price if changed
  if (result.priceChanged) {
    item.storePrice = result.finalPrice;
  }

  // Remove item from store if bluff failed
  if (result.itemRemoved) {
    state.currentStoreItems.splice(itemIndex, 1);
  }

  state.currentScreen = "negotiationResult";
  screenTransition(() => {
    renderNegotiationResult(result, item, state.player, {
      onBuy: (price) => doBuy(itemIndex, price),
      onContinue: () => {
        state.currentScreen = "storeBrowse";
        renderStoreBrowse(
          store,
          state.currentStoreItems,
          state.player,
          state.economy,
          {
            onBack: showStoreSelection,
            onSelectItem: (index) => showNegotiation(index),
          },
        );
      },
    });
  });
}

function doBuy(itemIndex, price) {
  const item = state.currentStoreItems[itemIndex];
  if (!item) return;

  if (!spendCash(state.player, price)) {
    showNotification("Not enough cash!", "error");
    return;
  }

  if (!canAddItem(state.player, item)) {
    showNotification("No room in inventory!", "error");
    // Refund
    earnCash(state.player, price);
    return;
  }

  // Set buy price and add to inventory
  item.buyPrice = price;
  addItemToInventory(state.player, item);
  state.player.itemsBought++;
  state.daySpending += price;

  // Remove from store
  state.currentStoreItems.splice(itemIndex, 1);

  // Visual feedback
  animateCashChange(-price);
  showNotification(`Bought ${item.name} for ${formatCash(price)}!`, "success");
  playSfx("buy");
  refreshHeader();

  autoSave();

  // Go back to store browse
  const store = STORES.find((s) => s.id === state.currentStoreId);
  setTimeout(() => {
    state.currentScreen = "storeBrowse";
    renderStoreBrowse(
      store,
      state.currentStoreItems,
      state.player,
      state.economy,
      {
        onBack: showStoreSelection,
        onSelectItem: (index) => showNegotiation(index),
      },
    );
  }, 300);
}

// ── Inventory Flow ───────────────────────────

function showInventory() {
  state.currentScreen = "inventory";
  screenTransition(() => {
    renderInventory(state.player, state.economy, {
      onBack: showHub,
      onRepair: doRepair,
      onDrop: doDrop,
    });
  });
}

function doRepair(itemId) {
  const item = state.player.inventory.find((i) => i.id === itemId);
  if (!item) return;

  const hasRepairBench = hasUpgrade(state.player, "repair_bench");
  const hasRepairTools = hasUpgrade(state.player, "repair_tools");

  if (!hasRepairBench) {
    showNotification("You need a Repair Bench!", "error");
    return;
  }

  const cost = getRepairCost(item, true, hasRepairTools);
  if (!spendCash(state.player, cost)) {
    showNotification("Not enough cash for repair!", "error");
    return;
  }

  repairItem(item);
  animateCashChange(-cost);
  showNotification(`Repaired ${item.name} for ${formatCash(cost)}!`, "success");
  refreshHeader();
  autoSave();

  // Re-render inventory
  renderInventory(state.player, state.economy, {
    onBack: showHub,
    onRepair: doRepair,
    onDrop: doDrop,
  });
}

function doDrop(itemId) {
  const item = state.player.inventory.find((i) => i.id === itemId);
  if (!item) return;

  showConfirm(`Drop "${item.name}"? You won't get it back.`, () => {
    removeItemFromInventory(state.player, itemId);
    showNotification(`Dropped ${item.name}.`, "info");
    refreshHeader();
    autoSave();
    renderInventory(state.player, state.economy, {
      onBack: showHub,
      onRepair: doRepair,
      onDrop: doDrop,
    });
  });
}

// ── Sell Flow ────────────────────────────────

function showSellScreen() {
  state.currentScreen = "sell";
  screenTransition(() => {
    renderSellScreen(state.player, state.economy, {
      onBack: showHub,
      onSell: doSell,
    });
  });
}

function doSell(itemId, channelId, targetMarginPct = 25) {
  const item = state.player.inventory.find((i) => i.id === itemId);
  const channel = CHANNELS.find((c) => c.id === channelId);
  if (!item || !channel) return;

  if (!canSellOnChannel(item, channel)) {
    showNotification("This item doesn't qualify for that channel.", "error");
    return;
  }

  // Remove item from inventory
  removeItemFromInventory(state.player, item.id);

  // Process the sale
  const fasterSales = hasUpgrade(state.player, "fast_listings") ? 1 : 0;
  // Adjust channel speed for the upgrade
  const adjustedChannel = { ...channel };
  if (adjustedChannel.speed > 0) {
    adjustedChannel.speed = Math.max(1, adjustedChannel.speed - fasterSales);
  }

  const result = listItemForSale(
    state.player,
    item,
    adjustedChannel,
    state.economy,
    { targetMarginPct },
  );
  const flavor = getSellFlavor(result.success);

  if (result.returnedToInventory) {
    addItemToInventory(state.player, item);
    playSfx("fail");
  }

  if (result.instant && result.success) {
    earnCash(state.player, result.price);
    recordFlip(state.player, item.buyPrice, result.price);
    state.dayEarnings += result.price;
    animateCashChange(result.price);
    // Skill gain from selling
    applySkillGains(state.player, { marketKnowledge: 0.05, intuition: 0.03 });
    playSfx("sell");
  }

  refreshHeader();
  autoSave();

  if (!result.success && !result.returnedToInventory) playSfx("fail");

  showSellResult(result, flavor, () => {
    showSellScreen();
  });
}

// ── Shop Flow ────────────────────────────────

function showShopScreen() {
  state.currentScreen = "shop";
  screenTransition(() => {
    renderShopScreen(state.player, {
      onBack: showHub,
      onBuyUpgrade: doBuyUpgrade,
    });
  });
}

function doBuyUpgrade(upgradeId) {
  const result = purchaseUpgrade(state.player, upgradeId);
  if (result.success) {
    showNotification(result.message, "success");
    animateCashChange(-result.upgrade.cost);

    // Apply theme if cosmetic
    if (result.upgrade.effect.theme) {
      applyTheme(result.upgrade.effect.theme);
    }

    refreshHeader();
    autoSave();
  } else {
    showNotification(result.message, "error");
  }

  // Re-render shop
  renderShopScreen(state.player, {
    onBack: showHub,
    onBuyUpgrade: doBuyUpgrade,
  });
}

// ── Stats Flow ───────────────────────────────

function showStatsScreen() {
  state.currentScreen = "stats";
  screenTransition(() => {
    renderStatsScreen(state.player, state.economy, {
      onBack: showHub,
    });
  });
}

// ── Rest / Day Advance ───────────────────────

function doRest() {
  showConfirm("End the day and rest? Energy will be fully restored.", () => {
    playSfx("day");
    // Process day advance
    const completedSales = advanceDay(state.player);
    const salesResults = processCompletedSales(completedSales, state.player);

    // Update economy
    updateEconomy(state.economy, state.player.day);

    // Check for new events
    state.activeEvents = cleanupExpiredEvents(
      state.activeEvents,
      state.player.day,
    );
    const newEvents = checkForEvents(state.activeEvents, state.player.day);
    state.activeEvents.push(...newEvents);

    // Track daily earnings from completed sales
    for (const r of salesResults) {
      if (r.success) state.dayEarnings += r.earnings;
    }

    autoSave();

    // Show day end summary
    state.currentScreen = "dayEnd";
    refreshHeader();
    screenTransition(() => {
      renderDayEndSummary(state.player, salesResults, {
        onNewDay: () => {
          // Show any new events as popups
          if (newEvents.length > 0) {
            showEventChain(newEvents, 0, () => {
              state.dayEarnings = 0;
              state.daySpending = 0;
              showHub();
            });
          } else {
            state.dayEarnings = 0;
            state.daySpending = 0;
            showHub();
          }
        },
      });
    });
  });
}

// Show events one by one
function showEventChain(events, index, onDone) {
  if (index >= events.length) {
    onDone();
    return;
  }
  showEventPopup(events[index], () => {
    showEventChain(events, index + 1, onDone);
  });
}

// ── Auto-save ────────────────────────────────
function autoSave() {
  saveGame({
    player: state.player,
    economy: state.economy,
    activeEvents: state.activeEvents,
    currentScreen: state.currentScreen,
  });
}

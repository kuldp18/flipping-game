// ============================================
// UI.JS — All Rendering, Animations & Effects
// ============================================

import {
  RARITIES,
  CONDITIONS,
  CATEGORIES,
  SIZES,
  formatCash,
  getItemDisplay,
  getValueEstimate,
  getRepairCost,
} from "./items.js";
import {
  getTitle,
  getNextTitle,
  getUsedSlots,
  getFreeSlots,
} from "./player.js";
import { STORES, getRestockCountdown, canVisitStore, getGuaranteedOpenStoreId } from "./stores.js";
import { CHANNELS, getSellPriceEstimate, canSellOnChannel } from "./selling.js";
import {
  UPGRADES,
  hasUpgrade,
  canPurchaseUpgrade,
  getUpgradesByCategory,
} from "./upgrades.js";
import { getSeason, getSeasonInfo, getTrendInfo } from "./economy.js";
import { getActiveEventDisplay } from "./events.js";
import { NEGOTIATION_OPTIONS } from "./negotiation.js";
import { getSaveInfo } from "./save.js";

// ── DOM References ───────────────────────────
let $main, $header, $notification, $modal;

export function initUI() {
  $main = document.getElementById("main-content");
  $header = document.getElementById("header-bar");
  $notification = document.getElementById("notification");
  $modal = document.getElementById("modal-overlay");
}

// ── Header Bar Rendering ─────────────────────
export function renderHeader(player, economy) {
  const title = getTitle(player.totalProfit);
  const season = getSeasonInfo(player.day);

  const energyPct = (player.energy / player.maxEnergy) * 100;
  let energyColor = "#4ade80";
  if (energyPct <= 25) energyColor = "#ef4444";
  else if (energyPct <= 50) energyColor = "#fbbf24";

  $header.innerHTML = `
    <div class="header-left">
      <span class="header-title">${title.name}</span>
      <span class="header-day">${season.icon} Day ${player.day} <span class="header-season">(${season.name})</span></span>
    </div>
    <div class="header-center">
      <span class="header-cash">${formatCash(player.cash)}</span>
    </div>
    <div class="header-right">
      <button class="btn btn-small btn-sound" id="btn-sound" title="Toggle sound">🔊 SFX</button>
      <div class="energy-bar-container">
        <span class="energy-label">⚡ ${player.energy}/${player.maxEnergy}</span>
        <div class="energy-bar">
          <div class="energy-fill" style="width: ${energyPct}%; background: ${energyColor};"></div>
        </div>
      </div>
      <span class="header-inv">📦 ${getUsedSlots(player.inventory)}/${player.inventorySlots}</span>
    </div>
  `;
}

// ── Title Screen ─────────────────────────────
export function renderTitleScreen(onNewGame, onContinue) {
  const saveInfo = getSaveInfo();
  $main.innerHTML = `
    <div class="title-screen">
      <div class="title-logo">
        <div class="title-text">FLIP</div>
        <div class="title-text title-text-accent">HUSTLE</div>
      </div>
      <div class="title-subtitle">Buy Low. Sell High. Flip Everything.</div>
      <div class="title-divider">─────────────────────</div>
      <div class="title-menu">
        <button class="btn btn-primary btn-large" id="btn-new-game">
          ▶ NEW GAME
        </button>
        ${
          saveInfo
            ? `
        <button class="btn btn-secondary btn-large" id="btn-continue">
          ↪ CONTINUE
          <span class="btn-sub">Day ${saveInfo.day} · ${formatCash(saveInfo.cash)}</span>
        </button>
        `
            : ""
        }
      </div>
      <div class="title-footer">
        <span class="pixel-text-small">A text-based flipping simulator</span>
        <span class="pixel-text-small">v1.0 · Made with ♥ and JavaScript</span>
      </div>
    </div>
  `;

  document.getElementById("btn-new-game")?.addEventListener("click", onNewGame);
  document
    .getElementById("btn-continue")
    ?.addEventListener("click", onContinue);
}

// ── Hub Screen ───────────────────────────────
export function renderHubScreen(player, economy, activeEvents, callbacks) {
  const trendInfo = getTrendInfo(economy, player.day);
  const eventDisplay = getActiveEventDisplay(activeEvents, player.day);
  const pendingSalesCount = player.pendingSales.length;

  let eventsHtml = "";
  if (eventDisplay.length > 0) {
    eventsHtml = `
      <div class="panel events-panel">
        <div class="panel-header">📰 ACTIVE EVENTS</div>
        ${eventDisplay
          .map(
            (e) => `
          <div class="event-item">
            <span class="event-icon">${e.icon}</span>
            <span class="event-text">${e.name} — <span class="text-muted">${e.daysLeft}d left</span></span>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  let trendsHtml = "";
  if (trendInfo.length > 0) {
    trendsHtml = `
      <div class="panel trends-panel">
        <div class="panel-header">📈 MARKET TRENDS</div>
        ${trendInfo
          .map(
            (t) => `
          <div class="trend-item">
            <span>${t.icon} ${t.name}</span>
            <span class="text-green">${t.bonus} to ${t.categoryName}</span>
            <span class="text-muted">${t.daysLeft}d left</span>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  let pendingHtml = "";
  if (pendingSalesCount > 0) {
    pendingHtml = `
      <div class="panel pending-panel">
        <div class="panel-header">⏳ PENDING SALES (${pendingSalesCount})</div>
        ${player.pendingSales
          .map(
            (s) => `
          <div class="pending-item">
            <span>${s.item.name}</span>
            <span class="text-muted">${s.channelName} · Day ${s.completionDay}</span>
            <span class="text-green">~${formatCash(s.expectedPrice)}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  $main.innerHTML = `
    <div class="hub-screen">
      <div class="hub-greeting">
        <div class="typewriter" id="hub-greeting-text"></div>
      </div>
      ${eventsHtml}
      ${trendsHtml}
      ${pendingHtml}
      <div class="hub-actions">
        <button class="btn btn-action" id="btn-stores" ${player.energy < 2 ? 'disabled title="Not enough energy"' : ""}>
          <span class="btn-icon">🏪</span>
          <span class="btn-label">VISIT STORES</span>
          <span class="btn-sub">Browse & buy items</span>
        </button>
        <button class="btn btn-action" id="btn-inventory">
          <span class="btn-icon">📦</span>
          <span class="btn-label">INVENTORY</span>
          <span class="btn-sub">${player.inventory.length} items</span>
        </button>
        <button class="btn btn-action" id="btn-sell" ${player.inventory.length === 0 ? 'disabled title="No items to sell"' : ""}>
          <span class="btn-icon">💰</span>
          <span class="btn-label">SELL ITEMS</span>
          <span class="btn-sub">Cash out your finds</span>
        </button>
        <button class="btn btn-action" id="btn-shop">
          <span class="btn-icon">🛒</span>
          <span class="btn-label">UPGRADE SHOP</span>
          <span class="btn-sub">Tools & cosmetics</span>
        </button>
        <button class="btn btn-action" id="btn-stats">
          <span class="btn-icon">📊</span>
          <span class="btn-label">STATS</span>
          <span class="btn-sub">Your journey so far</span>
        </button>
        <button class="btn btn-action btn-rest" id="btn-rest">
          <span class="btn-icon">🌙</span>
          <span class="btn-label">REST</span>
          <span class="btn-sub">End day, restore energy</span>
        </button>
      </div>
    </div>
  `;

  // Typewriter greeting
  const greetings = [
    "Another day, another flip.",
    "The hustle never sleeps.",
    "Time to make some money.",
    "What treasures await today?",
    "Let's see what deals are out there.",
    "The market waits for no one.",
    "Your reputation precedes you.",
    "Fortune favors the bold flipper.",
  ];
  const greeting = greetings[player.day % greetings.length];
  typeWriter(document.getElementById("hub-greeting-text"), greeting, 30);

  // Bind buttons
  document
    .getElementById("btn-stores")
    ?.addEventListener("click", callbacks.onStores);
  document
    .getElementById("btn-inventory")
    ?.addEventListener("click", callbacks.onInventory);
  document
    .getElementById("btn-sell")
    ?.addEventListener("click", callbacks.onSell);
  document
    .getElementById("btn-shop")
    ?.addEventListener("click", callbacks.onShop);
  document
    .getElementById("btn-stats")
    ?.addEventListener("click", callbacks.onStats);
  document
    .getElementById("btn-rest")
    ?.addEventListener("click", callbacks.onRest);
}

// ── Store Selection Screen ───────────────────
export function renderStoreSelection(player, callbacks) {
  const stores = STORES.filter((s) => player.reputation >= s.unlockRep);
  const lockedStores = STORES.filter((s) => player.reputation < s.unlockRep);
  const guaranteedOpenStore = getGuaranteedOpenStoreId(
    player.day,
    player.storesVisited,
    stores.map((s) => s.id),
  );

  $main.innerHTML = `
    <div class="store-select-screen">
      <div class="screen-header">
        <button class="btn btn-back" id="btn-back">← BACK</button>
        <h2>📍 Choose a Location</h2>
      </div>
      <div class="store-list">
        ${stores
          .map((store) => {
            const restock = getRestockCountdown(
              store.id,
              player.day,
              player.storesVisited,
            );
            const canVisit = canVisitStore(
              store.id,
              player.day,
              player.storesVisited,
              stores.map((s) => s.id),
            );
            const guaranteed = guaranteedOpenStore === store.id && restock > 0;
            const hasEnergy = player.energy >= store.energyCost;
            const disabled = !canVisit || !hasEnergy;
            return `
            <div class="store-card ${disabled ? "store-disabled" : ""}" data-store="${store.id}" ${disabled ? "" : 'role="button" tabindex="0"'}>
              <div class="store-icon">${store.icon}</div>
              <div class="store-info">
                <div class="store-name">${store.name}</div>
                <div class="store-vibe">${store.vibe}</div>
                <div class="store-meta">
                  <span>⚡ ${store.energyCost} energy</span>
                  <span>🎲 Negotiation: ${store.negotiationDifficulty}%</span>
                </div>
                ${!canVisit ? `<div class="store-restock text-muted">Restocks in ${restock} day(s)</div>` : guaranteed ? `<div class="store-restock text-cyan">🌟 Special opening today</div>` : ""}
                ${!hasEnergy ? `<div class="store-restock text-red">Not enough energy</div>` : ""}
              </div>
            </div>
          `;
          })
          .join("")}
        ${lockedStores
          .map(
            (store) => `
          <div class="store-card store-locked">
            <div class="store-icon">🔒</div>
            <div class="store-info">
              <div class="store-name">${store.name}</div>
              <div class="store-vibe text-muted">Requires ${store.unlockRep} reputation</div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  document
    .getElementById("btn-back")
    ?.addEventListener("click", callbacks.onBack);
  document.querySelectorAll('.store-card[role="button"]').forEach((card) => {
    card.addEventListener("click", () =>
      callbacks.onSelectStore(card.dataset.store),
    );
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ")
        callbacks.onSelectStore(card.dataset.store);
    });
  });
}

// ── Store Browse Screen ──────────────────────
export function renderStoreBrowse(
  store,
  storeItems,
  player,
  economy,
  callbacks,
) {
  const hasScanner = hasUpgrade(player, "market_scanner");

  $main.innerHTML = `
    <div class="store-browse-screen">
      <div class="screen-header">
        <button class="btn btn-back" id="btn-back">← BACK</button>
        <h2>${store.icon} ${store.name}</h2>
      </div>
      <div class="store-keeper">
        <span class="keeper-name">${store.keeperName}:</span>
        <span class="keeper-line">${store.keeperLine}</span>
      </div>
      <div class="store-items">
        ${storeItems.length === 0 ? '<div class="empty-text">Nothing left to buy here. Check back later.</div>' : ""}
        ${storeItems
          .map((item, idx) => {
            const display = getItemDisplay(item);
            const estimate = hasScanner
              ? getValueEstimate(
                  item,
                  player.skills.marketKnowledge,
                  true,
                  economy,
                )
              : null;
            return `
            <div class="item-card" data-index="${idx}" role="button" tabindex="0">
              <div class="item-header">
                <span class="item-category" style="color:${display.categoryColor}">${display.categoryIcon}</span>
                <span class="item-name">${item.name}</span>
                <span class="item-rarity" style="color:${display.rarityColor}">${display.raritySymbol} ${display.rarity}</span>
              </div>
              <div class="item-details">
                <span class="item-condition">${display.conditionIcon} ${display.condition}</span>
                <span class="item-size">◻ ${display.size}</span>
                <span class="item-price">${formatCash(item.storePrice)}</span>
              </div>
              ${estimate ? `<div class="item-estimate">Scanner: ${formatCash(estimate.low)} – ${formatCash(estimate.high)}</div>` : ""}
              <div class="item-flavor">${item.flavorText}</div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;

  document
    .getElementById("btn-back")
    ?.addEventListener("click", callbacks.onBack);
  document.querySelectorAll('.item-card[role="button"]').forEach((card) => {
    const handler = () => callbacks.onSelectItem(parseInt(card.dataset.index));
    card.addEventListener("click", handler);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") handler();
    });
  });
}

// ── Negotiation Screen ───────────────────────
export function renderNegotiation(item, store, player, callbacks) {
  const display = getItemDisplay(item);
  const options = NEGOTIATION_OPTIONS.buy;

  $main.innerHTML = `
    <div class="negotiation-screen">
      <div class="screen-header">
        <button class="btn btn-back" id="btn-back">← BACK</button>
        <h2>🤝 Make Your Move</h2>
      </div>
      <div class="negotiate-item panel">
        <div class="item-header">
          <span class="item-category" style="color:${display.categoryColor}">${display.categoryIcon}</span>
          <span class="item-name">${item.name}</span>
          <span class="item-rarity" style="color:${display.rarityColor}">${display.raritySymbol} ${display.rarity}</span>
        </div>
        <div class="item-details">
          <span class="item-condition">${display.conditionIcon} ${display.condition}</span>
          <span class="item-size">◻ ${display.size}</span>
        </div>
        <div class="item-asking-price">Asking: <span class="text-yellow">${formatCash(item.storePrice)}</span></div>
        <div class="item-flavor">${item.flavorText}</div>
      </div>
      <div class="negotiate-options">
        ${options
          .map(
            (opt) => `
          <button class="btn btn-negotiate" data-strategy="${opt.id}">
            <span class="btn-icon">${opt.icon}</span>
            <span class="btn-label">${opt.name}</span>
            <span class="btn-sub">${opt.description}</span>
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  document
    .getElementById("btn-back")
    ?.addEventListener("click", callbacks.onBack);
  document.querySelectorAll(".btn-negotiate").forEach((btn) => {
    btn.addEventListener("click", () =>
      callbacks.onNegotiate(btn.dataset.strategy),
    );
  });
}

// ── Negotiation Result ───────────────────────
export function renderNegotiationResult(result, item, player, callbacks) {
  const success = result.success;
  const canAfford = player.cash >= result.finalPrice;
  const canFit = getFreeSlots(player) >= (SIZES[item.size - 1]?.slots || 1);

  $main.innerHTML = `
    <div class="negotiate-result-screen">
      <div class="result-panel panel ${success ? "result-success" : "result-fail"}">
        <div class="result-response">${result.response}</div>
        <div class="result-message ${success ? "text-green" : "text-red"}">${result.message}</div>
        ${
          result.skillResult
            ? `
          <div class="result-skill text-muted">
            Roll: ${result.skillResult.roll} vs ${result.skillResult.threshold}
            (${result.skillResult.margin >= 0 ? "+" : ""}${result.skillResult.margin})
          </div>
        `
            : ""
        }
        ${
          success
            ? `
          <div class="result-price">
            Price: <span class="text-green">${formatCash(result.finalPrice)}</span>
            ${result.discount > 0 ? `<span class="text-muted">(saved ${formatCash(result.discount)})</span>` : ""}
          </div>
          ${!canAfford ? '<div class="text-red">You can\'t afford this!</div>' : ""}
          ${!canFit ? '<div class="text-red">No room in inventory!</div>' : ""}
          <button class="btn btn-primary" id="btn-buy" ${!canAfford || !canFit ? "disabled" : ""}>
            💵 BUY for ${formatCash(result.finalPrice)}
          </button>
        `
            : ""
        }
        <button class="btn btn-secondary" id="btn-continue">
          ${result.itemRemoved ? "← Back to Store" : "← Keep Browsing"}
        </button>
      </div>
    </div>
  `;

  document
    .getElementById("btn-buy")
    ?.addEventListener("click", () => callbacks.onBuy(result.finalPrice));
  document
    .getElementById("btn-continue")
    ?.addEventListener("click", callbacks.onContinue);
}

// ── Inventory Screen ─────────────────────────
export function renderInventory(player, economy, callbacks) {
  const hasRepairBench = hasUpgrade(player, "repair_bench");
  const hasRepairTools = hasUpgrade(player, "repair_tools");
  const hasScanner = hasUpgrade(player, "market_scanner");

  $main.innerHTML = `
    <div class="inventory-screen">
      <div class="screen-header">
        <button class="btn btn-back" id="btn-back">← BACK</button>
        <h2>📦 Inventory (${getUsedSlots(player.inventory)}/${player.inventorySlots} slots)</h2>
      </div>
      <div class="inventory-grid">
        ${player.inventory.length === 0 ? '<div class="empty-text">Your inventory is empty. Time to go shopping!</div>' : ""}
        ${player.inventory
          .map((item) => {
            const display = getItemDisplay(item);
            const canRepair = hasRepairBench && item.condition < 3;
            const repairCost = canRepair
              ? getRepairCost(item, true, hasRepairTools)
              : 0;
            const estimate = hasScanner
              ? getValueEstimate(
                  item,
                  player.skills.marketKnowledge,
                  true,
                  economy,
                )
              : null;
            return `
            <div class="inv-item-card" data-id="${item.id}">
              <div class="item-header">
                <span class="item-category" style="color:${display.categoryColor}">${display.categoryIcon}</span>
                <span class="item-name">${item.name}</span>
                <span class="item-rarity" style="color:${display.rarityColor}">${display.raritySymbol}</span>
              </div>
              <div class="item-details">
                <span class="item-condition">${display.conditionIcon} ${display.condition}</span>
                <span class="item-size">◻ ${display.size}</span>
                <span class="text-muted">Paid: ${formatCash(item.buyPrice)}</span>
              </div>
              ${estimate ? `<div class="item-estimate">Value: ${formatCash(estimate.low)} – ${formatCash(estimate.high)}</div>` : ""}
              <div class="inv-item-actions">
                ${
                  canRepair
                    ? `
                  <button class="btn btn-small btn-repair" data-id="${item.id}" ${player.cash < repairCost ? 'disabled title="Can\'t afford"' : ""}>
                    🔧 Repair (${formatCash(repairCost)})
                  </button>
                `
                    : ""
                }
                <button class="btn btn-small btn-drop" data-id="${item.id}">
                  🗑️ Drop
                </button>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;

  document
    .getElementById("btn-back")
    ?.addEventListener("click", callbacks.onBack);
  document.querySelectorAll(".btn-repair").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      callbacks.onRepair(parseInt(btn.dataset.id));
    });
  });
  document.querySelectorAll(".btn-drop").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      callbacks.onDrop(parseInt(btn.dataset.id));
    });
  });
}

// ── Sell Screen ──────────────────────────────
export function renderSellScreen(player, economy, callbacks) {
  const channels = CHANNELS.filter((ch) => player.reputation >= ch.minRep);
  const lockedChannels = CHANNELS.filter((ch) => player.reputation < ch.minRep);

  $main.innerHTML = `
    <div class="sell-screen">
      <div class="screen-header">
        <button class="btn btn-back" id="btn-back">← BACK</button>
        <h2>💰 Sell Items</h2>
      </div>
      ${
        player.inventory.length === 0
          ? '<div class="empty-text">Nothing to sell. Go find some deals!</div>'
          : `
      <div class="sell-instructions text-muted">Select an item, set your target margin, then choose a selling channel.</div>
      <div class="sell-items">
        ${player.inventory
          .map((item) => {
            const display = getItemDisplay(item);
            return `
            <div class="sell-item-card" data-id="${item.id}" role="button" tabindex="0">
              <span class="item-category" style="color:${display.categoryColor}">${display.categoryIcon}</span>
              <span class="item-name">${item.name}</span>
              <span class="item-rarity" style="color:${display.rarityColor}">${display.raritySymbol} ${display.rarity}</span>
              <span class="item-condition">${display.conditionIcon} ${display.condition}</span>
            </div>
          `;
          })
          .join("")}
      </div>

      <div id="sell-margin-controls" class="sell-margin-controls" style="display:none">
        <div class="panel-header">Pricing Strategy</div>
        <label for="sell-margin" class="text-muted">Target margin: <span id="sell-margin-value" class="text-cyan">+25%</span></label>
        <input id="sell-margin" type="range" min="-20" max="160" step="5" value="25" />
        <div class="sell-margin-hint text-muted">Higher margin = better payout but lower chance to close.</div>
      </div>

      <div id="sell-channel-section" class="sell-channels" style="display:none">
        <div class="panel-header">Choose Channel</div>
        ${channels
          .map(
            (ch) => `
          <button class="btn btn-channel" data-channel="${ch.id}">
            <span class="btn-icon">${ch.icon}</span>
            <span class="btn-label">${ch.name}</span>
            <span class="btn-sub">${ch.description}</span>
            <span class="btn-meta">${ch.speed === 0 ? "Instant" : ch.speed + "d"} · ${ch.feePercent}% fee · Risk: ${ch.risk}%</span>
          </button>
        `,
          )
          .join("")}
        ${lockedChannels
          .map(
            (ch) => `
          <div class="btn btn-channel btn-locked">
            <span class="btn-icon">🔒</span>
            <span class="btn-label">${ch.name}</span>
            <span class="btn-sub">Requires ${ch.minRep} reputation</span>
          </div>
        `,
          )
          .join("")}
        <div id="sell-estimate" class="sell-estimate"></div>
      </div>
      `
      }
    </div>
  `;

  document
    .getElementById("btn-back")
    ?.addEventListener("click", callbacks.onBack);

  let selectedItemId = null;
  let selectedMargin = 25;

  document.querySelectorAll(".sell-item-card").forEach((card) => {
    const handler = () => {
      selectedItemId = parseInt(card.dataset.id);
      document
        .querySelectorAll(".sell-item-card")
        .forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      document.getElementById("sell-channel-section").style.display = "block";
      document.getElementById("sell-margin-controls").style.display = "block";
      updateSellEstimates(selectedItemId, player, economy, selectedMargin);
    };
    card.addEventListener("click", handler);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") handler();
    });
  });

  const $marginSlider = document.getElementById("sell-margin");
  const $marginValue = document.getElementById("sell-margin-value");
  if ($marginSlider) {
    $marginSlider.addEventListener("input", () => {
      selectedMargin = parseInt($marginSlider.value, 10);
      $marginValue.textContent = `${selectedMargin >= 0 ? "+" : ""}${selectedMargin}%`;
      if (selectedItemId !== null) {
        updateSellEstimates(selectedItemId, player, economy, selectedMargin);
      }
    });
  }

  document.querySelectorAll(".btn-channel").forEach((btn) => {
    if (btn.classList.contains("btn-locked")) return;
    btn.addEventListener("click", () => {
      if (selectedItemId !== null) {
        callbacks.onSell(selectedItemId, btn.dataset.channel, selectedMargin);
      }
    });
  });
}

function updateSellEstimates(itemId, player, economy, targetMargin = 25) {
  const item = player.inventory.find((i) => i.id === itemId);
  if (!item) return;
  const $estimate = document.getElementById("sell-estimate");
  const channels = CHANNELS.filter((ch) => player.reputation >= ch.minRep);
  const lines = channels.map((ch) => {
    const qualifies = canSellOnChannel(item, ch);
    if (!qualifies)
      return `<div class="text-muted">${ch.name}: Item doesn't qualify</div>`;
    const est = getSellPriceEstimate(item, ch, economy, targetMargin);
    return `<div>${ch.icon} ${ch.name}: <span class="text-green">${formatCash(est.low)} – ${formatCash(est.high)}</span> · Ask ${formatCash(est.targetPrice)} · <span class="text-yellow">${est.saleChance}% sale chance</span></div>`;
  });
  $estimate.innerHTML =
    `<div class="panel-header">Estimated Prices</div>` + lines.join("");
}

// ── Shop Screen ──────────────────────────────
export function renderShopScreen(player, callbacks) {
  const { gameplay, cosmetic } = getUpgradesByCategory();

  function renderUpgrade(u) {
    const owned = hasUpgrade(player, u.id);
    const check = canPurchaseUpgrade(player, u.id);
    return `
      <div class="upgrade-card ${owned ? "upgrade-owned" : ""} ${!owned && !check.canBuy ? "upgrade-locked" : ""}">
        <div class="upgrade-icon">${u.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-name">${u.name} ${owned ? '<span class="text-green">✓ OWNED</span>' : ""}</div>
          <div class="upgrade-desc">${u.description}</div>
          ${
            !owned
              ? `
            <div class="upgrade-cost">${formatCash(u.cost)}</div>
            ${!check.canBuy ? `<div class="upgrade-req text-red">${check.reason}</div>` : ""}
            ${check.canBuy ? `<button class="btn btn-small btn-buy-upgrade" data-id="${u.id}">BUY</button>` : ""}
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  $main.innerHTML = `
    <div class="shop-screen">
      <div class="screen-header">
        <button class="btn btn-back" id="btn-back">← BACK</button>
        <h2>🛒 Upgrade Shop</h2>
      </div>
      <div class="panel">
        <div class="panel-header">⚙️ GAMEPLAY UPGRADES</div>
        <div class="upgrade-list">
          ${gameplay.map(renderUpgrade).join("")}
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">🎨 COSMETIC THEMES</div>
        <div class="upgrade-list">
          ${cosmetic.map(renderUpgrade).join("")}
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("btn-back")
    ?.addEventListener("click", callbacks.onBack);
  document.querySelectorAll(".btn-buy-upgrade").forEach((btn) => {
    btn.addEventListener("click", () => callbacks.onBuyUpgrade(btn.dataset.id));
  });
}

// ── Stats Screen ─────────────────────────────
export function renderStatsScreen(player, economy, callbacks) {
  const title = getTitle(player.totalProfit);
  const nextTitle = getNextTitle(player.totalProfit);
  const season = getSeasonInfo(player.day);

  $main.innerHTML = `
    <div class="stats-screen">
      <div class="screen-header">
        <button class="btn btn-back" id="btn-back">← BACK</button>
        <h2>📊 Stats & Profile</h2>
      </div>
      <div class="panel">
        <div class="panel-header">👤 PROFILE</div>
        <div class="stat-row"><span>Title:</span><span class="text-yellow">${title.name}</span></div>
        ${nextTitle ? `<div class="stat-row"><span>Next Title:</span><span class="text-muted">${nextTitle.name} (${formatCash(nextTitle.minProfit)} profit)</span></div>` : '<div class="stat-row"><span>Rank:</span><span class="text-yellow">MAX RANK!</span></div>'}
        <div class="stat-row"><span>Day:</span><span>${player.day}</span></div>
        <div class="stat-row"><span>Season:</span><span>${season.icon} ${season.name}</span></div>
        <div class="stat-row"><span>Reputation:</span><span>${player.reputation}</span></div>
      </div>
      <div class="panel">
        <div class="panel-header">💰 FINANCES</div>
        <div class="stat-row"><span>Cash:</span><span class="text-green">${formatCash(player.cash)}</span></div>
        <div class="stat-row"><span>Total Profit:</span><span class="text-green">${formatCash(player.totalProfit)}</span></div>
        <div class="stat-row"><span>Total Spent:</span><span>${formatCash(player.totalSpent)}</span></div>
        <div class="stat-row"><span>Total Earned:</span><span>${formatCash(player.totalEarned)}</span></div>
        <div class="stat-row"><span>Best Single Flip:</span><span class="text-yellow">${formatCash(player.bestFlip)}</span></div>
      </div>
      <div class="panel">
        <div class="panel-header">📈 ACTIVITY</div>
        <div class="stat-row"><span>Items Bought:</span><span>${player.itemsBought}</span></div>
        <div class="stat-row"><span>Items Flipped:</span><span>${player.itemsFlipped}</span></div>
        <div class="stat-row"><span>Inventory:</span><span>${player.inventory.length} items (${getUsedSlots(player.inventory)}/${player.inventorySlots} slots)</span></div>
        <div class="stat-row"><span>Pending Sales:</span><span>${player.pendingSales.length}</span></div>
      </div>
      <div class="panel">
        <div class="panel-header">🧠 SKILLS</div>
        ${Object.entries(player.skills)
          .map(
            ([skill, value]) => `
          <div class="stat-row">
            <span>${skill.charAt(0).toUpperCase() + skill.slice(1).replace(/([A-Z])/g, " $1")}:</span>
            <div class="skill-bar-container">
              <div class="skill-bar" style="width: ${Math.min(100, (value / 20) * 100)}%"></div>
              <span class="skill-value">${value.toFixed(1)}/20</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="panel">
        <div class="panel-header">🎮 UPGRADES OWNED</div>
        ${Object.keys(player.upgrades).length === 0 ? '<div class="text-muted">None yet. Visit the shop!</div>' : ""}
        ${UPGRADES.filter((u) => hasUpgrade(player, u.id))
          .map(
            (u) => `
          <div class="stat-row"><span>${u.icon} ${u.name}</span></div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  document
    .getElementById("btn-back")
    ?.addEventListener("click", callbacks.onBack);
}

// ── Day End Summary ──────────────────────────
export function renderDayEndSummary(player, salesResults, callbacks) {
  const totalEarned = salesResults.reduce(
    (s, r) => s + (r.success ? r.earnings : 0),
    0,
  );

  $main.innerHTML = `
    <div class="day-end-screen">
      <div class="day-end-panel panel">
        <div class="panel-header">🌙 END OF DAY ${player.day - 1}</div>
        <div class="day-end-divider">────────────────</div>
        ${
          salesResults.length > 0
            ? `
          <div class="day-end-sales">
            <div class="text-yellow">📬 Completed Sales:</div>
            ${salesResults
              .map(
                (r) => `
              <div class="${r.success ? "text-green" : "text-red"}">
                ${r.success ? "✓" : "✗"} ${r.message}
              </div>
            `,
              )
              .join("")}
            ${totalEarned > 0 ? `<div class="day-end-total text-green">Total earned: ${formatCash(totalEarned)}</div>` : ""}
          </div>
        `
            : '<div class="text-muted">No sales completed overnight.</div>'
        }
        <div class="day-end-divider">────────────────</div>
        <div class="day-end-status">
          <div class="stat-row"><span>Cash:</span><span class="text-green">${formatCash(player.cash)}</span></div>
          <div class="stat-row"><span>Energy Restored:</span><span class="text-green">${player.maxEnergy}/${player.maxEnergy} ⚡</span></div>
          <div class="stat-row"><span>Pending Sales:</span><span>${player.pendingSales.length}</span></div>
        </div>
        <button class="btn btn-primary btn-large" id="btn-new-day">
          ☀️ BEGIN DAY ${player.day}
        </button>
      </div>
    </div>
  `;

  document
    .getElementById("btn-new-day")
    ?.addEventListener("click", callbacks.onNewDay);
}

// ── Notification Toast ───────────────────────
let _notifTimeout = null;
export function showNotification(message, type = "info", duration = 3000) {
  clearTimeout(_notifTimeout);
  $notification.className = `notification notif-${type} notif-show`;
  $notification.textContent = message;
  _notifTimeout = setTimeout(() => {
    $notification.classList.remove("notif-show");
  }, duration);
}

// ── Confirm Modal ────────────────────────────
export function showConfirm(message, onConfirm, onCancel) {
  $modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-message">${message}</div>
      <div class="modal-buttons">
        <button class="btn btn-primary" id="modal-yes">Yes</button>
        <button class="btn btn-secondary" id="modal-no">No</button>
      </div>
    </div>
  `;
  $modal.style.display = "flex";
  document.getElementById("modal-yes").addEventListener("click", () => {
    $modal.style.display = "none";
    onConfirm();
  });
  document.getElementById("modal-no").addEventListener("click", () => {
    $modal.style.display = "none";
    if (onCancel) onCancel();
  });
}

// ── Sell Result Modal ────────────────────────
export function showSellResult(result, flavorText, onDone) {
  $modal.innerHTML = `
    <div class="modal-box ${result.success ? "modal-success" : "modal-fail"}">
      <div class="modal-icon">${result.success ? "💰" : "😱"}</div>
      <div class="modal-message">${result.message}</div>
      <div class="modal-flavor text-muted">${flavorText}</div>
      <button class="btn btn-primary" id="modal-ok">OK</button>
    </div>
  `;
  $modal.style.display = "flex";
  document.getElementById("modal-ok").addEventListener("click", () => {
    $modal.style.display = "none";
    onDone();
  });
}

// ── Event Popup ──────────────────────────────
export function showEventPopup(event, onDismiss) {
  $modal.innerHTML = `
    <div class="modal-box modal-event">
      <div class="modal-icon">${event.icon}</div>
      <div class="modal-title">${event.name}</div>
      <div class="modal-message">${event.description}</div>
      <div class="modal-meta text-muted">Duration: ${event.endDay - event.startDay} days</div>
      <button class="btn btn-primary" id="modal-ok">Got it</button>
    </div>
  `;
  $modal.style.display = "flex";
  document.getElementById("modal-ok").addEventListener("click", () => {
    $modal.style.display = "none";
    onDismiss();
  });
}

// ── Typewriter Effect ────────────────────────
function typeWriter(element, text, speed = 30) {
  if (!element) return;
  element.textContent = "";
  let i = 0;
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

// ── Cash animation ───────────────────────────
export function animateCashChange(amount) {
  const el = document.createElement("div");
  el.className = `cash-popup ${amount >= 0 ? "cash-gain" : "cash-loss"}`;
  el.textContent = amount >= 0 ? `+${formatCash(amount)}` : formatCash(amount);
  document.getElementById("header-bar")?.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ── Screen transition ────────────────────────
export function screenTransition(callback) {
  $main.classList.add("screen-fade-out");
  setTimeout(() => {
    callback();
    $main.classList.remove("screen-fade-out");
    $main.classList.add("screen-fade-in");
    setTimeout(() => $main.classList.remove("screen-fade-in"), 200);
  }, 150);
}

// ── Apply theme ──────────────────────────────
export function applyTheme(themeName) {
  document.body.className = `theme-${themeName}`;
}

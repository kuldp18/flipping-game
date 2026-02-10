// ============================================
// AUDIO.JS — Lightweight SFX (WebAudio)
// ============================================

let ctx = null;
let unlocked = false;

function ensureContext() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

export function initAudio() {
  const unlock = () => {
    const context = ensureContext();
    if (!context) return;
    if (context.state === "suspended") context.resume();
    unlocked = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function tone({ freq = 440, duration = 0.08, type = "square", gain = 0.04, slide = 0 }) {
  const context = ensureContext();
  if (!context || !unlocked) return;
  const now = context.currentTime;
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, now + duration);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp).connect(context.destination);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

export function playSfx(name) {
  switch (name) {
    case "buy":
      tone({ freq: 320, duration: 0.09, gain: 0.05 });
      tone({ freq: 520, duration: 0.1, gain: 0.04 });
      break;
    case "sell":
      tone({ freq: 600, duration: 0.08, gain: 0.05 });
      tone({ freq: 800, duration: 0.1, gain: 0.05 });
      break;
    case "error":
      tone({ freq: 170, duration: 0.14, gain: 0.045, slide: -60, type: "sawtooth" });
      break;
    default:
      tone({ freq: 420, duration: 0.06, gain: 0.03 });
      break;
  }
}

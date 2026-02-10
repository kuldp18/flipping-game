// ============================================
// AUDIO.JS — Lightweight Retro SFX (WebAudio)
// ============================================

let ctx = null;
let enabled = true;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

function tone(freq = 440, duration = 0.08, type = "square", gain = 0.04, delay = 0) {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;

  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const start = audio.currentTime + delay;
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playSfx(name) {
  switch (name) {
    case "click":
      tone(380, 0.05, "square", 0.03);
      break;
    case "buy":
      tone(240, 0.08, "square", 0.045);
      tone(320, 0.08, "square", 0.04, 0.07);
      break;
    case "sell":
      tone(420, 0.08, "triangle", 0.05);
      tone(640, 0.09, "triangle", 0.05, 0.08);
      break;
    case "success":
      tone(520, 0.06, "square", 0.04);
      tone(780, 0.08, "square", 0.05, 0.06);
      break;
    case "fail":
      tone(220, 0.09, "sawtooth", 0.035);
      tone(170, 0.1, "sawtooth", 0.03, 0.08);
      break;
    case "day":
      tone(330, 0.08, "triangle", 0.04);
      tone(440, 0.09, "triangle", 0.04, 0.08);
      tone(550, 0.1, "triangle", 0.04, 0.16);
      break;
  }
}

export function setSoundEnabled(value) {
  enabled = Boolean(value);
}

export function isSoundEnabled() {
  return enabled;
}

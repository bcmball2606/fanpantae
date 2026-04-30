"use client";

// Tiny sound effect helper using WebAudio — no external assets required.
// Used for: correct, wrong, tick, open.

let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    type WebkitWindow = Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const w = window as WebkitWindow;
    const Ctor = window.AudioContext || w.webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
  }
  return _ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.2) {
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(ac.destination);
  const now = ac.currentTime;
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.start(now);
  osc.stop(now + dur);
}

export const sfx = {
  correct() {
    tone(660, 0.1, "triangle", 0.18);
    setTimeout(() => tone(990, 0.18, "triangle", 0.18), 100);
  },
  wrong() {
    tone(220, 0.18, "sawtooth", 0.18);
    setTimeout(() => tone(150, 0.32, "sawtooth", 0.2), 120);
  },
  tick() {
    tone(1200, 0.04, "square", 0.06);
  },
  open() {
    tone(520, 0.08, "triangle", 0.15);
    setTimeout(() => tone(780, 0.1, "triangle", 0.12), 60);
  },
  finish() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => tone(f, 0.18, "triangle", 0.2), i * 120);
    });
  },
};

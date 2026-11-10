// The game's sounds were designed in SoundCraft (scripts/sounds.py) and are
// inlined into the page as MP3s. They are decoded once audio is allowed; until
// then, or if decoding fails, small synthesized stand-ins play instead.
import stampUrl from "./sounds/stamp.mp3";
import dingUrl from "./sounds/ding.mp3";
import buzzUrl from "./sounds/buzz.mp3";
import clickUrl from "./sounds/click.mp3";
import comboUrl from "./sounds/combo.mp3";
import fanfareUrl from "./sounds/fanfare.mp3";
import sadTromboneUrl from "./sounds/sad-trombone.mp3";

type Name = "stamp" | "ding" | "buzz" | "click" | "combo" | "fanfare" | "sadTrombone";

// Every file is normalized to the same peak; these gains even out how loud they feel.
const FILES: Record<Name, [url: string, gain: number]> = {
  stamp: [stampUrl, 0.4],
  ding: [dingUrl, 0.6],
  buzz: [buzzUrl, 0.3],
  click: [clickUrl, 0.35],
  combo: [comboUrl, 0.45],
  fanfare: [fanfareUrl, 0.6],
  sadTrombone: [sadTromboneUrl, 0.32]
};

let ctx: AudioContext | null = null;
let enabled = true;
const buffers = new Map<Name, AudioBuffer>();

export function setSound(on: boolean): void {
  enabled = on;
}

function context(): AudioContext | null {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      for (const [name, [url]] of Object.entries(FILES) as [Name, [string, number]][]) {
        fetch(url)
          .then((r) => r.arrayBuffer())
          .then((data) => ctx!.decodeAudioData(data))
          .then((buffer) => buffers.set(name, buffer))
          .catch(() => {});
      }
    }
    // iOS Safari suspends the context until a user gesture, and again after a reload.
    if (ctx.state !== "running") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// Start decoding on the first touch or key press, before the click that wants a sound.
for (const type of ["pointerdown", "keydown"]) addEventListener(type, () => context(), { once: true, capture: true });

/** Plays a SoundCraft sound, or the synthesized stand-in if it isn't decoded yet. */
function play(name: Name, fallback: (a: AudioContext) => void): void {
  if (!enabled) return;
  const a = context();
  if (!a) return;
  const buffer = buffers.get(name);
  if (!buffer) return fallback(a);
  const source = a.createBufferSource();
  const gain = a.createGain();
  source.buffer = buffer;
  gain.gain.value = FILES[name][1];
  source.connect(gain).connect(a.destination);
  source.start();
}

function tone(a: AudioContext, freq: number, start: number, length: number, type: OscillatorType = "sine", gain = 0.18, slideTo?: number): void {
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + length);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

export const stamp = () => play("stamp", (a) => tone(a, 140, 0, 0.14, "sine", 0.35, 50));
export const ding = () =>
  play("ding", (a) => {
    tone(a, 880, 0.05, 0.18, "triangle", 0.14);
    tone(a, 1320, 0.13, 0.28, "triangle", 0.12);
  });
export const buzz = () => play("buzz", (a) => tone(a, 180, 0.04, 0.32, "sawtooth", 0.07, 90));
export const click = () => play("click", (a) => tone(a, 660, 0, 0.05, "square", 0.03));
export const combo = () => play("combo", (a) => [784, 1047, 1319, 1568].forEach((f, i) => tone(a, f, i * 0.06, 0.18, "square", 0.05)));
export const fanfare = () =>
  play("fanfare", (a) => [523, 659, 784, 1047].forEach((f, i) => tone(a, f, i * 0.11, i === 3 ? 0.5 : 0.16, "triangle", 0.13)));
export const sadTrombone = () =>
  play("sadTrombone", (a) =>
    [392, 370, 349, 330].forEach((f, i) => tone(a, f, i * 0.28, i === 3 ? 0.7 : 0.26, "sawtooth", 0.05, i === 3 ? 300 : undefined))
  );

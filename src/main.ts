import "./style.css";
import verifiedJson from "./verified.json";
import { CHAPTERS } from "./questions";
import { COMPILE_ERROR, PANIC, hash, outcome, patch, type Chapter, type Question, type Result, type Verified } from "./types";
import { escapeHtml, highlight, prose } from "./highlight";
import { confetti, shake } from "./fx";
import * as sound from "./sound";

const VERIFIED = verifiedJson as Verified;
const HEARTS = 3;
const app = document.getElementById("app")!;

/** What rustc said about this exact source. scripts/verify.ts guarantees there is an entry. */
function rustc(source: string): Result {
  const r = VERIFIED.results[hash(source)];
  if (!r) throw new Error("No verified result for this program. Run npm run verify.");
  return r;
}

// ---------------------------------------------------------------- storage

interface Saved {
  best: Record<string, { score: number; stars: number }>;
  sound: boolean;
}
const STORE_KEY = "be-the-borrow-checker:v1";

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
    if (raw && typeof raw === "object") return { best: raw.best ?? {}, sound: raw.sound !== false };
  } catch {}
  return { best: {}, sound: true };
}
const saved = load();
sound.setSound(saved.sound);

function persist(): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));
  } catch {}
}

// ---------------------------------------------------------------- state

interface Run {
  chapter: Chapter;
  queue: Question[];
  index: number;
  hearts: number;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  /** The 50:50 joker hasn't been used yet. It can be used once per run. */
  joker: boolean;
  /** One entry per answered question, for the progress bar. */
  history: boolean[];
}

interface Turn {
  q: Question;
  /** Display order of choice indexes, shuffled per turn. */
  order: number[];
  /** Wrong choices the 50:50 joker struck out. */
  struck: number[];
  phase: "ask" | "reveal";
  right: boolean;
  said?: "accept" | "reject";
  picked?: number;
  points: number;
  /** Fix questions: which choice's compiler output is shown (-1: the code as written). */
  viewing: number;
  /** The reader opened rustc's output, so re-renders keep it open. */
  outputOpen: boolean;
  quip: string;
}

type Screen = { name: "home" } | { name: "play"; run: Run; turn: Turn } | { name: "end"; run: Run; newBest: boolean };
let screen: Screen = { name: "home" };
let animate = false;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/** ×1 for the first three in a row, then one more per three, up to ×4. */
const multiplier = (streak: number) => Math.min(4, 1 + Math.floor(streak / 3));

function queueFor(chapter: Chapter): Question[] {
  if (!chapter.mixIn) return chapter.questions;
  const others = CHAPTERS.filter((c) => c !== chapter).flatMap((c) => c.questions);
  return shuffle([...chapter.questions, ...shuffle(others).slice(0, chapter.mixIn)]);
}

function newTurn(q: Question): Turn {
  let order: number[] = [];
  if (q.kind !== "verdict") {
    // Shuffle the answers, but keep "doesn't compile" and "panics" at the end where people look for them.
    const idx = q.choices.map((_, i) => i);
    const special = (i: number) => q.kind === "output" && (q.choices[i] === COMPILE_ERROR || q.choices[i] === PANIC);
    order = [...shuffle(idx.filter((i) => !special(i))), ...idx.filter(special)];
  }
  return { q, order, struck: [], phase: "ask", right: false, points: 0, viewing: -1, outputOpen: false, quip: "" };
}

function start(chapter: Chapter): void {
  const queue = queueFor(chapter);
  const run: Run = { chapter, queue, index: 0, hearts: HEARTS, score: 0, streak: 0, bestStreak: 0, correct: 0, joker: true, history: [] };
  screen = { name: "play", run, turn: newTurn(queue[0]) };
  animate = true;
  render();
  window.scrollTo({ top: 0 });
}

// ---------------------------------------------------------------- answering

const QUIPS = {
  acceptRight: ["Approved. Ship it.", "Clean build. Not a warning in sight.", "LGTM, says the borrow checker."],
  rejectRight: ["Rejected. That code isn't shipping today.", "Denied. Memory safety holds another day.", "Rejected, and rustc agrees with you."],
  acceptWrong: ["You let that through? rustc didn't.", "That one would have paged someone at 3 a.m.", "You stamped it. rustc stamped it right back."],
  rejectWrong: ["That one was fine! Too strict, even for a borrow checker.", "False alarm: it compiles cleanly.", "You rejected perfectly good code. Harsh."],
  outputRight: ["Exactly what it prints.", "You ran it in your head. Nice.", "Spot on, down to the last byte."],
  outputWrong: ["Not what it prints.", "The program begs to differ.", "Close. The terminal says otherwise."],
  fixRight: ["Fixed. Green build.", "Compiles, and prints the right thing.", "Ship it."],
  fixWrong: ["rustc isn't happy with that one either.", "No green build this time.", "Not the fix."]
};

function score(run: Run, turn: Turn, right: boolean): void {
  turn.right = right;
  run.history.push(right);
  if (right) {
    turn.points += 100 * multiplier(run.streak);
    run.streak++;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    run.correct++;
    // Every third in a row raises the multiplier: a bigger sound and some confetti.
    if (run.streak % 3 === 0) {
      sound.combo();
      confetti(50);
    } else {
      sound.ding();
      confetti(16);
    }
  } else {
    run.streak = 0;
    run.hearts--;
    sound.buzz();
    shake(app);
  }
  run.score += turn.points;
}

function answerVerdict(said: "accept" | "reject"): void {
  if (screen.name !== "play" || screen.turn.phase !== "ask") return;
  const { run, turn } = screen;
  if (turn.q.kind !== "verdict") return;
  const compiles = rustc(turn.q.code).ok;
  const right = (said === "accept") === compiles;
  turn.said = said;
  sound.stamp();
  score(run, turn, right);
  turn.quip = pick(right ? (compiles ? QUIPS.acceptRight : QUIPS.rejectRight) : compiles ? QUIPS.rejectWrong : QUIPS.acceptWrong);
  turn.phase = "reveal";
  animate = true;
  render();
}

/** The joker needs something to strike: a question with more than two choices. */
const jokerFits = (q: Question) => q.kind !== "verdict" && q.choices.length > 2;

/** Strikes out wrong choices until the answer and one wrong choice are left. */
function useJoker(): void {
  if (screen.name !== "play" || screen.turn.phase !== "ask") return;
  const { run, turn } = screen;
  const q = turn.q;
  if (!run.joker || q.kind === "verdict" || !jokerFits(q)) return;
  const wrong = shuffle(turn.order.filter((c) => c !== q.answer));
  turn.struck = wrong.slice(1);
  run.joker = false;
  sound.click();
  render();
  (app.querySelector(".choice:not(:disabled)") as HTMLElement | null)?.focus({ preventScroll: true });
}

function answerChoice(choice: number): void {
  if (screen.name !== "play" || screen.turn.phase !== "ask") return;
  const { run, turn } = screen;
  const q = turn.q;
  if (q.kind === "verdict" || turn.struck.includes(choice)) return;
  turn.picked = choice;
  const right = choice === q.answer;
  score(run, turn, right);
  turn.viewing = q.kind === "fix" ? choice : -1;
  turn.quip = pick(q.kind === "fix" ? (right ? QUIPS.fixRight : QUIPS.fixWrong) : right ? QUIPS.outputRight : QUIPS.outputWrong);
  turn.phase = "reveal";
  animate = true;
  render();
}

function next(): void {
  if (screen.name !== "play" || screen.turn.phase !== "reveal") return;
  const { run } = screen;
  run.index++;
  if (run.hearts <= 0 || run.index >= run.queue.length) return finish(run);
  screen = { name: "play", run, turn: newTurn(run.queue[run.index]) };
  animate = true;
  render();
  document.querySelector(".hud")?.scrollIntoView({ block: "start" });
}

function stars(run: Run): number {
  if (run.hearts <= 0) return 0;
  const accuracy = run.correct / run.queue.length;
  return accuracy === 1 ? 3 : accuracy >= 0.75 ? 2 : 1;
}

function finish(run: Run): void {
  const s = stars(run);
  const best = saved.best[run.chapter.id];
  const newBest = !best || run.score > best.score;
  saved.best[run.chapter.id] = { score: Math.max(run.score, best?.score ?? 0), stars: Math.max(s, best?.stars ?? 0) };
  persist();
  screen = { name: "end", run, newBest };
  animate = true;
  render();
  window.scrollTo({ top: 0 });
  if (s > 0) {
    sound.fanfare();
    confetti(s === 3 ? 120 : 60);
  } else {
    sound.sadTrombone();
  }
}

// ---------------------------------------------------------------- rendering

function crab(mood: "idle" | "happy" | "sad" | "smug" = "idle"): string {
  const mouth = {
    idle: "M52 60q8 5 16 0",
    happy: "M50 58q10 10 20 0",
    smug: "M52 60q10 4 16-3",
    sad: "M51 63q9-7 18 0"
  }[mood];
  return `<svg class="crab ${mood}" viewBox="0 0 120 92" aria-hidden="true">
    <g class="legs">
      <path d="M26 60l-14 8M26 66l-12 13M30 71l-8 14M94 60l14 8M94 66l12 13M90 71l8 14" />
    </g>
    <g class="claw claw-l">
      <path class="arm" d="M30 52 Q16 44 18 30" />
      <path class="pincer" d="M18 31c-11-2-15-12-9-20 3 6 8 8 13 7-2-5 0-10 5-12 3 9 0 20-9 25z" />
    </g>
    <g class="claw claw-r">
      <path class="arm" d="M90 52 Q104 44 102 30" />
      <path class="pincer" d="M102 31c11-2 15-12 9-20-3 6-8 8-13 7 2-5 0-10-5-12-3 9 0 20 9 25z" />
    </g>
    <path class="body" d="M20 58c0-16 18-26 40-26s40 10 40 26c0 13-18 22-40 22S20 71 20 58z" />
    <g class="eyes">
      <path class="stalk" d="M49 36l-3-14M71 36l3-14" />
      <circle class="eye" cx="45" cy="19" r="7" />
      <circle class="eye" cx="75" cy="19" r="7" />
      <circle class="pupil" cx="46.5" cy="20" r="3.2" />
      <circle class="pupil" cx="76.5" cy="20" r="3.2" />
      ${mood === "sad" ? '<path class="brow" d="M38 10l12 4M82 10l-12 4" />' : ""}
    </g>
    <path class="mouth" d="${mouth}" />
  </svg>`;
}

const SOUND_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path class="wave" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /><path class="mute" d="M16 9.5l5 5M21 9.5l-5 5" /></svg>`;
const HEART = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.7 4.5c2.2 0 3.7 1.2 5.3 3 1.6-1.8 3.1-3 5.3-3 3.7 0 5.8 3.7 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>`;

function soundButton(): string {
  return `<button type="button" class="icon-btn" data-act="sound" aria-pressed="${saved.sound}" aria-label="Sound">${SOUND_ICON}</button>`;
}

function choiceLabel(text: string): string {
  if (text === COMPILE_ERROR) return `<span class="special">Doesn't compile</span>`;
  if (text === PANIC) return `<span class="special">Panics at run time</span>`;
  return `<code>${escapeHtml(text)}</code>`;
}

function starsHtml(n: number, label = true): string {
  const s = [0, 1, 2].map((i) => `<span class="${i < n ? "on" : ""}">★</span>`).join("");
  return `<span class="stars"${label ? ` aria-label="${n} of 3 stars"` : ' aria-hidden="true"'}>${s}</span>`;
}

function renderHome(): string {
  const total = CHAPTERS.reduce((n, c) => n + c.questions.length, 0);
  const programs = Object.keys(VERIFIED.results).length;
  const chapters = CHAPTERS.map((c, i) => {
    const best = saved.best[c.id];
    const count = c.questions.length + (c.mixIn ?? 0);
    return `<li>
      <button type="button" class="chapter" data-act="start" data-chapter="${i}">
        <span class="ch-num">${c.number}</span>
        <span class="ch-body">
          <span class="ch-name">${prose(c.name)}</span>
          <span class="ch-blurb">${escapeHtml(c.blurb)}</span>
          <span class="ch-meta">${count} questions${best ? ` · best ${best.score} ${starsHtml(best.stars)}` : ""}</span>
        </span>
        <span class="ch-go" aria-hidden="true">→</span>
      </button>
    </li>`;
  }).join("");

  return `<div class="screen home${animate ? " enter" : ""}">
    <header class="top">
      <a class="back" href="/games/">← Games</a>
      ${soundButton()}
    </header>
    <section class="hero">
      <div class="hero-text">
        <p class="kicker">A Rust quiz in ${total} rounds</p>
        <h1>Be the <em>borrow checker</em></h1>
        <p class="lede">You're rustc tonight. Stamp each snippet <b class="ok">accepted</b> or <b class="bad">rejected</b>, predict what it prints, and pick the fix that makes it build.</p>
      </div>
      <div class="hero-crab">${crab("smug")}<span class="bubble">Nothing gets past us.</span></div>
    </section>

    <ol class="chapters">${chapters}</ol>

    <footer class="foot">
      Every answer was checked by the compiler. All ${programs} programs were compiled, and the ones that build were run, with
      <code>${escapeHtml(VERIFIED.rustc.replace(/ \(.*\)/, ""))}</code>, edition ${VERIFIED.edition}. The error output you see is rustc's own.
    </footer>
  </div>`;
}

interface CodeView {
  code: string;
  /** Line rustc blames, marked with its message. */
  errorLine?: number;
  errorNote?: string;
  /** "why": you were right, this is rustc's reason. "bad": you missed it. */
  errorTone?: "why" | "bad";
  /** Fix questions: the line being replaced, and what replaced it. */
  target?: number;
  replacement?: { text: string; ok: boolean };
}

function codeHtml(view: CodeView): string {
  const lines = view.code.split("\n");
  const rows: string[] = [];
  lines.forEach((line, i) => {
    const n = i + 1;
    const cls = ["ln"];
    if (n === view.target) cls.push(view.replacement ? "removed" : "target");
    if (n === view.errorLine && !view.replacement) cls.push(view.errorTone === "bad" ? "err" : "why");
    rows.push(`<div class="${cls.join(" ")}"><span class="no">${n}</span><span class="src">${highlight(line) || " "}</span></div>`);
    if (n === view.target && view.replacement) {
      const indent = line.match(/^ */)![0];
      for (const r of view.replacement.text.split("\n")) {
        rows.push(`<div class="ln added ${view.replacement.ok ? "good" : "bad"}"><span class="no">+</span><span class="src">${highlight(indent + r)}</span></div>`);
      }
    }
    if (n === view.errorLine && view.errorNote && !view.replacement) {
      const tone = view.errorTone === "bad" ? "" : " why";
      rows.push(`<div class="ln-note${tone}" role="note"><span class="no"></span><span>${escapeHtml(view.errorNote)}</span></div>`);
    }
  });
  return `<div class="code" role="group" aria-label="Rust code"><div class="code-inner">${rows.join("")}</div></div>`;
}

/** First line of rustc's output, e.g. "error[E0382]: borrow of moved value: `a`". */
const headline = (r: Result) => r.rendered?.split("\n")[0] ?? "";

function terminal(r: Result): string {
  const cmd = `<span class="term-prompt">$</span> rustc --edition ${VERIFIED.edition} src/main.rs${r.ok ? " &amp;&amp; ./main" : ""}`;
  let body: string;
  if (!r.ok) {
    const n = r.errors.length;
    body = `${escapeHtml(r.rendered ?? "")}\n\n<span class="t-err">error</span>: aborting due to ${n === 1 ? "1 previous error" : `${n} previous errors`}`;
  } else {
    const out = escapeHtml(r.stdout ?? "");
    const panic = r.panicked ? `<span class="t-err">${escapeHtml(r.stderr ?? "")}</span>` : "";
    body = (out || panic ? out + panic : `<span class="t-dim">(prints nothing)</span>`).trimEnd();
  }
  return `<pre class="term"><code>${cmd}\n${body
    .replace(/^(error(\[E\d+\])?)(?=:)/gm, '<span class="t-err">$1</span>')
    .replace(/^(warning|help|note)(?=:)/gm, '<span class="t-note">$1</span>')}</code></pre>`;
}

function promptFor(q: Question): string {
  if (q.kind === "verdict") return "Does this compile?";
  if (q.kind === "output") return "What does it print?";
  return `rustc rejects this. Which version of line ${q.line} compiles and prints <code>${escapeHtml(q.goal)}</code>?`;
}

function renderPlay(run: Run, turn: Turn): string {
  const q = turn.q;
  const r = rustc(q.code);
  const m = multiplier(run.streak);

  const hearts = Array.from({ length: HEARTS }, (_, i) => `<span class="heart${i < run.hearts ? "" : " lost"}">${HEART}</span>`).join("");
  const progress = run.queue
    .map((_, i) => {
      const cls = i < run.history.length ? (run.history[i] ? "done good" : "done bad") : i === run.index ? "now" : "";
      return `<span class="${cls}"></span>`;
    })
    .join("");

  // ----- code panel
  let view: CodeView = { code: q.code };
  let stampHtml = "";
  if (q.kind === "verdict") {
    if (turn.phase === "reveal" && !r.ok) view = { code: q.code, errorLine: r.line, errorNote: headline(r), errorTone: turn.right ? "why" : "bad" };
    if (turn.said) {
      // The stamp shows your verdict, coloured by whether it was right.
      const word = turn.said === "accept" ? "Accepted" : "Rejected";
      stampHtml = `<div class="stamp ${turn.right ? "right" : "wrong"}${animate ? " slam" : ""}" aria-hidden="true">${turn.right ? "✓ " : ""}${word}</div>`;
    }
  } else if (q.kind === "fix") {
    view = { code: q.code, target: q.line };
    if (turn.phase === "reveal") {
      if (turn.viewing >= 0) {
        const pr = rustc(patch(q.code, q.line, q.choices[turn.viewing]));
        view.replacement = { text: q.choices[turn.viewing], ok: outcome(pr) === q.goal };
      } else {
        view = { code: q.code, errorLine: r.line, errorNote: headline(r), errorTone: "why" };
      }
    }
  }

  // ----- actions
  let actions = "";
  if (turn.phase === "ask") {
    if (q.kind === "verdict") {
      actions = `<div class="stamps">
        <button type="button" class="stamp-btn accept" data-act="accept"><span>Accept</span><kbd>A</kbd></button>
        <button type="button" class="stamp-btn reject" data-act="reject"><span>Reject</span><kbd>R</kbd></button>
      </div>`;
    } else {
      actions = `<div class="choices ${q.kind}">${turn.order
        .map(
          (c, i) =>
            `<button type="button" class="choice${turn.struck.includes(c) ? " struck" : ""}" data-act="choice" data-choice="${c}"${
              turn.struck.includes(c) ? " disabled" : ""
            }><kbd>${i + 1}</kbd>${q.kind === "fix" ? `<code>${highlight(q.choices[c])}</code>` : choiceLabel(q.choices[c])}</button>`
        )
        .join("")}</div>`;
      if (jokerFits(q)) {
        const note = turn.struck.length ? "Used on this question" : run.joker ? "Strikes out wrong answers until two are left. Once per chapter." : "Already used in this chapter";
        actions += `<div class="joker-row">
          <button type="button" class="joker" data-act="joker"${run.joker ? "" : " disabled"}><span>50:50</span><kbd>J</kbd></button>
          <span class="joker-note">${note}</span>
        </div>`;
      }
    }
  }

  // ----- reveal
  let reveal = "";
  if (turn.phase === "reveal") {
    let detail = "";
    if (q.kind === "output") {
      const answer = choiceLabel(q.choices[q.answer]);
      detail = turn.right ? "" : `<p class="line-result">It's ${answer}.</p>`;
    }

    let tabs = "";
    let shown = r;
    if (q.kind === "fix") {
      const all = [-1, ...turn.order];
      tabs = `<div class="tabs" role="tablist" aria-label="See what rustc says about each version">${all
        .map((c) => {
          const label = c < 0 ? "As written" : `Choice ${turn.order.indexOf(c) + 1}`;
          const res = c < 0 ? r : rustc(patch(q.code, q.line, q.choices[c]));
          const mark = c < 0 ? "" : outcome(res) === q.goal ? " ✓" : " ✗";
          return `<button type="button" role="tab" aria-selected="${c === turn.viewing}" class="tab${c === q.answer ? " is-answer" : ""}" data-act="view" data-choice="${c}">${label}${mark}${c === turn.picked ? " · yours" : ""}</button>`;
        })
        .join("")}</div>`;
      if (turn.viewing >= 0) {
        shown = rustc(patch(q.code, q.line, q.choices[turn.viewing]));
      }
    }

    const last = run.hearts <= 0 || run.index + 1 >= run.queue.length;
    const title = turn.right ? "Correct!" : run.hearts <= 0 ? "Out of lives" : "Not quite";
    const points = turn.right ? `+${turn.points}${run.streak >= 3 ? ` · ${run.streak} in a row` : ""}` : "−1 life";
    // Why rustc refuses the code is worth reading even when you got it right, but it shouldn't
    // greet a right answer with a wall of red, so the full output starts folded then.
    const folded = turn.right && !shown.ok && !turn.outputOpen;
    reveal = `<section class="reveal${animate ? " enter" : ""}" aria-live="polite">
      <div class="verdict ${turn.right ? "good" : "bad"}">
        ${crab(turn.right ? "happy" : "sad")}
        <div>
          <p class="verdict-title">${title}</p>
          <p class="points">${points}</p>
          <p class="quip">${escapeHtml(turn.quip)}</p>
        </div>
      </div>
      ${detail}
      <p class="explain">${turn.right && q.kind === "verdict" && !r.ok ? "<b>Why rustc refuses it:</b> " : ""}${prose(q.explain)}</p>
      <details class="rustc-out"${folded ? "" : " open"}>
        <summary class="out-label">What rustc actually said</summary>
        ${tabs}
        ${terminal(shown)}
      </details>
      <button type="button" class="next" data-act="next">${last ? "See results" : "Next question"} <kbd>↵</kbd></button>
    </section>`;
  }

  const kindLabel = { verdict: "Verdict", output: "Output", fix: "Fix it" }[q.kind];
  return `<div class="screen play">
    <header class="hud">
      <button type="button" class="back" data-act="home">← Chapters</button>
      <div class="hud-stats">
        <span class="hearts" role="img" aria-label="${run.hearts} of ${HEARTS} lives left">${hearts}</span>
        <span class="score" aria-label="Score ${run.score}"><span class="score-n${animate && turn.phase === "reveal" && turn.right ? " bump" : ""}">${run.score}</span></span>
        <span class="combo m${m}" title="Multiplier" aria-label="Multiplier ${m}">×${m}</span>
      </div>
      ${soundButton()}
    </header>
    <div class="progress" aria-hidden="true">${progress}</div>

    <main class="card${animate && turn.phase === "ask" ? " enter" : ""}">
      <div class="card-head">
        <span class="chip chip-${q.kind}">${kindLabel}</span>
        <span class="topic">${escapeHtml(q.topic)}</span>
        <span class="qno">${run.index + 1} / ${run.queue.length}</span>
      </div>
      <h2 class="prompt" tabindex="-1">${promptFor(q)}</h2>
      <div class="code-wrap">
        ${codeHtml(view)}
        ${stampHtml}
      </div>
      ${actions}
      ${reveal}
    </main>
  </div>`;
}

const RANKS: [number, string, string][] = [
  [1, "Ferris's favourite", "Not a single borrow got past you. rustc would like to hire you."],
  [0.85, "Senior borrow checker", "You see dangling references before they're even written."],
  [0.65, "Lifetime apprentice", "Your instincts are good. A few more rounds and the errors will start explaining themselves."],
  [0.4, "Clone() enthusiast", "When in doubt, .clone() it out. It works, but there's more to learn here."],
  [0, "Segfault tourist", "Every expert started here. Read the rustc output after each answer; it's the best teacher in the language."]
];

function renderEnd(run: Run, newBest: boolean): string {
  const failed = run.hearts <= 0;
  const answered = run.history.length;
  const accuracy = run.correct / run.queue.length;
  const [, rank, blurb] = RANKS.find(([min]) => accuracy >= min)!;
  const s = stars(run);
  const nextChapter = CHAPTERS[CHAPTERS.indexOf(run.chapter) + 1];
  const term = failed
    ? `<span class="t-err">error</span>: could not compile \`you\` (bin "you") due to ${HEARTS} previous errors\n<span class="t-dim">  answered ${answered} of ${run.queue.length} before running out of lives</span>`
    : `<span class="t-ok">   Compiling</span> you v1.0.0 (${escapeHtml(run.chapter.name)})\n<span class="t-ok">    Finished</span> \`release\` profile [optimized] in ${run.queue.length} questions`;

  return `<div class="screen end${animate ? " enter" : ""}">
    <header class="top">
      <button type="button" class="back" data-act="home">← Chapters</button>
      ${soundButton()}
    </header>
    <section class="result ${failed ? "failed" : "passed"}">
      <div class="result-crab">${crab(failed ? "sad" : s === 3 ? "happy" : "smug")}</div>
      <p class="kicker">${run.chapter.number} · ${prose(run.chapter.name)}</p>
      <h1>${failed ? "Build failed" : "Build succeeded"}</h1>
      <pre class="term end-term"><code>${term}</code></pre>
      <div class="tally">
        <div><span class="big">${run.score}</span><span>points${newBest && run.score > 0 ? ' <b class="new-best">New best</b>' : ""}</span></div>
        <div><span class="big">${run.correct}/${run.queue.length}</span><span>correct</span></div>
        <div><span class="big">${run.bestStreak}</span><span>best streak</span></div>
      </div>
      ${failed ? "" : `<div class="result-stars">${starsHtml(s)}</div>`}
      <p class="rank"><b>${escapeHtml(rank)}</b>${escapeHtml(blurb)}</p>
      <div class="end-actions">
        <button type="button" class="primary" data-act="retry">Play again</button>
        ${nextChapter ? `<button type="button" class="ghost" data-act="start" data-chapter="${CHAPTERS.indexOf(nextChapter)}">Next: ${prose(nextChapter.name)}</button>` : ""}
      </div>
    </section>
  </div>`;
}

function render(): void {
  if (screen.name === "home") app.innerHTML = renderHome();
  else if (screen.name === "play") app.innerHTML = renderPlay(screen.run, screen.turn);
  else app.innerHTML = renderEnd(screen.run, screen.newBest);

  if (animate && screen.name === "play") {
    const phase = screen.turn.phase;
    const focus = phase === "reveal" ? ".next" : ".prompt";
    // Keep the code in view: the reveal opens right under it, and the reader scrolls on when ready.
    (app.querySelector(focus) as HTMLElement | null)?.focus({ preventScroll: true });
  }
  animate = false;
}

// ---------------------------------------------------------------- input

app.addEventListener("click", (event) => {
  const el = (event.target as HTMLElement).closest<HTMLElement>("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  if (act === "sound") {
    saved.sound = !saved.sound;
    sound.setSound(saved.sound);
    persist();
    el.setAttribute("aria-pressed", String(saved.sound));
    if (saved.sound) sound.click();
  } else if (act === "start") {
    sound.click();
    start(CHAPTERS[Number(el.dataset.chapter)]);
  } else if (act === "home") {
    screen = { name: "home" };
    animate = true;
    render();
  } else if (act === "retry" && screen.name === "end") {
    start(screen.run.chapter);
  } else if (act === "accept" || act === "reject") {
    answerVerdict(act);
  } else if (act === "joker") {
    useJoker();
  } else if (act === "choice") {
    answerChoice(Number(el.dataset.choice));
  } else if (act === "view" && screen.name === "play") {
    screen.turn.viewing = Number(el.dataset.choice);
    screen.turn.outputOpen = true;
    render();
    (app.querySelector(`.tab[data-choice="${el.dataset.choice}"]`) as HTMLElement | null)?.focus({ preventScroll: true });
  } else if (act === "next") {
    next();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key.toLowerCase();
  const target = event.target as HTMLElement;

  if (screen.name === "home" && /^[1-9]$/.test(key) && CHAPTERS[Number(key) - 1]) {
    start(CHAPTERS[Number(key) - 1]);
    return;
  }
  if (screen.name !== "play") return;
  const { turn } = screen;

  if (turn.phase === "ask") {
    if (turn.q.kind === "verdict" && (key === "a" || key === "r")) answerVerdict(key === "a" ? "accept" : "reject");
    else if (key === "j") useJoker();
    else if (turn.q.kind !== "verdict" && /^[1-9]$/.test(key) && turn.order[Number(key) - 1] !== undefined) answerChoice(turn.order[Number(key) - 1]);
  } else if (turn.phase === "reveal" && (key === "n" || (key === "enter" && !target.closest("button")))) {
    next();
  }
});

render();

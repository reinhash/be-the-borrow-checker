// Question shapes, and the programs each question asks rustc about. The game and
// scripts/verify.ts both call programsOf(), so the game can only show results
// that rustc actually produced for exactly this source.

/** What rustc says about a program: it compiles (and prints stdout), or it is rejected. */
export type Expect =
  | { ok: true }
  | {
      ok: false;
      /** Error code of the first error ("E0382"), or its message when it has no code. */
      error: string;
      /** 1-based line of the first error's primary span: the line marked in the reveal. */
      line: number;
    };

interface Base {
  id: string;
  /** Short concept label shown on the card. */
  topic: string;
  code: string;
  /** Shown after answering. `backticks` become inline code. */
  explain: string;
}

/** Does this compile? Stamp ACCEPT or REJECT. */
export interface Verdict extends Base {
  kind: "verdict";
  expect: Expect;
}

/** What does this print? A choice can also be COMPILE_ERROR or PANIC. */
export interface Output extends Base {
  kind: "output";
  choices: string[];
  answer: number;
}

/** The code is rejected; pick the replacement for `line` that compiles and prints `goal`. */
export interface Fix extends Base {
  kind: "fix";
  expect: Extract<Expect, { ok: false }>;
  line: number;
  goal: string;
  /** Replacement code for `line`, without its indentation (it keeps the original's). */
  choices: string[];
  answer: number;
}

export type Question = Verdict | Output | Fix;

export interface Chapter {
  id: string;
  number: string;
  /** Which chapters of The Rust Programming Language this draws on, e.g. "Book ch. 4". */
  book: string;
  name: string;
  blurb: string;
  questions: Question[];
  /** Also draw this many random questions from the other chapters. */
  mixIn?: number;
}

export const COMPILE_ERROR = "<compile error>";
export const PANIC = "<panic>";

/** What rustc reported, keyed by hash of the source, written by scripts/verify.ts. */
export interface Result {
  ok: boolean;
  /** Codes (or messages, if uncoded) of every error, in order. */
  errors: string[];
  line?: number;
  /** rustc's own rendered error output. */
  rendered?: string;
  stdout?: string;
  panicked?: boolean;
  /** The panic message, for programs that panic. */
  stderr?: string;
}

export interface Verified {
  rustc: string;
  edition: string;
  results: Record<string, Result>;
}

/** Strips the leading newline and the common indentation, so snippets can be indented in source. */
export function rs(strings: TemplateStringsArray, ...values: unknown[]): string {
  const raw = String.raw({ raw: strings }, ...values).replace(/^\n/, "").replace(/\n[ \t]*$/, "");
  const lines = raw.split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(indent)).join("\n");
}

/** FNV-1a, enough to key results by source in the browser and in Node alike. */
export function hash(source: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < source.length; i++) {
    h ^= source.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function patch(code: string, line: number, replacement: string): string {
  const lines = code.split("\n");
  const indent = lines[line - 1].match(/^ */)![0];
  lines.splice(line - 1, 1, ...replacement.split("\n").map((l) => indent + l));
  return lines.join("\n");
}

/** How a program behaves, in the same terms as an Output choice. */
export function outcome(result: Result): string {
  if (!result.ok) return COMPILE_ERROR;
  if (result.panicked) return PANIC;
  return result.stdout!.trim();
}

export interface Program {
  source: string;
  /** For Fix questions: which choice this program is. */
  choice?: number;
}

export function programsOf(q: Question): Program[] {
  const base = [{ source: q.code }];
  if (q.kind !== "fix") return base;
  return [...base, ...q.choices.map((c, choice) => ({ source: patch(q.code, q.line, c), choice }))];
}

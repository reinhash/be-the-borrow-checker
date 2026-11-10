// Checks without rustc that src/verified.json belongs to the questions as they
// are now: every program has a result and nothing is left over. If a snippet
// was edited after the last `npm run verify`, this fails. It also checks the
// parts of a question that rustc doesn't see.
import verifiedJson from "../src/verified.json";
import { CHAPTERS } from "../src/questions";
import { key, programsOf, type Verified } from "../src/types";

const verified = verifiedJson as Verified;
let failures = 0;
function check(ok: boolean, message: string): void {
  if (!ok) {
    failures++;
    console.error(`✗ ${message}`);
  }
}

const needed = new Set<string>();
for (const chapter of CHAPTERS) {
  check(chapter.questions.length > 0, `${chapter.id}: no questions`);
  for (const q of chapter.questions) {
    for (const p of programsOf(q)) {
      const k = key(p.source, p.test);
      needed.add(k);
      check(k in verified.results, `${q.id}${p.choice === undefined ? "" : ` choice ${p.choice}`}: not verified. Run npm run verify.`);
    }
    for (const text of [q.explain, chapter.name]) check(text.split("`").length % 2 === 1, `${q.id}: unbalanced backticks`);
    check(!/\/\*/.test(q.code), `${q.id}: block comments aren't supported by the line highlighter`);
    if (q.kind !== "verdict") check(q.choices.length >= 2 && q.choices.length <= 4, `${q.id}: needs 2 to 4 choices`);
  }
}
for (const k of Object.keys(verified.results)) check(needed.has(k), `verified.json has a stale result ${k}. Run npm run verify.`);

if (failures) {
  console.error(`${failures} problem(s)`);
  process.exit(1);
}
console.log(`✓ ${needed.size} programs match src/verified.json (${verified.rustc})`);

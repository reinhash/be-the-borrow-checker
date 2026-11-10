// Compiles every program in the quiz with the local rustc, runs the ones that
// compile, and checks every claim a question makes: whether it compiles, the
// first error's code and line, the printed output, and that a fix question
// has exactly one choice that compiles and prints its goal. Writes what rustc
// said to src/verified.json, which the game shows after each answer.
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { CHAPTERS } from "../src/questions";
import { hash, outcome, programsOf, type Result, type Verified } from "../src/types";

const run = promisify(execFile);
const EDITION = "2024";
const MAX_WIDTH = 54;

interface Diagnostic {
  message: string;
  code: { code: string } | null;
  level: string;
  spans: { is_primary: boolean; line_start: number }[];
  rendered: string;
}

async function compile(source: string): Promise<Result & { warnings: string[] }> {
  const dir = await mkdtemp(join(tmpdir(), "borrow-"));
  try {
    // Named src/main.rs so rustc's output reads like a normal cargo project.
    await run("mkdir", ["-p", join(dir, "src")]);
    await writeFile(join(dir, "src/main.rs"), source + "\n");
    const bin = join(dir, "main");
    const out = await run(
      "rustc",
      ["--edition", EDITION, "--error-format=json", "--color", "never", "--crate-name", "main", "-o", bin, "src/main.rs"],
      { cwd: dir }
    ).then(
      (r) => r.stderr,
      (e) => e.stderr as string
    );
    const diagnostics: Diagnostic[] = out
      .split("\n")
      .filter((l) => l.startsWith("{"))
      .map((l) => JSON.parse(l))
      .filter((d) => d.$message_type === "diagnostic");
    const errors = diagnostics.filter((d) => d.level === "error" && !d.message.startsWith("aborting due to"));
    const warnings = diagnostics.filter((d) => d.level === "warning").map((d) => d.rendered);

    if (errors.length) {
      const primary = errors[0].spans.find((s) => s.is_primary);
      return {
        ok: false,
        errors: errors.map((d) => d.code?.code ?? d.message),
        line: primary?.line_start,
        // Notes into the standard library carry the local toolchain path; keep the home directory out of the site.
        rendered: errors
          .map((d) => d.rendered.trimEnd())
          .join("\n\n")
          .replaceAll(homedir(), "~"),
        warnings
      };
    }

    // macOS checks each new binary on its first launch, which takes seconds when eight start at once.
    const result = await run(bin, [], { timeout: 30000 }).then(
      (r) => ({ stdout: r.stdout, panicked: false }),
      (e) => ({ stdout: e.stdout as string, stderr: e.stderr as string, panicked: e.code === 101, failed: e.code !== 101 })
    );
    if ("failed" in result) {
      if (result.failed) throw new Error(`program exited unexpectedly:\n${source}`);
      return { ok: true, errors: [], stdout: result.stdout, // The thread id changes every run; drop it so verified.json only changes when rustc does.
        stderr: result.stderr.trim().replace(/^thread 'main' \(\d+\)/m, "thread 'main'"),
        panicked: true, warnings };
    }
    return { ok: true, errors: [], ...result, warnings };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const failures: string[] = [];
function check(ok: boolean, message: string): void {
  if (!ok) failures.push(message);
}

const { stdout: version } = await run("rustc", ["--version"]);
const sources = new Map<string, string>();
for (const chapter of CHAPTERS) {
  for (const q of chapter.questions) for (const p of programsOf(q)) sources.set(hash(p.source), p.source);
}

// Compile in parallel; rustc is single-threaded for programs this small.
const results = new Map<string, Result & { warnings: string[] }>();
const queue = [...sources];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) results.set(next[0], await compile(next[1]));
  })
);

const ids = new Set<string>();
for (const chapter of CHAPTERS) {
  for (const q of chapter.questions) {
    const where = `${chapter.id}/${q.id}`;
    check(!ids.has(q.id), `${where}: duplicate id`);
    ids.add(q.id);

    for (const p of programsOf(q)) {
      const r = results.get(hash(p.source))!;
      const label = p.choice === undefined ? where : `${where} choice ${p.choice}`;
      for (const line of p.source.split("\n")) {
        check(line.length <= MAX_WIDTH, `${label}: line wider than ${MAX_WIDTH} columns: ${line}`);
      }
      // A program that compiles must do so cleanly, so no stray warning distracts from the lesson.
      if (r.ok) check(r.warnings.length === 0, `${label}: compiles with warnings:\n${r.warnings.join("\n")}`);
    }

    const base = results.get(hash(q.code))!;
    const describe = (r: Result) => (r.ok ? `compiles, prints ${JSON.stringify(outcome(r))}` : `${r.errors.join(", ")} at line ${r.line}`);

    if (q.kind === "verdict" || q.kind === "fix") {
      const e = q.expect;
      if (e.ok) {
        check(base.ok, `${where}: expected to compile, but rustc says ${describe(base)}`);
      } else {
        check(!base.ok && base.errors[0] === e.error && base.line === e.line, `${where}: expected ${e.error} at line ${e.line}, but rustc says ${describe(base)}`);
      }
    }

    if (q.kind === "output") {
      const got = outcome(base);
      check(q.choices[q.answer] === got, `${where}: answer is ${JSON.stringify(q.choices[q.answer])} but the program gives ${JSON.stringify(got)}`);
      check(new Set(q.choices).size === q.choices.length, `${where}: duplicate choices`);
    }

    if (q.kind === "fix") {
      check(q.line >= 1 && q.line <= q.code.split("\n").length, `${where}: line ${q.line} is out of range`);
      programsOf(q).forEach((p) => {
        if (p.choice === undefined) return;
        const r = results.get(hash(p.source))!;
        const wins = outcome(r) === q.goal;
        if (p.choice === q.answer) check(wins, `${where}: the answer should print ${JSON.stringify(q.goal)}, but ${describe(r)}`);
        else check(!wins, `${where}: choice ${p.choice} also works (${describe(r)})`);
      });
    }

    if (q.kind !== "verdict") check(q.answer >= 0 && q.answer < q.choices.length, `${where}: answer out of range`);
  }
}

if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}\n`);
  console.error(`${failures.length} problem(s). src/verified.json was not updated.`);
  process.exit(1);
}

const verified: Verified = {
  rustc: version.trim(),
  edition: EDITION,
  results: Object.fromEntries([...results].sort(([a], [b]) => a.localeCompare(b)).map(([k, { warnings: _, ...r }]) => [k, r]))
};
// Run from the package root by npm; the bundled script itself lives in node_modules/.cache.
writeFileSync("src/verified.json", JSON.stringify(verified, null, 2) + "\n");
console.log(`✓ ${sources.size} programs verified with ${verified.rustc}, edition ${EDITION}`);

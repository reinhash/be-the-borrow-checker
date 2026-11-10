// A small Rust highlighter for single lines. The snippets have no block comments
// or multi-line strings, so each line can be coloured on its own, and lifetimes
// get a colour of their own since they are half of what this game is about.
const KEYWORDS = new Set(
  "as break const continue crate else enum false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while dyn".split(
    " "
  )
);
const PRIMITIVES = new Set("i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 bool char str".split(" "));

const TOKEN =
  /(\/\/.*$)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])')|('[a-z_]\w*)|(#!?\[[^\]]*\])|(\b\d[\d_]*(?:\.\d+)?\b)|(\b[a-z_]\w*!)|(\b[A-Za-z_]\w*\b)/g;

export function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function highlight(line: string): string {
  let out = "";
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    out += escapeHtml(line.slice(last, m.index));
    last = m.index! + m[0].length;
    const [text, comment, string, char, lifetime, attr, number, macro, word] = m;
    let kind = "";
    if (comment) kind = "comment";
    else if (string || char) kind = "string";
    else if (lifetime) kind = "lifetime";
    else if (attr) kind = "attr";
    else if (number) kind = "number";
    else if (macro) kind = "macro";
    else if (word) {
      if (KEYWORDS.has(word)) kind = "keyword";
      else if (PRIMITIVES.has(word) || /^[A-Z]/.test(word)) kind = "type";
      else if (line[last] === "(") kind = "fn";
    }
    out += kind ? `<span class="t-${kind}">${escapeHtml(text)}</span>` : escapeHtml(text);
  }
  return out + escapeHtml(line.slice(last));
}

/** Prose with `backtick` spans turned into inline code. */
export function prose(text: string): string {
  return text
    .split("`")
    .map((part, i) => (i % 2 ? `<code>${escapeHtml(part)}</code>` : escapeHtml(part)))
    .join("");
}

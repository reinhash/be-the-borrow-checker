// Chapters follow the order of The Rust Programming Language ("the book"); `book` says which of its
// chapters each one draws on.
// Every snippet here is compiled (and, if it compiles, run) by scripts/verify.ts,
// which fails the build if any expectation, line number or answer is wrong.
import { COMPILE_ERROR, PANIC, rs, type Chapter } from "./types";

const basics: Chapter = {
  id: "basics",
  number: "01",
  book: "Book ch. 1–3",
  name: "First steps",
  blurb: "Variables, types, expressions and control flow.",
  questions: [
    {
      id: "println-is-macro",
      kind: "verdict",
      topic: "Macros end in !",
      code: rs`
        fn main() {
            println("hello");
        }
      `,
      expect: { ok: false, error: "E0423", line: 2 },
      explain:
        "`println!` is a macro, not a function. A macro is code that writes other code at compile time, and it is always called with a `!`. Without it, the compiler looks for a function named `println` and finds none."
    },
    {
      id: "immutable-assign",
      kind: "verdict",
      topic: "Immutable by default",
      code: rs`
        fn main() {
            let x = 5;
            x = 6;
            println!("{x}");
        }
      `,
      expect: { ok: false, error: "E0384", line: 3 },
      explain:
        "A variable made with `let` can't be assigned a second time. Write `let mut x` to allow changes. Rust makes you ask for mutability so that a value you didn't mark can be relied on not to change."
    },
    {
      id: "shadow-type",
      kind: "verdict",
      topic: "Shadowing",
      code: rs`
        fn main() {
            let spaces = "   ";
            let spaces = spaces.len();
            println!("{spaces}");
        }
      `,
      expect: { ok: true },
      explain:
        "A second `let` with the same name creates a new variable that hides the first. This is called shadowing. Because it is a new variable, it may have a different type: first a `&str`, then a number. It prints `3`."
    },
    {
      id: "mut-type-change",
      kind: "verdict",
      topic: "mut keeps the type",
      code: rs`
        fn main() {
            let mut spaces = "   ";
            spaces = spaces.len();
            println!("{spaces}");
        }
      `,
      expect: { ok: false, error: "E0308", line: 3 },
      explain:
        "`mut` lets you change a variable's value, never its type. `spaces` is a `&str`, and `spaces.len()` is a number. Only shadowing with a new `let` can switch types."
    },
    {
      id: "const-needs-type",
      kind: "verdict",
      topic: "Constants",
      code: rs`
        const MAX_POINTS = 100;

        fn main() {
            println!("{MAX_POINTS}");
        }
      `,
      expect: { ok: false, error: "missing type for `const` item", line: 1 },
      explain:
        "A `let` can leave its type to be inferred, but a `const` must always state it: `const MAX_POINTS: u32 = 100;`. Constants are fixed at compile time and visible to other code, so their type is written down, not guessed from use."
    },
    {
      id: "block-expression",
      kind: "output",
      topic: "Blocks are expressions",
      code: rs`
        fn main() {
            let y = {
                let x = 3;
                x + 1
            };
            println!("{y}");
        }
      `,
      choices: ["4", "3", COMPILE_ERROR],
      answer: 0,
      explain:
        "A block `{ ... }` is an expression: it produces the value of its last line, as long as that line has no semicolon. `x + 1` is that last line, so the block is worth `4`."
    },
    {
      id: "fix-semicolon-return",
      kind: "fix",
      topic: "Statements and expressions",
      code: rs`
        fn plus_one(x: i32) -> i32 {
            x + 1;
        }

        fn main() {
            println!("{}", plus_one(5));
        }
      `,
      expect: { ok: false, error: "E0308", line: 1 },
      line: 2,
      goal: "6",
      choices: ["x + 1", "x + 1;;", "let y = x + 1;"],
      answer: 0,
      explain:
        "A function returns the value of its last expression. A semicolon turns an expression into a statement, which produces no value, so the body ends with nothing where an `i32` was promised. Removing the semicolon is the fix."
    },
    {
      id: "if-needs-bool",
      kind: "verdict",
      topic: "if takes a bool",
      code: rs`
        fn main() {
            let number = 3;
            if number {
                println!("not zero");
            }
        }
      `,
      expect: { ok: false, error: "E0308", line: 3 },
      explain:
        "The condition of an `if` must be a `bool`. Rust never converts a number to true or false for you. Write the comparison out: `if number != 0`."
    },
    {
      id: "if-arms-same-type",
      kind: "verdict",
      topic: "if is an expression",
      code: rs`
        fn main() {
            let lucky = true;
            let n = if lucky { 5 } else { "six" };
            println!("{n}");
        }
      `,
      expect: { ok: false, error: "E0308", line: 3 },
      explain:
        "`if` is an expression, so it can sit on the right of a `let`. Both branches must then produce the same type, because `n` needs one type known at compile time. Here one branch is a number and the other a string."
    },
    {
      id: "array-out-of-bounds",
      kind: "output",
      topic: "Array bounds",
      code: rs`
        fn main() {
            let a = [10, 20, 30];
            let i: usize = "3".parse().unwrap();
            println!("{}", a[i]);
        }
      `,
      choices: ["30", "0", PANIC, COMPILE_ERROR],
      answer: 2,
      explain:
        "Indexes start at 0, so a three-element array has indexes 0 to 2. Every index is checked while the program runs. An index past the end stops the program with a panic (a controlled crash with a message) and never reads whatever memory lies beyond the array."
    },
    {
      id: "integer-overflow",
      kind: "output",
      topic: "Integer overflow",
      code: rs`
        fn main() {
            let big: u8 = "255".parse().unwrap();
            let bigger = big + 1;
            println!("{bigger}");
        }
      `,
      choices: ["256", "0", PANIC, COMPILE_ERROR],
      answer: 2,
      explain:
        "A `u8` holds 0 to 255, so `255 + 1` does not fit. This is called integer overflow. In a debug build, which is what plain `cargo run` makes, overflow panics. In a `--release` build it wraps around to `0`. Use `wrapping_add` or `checked_add` to pick the behaviour yourself."
    },
    {
      id: "loop-break-value",
      kind: "output",
      topic: "loop returns a value",
      code: rs`
        fn main() {
            let mut n = 0;
            let x = loop {
                n += 1;
                if n == 3 {
                    break n * 10;
                }
            };
            println!("{x}");
        }
      `,
      choices: ["30", "3", "20", COMPILE_ERROR],
      answer: 0,
      explain:
        "`loop` repeats until a `break`. A value written after `break` becomes the value of the whole `loop` expression. The loop stops when `n` is `3`, and hands back `3 * 10`."
    },
    {
      id: "range-rev",
      kind: "output",
      topic: "Ranges",
      code: rs`
        fn main() {
            for i in (1..4).rev() {
                print!("{i} ");
            }
        }
      `,
      choices: ["3 2 1", "4 3 2 1", "4 3 2"],
      answer: 0,
      explain:
        "The range `1..4` includes its start and leaves out its end: 1, 2, 3. Write `1..=4` to include the 4. `rev()` walks the same numbers backwards."
    },
    {
      id: "guess-compare",
      kind: "output",
      topic: "parse and match",
      code: rs`
        use std::cmp::Ordering;

        fn main() {
            let typed = "  42  ";
            let guess: u32 = typed.trim().parse().unwrap();
            let word = match guess.cmp(&50) {
                Ordering::Less => "too small",
                Ordering::Greater => "too big",
                Ordering::Equal => "you win",
            };
            println!("{word}");
        }
      `,
      choices: ["too small", "too big", PANIC, COMPILE_ERROR],
      answer: 0,
      explain:
        "This is the core of the book's guessing game. `trim` removes the spaces and line breaks around typed input, `parse` turns the text into the `u32` the annotation asks for, and `cmp` compares two numbers and answers with one of three `Ordering` values."
    },
    {
      id: "parse-needs-type",
      kind: "verdict",
      topic: "parse and match",
      code: rs`
        fn main() {
            let guess = "42".parse().unwrap();
            println!("{guess}");
        }
      `,
      expect: { ok: false, error: "E0284", line: 2 },
      explain:
        "`parse` can produce many types: `u32`, `i64`, `f64` and more. Nothing here says which one is wanted, so the type can't be inferred. Annotate the variable (`let guess: u32`) or the call (`parse::<u32>()`)."
    }
  ]
};

const ownership: Chapter = {
  id: "ownership",
  number: "02",
  book: "Book ch. 4",
  name: "Who owns this?",
  blurb: "Moves, copies, clones and drops. Every value has exactly one owner.",
  questions: [
    {
      id: "move-string",
      kind: "verdict",
      topic: "Move",
      code: rs`
        fn main() {
            let a = String::from("crab");
            let b = a;
            println!("{a} and {b}");
        }
      `,
      expect: { ok: false, error: "E0382", line: 4 },
      explain:
        "`let b = a` moves the `String`. `b` owns the heap buffer now, and `a` is gone. Reading `a` afterwards is a use after move. Write `a.clone()` for a second string, or `&a` to borrow."
    },
    {
      id: "copy-int",
      kind: "verdict",
      topic: "Copy",
      code: rs`
        fn main() {
            let a = 42;
            let b = a;
            println!("{a} and {b}");
        }
      `,
      expect: { ok: true },
      explain:
        "Integers are `Copy`: `let b = a` copies the bits and both stay usable. A type can only be `Copy` if copying its bits is enough. `String` owns heap memory, so it is not."
    },
    {
      id: "clone-vec",
      kind: "output",
      topic: "Clone",
      code: rs`
        fn main() {
            let mut v = vec![1, 2, 3];
            let w = v.clone();
            v.push(4);
            println!("{} {}", v.len(), w.len());
        }
      `,
      choices: ["4 4", "4 3", "3 3", COMPILE_ERROR],
      answer: 1,
      explain:
        "`clone()` makes a deep copy with its own heap buffer. Pushing to `v` leaves `w` alone, so you get two owners of two separate vectors."
    },
    {
      id: "move-into-fn",
      kind: "verdict",
      topic: "Move into a call",
      code: rs`
        fn shout(s: String) -> usize {
            s.len()
        }

        fn main() {
            let name = String::from("ferris");
            let n = shout(name);
            println!("{name} has {n} letters");
        }
      `,
      expect: { ok: false, error: "E0382", line: 8 },
      explain:
        "Passing a `String` by value moves it into the function, just like `let`. `shout` drops it when it returns, so `name` is gone by the time `println!` wants it."
    },
    {
      id: "fix-move-into-fn",
      kind: "fix",
      topic: "Move into a call",
      code: rs`
        fn shout(s: String) -> usize {
            s.len()
        }

        fn main() {
            let name = String::from("ferris");
            let n = shout(name);
            println!("{name} has {n} letters");
        }
      `,
      expect: { ok: false, error: "E0382", line: 8 },
      line: 7,
      goal: "ferris has 6 letters",
      choices: ["let n = shout(name.clone());", "let n = shout(&name);", "let n = shout(name.as_str());"],
      answer: 0,
      explain:
        "`shout` wants an owned `String`, so you can't hand it a borrow (`&String` or `&str`): the types don't match. Cloning gives it a copy to own and drop. The better long-term fix is changing `shout` to take `&str`."
    },
    {
      id: "copy-struct",
      kind: "verdict",
      topic: "Derive Copy",
      code: rs`
        #[derive(Clone, Copy)]
        struct Point {
            x: i32,
            y: i32,
        }

        fn main() {
            let p = Point { x: 1, y: 2 };
            let q = p;
            println!("{}", p.x + q.y);
        }
      `,
      expect: { ok: true },
      explain:
        "Every field is `Copy`, so the struct can derive `Copy` too. `let q = p` then copies the value instead of moving it, and `p` stays valid. It prints `3`."
    },
    {
      id: "move-out-of-index",
      kind: "verdict",
      topic: "Move out of a Vec",
      code: rs`
        fn main() {
            let names = vec![String::from("Ann")];
            let first = names[0];
            println!("{first}");
        }
      `,
      expect: { ok: false, error: "E0507", line: 3 },
      explain:
        "`names[0]` is a place inside the vector. Moving the `String` out would leave a hole the `Vec` still thinks it owns, so Rust refuses. Borrow it with `&names[0]`, clone it, or take it out with `remove` or `swap_remove`."
    },
    {
      id: "fix-move-out-of-index",
      kind: "fix",
      topic: "Move out of a Vec",
      code: rs`
        fn main() {
            let names = vec![String::from("Ann")];
            let first = names[0];
            println!("{first}");
        }
      `,
      expect: { ok: false, error: "E0507", line: 3 },
      line: 3,
      goal: "Ann",
      choices: ["let first = &names[0];", "let first: String = names[0];", "let first = names.get(0);"],
      answer: 0,
      explain:
        "A shared borrow is all `println!` needs. A type annotation doesn't make a move legal. `get(0)` compiles on its own but gives an `Option<&String>`, which doesn't implement `Display`, so `{first}` is rejected."
    },
    {
      id: "move-in-loop",
      kind: "verdict",
      topic: "Move in a loop",
      code: rs`
        fn eat(s: String) {
            println!("nom {s}");
        }

        fn main() {
            let snack = String::from("kelp");
            for _ in 0..2 {
                eat(snack);
            }
        }
      `,
      expect: { ok: false, error: "E0382", line: 8 },
      explain:
        "The first pass of the loop moves `snack` into `eat`. The second pass would move it again, but it is already gone. rustc says so: \"value moved here, in previous iteration of loop\"."
    },
    {
      id: "drop-order",
      kind: "output",
      topic: "Drop order",
      code: rs`
        struct Noisy(&'static str);

        impl Drop for Noisy {
            fn drop(&mut self) {
                print!("{} ", self.0);
            }
        }

        fn main() {
            let _a = Noisy("a");
            let _b = Noisy("b");
            print!("hi ");
        }
      `,
      choices: ["hi a b", "hi b a", "a b hi", "b a hi"],
      answer: 1,
      explain:
        "Locals are dropped at the end of their scope, in reverse order of declaration. That way a later value, which might borrow from an earlier one, is always gone first."
    },
    {
      id: "underscore-drop",
      kind: "output",
      topic: "let _",
      code: rs`
        struct Noisy(&'static str);

        impl Drop for Noisy {
            fn drop(&mut self) {
                print!("{} ", self.0);
            }
        }

        fn main() {
            let _ = Noisy("a");
            let _b = Noisy("b");
            print!("hi ");
        }
      `,
      choices: ["hi b a", "a hi b", "hi a b", COMPILE_ERROR],
      answer: 1,
      explain:
        "`_` is not a variable, so nothing owns the value and it is dropped right away. `_b` is a real binding and lives to the end of `main`. This is why `let _ = mutex.lock();` doesn't hold the lock."
    },
    {
      id: "shadowing",
      kind: "output",
      topic: "Shadowing",
      code: rs`
        fn main() {
            let s = String::from("a");
            let r = &s;
            let s = String::from("b");
            println!("{r}{s}");
        }
      `,
      choices: ["bb", "ab", "ba", COMPILE_ERROR],
      answer: 1,
      explain:
        "The second `let s` makes a new variable that hides the first. It does not reassign or drop it. The first string stays alive until the end of `main`, so `r` still points at `\"a\"`."
    },
    {
      id: "for-moves-vec",
      kind: "verdict",
      topic: "for takes ownership",
      code: rs`
        fn main() {
            let names = vec![String::from("Ann")];
            for n in names {
                println!("{n}");
            }
            println!("{}", names.len());
        }
      `,
      expect: { ok: false, error: "E0382", line: 6 },
      explain:
        "`for n in names` moves the whole vector into the loop, which then hands out each `String` by value. After the loop `names` is gone. Write `for n in &names` to loop over borrows and keep the vector."
    },
    {
      id: "give-back",
      kind: "verdict",
      topic: "Returning ownership",
      code: rs`
        fn add_bang(mut s: String) -> String {
            s.push('!');
            s
        }

        fn main() {
            let a = String::from("hi");
            let a = add_bang(a);
            println!("{a}");
        }
      `,
      expect: { ok: true },
      explain:
        "The `String` moves into `add_bang`, and the return value moves it back out to the caller. Ownership went in and came back, so nothing is used after a move. It prints `hi!`."
    }
  ]
};

const borrowing: Chapter = {
  id: "borrowing",
  number: "03",
  book: "Book ch. 4",
  name: "Many readers or one writer",
  blurb: "Shared borrows, mutable borrows, and why you never get both at once.",
  questions: [
    {
      id: "two-shared",
      kind: "verdict",
      topic: "Shared borrows",
      code: rs`
        fn main() {
            let s = String::from("crab");
            let a = &s;
            let b = &s;
            println!("{a} {b} {s}");
        }
      `,
      expect: { ok: true },
      explain:
        "You can have as many `&` borrows as you like at the same time. Nobody can change the string while they exist, so they can't disagree about it."
    },
    {
      id: "two-mut",
      kind: "verdict",
      topic: "&mut is exclusive",
      code: rs`
        fn main() {
            let mut score = 0;
            let a = &mut score;
            let b = &mut score;
            *a += 1;
            *b += 1;
        }
      `,
      expect: { ok: false, error: "E0499", line: 4 },
      explain:
        "A `&mut` borrow is exclusive. `a` is still used on line 5, so it is alive when `b` is created on line 4, and you can't have two mutable borrows of `score` at once."
    },
    {
      id: "nll",
      kind: "verdict",
      topic: "Borrows end at last use",
      code: rs`
        fn main() {
            let mut score = 0;
            let a = &mut score;
            *a += 1;
            let b = &mut score;
            *b += 1;
            println!("{score}");
        }
      `,
      expect: { ok: true },
      explain:
        "Since Rust 2018's non-lexical lifetimes, a borrow lasts until its last use, not until the end of the block. `a` is finished on line 4, so `b` is the only mutable borrow. It prints `2`."
    },
    {
      id: "not-mut",
      kind: "verdict",
      topic: "mut binding",
      code: rs`
        fn main() {
            let v = Vec::new();
            v.push(1);
            println!("{v:?}");
        }
      `,
      expect: { ok: false, error: "E0596", line: 3 },
      explain:
        "`push` takes `&mut self`, and you can only borrow `v` mutably if the binding is declared `let mut v`. Bindings are immutable unless you say otherwise."
    },
    {
      id: "bump",
      kind: "output",
      topic: "&mut parameters",
      code: rs`
        fn bump(n: &mut i32) {
            *n += 10;
        }

        fn main() {
            let mut x = 1;
            bump(&mut x);
            bump(&mut x);
            println!("{x}");
        }
      `,
      choices: ["1", "11", "21", COMPILE_ERROR],
      answer: 2,
      explain:
        "Each `&mut x` borrow ends when `bump` returns, so taking a second one is fine. Both calls write through the reference into the same `x`."
    },
    {
      id: "push-while-borrowed",
      kind: "verdict",
      topic: "Aliasing XOR mutation",
      code: rs`
        fn main() {
            let mut v = vec![1, 2, 3];
            let first = &v[0];
            v.push(4);
            println!("{first}");
        }
      `,
      expect: { ok: false, error: "E0502", line: 4 },
      explain:
        "`push` may reallocate the vector's buffer, which would leave `first` pointing at freed memory. Rust doesn't need to know whether it will. It sees a mutable borrow (`push`) while a shared one (`first`) is still alive, and that is enough to reject it."
    },
    {
      id: "fix-push-while-borrowed",
      kind: "fix",
      topic: "Aliasing XOR mutation",
      code: rs`
        fn main() {
            let mut v = vec![1, 2, 3];
            let first = &v[0];
            v.push(4);
            println!("{first}");
        }
      `,
      expect: { ok: false, error: "E0502", line: 4 },
      line: 3,
      goal: "1",
      choices: ["let first = v[0];", "let first = &mut v[0];", "let first = v.first().unwrap();"],
      answer: 0,
      explain:
        "`i32` is `Copy`, so `v[0]` copies the number out and nothing stays borrowed. A `&mut` borrow conflicts even more. `first().unwrap()` is still a `&i32` into the vector, just spelled differently."
    },
    {
      id: "assign-while-borrowed",
      kind: "verdict",
      topic: "Assigning to a borrowed value",
      code: rs`
        fn main() {
            let mut name = String::from("Ann");
            let r = &name;
            name = String::from("Bob");
            println!("{r}");
        }
      `,
      expect: { ok: false, error: "E0506", line: 4 },
      explain:
        "Assigning to `name` drops the old `\"Ann\"` string, the one `r` points at. `r` is still used on the next line, so the assignment has to wait."
    },
    {
      id: "iterator-invalidation",
      kind: "verdict",
      topic: "Iterator invalidation",
      code: rs`
        fn main() {
            let mut v = vec![1, 2, 3];
            for x in &v {
                if *x == 2 {
                    v.push(4);
                }
            }
        }
      `,
      expect: { ok: false, error: "E0502", line: 5 },
      explain:
        "The `for` loop holds a shared borrow of `v` for as long as it runs. Pushing inside it could reallocate the buffer under the iterator. In C++ this is undefined behaviour; in Rust it doesn't compile."
    },
    {
      id: "disjoint-fields",
      kind: "verdict",
      topic: "Disjoint fields",
      code: rs`
        struct Game {
            score: u32,
            lives: u32,
        }

        fn main() {
            let mut g = Game { score: 0, lives: 3 };
            let s = &mut g.score;
            let l = &mut g.lives;
            *s += 100;
            *l -= 1;
            println!("{} {}", g.score, g.lives);
        }
      `,
      expect: { ok: true },
      explain:
        "Within one function the borrow checker tracks fields separately. `g.score` and `g.lives` don't overlap, so two `&mut` borrows of them are fine. It prints `100 2`."
    },
    {
      id: "refcell-panic",
      kind: "output",
      topic: "RefCell",
      code: rs`
        use std::cell::RefCell;

        fn main() {
            let c = RefCell::new(5);
            let a = c.borrow_mut();
            let b = c.borrow_mut();
            println!("{a} {b}");
        }
      `,
      choices: ["5 5", COMPILE_ERROR, PANIC, "10"],
      answer: 2,
      explain:
        "`RefCell` moves the borrow rules from compile time to run time. The rules still hold: the second `borrow_mut` finds the first one still alive and panics with `RefCell already borrowed`."
    },
    {
      id: "closure-borrow",
      kind: "verdict",
      topic: "Closures borrow too",
      code: rs`
        fn main() {
            let mut count = 0;
            let mut inc = || count += 1;
            println!("{count}");
            inc();
        }
      `,
      expect: { ok: false, error: "E0502", line: 4 },
      explain:
        "A closure that changes `count` holds a mutable borrow of it for as long as the closure is alive. `inc` is called on line 5, so `count` can't be read on line 4. Move the `println!` after `inc()` and it's fine."
    },
    {
      id: "push-len",
      kind: "output",
      topic: "Two-phase borrows",
      code: rs`
        fn main() {
            let mut v = vec![10, 20];
            v.push(v.len());
            println!("{v:?}");
        }
      `,
      choices: ["[10, 20, 2]", "[10, 20, 3]", COMPILE_ERROR],
      answer: 0,
      explain:
        "`push` borrows `v` mutably and `v.len()` borrows it shared, in one expression. It is allowed because of two-phase borrows: the `&mut` for a method call only becomes exclusive once the arguments have been worked out. `v.len()` is `2` at that point."
    },
    {
      id: "slice-then-clear",
      kind: "verdict",
      topic: "Slices are borrows",
      code: rs`
        fn main() {
            let mut s = String::from("hello world");
            let word = &s[..5];
            s.clear();
            println!("{word}");
        }
      `,
      expect: { ok: false, error: "E0502", line: 4 },
      explain:
        "A slice like `&s[..5]` is a reference into the string's own buffer, so it is a shared borrow of `s`. `clear` needs `&mut self` and would empty the text `word` points at, while `word` is still used on line 5."
    }
  ]
};

const data: Chapter = {
  id: "data",
  number: "04",
  book: "Book ch. 5, 6, 19",
  name: "Shapes of data",
  blurb: "Structs, enums, match and the patterns that take them apart.",
  questions: [
    {
      id: "struct-update-moves",
      kind: "verdict",
      topic: "Struct update syntax",
      code: rs`
        struct User {
            name: String,
            age: u32,
        }

        fn main() {
            let a = User {
                name: String::from("Ann"),
                age: 30,
            };
            let b = User { age: 31, ..a };
            println!("{} {} {}", a.name, b.name, b.age);
        }
      `,
      expect: { ok: false, error: "E0382", line: 12 },
      explain:
        "`..a` fills in the fields you didn't list from `a`. That is called struct update syntax, and it moves those fields like `=` would. `name` is a `String`, so it moved into `b`, and `a.name` can't be read afterwards."
    },
    {
      id: "struct-update-copies",
      kind: "verdict",
      topic: "Struct update syntax",
      code: rs`
        struct User {
            name: String,
            age: u32,
        }

        fn main() {
            let a = User {
                name: String::from("Ann"),
                age: 30,
            };
            let b = User { name: String::from("Bob"), ..a };
            println!("{} {}", a.name, a.age);
            println!("{} {}", b.name, b.age);
        }
      `,
      expect: { ok: true },
      explain:
        "This time `b` gets a `name` of its own, so `..a` only takes `age`. A `u32` is `Copy`, which means it is copied and nothing is moved. `a` stays fully usable. It prints `Ann 30`, then `Bob 30`."
    },
    {
      id: "assoc-fn-not-method",
      kind: "verdict",
      topic: "Methods and associated functions",
      code: rs`
        struct Rect {
            w: u32,
            h: u32,
        }

        impl Rect {
            fn square(side: u32) -> Rect {
                Rect { w: side, h: side }
            }
            fn area(&self) -> u32 {
                self.w * self.h
            }
        }

        fn main() {
            let r = Rect::square(3);
            println!("{}", r.area());
            let s = r.square(2);
            println!("{}", s.area());
        }
      `,
      expect: { ok: false, error: "E0599", line: 18 },
      explain:
        "A function in an `impl` block with a `self` parameter is a method, called with a dot: `r.area()`. One without `self`, like `square`, is an associated function. It belongs to the type, not to a value, and is called as `Rect::square(2)`."
    },
    {
      id: "fix-debug-print",
      kind: "fix",
      topic: "Printing a struct",
      code: rs`
        #[derive(Debug)]
        struct Point {
            x: i32,
            y: i32,
        }

        fn main() {
            let p = Point { x: 1, y: 2 };
            println!("{p} {}", p.x + p.y);
        }
      `,
      expect: { ok: false, error: "E0277", line: 9 },
      line: 9,
      goal: "Point { x: 1, y: 2 } 3",
      choices: [
        'println!("{p:?} {}", p.x + p.y);',
        'println!("{} {}", p, p.x + p.y);',
        'println!("{p:#} {}", p.x + p.y);'
      ],
      answer: 0,
      explain:
        "`{}` prints with the `Display` trait, meant for end users, and no struct has it unless you write it. `{:?}` prints with `Debug`, meant for developers, which `#[derive(Debug)]` generates for you. `{p:#}` is still `Display`, only with a formatting flag."
    },
    {
      id: "tuple-struct-types",
      kind: "verdict",
      topic: "Tuple structs",
      code: rs`
        struct Meters(u32);
        struct Feet(u32);

        fn climb(m: Meters) -> u32 {
            m.0
        }

        fn main() {
            println!("{}", climb(Feet(3)));
        }
      `,
      expect: { ok: false, error: "E0308", line: 9 },
      explain:
        "A tuple struct is a struct whose fields have positions (`.0`) but no names. Each one is a type of its own, even when the insides match. `Feet` is not `Meters`, so mixing up the units is caught at compile time."
    },
    {
      id: "option-not-a-number",
      kind: "verdict",
      topic: "Option",
      code: rs`
        fn main() {
            let x: i32 = 5;
            let y: Option<i32> = Some(5);
            println!("{}", x + y);
        }
      `,
      expect: { ok: false, error: "E0277", line: 4 },
      explain:
        "Rust has no null. A value that may be missing has the type `Option<T>`: either `Some(value)` or `None`. An `Option<i32>` is not an `i32`, so you have to deal with the `None` case (with `match`, `if let` or `unwrap_or`) before you can add."
    },
    {
      id: "match-not-exhaustive",
      kind: "verdict",
      topic: "match covers every case",
      code: rs`
        enum Coin {
            Penny,
            Nickel,
            Dime,
        }

        fn cents(c: Coin) -> u32 {
            match c {
                Coin::Penny => 1,
                Coin::Nickel => 5,
            }
        }

        fn main() {
            let all = [Coin::Penny, Coin::Nickel, Coin::Dime];
            let total: u32 = all.into_iter().map(cents).sum();
            println!("{total}");
        }
      `,
      expect: { ok: false, error: "E0004", line: 8 },
      explain:
        "A `match` must handle every possible value. This is called being exhaustive. `Coin::Dime` has no arm here. Add one, or a catch-all `_ => ...` arm. The check is what makes it safe to add a variant later: every `match` that forgot it stops compiling."
    },
    {
      id: "match-first-arm-wins",
      kind: "output",
      topic: "Match guards",
      code: rs`
        fn main() {
            let n = 7;
            let label = match n {
                x if x > 5 => "big",
                7 => "seven",
                _ => "small",
            };
            println!("{label}");
        }
      `,
      choices: ["big", "seven", "small", COMPILE_ERROR],
      answer: 0,
      explain:
        "Arms are tried from top to bottom and the first one that fits wins. The `if x > 5` after the pattern is a match guard, an extra condition the arm must pass. `7` passes it, so the `7 =>` arm below is never reached."
    },
    {
      id: "enum-with-data",
      kind: "output",
      topic: "Enums carry data",
      code: rs`
        enum Shape {
            Circle(u32),
            Rect { w: u32, h: u32 },
        }

        fn area(s: &Shape) -> u32 {
            match s {
                Shape::Circle(r) => 3 * r * r,
                Shape::Rect { w, h } => w * h,
            }
        }

        fn main() {
            let c = Shape::Circle(2);
            let r = Shape::Rect { w: 2, h: 5 };
            println!("{} {}", area(&c), area(&r));
        }
      `,
      choices: ["12 10", "10 12", "6 7", COMPILE_ERROR],
      answer: 0,
      explain:
        "Each variant of an enum can hold its own data, in a tuple or with named fields. A `match` pattern names the variant and binds the data inside to new variables: `r` for the circle, `w` and `h` for the rectangle."
    },
    {
      id: "match-moves-binding",
      kind: "verdict",
      topic: "Patterns can move",
      code: rs`
        fn main() {
            let name = Some(String::from("Ann"));
            match name {
                Some(n) => println!("{n}"),
                None => println!("nobody"),
            }
            println!("{name:?}");
        }
      `,
      expect: { ok: false, error: "E0382", line: 7 },
      explain:
        "A pattern binds by value when it matches an owned value. `Some(n)` moves the `String` out of `name` into `n`, which leaves `name` partly moved. Match on `&name` to bind `n` as a reference and keep `name` whole."
    },
    {
      id: "let-refutable",
      kind: "verdict",
      topic: "Refutable patterns",
      code: rs`
        fn main() {
            let maybe: Option<i32> = Some(3);
            let Some(x) = maybe;
            println!("{x}");
        }
      `,
      expect: { ok: false, error: "E0005", line: 3 },
      explain:
        "A pattern that can fail to match is called refutable. `Some(x)` is one, because the value might be `None`. A plain `let` only takes patterns that always match. For the others use `if let`, or `let ... else` with a way out."
    },
    {
      id: "let-else",
      kind: "output",
      topic: "let ... else",
      code: rs`
        fn first_char(s: &str) -> char {
            let Some(c) = s.chars().next() else {
                return '?';
            };
            c
        }

        fn main() {
            let a = first_char("ok");
            let b = first_char("");
            println!("{a}{b}");
        }
      `,
      choices: ["o?", "ok", PANIC, COMPILE_ERROR],
      answer: 0,
      explain:
        "`let ... else` tries the pattern. When it matches, `c` is available for the rest of the function. When it doesn't, the `else` block runs, and that block must leave: with `return`, `break`, `continue` or a panic. An empty string has no first character, so it gives `?`."
    },
    {
      id: "at-binding",
      kind: "output",
      topic: "Ranges and @ in patterns",
      code: rs`
        fn main() {
            let age = 15;
            let msg = match age {
                0..=12 => String::from("child"),
                n @ 13..=19 => format!("teen {n}"),
                _ => String::from("adult"),
            };
            println!("{msg}");
        }
      `,
      choices: ["teen 15", "teen", "adult", COMPILE_ERROR],
      answer: 0,
      explain:
        "`13..=19` as a pattern matches any number in that range. `n @` in front of it also stores the matched number in `n`, so the arm can test the value and use it."
    }
  ]
};

const modules: Chapter = {
  id: "modules",
  number: "05",
  book: "Book ch. 7, 14",
  name: "Who can see this?",
  blurb: "Modules, paths, pub and use. Everything is private until you say otherwise.",
  questions: [
    {
      id: "private-fn",
      kind: "verdict",
      topic: "Private by default",
      code: rs`
        mod kitchen {
            fn cook() -> &'static str {
                "soup"
            }
        }

        fn main() {
            println!("{}", kitchen::cook());
        }
      `,
      expect: { ok: false, error: "E0603", line: 8 },
      explain:
        "A module (`mod`) is a named group of items. Everything inside one is private unless marked `pub`: code outside the module can't use it. `main` is outside `kitchen`, so it can't call `cook`."
    },
    {
      id: "fix-private-fn",
      kind: "fix",
      topic: "Private by default",
      code: rs`
        mod kitchen {
            fn cook() -> &'static str {
                "soup"
            }
        }

        fn main() {
            println!("{}", kitchen::cook());
        }
      `,
      expect: { ok: false, error: "E0603", line: 8 },
      line: 2,
      goal: "soup",
      choices: [
        "pub fn cook() -> &'static str {",
        "pub(self) fn cook() -> &'static str {",
        "const fn cook() -> &'static str {"
      ],
      answer: 0,
      explain:
        "`pub` makes the function usable from outside its module. `pub(self)` limits it to the current module, which is the same as writing nothing. `const fn` is about running a function at compile time and changes nothing about who can call it."
    },
    {
      id: "child-sees-parent",
      kind: "verdict",
      topic: "Privacy looks outwards",
      code: rs`
        fn secret() -> u32 {
            42
        }

        mod inner {
            pub fn reveal() -> u32 {
                super::secret()
            }
        }

        fn main() {
            println!("{}", inner::reveal());
        }
      `,
      expect: { ok: true },
      explain:
        "Privacy only hides things from the outside. Code in a module can use everything in the modules that contain it, private or not. `super::` means \"one module up\", where `secret` lives. It prints `42`."
    },
    {
      id: "private-field",
      kind: "verdict",
      topic: "Struct fields are private",
      code: rs`
        mod bank {
            pub struct Account {
                pub owner: String,
                balance: u32,
            }

            pub fn open(owner: &str) -> Account {
                Account {
                    owner: owner.to_string(),
                    balance: 100,
                }
            }
        }

        fn main() {
            let a = bank::open("Ann");
            println!("{} {}", a.owner, a.balance);
        }
      `,
      expect: { ok: false, error: "E0616", line: 17 },
      explain:
        "`pub struct` makes the type public, but each field stays private until it gets its own `pub`. `owner` has one and `balance` doesn't. This lets a module decide which parts of its data outside code may touch."
    },
    {
      id: "private-field-construct",
      kind: "verdict",
      topic: "Struct fields are private",
      code: rs`
        mod bank {
            pub struct Account {
                pub owner: String,
                balance: u32,
            }

            impl Account {
                pub fn balance(&self) -> u32 {
                    self.balance
                }
            }
        }

        fn main() {
            let a = bank::Account {
                owner: String::from("Ann"),
                balance: 1_000_000,
            };
            println!("{} {}", a.owner, a.balance());
        }
      `,
      expect: { ok: false, error: "E0451", line: 17 },
      explain:
        "A struct with a private field can't be built from outside its module, because that would mean setting the private field. The module has to offer a `pub` function that builds one, which is how it keeps control of the starting values."
    },
    {
      id: "pub-enum-variants",
      kind: "verdict",
      topic: "Enum variants are public",
      code: rs`
        mod menu {
            pub enum Dish {
                Soup,
                Salad,
            }
        }

        fn main() {
            for d in [menu::Dish::Soup, menu::Dish::Salad] {
                match d {
                    menu::Dish::Soup => print!("soup "),
                    menu::Dish::Salad => print!("salad "),
                }
            }
        }
      `,
      expect: { ok: true },
      explain:
        "Enums work the other way round from structs: making the enum `pub` makes all its variants public too. An enum whose variants you couldn't name would be of little use."
    },
    {
      id: "use-is-per-module",
      kind: "verdict",
      topic: "use belongs to one module",
      code: rs`
        use std::collections::HashMap;

        mod stats {
            pub fn empty() -> usize {
                let m: HashMap<u8, u8> = HashMap::new();
                m.len()
            }
        }

        fn main() {
            println!("{}", stats::empty());
        }
      `,
      expect: { ok: false, error: "E0425", line: 5 },
      explain:
        "`use` brings a name into the module where it is written, and nowhere else. The `use` at the top applies to the outer module only. Inside `stats`, `HashMap` is unknown. Move the `use` into `stats`, or write `super::HashMap`."
    },
    {
      id: "pub-use-reexport",
      kind: "verdict",
      topic: "Re-exporting with pub use",
      code: rs`
        mod art {
            pub mod kinds {
                pub fn red() -> &'static str {
                    "red"
                }
            }
            pub use self::kinds::red;
        }

        fn main() {
            println!("{}", art::red());
        }
      `,
      expect: { ok: true },
      explain:
        "`pub use` brings a name into a module and also offers it to everyone outside, as if it were defined there. This is called re-exporting. Libraries use it to give a short public path (`art::red`) to something that lives deeper inside (`art::kinds::red`)."
    },
    {
      id: "use-is-private",
      kind: "verdict",
      topic: "Re-exporting with pub use",
      code: rs`
        mod art {
            pub mod kinds {
                pub fn red() -> &'static str {
                    "red"
                }
            }
            use self::kinds::red;
        }

        fn main() {
            println!("{}", art::red());
        }
      `,
      expect: { ok: false, error: "E0603", line: 11 },
      explain:
        "A plain `use` is private like everything else: the short name `red` exists inside `art` only. From outside, the function is still reachable by its full path, `art::kinds::red()`."
    },
    {
      id: "use-name-clash",
      kind: "verdict",
      topic: "Two imports, one name",
      code: rs`
        use std::fmt::Result;
        use std::io::Result;

        fn main() {
            let a: Result = Ok(());
            println!("{a:?}");
        }
      `,
      expect: { ok: false, error: "E0252", line: 2 },
      explain:
        "Both modules define a type called `Result`, and one scope can't hold two things with the same name. Rename one as you import it, `use std::io::Result as IoResult;`, or import the modules and write `fmt::Result` and `io::Result`."
    }
  ]
};

const collections: Chapter = {
  id: "collections",
  number: "06",
  book: "Book ch. 8",
  name: "Vectors, strings and maps",
  blurb: "Vec, String and HashMap: growing data, and the ways it can be missing.",
  questions: [
    {
      id: "vec-get",
      kind: "output",
      topic: "get or index",
      code: rs`
        fn main() {
            let v = vec![10, 20, 30];
            println!("{:?}", v.get(7));
        }
      `,
      choices: ["None", "Some(0)", PANIC, COMPILE_ERROR],
      answer: 0,
      explain:
        "`get` returns an `Option`: `Some(&value)` when the index exists and `None` when it doesn't. Use it when a missing element is a normal case you want to handle."
    },
    {
      id: "vec-index-panic",
      kind: "output",
      topic: "get or index",
      code: rs`
        fn main() {
            let v = vec![10, 20, 30];
            println!("{}", v[7]);
        }
      `,
      choices: ["None", "0", PANIC, COMPILE_ERROR],
      answer: 2,
      explain:
        "Indexing with `[]` gives the element itself, with no `Option` around it, so there is nothing it could return for a missing index. It panics. Use `[]` when a wrong index is a bug, and `get` when it can happen."
    },
    {
      id: "vec-mut-iter-deref",
      kind: "verdict",
      topic: "Changing elements in a loop",
      code: rs`
        fn main() {
            let mut v = vec![1, 2, 3];
            for x in &mut v {
                x *= 2;
            }
            println!("{v:?}");
        }
      `,
      expect: { ok: false, error: "E0368", line: 4 },
      explain:
        "Looping over `&mut v` makes `x` a `&mut i32`, a reference to each element. To change the number behind a reference you have to dereference it with `*`: `*x *= 2`. Then it prints `[2, 4, 6]`."
    },
    {
      id: "string-index",
      kind: "verdict",
      topic: "Strings have no index",
      code: rs`
        fn main() {
            let s = String::from("hello");
            let c = s[0];
            println!("{c}");
        }
      `,
      expect: { ok: false, error: "E0277", line: 3 },
      explain:
        "A `String` is stored as UTF-8, where one character takes one to four bytes. `s[0]` could only mean \"the first byte\", which is often not a whole character, so Rust offers no index on strings. Ask for what you mean: `s.chars().next()` or `s.bytes().next()`."
    },
    {
      id: "string-len-bytes",
      kind: "output",
      topic: "Bytes and characters",
      code: rs`
        fn main() {
            let s = "crème";
            println!("{} {}", s.len(), s.chars().count());
        }
      `,
      choices: ["5 5", "6 5", "6 6", COMPILE_ERROR],
      answer: 1,
      explain:
        "`len()` counts bytes, not characters. In UTF-8 the four plain letters take one byte each and `è` takes two, which makes six bytes. `chars()` walks the text character by character and finds five."
    },
    {
      id: "string-slice-mid-char",
      kind: "output",
      topic: "Bytes and characters",
      code: rs`
        fn main() {
            let s = String::from("é!");
            let first = &s[0..1];
            println!("{first}");
        }
      `,
      choices: ["é", "!", PANIC, COMPILE_ERROR],
      answer: 2,
      explain:
        "A range on a string counts bytes. `é` is two bytes long, so `0..1` would cut it in half. Rust checks this while the program runs and panics, because half a character is not valid text. `&s[0..2]` gives `é`."
    },
    {
      id: "fix-string-concat",
      kind: "fix",
      topic: "Joining strings",
      code: rs`
        fn main() {
            let a = String::from("tic");
            let b = String::from("tac");
            let c = a + &b;
            println!("{a} {c}");
        }
      `,
      expect: { ok: false, error: "E0382", line: 5 },
      line: 4,
      goal: "tic tictac",
      choices: ['let c = format!("{a}{b}");', "let c = &a + &b;", "let c = a + b;"],
      answer: 0,
      explain:
        "`+` on strings takes the left side by value and appends to its buffer, so `a` is moved into `c`. `format!` only borrows its arguments and builds a new `String`. `&a + &b` has no owned string to append to, and the right side of `+` must be a `&str`, not a `String`."
    },
    {
      id: "hashmap-insert-entry",
      kind: "output",
      topic: "insert and entry",
      code: rs`
        use std::collections::HashMap;

        fn main() {
            let mut m = HashMap::new();
            m.insert("blue", 10);
            m.insert("blue", 25);
            m.entry("blue").or_insert(50);
            m.entry("red").or_insert(50);
            println!("{} {}", m["blue"], m["red"]);
        }
      `,
      choices: ["25 50", "10 50", "50 50", COMPILE_ERROR],
      answer: 0,
      explain:
        "A `HashMap` stores one value per key. `insert` replaces the value when the key already exists. `entry(key).or_insert(v)` only inserts when the key is missing, so it leaves `blue` at `25` and adds `red`."
    },
    {
      id: "hashmap-count",
      kind: "output",
      topic: "Counting with entry",
      code: rs`
        use std::collections::HashMap;

        fn main() {
            let mut counts = HashMap::new();
            for word in "a b a c a".split(' ') {
                *counts.entry(word).or_insert(0) += 1;
            }
            println!("{} {}", counts["a"], counts.len());
        }
      `,
      choices: ["3 3", "1 3", "3 5", COMPILE_ERROR],
      answer: 0,
      explain:
        "`or_insert` returns a `&mut` to the value for that key, the one it just inserted or the one already there. `*... += 1` adds one through that reference. The result is one entry per different word, with `a` counted three times."
    },
    {
      id: "hashmap-moves-key",
      kind: "verdict",
      topic: "A map owns its keys",
      code: rs`
        use std::collections::HashMap;

        fn main() {
            let name = String::from("Ann");
            let mut ages = HashMap::new();
            ages.insert(name, 30);
            println!("{name} is {}", ages.len());
        }
      `,
      expect: { ok: false, error: "E0382", line: 7 },
      explain:
        "`insert` takes the key and the value by value. A `String` key is moved into the map, which owns it from then on. Insert `name.clone()`, or use `&str` keys, if you still need the name afterwards."
    },
    {
      id: "hashmap-missing-key",
      kind: "output",
      topic: "A key that isn't there",
      code: rs`
        use std::collections::HashMap;

        fn main() {
            let mut stock = HashMap::new();
            stock.insert("apple", 3);
            println!("{}", stock["pear"]);
        }
      `,
      choices: ["0", "None", PANIC, COMPILE_ERROR],
      answer: 2,
      explain:
        "As with a vector, `[]` on a map promises the value itself and panics when the key is missing. `stock.get(\"pear\")` returns an `Option`, and `stock.get(\"pear\").copied().unwrap_or(0)` gives a default."
    }
  ]
};

const errors: Chapter = {
  id: "errors",
  number: "07",
  book: "Book ch. 9, 11",
  name: "When things go wrong",
  blurb: "panic!, Result and the ? operator, plus the asserts that tests are made of.",
  questions: [
    {
      id: "unwrap-none",
      kind: "output",
      topic: "unwrap",
      code: rs`
        fn main() {
            let v: Vec<i32> = Vec::new();
            let first = v.first().unwrap();
            println!("{first}");
        }
      `,
      choices: ["0", "None", PANIC, COMPILE_ERROR],
      answer: 2,
      explain:
        "`first()` returns an `Option`, and for an empty vector it is `None`. `unwrap` means \"give me the value inside, and panic if there is none\". It is fine in examples and tests. In real code, handle the `None`."
    },
    {
      id: "unwrap-or",
      kind: "output",
      topic: "Falling back to a default",
      code: rs`
        fn main() {
            let a: i32 = "x".parse().unwrap_or(0);
            let b: i32 = "5".parse().unwrap_or(0);
            println!("{}", a + b);
        }
      `,
      choices: ["5", "0", PANIC, COMPILE_ERROR],
      answer: 0,
      explain:
        "`parse` returns a `Result`: `Ok(number)` on success, or `Err(reason)` on failure. `unwrap_or(0)` takes the number out of an `Ok` and uses `0` for an `Err`, so nothing panics. `\"x\"` is not a number and counts as `0`."
    },
    {
      id: "question-mark-in-main",
      kind: "verdict",
      topic: "The ? operator",
      code: rs`
        fn main() {
            let n: i32 = "42".parse()?;
            println!("{n}");
        }
      `,
      expect: { ok: false, error: "E0277", line: 2 },
      explain:
        "`?` after a `Result` means: on `Ok`, take the value out; on `Err`, return that error from the current function right away. That only works in a function whose return type can hold the error. This `main` returns nothing."
    },
    {
      id: "main-returns-result",
      kind: "verdict",
      topic: "The ? operator",
      code: rs`
        use std::num::ParseIntError;

        fn main() -> Result<(), ParseIntError> {
            let n: i32 = "42".parse()?;
            println!("{n}");
            Ok(())
        }
      `,
      expect: { ok: true },
      explain:
        "`main` may return a `Result`. Now `?` has somewhere to send an error: if `parse` failed, `main` would return it and the program would end with an error message. On success the last line returns `Ok(())`, a success with no value."
    },
    {
      id: "question-mark-propagates",
      kind: "output",
      topic: "Passing errors up",
      code: rs`
        use std::num::ParseIntError;

        fn double(s: &str) -> Result<i32, ParseIntError> {
            let n: i32 = s.parse()?;
            Ok(n * 2)
        }

        fn main() {
            let bad = double("x").is_err();
            println!("{:?} {bad}", double("4"));
        }
      `,
      choices: ["Ok(8) true", "8 true", PANIC, COMPILE_ERROR],
      answer: 0,
      explain:
        "For `\"4\"`, `?` unwraps the number and the function returns `Ok(8)`. For `\"x\"`, `?` returns the parse error to the caller at once, and the line after it never runs. Handing an error to your caller like this is called propagating it."
    },
    {
      id: "fix-option-in-result",
      kind: "fix",
      topic: "? needs matching types",
      code: rs`
        fn first(v: &[i32]) -> Result<i32, String> {
            let x = v.first()?;
            Ok(*x)
        }

        fn main() {
            println!("{:?}", first(&[]));
        }
      `,
      expect: { ok: false, error: "E0277", line: 2 },
      line: 2,
      goal: 'Err("empty")',
      choices: [
        'let x = v.first().ok_or("empty")?;',
        "let x = v.first().unwrap()?;",
        "let x = v.first().ok()?;"
      ],
      answer: 0,
      explain:
        "`first()` returns an `Option`, but the function returns a `Result`, and `?` can't turn a `None` into an `Err` without being told which error to use. `ok_or(\"empty\")` converts the `Option` into a `Result` with that error. `unwrap()` would panic, and its `&i32` can't take a `?`."
    },
    {
      id: "box-dyn-error",
      kind: "verdict",
      topic: "Mixing error types",
      code: rs`
        use std::error::Error;

        fn run() -> Result<i32, Box<dyn Error>> {
            let n: i32 = "7".parse()?;
            let f: f64 = "0.5".parse()?;
            Ok(n + f as i32)
        }

        fn main() {
            println!("{}", run().unwrap());
        }
      `,
      expect: { ok: true },
      explain:
        "The two `parse` calls fail with different error types. `Box<dyn Error>` means \"any error type, stored on the heap\", and `?` converts each error into it automatically. It prints `7`."
    },
    {
      id: "one-error-type",
      kind: "verdict",
      topic: "Mixing error types",
      code: rs`
        use std::num::ParseIntError;

        fn run() -> Result<i32, ParseIntError> {
            let n: i32 = "7".parse()?;
            let f: f64 = "0.5".parse()?;
            Ok(n + f as i32)
        }

        fn main() {
            println!("{}", run().unwrap());
        }
      `,
      expect: { ok: false, error: "E0271", line: 5 },
      explain:
        "This function can only return a `ParseIntError`. Parsing an `f64` fails with a different type, `ParseFloatError`, and nothing converts one into the other. The first `?` is fine, the second is not."
    },
    {
      id: "assert-eq-fails",
      kind: "output",
      topic: "assert_eq!",
      code: rs`
        fn add(a: i32, b: i32) -> i32 {
            a - b
        }

        fn main() {
            assert_eq!(add(2, 2), 4);
            println!("ok");
        }
      `,
      choices: ["ok", "0", PANIC, COMPILE_ERROR],
      answer: 2,
      explain:
        "`assert_eq!` compares two values and panics when they differ, printing both. `add` subtracts by mistake, so it gets `0` where `4` was expected. Tests are built on this: a test is a function that passes when it finishes without a panic."
    },
    {
      id: "eq-needs-partial-eq",
      kind: "verdict",
      topic: "Comparing your own types",
      code: rs`
        struct Point(i32, i32);

        fn main() {
            let same = Point(1, 2) == Point(1, 2);
            println!("{same}");
        }
      `,
      expect: { ok: false, error: "E0369", line: 4 },
      explain:
        "`==` is not built in for your own types. It comes from the `PartialEq` trait, which `#[derive(PartialEq)]` writes for you. `assert_eq!` in a test needs it too, plus `Debug`, because it prints both values when they differ."
    },
    {
      id: "test-fn-not-built",
      kind: "output",
      topic: "#[test]",
      code: rs`
        fn add(a: i32, b: i32) -> i32 {
            a + b
        }

        #[test]
        fn adds() {
            assert_eq!(add(2, 2), 5);
        }

        fn main() {
            println!("{}", add(2, 2));
        }
      `,
      choices: ["4", "5", PANIC, COMPILE_ERROR],
      answer: 0,
      explain:
        "A function marked `#[test]` is only compiled and run by `cargo test`. In a normal build it is left out completely, so its wrong assertion can't fail here. `cargo test` would report `adds` as failed."
    },
    {
      id: "cfg-test-only",
      kind: "verdict",
      topic: "#[cfg(test)]",
      code: rs`
        #[cfg(test)]
        fn helper() -> i32 {
            4
        }

        fn main() {
            println!("{}", helper());
        }
      `,
      expect: { ok: false, error: "E0425", line: 7 },
      explain:
        "`#[cfg(test)]` means \"compile this only when building tests\". In a normal build `helper` does not exist, so `main` can't call it. Test modules carry this attribute so that test code stays out of the finished program."
    }
  ]
};

const lifetimes: Chapter = {
  id: "lifetimes",
  number: "08",
  book: "Book ch. 10",
  name: "How long is 'a?",
  blurb: "Dangling references, lifetimes Rust fills in for you, and the ones you have to write.",
  questions: [
    {
      id: "dangling-scope",
      kind: "verdict",
      topic: "Dangling reference",
      code: rs`
        fn main() {
            let r;
            {
                let x = 5;
                r = &x;
            }
            println!("{r}");
        }
      `,
      expect: { ok: false, error: "E0597", line: 5 },
      explain:
        "`x` is dropped at the closing brace on line 6, but `r` is used after that. A reference can't outlive the value it points at: `x` does not live long enough."
    },
    {
      id: "static-str",
      kind: "verdict",
      topic: "'static",
      code: rs`
        fn main() {
            let s: &'static str;
            {
                let local = "I live forever";
                s = local;
            }
            println!("{s}");
        }
      `,
      expect: { ok: true },
      explain:
        "It looks like the last question, but `local` is only a reference. The text itself is a string literal baked into the binary, so it is `'static`. Copying the reference out of the block is fine."
    },
    {
      id: "longest-elision",
      kind: "verdict",
      topic: "Lifetimes you can leave out",
      code: rs`
        fn longest(a: &str, b: &str) -> &str {
            if a.len() > b.len() { a } else { b }
        }

        fn main() {
            println!("{}", longest("crab", "ferris"));
        }
      `,
      expect: { ok: false, error: "E0106", line: 1 },
      explain:
        "You can often leave lifetimes out of a signature and Rust fills them in. This is called lifetime elision. For the result, it only works when there is exactly one reference parameter, or a `&self`. With two `&str` parameters Rust won't guess which one the result borrows from: \"missing lifetime specifier\"."
    },
    {
      id: "fix-longest",
      kind: "fix",
      topic: "Lifetime annotations",
      code: rs`
        fn longest(a: &str, b: &str) -> &str {
            if a.len() > b.len() { a } else { b }
        }

        fn main() {
            println!("{}", longest("crab", "ferris"));
        }
      `,
      expect: { ok: false, error: "E0106", line: 1 },
      line: 1,
      goal: "ferris",
      choices: [
        "fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {",
        "fn longest<'a>(a: &'a str, b: &str) -> &'a str {",
        "fn longest(a: &str, b: &str) -> &'static str {"
      ],
      answer: 0,
      explain:
        "The result may be either input, so both inputs need the same `'a`. That means the result is valid for as long as both are. If only `a` is tied to `'a`, returning `b` is rejected. `'static` promises more than any borrowed input can give."
    },
    {
      id: "first-word",
      kind: "verdict",
      topic: "Lifetimes you can leave out",
      code: rs`
        fn first_word(s: &str) -> &str {
            s.split(' ').next().unwrap_or("")
        }

        fn main() {
            let text = String::from("borrow checker");
            println!("{}", first_word(&text));
        }
      `,
      expect: { ok: true },
      explain:
        "One reference in, one reference out, so Rust fills in the lifetimes and ties the result to the input. It reads as if you had written `fn first_word<'a>(s: &'a str) -> &'a str`. It prints `borrow`."
    },
    {
      id: "first-word-drop",
      kind: "verdict",
      topic: "Lifetimes you can leave out",
      code: rs`
        fn first_word(s: &str) -> &str {
            s.split(' ').next().unwrap_or("")
        }

        fn main() {
            let text = String::from("borrow checker");
            let w = first_word(&text);
            drop(text);
            println!("{w}");
        }
      `,
      expect: { ok: false, error: "E0505", line: 8 },
      explain:
        "Rust fills in the signature as `fn first_word<'a>(s: &'a str) -> &'a str`, so `w` borrows from `text`. `drop(text)` moves `text` away while `w`, still needed on line 9, borrows it."
    },
    {
      id: "return-local",
      kind: "verdict",
      topic: "Returning a reference",
      code: rs`
        fn greeting() -> &'static str {
            let s = String::from("hello");
            &s
        }

        fn main() {
            println!("{}", greeting());
        }
      `,
      expect: { ok: false, error: "E0515", line: 3 },
      explain:
        "`s` is a local `String`, dropped when `greeting` returns. A reference to it would dangle at once. Writing `'static` on the signature doesn't make that true. Return the `String` itself instead."
    },
    {
      id: "struct-needs-lifetime",
      kind: "verdict",
      topic: "Structs holding references",
      code: rs`
        struct Excerpt {
            part: &str,
        }

        fn main() {
            let e = Excerpt { part: "Call me Ishmael." };
            println!("{}", e.part);
        }
      `,
      expect: { ok: false, error: "E0106", line: 2 },
      explain:
        "A struct that holds a reference must say how long that reference lives: `struct Excerpt<'a> { part: &'a str }`. Rust only fills in missing lifetimes in function signatures, never in struct fields."
    },
    {
      id: "struct-outlives",
      kind: "verdict",
      topic: "Structs holding references",
      code: rs`
        struct Excerpt<'a> {
            part: &'a str,
        }

        fn main() {
            let e;
            {
                let novel = String::from("Call me Ishmael.");
                e = Excerpt { part: &novel[..4] };
            }
            println!("{}", e.part);
        }
      `,
      expect: { ok: false, error: "E0597", line: 9 },
      explain:
        "`Excerpt<'a>` can't outlive the string it borrows from. `novel` is dropped at the end of the inner block, but `e` is used after it."
    },
    {
      id: "self-elision",
      kind: "verdict",
      topic: "Leaving out lifetimes with &self",
      code: rs`
        struct Crab {
            name: String,
        }

        impl Crab {
            fn greet(&self, other: &str) -> &str {
                println!("hi {other}");
                &self.name
            }
        }

        fn main() {
            let c = Crab { name: String::from("Ferris") };
            println!("{}", c.greet("Corro"));
        }
      `,
      expect: { ok: true },
      explain:
        "When a method takes `&self`, Rust gives a result without a written lifetime the lifetime of `self`. Returning `&self.name` matches that. It prints `hi Corro`, then `Ferris`."
    },
    {
      id: "self-elision-other",
      kind: "verdict",
      topic: "Leaving out lifetimes with &self",
      code: rs`
        struct Crab {
            name: String,
        }

        impl Crab {
            fn pick(&self, other: &str) -> &str {
                if other.is_empty() {
                    &self.name
                } else {
                    other
                }
            }
        }

        fn main() {
            let c = Crab { name: String::from("Ferris") };
            println!("{}", c.pick("Corro"));
        }
      `,
      expect: { ok: false, error: "lifetime may not live long enough", line: 10 },
      explain:
        "With no lifetimes written, Rust assumes the result borrows from `self`, but this method can return `other`, which might live for a shorter time. Give `other` and the result the same named lifetime to make that clear."
    },
    {
      id: "longest-scope",
      kind: "verdict",
      topic: "The checker doesn't run your code",
      code: rs`
        fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
            if a.len() >= b.len() { a } else { b }
        }

        fn main() {
            let a = String::from("ferris");
            let out;
            {
                let b = String::from("crab");
                out = longest(&a, &b);
            }
            println!("{out}");
        }
      `,
      expect: { ok: false, error: "E0597", line: 10 },
      explain:
        "At run time `out` would be `a`, which is still alive. But the borrow checker only reads signatures, and this one says the result may borrow from `b` too. `b` dies at the end of the block, so `out` can't be used after it."
    },
    {
      id: "static-bound-owned",
      kind: "verdict",
      topic: "T: 'static",
      code: rs`
        fn keep<T: 'static>(t: T) -> T {
            t
        }

        fn main() {
            let s = String::from("owned");
            let kept = keep(s);
            println!("{kept}");
        }
      `,
      expect: { ok: true },
      explain:
        "The bound `T: 'static` does not mean the value lives for the whole program. It means the type holds no borrowed data that could expire. A `String` owns its text, so it passes, even though it was created a line earlier."
    },
    {
      id: "static-bound-ref",
      kind: "verdict",
      topic: "T: 'static",
      code: rs`
        fn keep<T: 'static>(t: T) -> T {
            t
        }

        fn main() {
            let s = String::from("owned");
            let kept = keep(&s);
            println!("{kept}");
        }
      `,
      expect: { ok: false, error: "E0597", line: 7 },
      explain:
        "Here `T` is `&String`, a borrow of the local `s`. `T: 'static` only accepts types whose borrows last for the whole program, and `s` is dropped at the end of `main`."
    }
  ]
};

const structs: Chapter = {
  id: "structs",
  number: "09",
  book: "Book ch. 10",
  name: "Structs that borrow",
  blurb: "Lifetimes on structs, on impl blocks, and on the methods inside them.",
  questions: [
    {
      id: "impl-needs-lifetime",
      kind: "verdict",
      topic: "impl blocks name the lifetime",
      code: rs`
        struct Excerpt<'a> {
            part: &'a str,
        }

        impl Excerpt {
            fn len(&self) -> usize {
                self.part.len()
            }
        }

        fn main() {
            let e = Excerpt { part: "Call me" };
            println!("{}", e.len());
        }
      `,
      expect: { ok: false, error: "E0726", line: 5 },
      explain:
        "The lifetime is part of the type's name: the type is `Excerpt<'a>`, not `Excerpt`. An `impl` block has to say which `Excerpt` it is for, so the lifetime can't be left out here."
    },
    {
      id: "fix-impl-lifetime",
      kind: "fix",
      topic: "impl blocks name the lifetime",
      code: rs`
        struct Excerpt<'a> {
            part: &'a str,
        }

        impl Excerpt {
            fn len(&self) -> usize {
                self.part.len()
            }
        }

        fn main() {
            let e = Excerpt { part: "Call me" };
            println!("{}", e.len());
        }
      `,
      expect: { ok: false, error: "E0726", line: 5 },
      line: 5,
      goal: "7",
      choices: ["impl<'a> Excerpt<'a> {", "impl Excerpt<'a> {", "impl<'a> Excerpt {"],
      answer: 0,
      explain:
        "`impl<'a>` declares the lifetime name and `Excerpt<'a>` uses it, the same two steps as `fn f<'a>(x: &'a str)`. Using `'a` without declaring it is an unknown name. Declaring it without using it still leaves `Excerpt` incomplete."
    },
    {
      id: "impl-anon-lifetime",
      kind: "verdict",
      topic: "The anonymous lifetime '_",
      code: rs`
        struct Excerpt<'a> {
            part: &'a str,
        }

        impl Excerpt<'_> {
            fn shout(&self) -> String {
                self.part.to_uppercase()
            }
        }

        fn main() {
            let e = Excerpt { part: "call me" };
            println!("{}", e.shout());
        }
      `,
      expect: { ok: true },
      explain:
        "`'_` is the anonymous lifetime: it says \"there is a lifetime here, but it needs no name\". That is enough when no method has to mention the lifetime, as here, where `shout` returns an owned `String`. It prints `CALL ME`."
    },
    {
      id: "getter-struct-lifetime",
      kind: "verdict",
      topic: "Returning the struct's lifetime",
      code: rs`
        struct Excerpt<'a> {
            part: &'a str,
        }

        impl<'a> Excerpt<'a> {
            fn part(&self) -> &'a str {
                self.part
            }
        }

        fn main() {
            let novel = String::from("Call me Ishmael.");
            let p;
            {
                let e = Excerpt { part: &novel[..4] };
                p = e.part();
            }
            println!("{p}");
        }
      `,
      expect: { ok: true },
      explain:
        "The result is `&'a str`: it borrows from the text the struct points at (`novel`), not from the struct. So `p` stays valid after `e` is dropped at the end of the block, as long as `novel` is alive. It prints `Call`."
    },
    {
      id: "getter-self-lifetime",
      kind: "verdict",
      topic: "Returning the struct's lifetime",
      code: rs`
        struct Excerpt<'a> {
            part: &'a str,
        }

        impl<'a> Excerpt<'a> {
            fn part(&self) -> &str {
                self.part
            }
        }

        fn main() {
            let novel = String::from("Call me Ishmael.");
            let p;
            {
                let e = Excerpt { part: &novel[..4] };
                p = e.part();
            }
            println!("{p}");
        }
      `,
      expect: { ok: false, error: "E0597", line: 16 },
      explain:
        "Only the return type changed, from `&'a str` to `&str`. With no lifetime written, a method's result gets the lifetime of the `&self` borrow. That ties `p` to the struct `e`, which is dropped on line 17, even though the text itself lives on in `novel`."
    },
    {
      id: "struct-from-local",
      kind: "verdict",
      topic: "A lifetime name extends nothing",
      code: rs`
        struct Excerpt<'a> {
            part: &'a str,
        }

        fn make<'a>() -> Excerpt<'a> {
            let s = String::from("Call me");
            Excerpt { part: &s }
        }

        fn main() {
            println!("{}", make().part);
        }
      `,
      expect: { ok: false, error: "E0515", line: 7 },
      explain:
        "A lifetime annotation describes how long a borrow is valid. It never keeps a value alive. `s` is dropped when `make` returns, so the struct would hold a dangling reference. To return it, the struct has to own its text: `part: String`."
    },
    {
      id: "mut-field-locks",
      kind: "verdict",
      topic: "A struct holding &mut",
      code: rs`
        struct Counter<'a> {
            n: &'a mut i32,
        }

        impl Counter<'_> {
            fn bump(&mut self) {
                *self.n += 1;
            }
        }

        fn main() {
            let mut total = 0;
            let mut c = Counter { n: &mut total };
            c.bump();
            println!("{total}");
            c.bump();
        }
      `,
      expect: { ok: false, error: "E0502", line: 15 },
      explain:
        "`c` holds a `&mut` borrow of `total` in its field, and that borrow lasts as long as `c` is used. `c.bump()` on line 16 still needs it, so `total` can't be read on line 15."
    },
    {
      id: "mut-field-done",
      kind: "output",
      topic: "A struct holding &mut",
      code: rs`
        struct Counter<'a> {
            n: &'a mut i32,
        }

        impl Counter<'_> {
            fn bump(&mut self) {
                *self.n += 1;
            }
        }

        fn main() {
            let mut total = 0;
            let mut c = Counter { n: &mut total };
            c.bump();
            c.bump();
            println!("{total}");
        }
      `,
      choices: ["0", "2", "1", COMPILE_ERROR],
      answer: 1,
      explain:
        "The same code with the last two lines swapped. `c` is not used after its second `bump`, so the `&mut` borrow it holds has ended and `total` can be read again. Both calls wrote through the reference into `total`."
    },
    {
      id: "pair-one-lifetime",
      kind: "verdict",
      topic: "One lifetime for two fields",
      code: rs`
        struct Pair<'a> {
            left: &'a str,
            right: &'a str,
        }

        fn main() {
            let a = String::from("left");
            let l;
            {
                let b = String::from("right");
                let p = Pair { left: &a, right: &b };
                println!("{}", p.right);
                l = p.left;
            }
            println!("{l}");
        }
      `,
      expect: { ok: false, error: "E0597", line: 11 },
      explain:
        "Both fields share one lifetime `'a`, so it can only be as long as the shorter of the two borrows, the one of `b`. `p.left` is typed `&'a str` as well, so `l` counts as borrowing from `b`, which is dropped on line 14."
    },
    {
      id: "pair-two-lifetimes",
      kind: "verdict",
      topic: "Two lifetimes for two fields",
      code: rs`
        struct Pair<'a, 'b> {
            left: &'a str,
            right: &'b str,
        }

        fn main() {
            let a = String::from("left");
            let l;
            {
                let b = String::from("right");
                let p = Pair { left: &a, right: &b };
                println!("{}", p.right);
                l = p.left;
            }
            println!("{l}");
        }
      `,
      expect: { ok: true },
      explain:
        "With a lifetime of its own for each field, `left` is tied only to `a` and `right` only to `b`. `l` now borrows just from `a`, which is still alive on the last line. It prints `right`, then `left`."
    },
    {
      id: "fix-setter-lifetime",
      kind: "fix",
      topic: "Storing a reference in a method",
      code: rs`
        struct Holder<'a> {
            item: &'a str,
        }

        impl<'a> Holder<'a> {
            fn set(&mut self, item: &str) {
                self.item = item;
            }
        }

        fn main() {
            let mut h = Holder { item: "old" };
            h.set("new");
            println!("{}", h.item);
        }
      `,
      expect: { ok: false, error: "E0621", line: 7 },
      line: 6,
      goal: "new",
      choices: [
        "fn set(&mut self, item: &'a str) {",
        "fn set<'b>(&mut self, item: &'b str) {",
        "fn set(&mut self, item: &'_ str) {"
      ],
      answer: 0,
      explain:
        "The field is a `&'a str`, so whatever is stored in it must be valid for `'a`. A plain `&str` parameter gets a fresh lifetime of its own, which may be shorter. `'b` and `'_` are just other ways to write that fresh lifetime. Only `&'a str` promises enough."
    },
    {
      id: "self-borrowed-forever",
      kind: "verdict",
      topic: "&'a mut self",
      code: rs`
        struct Lexer<'a> {
            rest: &'a str,
        }

        impl<'a> Lexer<'a> {
            fn skip(&'a mut self) {
                self.rest = &self.rest[1..];
            }
        }

        fn main() {
            let mut lx = Lexer { rest: "abc" };
            lx.skip();
            lx.skip();
            println!("{}", lx.rest);
        }
      `,
      expect: { ok: false, error: "E0499", line: 14 },
      explain:
        "`'a` is the lifetime of the text inside the lexer, which is at least as long as the lexer itself. `&'a mut self` asks for a mutable borrow of the lexer lasting all of `'a`, so the first call keeps `lx` borrowed for the rest of its life and no second call is possible."
    },
    {
      id: "fix-self-borrowed-forever",
      kind: "fix",
      topic: "&'a mut self",
      code: rs`
        struct Lexer<'a> {
            rest: &'a str,
        }

        impl<'a> Lexer<'a> {
            fn skip(&'a mut self) {
                self.rest = &self.rest[1..];
            }
        }

        fn main() {
            let mut lx = Lexer { rest: "abc" };
            lx.skip();
            lx.skip();
            println!("{}", lx.rest);
        }
      `,
      expect: { ok: false, error: "E0499", line: 14 },
      line: 6,
      goal: "c",
      choices: ["fn skip(&mut self) {", "fn skip(&'a self) {", "fn skip<'b: 'a>(&'b mut self) {"],
      answer: 0,
      explain:
        "A plain `&mut self` borrows the lexer only for the length of the call. `&'a self` is a shared borrow, which can't assign to `self.rest`. `'b: 'a` means `'b` lasts at least as long as `'a`, so that borrow is just as long as before."
    }
  ]
};

const traits: Chapter = {
  id: "traits",
  number: "10",
  book: "Book ch. 10, 18",
  name: "What can it do?",
  blurb: "Generics and traits: shared behaviour, bounds, and dyn for mixing types.",
  questions: [
    {
      id: "generic-struct-one-type",
      kind: "verdict",
      topic: "Generic structs",
      code: rs`
        struct Point<T> {
            x: T,
            y: T,
        }

        fn main() {
            let p = Point { x: 5, y: 4.0 };
            println!("{} {}", p.x, p.y);
        }
      `,
      expect: { ok: false, error: "E0308", line: 7 },
      explain:
        "`Point<T>` is a generic struct: `T` is a placeholder for a type chosen where the struct is used. Both fields are declared as the same `T`, so an integer and a float can't be mixed. For that, give the struct two parameters: `Point<T, U>`."
    },
    {
      id: "impl-for-one-type",
      kind: "verdict",
      topic: "Methods for one concrete type",
      code: rs`
        struct Point<T> {
            x: T,
            y: T,
        }

        impl Point<f32> {
            fn len(&self) -> f32 {
                (self.x * self.x + self.y * self.y).sqrt()
            }
        }

        fn main() {
            let a = Point { x: 3.0, y: 4.0 };
            let b = Point { x: 3, y: 4 };
            println!("{} {}", a.len(), b.len());
        }
      `,
      expect: { ok: false, error: "E0599", line: 15 },
      explain:
        "`impl Point<f32>` adds `len` to points of `f32` only. `a` is a `Point<f32>` and has it. `b` is a `Point<i32>` and doesn't. Writing `impl<T> Point<T>` would give a method to every kind of point."
    },
    {
      id: "trait-not-implemented",
      kind: "verdict",
      topic: "Implementing a trait",
      code: rs`
        trait Speak {
            fn speak(&self) -> String;
        }

        struct Crab;
        struct Rock;

        impl Speak for Crab {
            fn speak(&self) -> String {
                String::from("click")
            }
        }

        fn main() {
            println!("{}", Crab.speak());
            println!("{}", Rock.speak());
        }
      `,
      expect: { ok: false, error: "E0599", line: 16 },
      explain:
        "A trait is a named set of methods a type can provide. A type only has them after an `impl Speak for ...` block written for that type. There is one for `Crab` and none for `Rock`, so `Rock` has no `speak` method."
    },
    {
      id: "trait-missing-method",
      kind: "verdict",
      topic: "Required methods",
      code: rs`
        trait Speak {
            fn name(&self) -> String;
            fn speak(&self) -> String;
        }

        struct Crab;

        impl Speak for Crab {
            fn speak(&self) -> String {
                String::from("click")
            }
        }

        fn main() {
            println!("{}", Crab.speak());
        }
      `,
      expect: { ok: false, error: "E0046", line: 8 },
      explain:
        "A method declared in a trait without a body is a required method: every `impl` must write it. This `impl` leaves out `name`. It doesn't matter that `main` never calls it."
    },
    {
      id: "trait-default-method",
      kind: "output",
      topic: "Default methods",
      code: rs`
        trait Speak {
            fn name(&self) -> String;
            fn speak(&self) -> String {
                format!("{} says hi", self.name())
            }
        }

        struct Crab;
        struct Robot;

        impl Speak for Crab {
            fn name(&self) -> String {
                String::from("Ferris")
            }
        }

        impl Speak for Robot {
            fn name(&self) -> String {
                String::from("R2")
            }
            fn speak(&self) -> String {
                String::from("beep")
            }
        }

        fn main() {
            println!("{}, {}", Crab.speak(), Robot.speak());
        }
      `,
      choices: ["Ferris says hi, beep", "Ferris says hi, R2 says hi", "beep, beep", COMPILE_ERROR],
      answer: 0,
      explain:
        "A trait method with a body is a default method. A type that doesn't write its own version gets the default (`Crab`), and a type that does write one replaces it (`Robot`). The default can call required methods like `name`."
    },
    {
      id: "trait-in-scope",
      kind: "verdict",
      topic: "Traits must be in scope",
      code: rs`
        mod shapes {
            pub trait Area {
                fn area(&self) -> u32;
            }

            pub struct Square(pub u32);

            impl Area for Square {
                fn area(&self) -> u32 {
                    self.0 * self.0
                }
            }
        }

        fn main() {
            let s = shapes::Square(3);
            println!("{}", s.area());
        }
      `,
      expect: { ok: false, error: "E0599", line: 17 },
      explain:
        "`Square` does implement `Area`, but trait methods can only be called with `.` when the trait itself has been imported. `main` never wrote `use shapes::Area;`. This is why you sometimes need a `use` for a trait you never mention by name."
    },
    {
      id: "fix-trait-in-scope",
      kind: "fix",
      topic: "Traits must be in scope",
      code: rs`
        mod shapes {
            pub trait Area {
                fn area(&self) -> u32;
            }

            pub struct Square(pub u32);

            impl Area for Square {
                fn area(&self) -> u32 {
                    self.0 * self.0
                }
            }
        }

        fn main() {
            let s = shapes::Square(3);
            println!("{}", s.area());
        }
      `,
      expect: { ok: false, error: "E0599", line: 17 },
      line: 17,
      goal: "9",
      choices: [
        'println!("{}", shapes::Area::area(&s));',
        'println!("{}", shapes::Square::area(&s));',
        'println!("{}", shapes::area(&s));'
      ],
      answer: 0,
      explain:
        "`shapes::Area::area(&s)` names the trait in full, so no import is needed. `s.area()` is short for exactly this call. `Square::area` looks the method up on the type, which again needs the trait imported. `shapes::area` would be a free function, and there is none."
    },
    {
      id: "fix-trait-bound",
      kind: "fix",
      topic: "Trait bounds",
      code: rs`
        fn largest<T>(a: T, b: T) -> T {
            if a > b { a } else { b }
        }

        fn main() {
            println!("{}", largest(3, 7));
        }
      `,
      expect: { ok: false, error: "E0369", line: 2 },
      line: 1,
      goal: "7",
      choices: [
        "fn largest<T: PartialOrd>(a: T, b: T) -> T {",
        "fn largest<T: PartialEq>(a: T, b: T) -> T {",
        "fn largest<T: Copy>(a: T, b: T) -> T {"
      ],
      answer: 0,
      explain:
        "Inside a generic function you may only do what the bounds on `T` allow, and a bare `T` allows almost nothing. A trait bound like `T: PartialOrd` limits `T` to types with that trait. `>` comes from `PartialOrd`. `PartialEq` only gives `==`, and `Copy` gives no operators."
    },
    {
      id: "bound-at-call",
      kind: "verdict",
      topic: "Trait bounds",
      code: rs`
        use std::fmt::Display;

        struct Point {
            x: i32,
        }

        fn show<T: Display>(t: T) {
            println!("<{t}>");
        }

        fn main() {
            show(7);
            show(Point { x: 1 });
        }
      `,
      expect: { ok: false, error: "E0277", line: 13 },
      explain:
        "A bound is checked at every call. `i32` implements `Display`, the trait behind `{}`, so `show(7)` is fine. `Point` has no `impl Display`, so the second call is rejected at the call, before the body of `show` matters."
    },
    {
      id: "generic-one-type",
      kind: "verdict",
      topic: "One T is one type",
      code: rs`
        trait Speak {
            fn speak(&self) -> String;
        }

        struct Crab;
        struct Robot;

        impl Speak for Crab {
            fn speak(&self) -> String {
                String::from("click")
            }
        }

        impl Speak for Robot {
            fn speak(&self) -> String {
                String::from("beep")
            }
        }

        fn chat<T: Speak>(a: &T, b: &T) {
            println!("{} {}", a.speak(), b.speak());
        }

        fn main() {
            chat(&Crab, &Robot);
        }
      `,
      expect: { ok: false, error: "E0308", line: 25 },
      explain:
        "A type parameter stands for one type per call. `a` and `b` are both `&T`, so they must be the same type. `&Crab` sets `T` to `Crab`, and `&Robot` then doesn't match. Both implementing `Speak` is not enough."
    },
    {
      id: "impl-trait-args",
      kind: "verdict",
      topic: "impl Trait arguments",
      code: rs`
        trait Speak {
            fn speak(&self) -> String;
        }

        struct Crab;
        struct Robot;

        impl Speak for Crab {
            fn speak(&self) -> String {
                String::from("click")
            }
        }

        impl Speak for Robot {
            fn speak(&self) -> String {
                String::from("beep")
            }
        }

        fn chat(a: &impl Speak, b: &impl Speak) {
            println!("{} {}", a.speak(), b.speak());
        }

        fn main() {
            chat(&Crab, &Robot);
        }
      `,
      expect: { ok: true },
      explain:
        "In argument position, each `impl Speak` is its own hidden type parameter. This reads like `fn chat<A: Speak, B: Speak>(a: &A, b: &B)`, so the two arguments may be different types. It prints `click beep`."
    },
    {
      id: "impl-trait-return",
      kind: "verdict",
      topic: "impl Trait results",
      code: rs`
        trait Speak {
            fn speak(&self) -> String;
        }

        struct Crab;
        struct Robot;

        impl Speak for Crab {
            fn speak(&self) -> String {
                String::from("click")
            }
        }

        impl Speak for Robot {
            fn speak(&self) -> String {
                String::from("beep")
            }
        }

        fn pick(loud: bool) -> impl Speak {
            if loud { Robot } else { Crab }
        }

        fn main() {
            println!("{}", pick(true).speak());
        }
      `,
      expect: { ok: false, error: "E0308", line: 21 },
      explain:
        "As a return type, `impl Speak` means one fixed type that the caller is not told. The compiler still has to know its size and which `speak` to call, so every branch must return the same type. Here one returns `Robot` and the other `Crab`."
    },
    {
      id: "vec-mixed-types",
      kind: "verdict",
      topic: "One Vec, one type",
      code: rs`
        trait Speak {
            fn speak(&self) -> String;
        }

        struct Crab;
        struct Robot;

        impl Speak for Crab {
            fn speak(&self) -> String {
                String::from("click")
            }
        }

        impl Speak for Robot {
            fn speak(&self) -> String {
                String::from("beep")
            }
        }

        fn main() {
            let zoo = vec![Crab, Robot];
            for z in &zoo {
                print!("{} ", z.speak());
            }
        }
      `,
      expect: { ok: false, error: "E0308", line: 21 },
      explain:
        "Every element of a `Vec` has the same type and the same size. `Crab` and `Robot` are two different types. Sharing a trait does not make them one type."
    },
    {
      id: "dyn-vec",
      kind: "output",
      topic: "Trait objects",
      code: rs`
        trait Speak {
            fn speak(&self) -> String;
        }

        struct Crab;
        struct Robot;

        impl Speak for Crab {
            fn speak(&self) -> String {
                String::from("click")
            }
        }

        impl Speak for Robot {
            fn speak(&self) -> String {
                String::from("beep")
            }
        }

        fn main() {
            let zoo: Vec<Box<dyn Speak>> =
                vec![Box::new(Crab), Box::new(Robot)];
            for z in &zoo {
                print!("{} ", z.speak());
            }
        }
      `,
      choices: ["click beep", "click click", "beep beep", COMPILE_ERROR],
      answer: 0,
      explain:
        "`dyn Speak` is a trait object: a value of some type that implements `Speak`, where the exact type is only known while the program runs. Each `Box<dyn Speak>` is the same size (a pointer to the value plus a pointer to its method table), so they fit in one `Vec`. The right `speak` is looked up in that table on every call. This is called dynamic dispatch."
    },
    {
      id: "dyn-returns-self",
      kind: "verdict",
      topic: "Not every trait works with dyn",
      code: rs`
        trait Shape {
            fn double(&self) -> Self;
        }

        struct Square(u32);

        impl Shape for Square {
            fn double(&self) -> Self {
                Square(self.0 * 2)
            }
        }

        fn main() {
            let s: Box<dyn Shape> = Box::new(Square(2));
            let _ = s.double();
        }
      `,
      expect: { ok: false, error: "E0038", line: 14 },
      explain:
        "`double` returns `Self`, the concrete type. Behind `dyn Shape` that type is unknown, so there is no way to say what `double` would return or how big it is. A trait with a method like this can't be used as a trait object. The term for that is \"not dyn compatible\" (older books say \"not object safe\")."
    },
    {
      id: "fix-dyn-lifetime",
      kind: "fix",
      topic: "Trait objects have a lifetime",
      code: rs`
        trait Speak {
            fn speak(&self) -> String;
        }

        struct Parrot<'a> {
            phrase: &'a str,
        }

        impl Speak for Parrot<'_> {
            fn speak(&self) -> String {
                self.phrase.to_uppercase()
            }
        }

        fn boxed(phrase: &str) -> Box<dyn Speak> {
            Box::new(Parrot { phrase })
        }

        fn main() {
            let text = String::from("hello");
            println!("{}", boxed(&text).speak());
        }
      `,
      expect: { ok: false, error: "lifetime may not live long enough", line: 16 },
      line: 15,
      goal: "HELLO",
      choices: [
        "fn boxed(phrase: &str) -> Box<dyn Speak + '_> {",
        "fn boxed(phrase: &str) -> Box<dyn Speak + 'static> {",
        "fn boxed(phrase: &str) -> Box<&dyn Speak> {"
      ],
      answer: 0,
      explain:
        "A trait object hides its type, and with it any borrows inside. So `dyn Speak` carries a lifetime bound, and in a `Box` that bound is `'static` unless you write another. `Parrot` borrows `phrase`, which is not `'static`. `+ '_` says the object may borrow from the argument."
    },
    {
      id: "orphan-rule",
      kind: "verdict",
      topic: "The orphan rule",
      code: rs`
        use std::fmt;

        impl fmt::Display for Vec<u32> {
            fn fmt(
                &self,
                f: &mut fmt::Formatter,
            ) -> fmt::Result {
                write!(f, "{} numbers", self.len())
            }
        }

        fn main() {
            println!("{}", vec![1, 2, 3]);
        }
      `,
      expect: { ok: false, error: "E0117", line: 3 },
      explain:
        "You may write `impl Trait for Type` only if the trait or the type is defined in your own crate. This is called the orphan rule. `Display` and `Vec` both belong to the standard library. Without the rule, two crates could each write this `impl` and conflict. The usual way around it is to wrap the `Vec` in a struct of your own."
    },
    {
      id: "blanket-impl",
      kind: "output",
      topic: "Blanket impls",
      code: rs`
        use std::fmt::Display;

        trait Loud {
            fn loud(&self) -> String;
        }

        impl<T: Display> Loud for T {
            fn loud(&self) -> String {
                format!("{self}!")
            }
        }

        fn main() {
            println!("{} {}", 7.loud(), "hi".loud());
        }
      `,
      choices: ["7! hi!", "7 hi", "7! hi", COMPILE_ERROR],
      answer: 0,
      explain:
        "`impl<T: Display> Loud for T` implements `Loud` for every type that has `Display`, all at once. This is called a blanket impl. Integers and `&str` both have `Display`, so both get `loud`. The standard library gives every `Display` type its `to_string` method the same way."
    },
    {
      id: "iterator-impl",
      kind: "output",
      topic: "Associated types",
      code: rs`
        struct Countdown(u32);

        impl Iterator for Countdown {
            type Item = u32;

            fn next(&mut self) -> Option<u32> {
                if self.0 == 0 {
                    return None;
                }
                self.0 -= 1;
                Some(self.0 + 1)
            }
        }

        fn main() {
            let v: Vec<u32> =
                Countdown(3).map(|n| n * 2).collect();
            println!("{v:?}");
        }
      `,
      choices: ["[6, 4, 2]", "[3, 2, 1]", "[4, 2, 0]", COMPILE_ERROR],
      answer: 0,
      explain:
        "`type Item = u32` is an associated type: a type that each `impl` picks once, here the type of the items the iterator yields. `next` is the only required method of `Iterator`. `map`, `collect` and dozens more are default methods built on `next`, so `Countdown` gets them all. It yields `3, 2, 1`, each doubled."
    },
    {
      id: "operator-trait",
      kind: "verdict",
      topic: "Operators are traits",
      code: rs`
        use std::ops::Add;

        struct Point {
            x: i32,
            y: i32,
        }

        impl Add for Point {
            type Output = Point;

            fn add(self, o: Point) -> Point {
                Point { x: self.x + o.x, y: self.y + o.y }
            }
        }

        fn main() {
            let a = Point { x: 1, y: 2 };
            let p = a + Point { x: 10, y: 20 };
            println!("{} {}", p.x, p.y);
        }
      `,
      expect: { ok: true },
      explain:
        "`a + b` is short for `Add::add(a, b)`. Implementing the `Add` trait for your type is what makes `+` work on it. `add` takes `self` by value, so `a` is moved by the addition, like any other call. It prints `11 22`."
    }
  ]
};

const closures: Chapter = {
  id: "closures",
  number: "11",
  book: "Book ch. 12, 13",
  name: "Closures and iterators",
  blurb: "Functions that capture their surroundings, and lazy chains over sequences.",
  questions: [
    {
      id: "closure-one-type",
      kind: "verdict",
      topic: "Closure types are inferred once",
      code: rs`
        fn main() {
            let same = |x| x;
            let a = same(5);
            let b = same("five");
            println!("{a} {b}");
        }
      `,
      expect: { ok: false, error: "E0308", line: 4 },
      explain:
        "A closure is a function written inline, like `|x| x`, that can also use variables from around it. Its parameter types may be left out, and they are then fixed by the first call. `same(5)` makes `x` an integer, so a string no longer fits."
    },
    {
      id: "fnmut-needs-mut",
      kind: "verdict",
      topic: "Closures that change things",
      code: rs`
        fn main() {
            let mut count = 0;
            let inc = || count += 1;
            inc();
            inc();
            println!("{count}");
        }
      `,
      expect: { ok: false, error: "E0596", line: 3 },
      explain:
        "This closure changes `count`, so it holds a `&mut` borrow of it, and calling it changes that state. A closure like that must itself be declared `let mut inc`. With `mut` added it prints `2`."
    },
    {
      id: "fnonce-twice",
      kind: "verdict",
      topic: "Closures you can call once",
      code: rs`
        fn main() {
            let s = String::from("bye");
            let consume = || drop(s);
            consume();
            consume();
        }
      `,
      expect: { ok: false, error: "E0382", line: 5 },
      explain:
        "`drop(s)` takes `s` by value, so the closure gives its captured string away when it runs. It can't do that twice. Such a closure only has the `FnOnce` trait, which allows one call. Closures that just read have `Fn`, and those that change things have `FnMut`."
    },
    {
      id: "fix-return-closure",
      kind: "fix",
      topic: "Returning a closure",
      code: rs`
        fn adder(n: i32) -> impl Fn(i32) -> i32 {
            |x| x + n
        }

        fn main() {
            let add5 = adder(5);
            println!("{}", add5(1) + add5(2));
        }
      `,
      expect: { ok: false, error: "E0373", line: 2 },
      line: 2,
      goal: "13",
      choices: ["move |x| x + n", "|x| x + &n", "|&x| x + n"],
      answer: 0,
      explain:
        "By default a closure borrows what it uses. This one borrows `n`, a local of `adder` that is gone once `adder` returns. `move` makes the closure take ownership of `n`, so it carries its own copy along. The other two still borrow `n`."
    },
    {
      id: "iterators-are-lazy",
      kind: "output",
      topic: "Iterators are lazy",
      code: rs`
        fn main() {
            let v = vec![1, 2, 3];
            let doubled = v.iter().map(|x| {
                print!("map ");
                x * 2
            });
            print!("start ");
            let total: i32 = doubled.sum();
            println!("{total}");
        }
      `,
      choices: ["start map map map 12", "map map map start 12", "start 12", COMPILE_ERROR],
      answer: 0,
      explain:
        "An iterator is a value that hands out items one at a time. `map` only describes what to do with each item and runs nothing yet. This is what \"lazy\" means. The closure runs when something asks for the items, here `sum`, which comes after `start` is printed."
    },
    {
      id: "collect-needs-type",
      kind: "verdict",
      topic: "collect",
      code: rs`
        fn main() {
            let v = (1..4).map(|x| x * 2).collect();
            println!("{}", v.len());
        }
      `,
      expect: { ok: false, error: "E0282", line: 2 },
      explain:
        "`collect` gathers an iterator's items into a collection, and it can build many kinds: a `Vec`, a `HashMap`, a `String` and more. You have to say which: `let v: Vec<i32> = ...` or `.collect::<Vec<_>>()`."
    },
    {
      id: "filter-map-sum",
      kind: "output",
      topic: "Chaining adapters",
      code: rs`
        fn main() {
            let total: u32 = (1..=6)
                .filter(|n| n % 2 == 0)
                .map(|n| n * n)
                .sum();
            println!("{total}");
        }
      `,
      choices: ["56", "91", "12", COMPILE_ERROR],
      answer: 0,
      explain:
        "`filter` keeps the items its closure says `true` for: 2, 4 and 6. `map` turns each into its square: 4, 16 and 36. `sum` adds them up. Each item goes through the whole chain before the next one starts, and no list is built in between."
    },
    {
      id: "into-iter-consumes",
      kind: "verdict",
      topic: "iter or into_iter",
      code: rs`
        fn main() {
            let words = vec![String::from("hi")];
            let n: usize =
                words.into_iter().map(|w| w.len()).sum();
            println!("{n} {}", words.len());
        }
      `,
      expect: { ok: false, error: "E0382", line: 5 },
      explain:
        "`into_iter()` takes the vector by value and hands out the items themselves, so `words` is used up. `iter()` borrows the vector and hands out references, which is all `len` needs here."
    },
    {
      id: "iterator-needs-mut",
      kind: "verdict",
      topic: "next changes the iterator",
      code: rs`
        fn main() {
            let v = vec![1, 2, 3];
            let it = v.iter();
            println!("{:?}", it.next());
        }
      `,
      expect: { ok: false, error: "E0596", line: 4 },
      explain:
        "An iterator remembers where it is, and `next` moves it one step forward, so `next` takes `&mut self`. Calling it by hand needs `let mut it`. A `for` loop takes ownership of the iterator and does this for you."
    },
    {
      id: "zip-shortest",
      kind: "output",
      topic: "zip",
      code: rs`
        fn main() {
            let nums = [1, 2, 3];
            let names = ["one", "two"];
            let pairs: Vec<_> =
                nums.iter().zip(names.iter()).collect();
            println!("{}", pairs.len());
        }
      `,
      choices: ["2", "3", PANIC, COMPILE_ERROR],
      answer: 0,
      explain:
        "`zip` walks two iterators side by side and yields pairs. It stops as soon as either one runs out, so the `3` is left without a partner and dropped from the result. Nothing panics."
    },
    {
      id: "args-count",
      kind: "output",
      topic: "Command line arguments",
      code: rs`
        use std::env;

        fn main() {
            let args: Vec<String> = env::args().collect();
            println!("{}", args.len());
        }
      `,
      choices: ["1", "0", PANIC],
      answer: 0,
      explain:
        "Assume the program is started with no arguments. `env::args()` is an iterator over the command line, and its first item is always the name the program was started with. The arguments typed by the user start at `args[1]`."
    }
  ]
};

const pointers: Chapter = {
  id: "pointers",
  number: "12",
  book: "Book ch. 15",
  name: "Smart pointers",
  blurb: "Box, Rc, RefCell and Weak: owning data on the heap, alone or shared.",
  questions: [
    {
      id: "recursive-type",
      kind: "verdict",
      topic: "Recursive types",
      code: rs`
        enum List {
            Cons(i32, List),
            Nil,
        }

        use List::{Cons, Nil};

        fn main() {
            let list = Cons(1, Box::new(Nil));
            if let Cons(n, rest) = list {
                let end = matches!(*rest, Nil);
                println!("{n} {end}");
            }
        }
      `,
      expect: { ok: false, error: "E0072", line: 1 },
      explain:
        "The compiler must know the size of every type. A `List` that holds another `List` directly would hold another, and another, with no end: \"recursive type has infinite size\". The inner list has to sit behind a pointer, which has a fixed size."
    },
    {
      id: "fix-recursive-type",
      kind: "fix",
      topic: "Recursive types",
      code: rs`
        enum List {
            Cons(i32, List),
            Nil,
        }

        use List::{Cons, Nil};

        fn main() {
            let list = Cons(1, Box::new(Nil));
            if let Cons(n, rest) = list {
                let end = matches!(*rest, Nil);
                println!("{n} {end}");
            }
        }
      `,
      expect: { ok: false, error: "E0072", line: 1 },
      line: 2,
      goal: "1 true",
      choices: ["Cons(i32, Box<List>),", "Cons(i32, &List),", "Cons(i32, [List; 1]),"],
      answer: 0,
      explain:
        "`Box<T>` is a pointer that owns a value stored on the heap. A box is always one pointer wide, whatever is inside, so the size of `List` is known. A `&List` needs a lifetime and an owner somewhere else. An array of one `List` is as large as a `List`, so nothing is gained."
    },
    {
      id: "deref-coercion",
      kind: "verdict",
      topic: "Deref coercion",
      code: rs`
        fn hello(name: &str) {
            println!("hello {name}");
        }

        fn main() {
            let boxed = Box::new(String::from("Ferris"));
            hello(&boxed);
        }
      `,
      expect: { ok: true },
      explain:
        "`&boxed` is a `&Box<String>`, and `hello` wants a `&str`. When the types of a reference don't match, the compiler tries dereferencing for you: `&Box<String>` to `&String` to `&str`. This is called deref coercion, and it is why `&String` works wherever `&str` is asked for."
    },
    {
      id: "box-compare",
      kind: "verdict",
      topic: "A box is not its content",
      code: rs`
        fn main() {
            let x = 5;
            let y = Box::new(x);
            let same = 5 == y;
            println!("{same}");
        }
      `,
      expect: { ok: false, error: "E0277", line: 4 },
      explain:
        "`y` is a `Box<i32>`, a pointer to a number, and comparing a number with a pointer is a type error. Deref coercion only applies to references passed where another reference type is expected. Here you follow the pointer yourself: `5 == *y`."
    },
    {
      id: "box-move-out",
      kind: "verdict",
      topic: "Moving out of a Box",
      code: rs`
        fn main() {
            let b = Box::new(String::from("hi"));
            let s: String = *b;
            println!("{s}");
        }
      `,
      expect: { ok: true },
      explain:
        "A `Box` is the only owner of its content, so `*b` may move the `String` out of it. The box is used up by that, and its heap memory is freed. It prints `hi`."
    },
    {
      id: "rc-move-out",
      kind: "verdict",
      topic: "Moving out of an Rc",
      code: rs`
        use std::rc::Rc;

        fn main() {
            let a = Rc::new(String::from("hi"));
            let s: String = *a;
            println!("{s}");
        }
      `,
      expect: { ok: false, error: "E0507", line: 5 },
      explain:
        "`Rc<T>` (reference counted) lets several owners share one value. Because there may be other owners, none of them may move the value out, even when it happens to be the only one. Clone the string, or borrow it with `&*a`."
    },
    {
      id: "rc-is-read-only",
      kind: "verdict",
      topic: "Rc gives shared access",
      code: rs`
        use std::rc::Rc;

        fn main() {
            let a = Rc::new(vec![1]);
            a.push(2);
            println!("{a:?}");
        }
      `,
      expect: { ok: false, error: "E0596", line: 5 },
      explain:
        "Everything an `Rc` hands out is a shared reference, since other owners may be looking at the same value. Shared means read-only, and `push` needs `&mut`. To change shared data, put a `RefCell` inside: `Rc<RefCell<Vec<i32>>>`."
    },
    {
      id: "rc-refcell",
      kind: "output",
      topic: "Rc<RefCell<T>>",
      code: rs`
        use std::cell::RefCell;
        use std::rc::Rc;

        fn main() {
            let shared = Rc::new(RefCell::new(vec![1]));
            let other = Rc::clone(&shared);
            other.borrow_mut().push(2);
            let n = Rc::strong_count(&shared);
            println!("{:?} {n}", shared.borrow());
        }
      `,
      choices: ["[1, 2] 2", "[1] 2", "[1, 2] 1", COMPILE_ERROR],
      answer: 0,
      explain:
        "`Rc` gives the vector two owners, and `RefCell` allows changing it through a shared reference by checking the borrow rules while the program runs. `shared` and `other` point at the same vector, so the push through one is seen through the other."
    },
    {
      id: "explicit-drop-call",
      kind: "verdict",
      topic: "Dropping early",
      code: rs`
        struct Noisy(&'static str);

        impl Drop for Noisy {
            fn drop(&mut self) {
                print!("{} ", self.0);
            }
        }

        fn main() {
            let a = Noisy("a");
            a.drop();
            println!("end");
        }
      `,
      expect: { ok: false, error: "E0040", line: 11 },
      explain:
        "The `Drop` trait holds the cleanup code that runs when a value goes away. You can't call that method yourself: Rust would run it again at the end of the scope and clean up twice. To drop a value early, hand it to the function `drop(a)`."
    },
    {
      id: "drop-function",
      kind: "output",
      topic: "Dropping early",
      code: rs`
        struct Noisy(&'static str);

        impl Drop for Noisy {
            fn drop(&mut self) {
                print!("{} ", self.0);
            }
        }

        fn main() {
            let a = Noisy("a");
            let _b = Noisy("b");
            drop(a);
            print!("end ");
        }
      `,
      choices: ["a end b", "end b a", "end a b", "a b end"],
      answer: 0,
      explain:
        "`drop(a)` takes `a` by value, so it is moved into that function and cleaned up there, before `end` is printed. `_b` lives until the closing brace of `main`. `a` is not dropped a second time, because it was moved away."
    },
    {
      id: "weak-upgrade",
      kind: "output",
      topic: "Weak references",
      code: rs`
        use std::rc::Rc;

        fn main() {
            let weak;
            {
                let strong = Rc::new(5);
                weak = Rc::downgrade(&strong);
                print!("{:?} ", weak.upgrade());
            }
            println!("{:?}", weak.upgrade());
        }
      `,
      choices: ["Some(5) None", "Some(5) Some(5)", PANIC, COMPILE_ERROR],
      answer: 0,
      explain:
        "A `Weak` pointer refers to a value in an `Rc` without owning it, so it doesn't keep the value alive. `upgrade()` asks whether the value still exists and answers with an `Option`. After the block, the only owner is gone and the answer is `None`. `Weak` is how two values can point at each other without leaking memory."
    }
  ]
};

const concurrency: Chapter = {
  id: "concurrency",
  number: "13",
  book: "Book ch. 16, 17, 21",
  name: "Threads and futures",
  blurb: "Sharing data between threads, channels, and async code that waits.",
  questions: [
    {
      id: "rc-not-send",
      kind: "verdict",
      topic: "Send",
      code: rs`
        use std::rc::Rc;
        use std::thread;

        fn main() {
            let n = Rc::new(5);
            let h = thread::spawn(move || {
                println!("{n}");
            });
            h.join().unwrap();
        }
      `,
      expect: { ok: false, error: "E0277", line: 6 },
      explain:
        "`Send` is the trait for types that are safe to move to another thread. `Rc` doesn't have it: it counts its owners with a plain number, and two threads updating that number at once could corrupt it. `Arc` is the same idea with a count that is safe across threads."
    },
    {
      id: "arc-mutex-counter",
      kind: "output",
      topic: "Arc<Mutex<T>>",
      code: rs`
        use std::sync::{Arc, Mutex};
        use std::thread;

        fn main() {
            let n = Arc::new(Mutex::new(0));
            let mut handles = Vec::new();
            for _ in 0..4 {
                let n = Arc::clone(&n);
                handles.push(thread::spawn(move || {
                    *n.lock().unwrap() += 10;
                }));
            }
            for h in handles {
                h.join().unwrap();
            }
            println!("{}", n.lock().unwrap());
        }
      `,
      choices: ["40", "10", "0", COMPILE_ERROR],
      answer: 0,
      explain:
        "`Arc` lets the four threads share ownership of one value. `Mutex` (mutual exclusion) lets only one of them touch it at a time: `lock()` waits for its turn and returns a guard that gives access until it is dropped. Every thread adds 10, and `join` waits for each to finish before the print."
    },
    {
      id: "mutex-needs-arc",
      kind: "verdict",
      topic: "Arc<Mutex<T>>",
      code: rs`
        use std::sync::Mutex;
        use std::thread;

        fn main() {
            let n = Mutex::new(0);
            let mut handles = Vec::new();
            for _ in 0..4 {
                handles.push(thread::spawn(move || {
                    *n.lock().unwrap() += 10;
                }));
            }
            for h in handles {
                h.join().unwrap();
            }
        }
      `,
      expect: { ok: false, error: "E0382", line: 8 },
      explain:
        "`move` gives the mutex to the first thread, and the second pass of the loop has nothing left to give. A `Mutex` controls access, but it still has a single owner. Wrap it in an `Arc` and give each thread a clone of the `Arc`."
    },
    {
      id: "channel-send-moves",
      kind: "verdict",
      topic: "Channels",
      code: rs`
        use std::sync::mpsc;

        fn main() {
            let (tx, rx) = mpsc::channel();
            let msg = String::from("ping");
            tx.send(msg).unwrap();
            println!("sent {msg}");
            println!("got {}", rx.recv().unwrap());
        }
      `,
      expect: { ok: false, error: "E0382", line: 7 },
      explain:
        "A channel carries values from a sender (`tx`) to a receiver (`rx`), usually on another thread. `send` moves the value into the channel, and from then on it belongs to whoever receives it. That is why the sending side can't keep using it."
    },
    {
      id: "channel-collect",
      kind: "output",
      topic: "Channels",
      code: rs`
        use std::sync::mpsc;
        use std::thread::spawn;

        fn main() {
            let (tx, rx) = mpsc::channel();
            let tx2 = tx.clone();
            let a = spawn(move || tx.send(1).unwrap());
            a.join().unwrap();
            let b = spawn(move || tx2.send(2).unwrap());
            b.join().unwrap();
            let got: Vec<i32> = rx.iter().collect();
            println!("{got:?}");
        }
      `,
      choices: ["[1, 2]", "[2, 1]", "[]", COMPILE_ERROR],
      answer: 0,
      explain:
        "`mpsc` stands for multiple producer, single consumer: a sender can be cloned, and all clones feed one receiver. Messages wait in the channel until they are read. `rx.iter()` yields them in order and ends once every sender has been dropped, which happens when the two threads finish."
    },
    {
      id: "receiver-not-clone",
      kind: "verdict",
      topic: "One receiver",
      code: rs`
        use std::sync::mpsc;

        fn main() {
            let (tx, rx) = mpsc::channel();
            let rx2 = rx.clone();
            tx.send(1).unwrap();
            println!("{:?} {:?}", rx.recv(), rx2.try_recv());
        }
      `,
      expect: { ok: false, error: "E0599", line: 5 },
      explain:
        "The \"single consumer\" in `mpsc` is enforced by the types: `Receiver` has no `clone`. When several worker threads should take jobs from one channel, as in the book's web server, they share the one receiver as an `Arc<Mutex<Receiver<T>>>`."
    },
    {
      id: "future-is-lazy",
      kind: "output",
      topic: "Futures are lazy",
      code: rs`
        async fn hello() {
            print!("hello ");
        }

        fn main() {
            let fut = hello();
            print!("made ");
            drop(fut);
            println!("done");
        }
      `,
      choices: ["made done", "hello made done", "made hello done", COMPILE_ERROR],
      answer: 0,
      explain:
        "Calling an `async fn` runs none of its body. It returns a future: a value that describes work to be done later. The work only happens when the future is awaited or handed to a runtime. This one is dropped unused, so `hello` is never printed."
    },
    {
      id: "async-returns-future",
      kind: "verdict",
      topic: "Futures are lazy",
      code: rs`
        async fn answer() -> u32 {
            42
        }

        fn main() {
            let n: u32 = answer();
            println!("{n}");
        }
      `,
      expect: { ok: false, error: "E0308", line: 6 },
      explain:
        "An `async fn` written as returning `u32` really returns a future that will produce a `u32` once it has run. The number is only available after `.await`."
    },
    {
      id: "await-outside-async",
      kind: "verdict",
      topic: "await needs async",
      code: rs`
        async fn answer() -> u32 {
            42
        }

        fn main() {
            let n = answer().await;
            println!("{n}");
        }
      `,
      expect: { ok: false, error: "E0728", line: 6 },
      explain:
        "`.await` pauses the surrounding code until a future is ready, and only async code can be paused. So `.await` is allowed in an `async fn` or `async` block and nowhere else. A plain `main` needs a runtime, a library such as Tokio that runs futures, to cross from normal code into async code."
    },
    {
      id: "block-on",
      kind: "output",
      topic: "What a runtime does",
      code: rs`
        use std::pin::pin;
        use std::task::{Context, Poll, Waker};

        fn block_on<F: Future>(fut: F) -> F::Output {
            let mut fut = pin!(fut);
            let mut cx = Context::from_waker(Waker::noop());
            loop {
                match fut.as_mut().poll(&mut cx) {
                    Poll::Ready(value) => return value,
                    Poll::Pending => {}
                }
            }
        }

        async fn double(n: u32) -> u32 {
            n * 2
        }

        fn main() {
            let total = block_on(async {
                let a = double(1).await;
                let b = double(a).await;
                a + b
            });
            println!("{total}");
        }
      `,
      choices: ["6", "4", "2", COMPILE_ERROR],
      answer: 0,
      explain:
        "A future makes progress when someone calls `poll` on it. `poll` answers `Ready(value)` when the work is done, or `Pending` when it has to wait. `block_on` here is the smallest possible runtime: it polls until the future is ready. Inside, each `.await` runs another future to its end: `a` is 2, `b` is 4."
    }
  ]
};

const advanced: Chapter = {
  id: "advanced",
  number: "14",
  book: "Book ch. 18, 20",
  name: "Advanced features",
  blurb: "unsafe, trait tricks, function pointers, macros and the never type.",
  questions: [
    {
      id: "raw-pointer-deref",
      kind: "verdict",
      topic: "unsafe",
      code: rs`
        fn main() {
            let x = 5;
            let p = &x as *const i32;
            println!("{}", *p);
        }
      `,
      expect: { ok: false, error: "E0133", line: 4 },
      explain:
        "`*const i32` is a raw pointer: an address with none of the guarantees of a reference. It may be null or point at freed memory. Making one is safe. Reading through one is not something the compiler can check, so it is only allowed inside an `unsafe` block."
    },
    {
      id: "fix-raw-pointer-deref",
      kind: "fix",
      topic: "unsafe",
      code: rs`
        fn main() {
            let x = 5;
            let p = &x as *const i32;
            println!("{}", *p);
        }
      `,
      expect: { ok: false, error: "E0133", line: 4 },
      line: 4,
      goal: "5",
      choices: ['println!("{}", unsafe { *p });', 'println!("{}", &*p);', 'println!("{}", p);'],
      answer: 0,
      explain:
        "`unsafe { ... }` doesn't turn off the borrow checker. It unlocks a few extra operations, such as reading through a raw pointer, and marks the spot where you, not the compiler, promise the pointer is valid. `&*p` still reads through it. `p` alone is an address, which `{}` can't print."
    },
    {
      id: "same-name-methods",
      kind: "output",
      topic: "Methods with the same name",
      code: rs`
        trait Pilot {
            fn fly(&self) -> &'static str;
        }

        trait Wizard {
            fn fly(&self) -> &'static str;
        }

        struct Human;

        impl Pilot for Human {
            fn fly(&self) -> &'static str {
                "plane"
            }
        }

        impl Wizard for Human {
            fn fly(&self) -> &'static str {
                "broom"
            }
        }

        impl Human {
            fn fly(&self) -> &'static str {
                "arms"
            }
        }

        fn main() {
            let h = Human;
            print!("{} ", h.fly());
            print!("{} ", Pilot::fly(&h));
            println!("{}", Wizard::fly(&h));
        }
      `,
      choices: ["arms plane broom", "plane plane broom", "arms arms arms", COMPILE_ERROR],
      answer: 0,
      explain:
        "Three methods are called `fly`. `h.fly()` picks the one written directly on the type. To reach a trait's version, name the trait: `Pilot::fly(&h)`. Spelling out where a method comes from like this is called fully qualified syntax."
    },
    {
      id: "ambiguous-method",
      kind: "verdict",
      topic: "Methods with the same name",
      code: rs`
        trait Pilot {
            fn fly(&self) -> &'static str;
        }

        trait Wizard {
            fn fly(&self) -> &'static str;
        }

        struct Human;

        impl Pilot for Human {
            fn fly(&self) -> &'static str {
                "plane"
            }
        }

        impl Wizard for Human {
            fn fly(&self) -> &'static str {
                "broom"
            }
        }

        fn main() {
            println!("{}", Human.fly());
        }
      `,
      expect: { ok: false, error: "E0034", line: 24 },
      explain:
        "Without a method on the type itself, `fly` could mean either trait's version, and neither is preferred. The call is ambiguous and is rejected. Say which one: `Pilot::fly(&Human)` or `Wizard::fly(&Human)`."
    },
    {
      id: "supertrait",
      kind: "verdict",
      topic: "Supertraits",
      code: rs`
        use std::fmt::Display;

        trait Label: Display {
            fn label(&self) -> String {
                format!("[{self}]")
            }
        }

        struct Point(i32);

        impl Label for Point {}

        fn main() {
            println!("{}", Point(3).label());
        }
      `,
      expect: { ok: false, error: "E0277", line: 11 },
      explain:
        "`trait Label: Display` makes `Display` a supertrait of `Label`: a type must implement `Display` before it may implement `Label`. That is what lets the default method print `self` with `{}`. `Point` has no `Display`."
    },
    {
      id: "newtype-display",
      kind: "output",
      topic: "The newtype pattern",
      code: rs`
        use std::fmt;

        struct Wrapper(Vec<String>);

        impl fmt::Display for Wrapper {
            fn fmt(
                &self,
                f: &mut fmt::Formatter,
            ) -> fmt::Result {
                write!(f, "[{}]", self.0.join(", "))
            }
        }

        fn main() {
            let w = Wrapper(vec!["a".into(), "b".into()]);
            println!("{w}");
        }
      `,
      choices: ["[a, b]", '["a", "b"]', "Wrapper([a, b])", COMPILE_ERROR],
      answer: 0,
      explain:
        "The orphan rule forbids `impl Display for Vec<String>`, since neither belongs to your crate. A tuple struct with one field, wrapped around the `Vec`, is a type of your own, and you may implement any trait for it. This is called the newtype pattern, and the wrapper costs nothing when the program runs."
    },
    {
      id: "type-alias",
      kind: "verdict",
      topic: "Type aliases",
      code: rs`
        type Km = u32;

        fn main() {
            let trip: Km = 5;
            let extra: u32 = 3;
            println!("{}", trip + extra);
        }
      `,
      expect: { ok: true },
      explain:
        "`type Km = u32` creates a second name for the same type, not a new type. A `Km` is a `u32` and mixes freely with one. Aliases are for shortening long types. When you want mix-ups caught, use a tuple struct like `struct Km(u32)`."
    },
    {
      id: "never-type",
      kind: "output",
      topic: "The never type",
      code: rs`
        fn main() {
            let mut sum = 0;
            for s in ["1", "x", "3"] {
                let n: i32 = match s.parse() {
                    Ok(n) => n,
                    Err(_) => continue,
                };
                sum += n;
            }
            println!("{sum}");
        }
      `,
      choices: ["4", "1", PANIC, COMPILE_ERROR],
      answer: 0,
      explain:
        "Both arms of a `match` must have the same type, yet one is an `i32` and the other is `continue`. `continue` never produces a value, because control jumps away. Its type is `!`, the never type, which fits anywhere a value is expected. `return`, `break` and `panic!` have it too."
    },
    {
      id: "fn-pointer",
      kind: "output",
      topic: "Function pointers",
      code: rs`
        fn add_one(x: i32) -> i32 {
            x + 1
        }

        fn twice(f: fn(i32) -> i32, x: i32) -> i32 {
            f(f(x))
        }

        fn main() {
            println!("{}", twice(add_one, 5));
        }
      `,
      choices: ["7", "6", "12", COMPILE_ERROR],
      answer: 0,
      explain:
        "A function's name can be passed around as a value. `fn(i32) -> i32`, with a small `f`, is the type of a function pointer: the address of some function with that signature. `twice` calls it on `5`, then again on the result."
    },
    {
      id: "fn-pointer-capture",
      kind: "verdict",
      topic: "Function pointers",
      code: rs`
        fn twice(f: fn(i32) -> i32, x: i32) -> i32 {
            f(f(x))
        }

        fn main() {
            let step = 10;
            println!("{}", twice(|x| x + step, 5));
        }
      `,
      expect: { ok: false, error: "E0308", line: 7 },
      explain:
        "A function pointer is only an address, with no room for extra data. This closure uses `step` from its surroundings, so it has to carry that value along and can't be turned into a `fn`. Declare the parameter as `impl Fn(i32) -> i32` to accept closures too."
    },
    {
      id: "boxed-closures",
      kind: "output",
      topic: "A list of closures",
      code: rs`
        fn main() {
            let steps: Vec<Box<dyn Fn(i32) -> i32>> = vec![
                Box::new(|x| x + 1),
                Box::new(|x| x * 10),
            ];
            let mut n = 1;
            for step in &steps {
                n = step(n);
            }
            println!("{n}");
        }
      `,
      choices: ["20", "11", "10", COMPILE_ERROR],
      answer: 0,
      explain:
        "Every closure has a type of its own that can't be written down, so two closures never share a type. Behind `Box<dyn Fn(i32) -> i32>` they do: each becomes a trait object, and they fit in one `Vec`. They run in order: 1 + 1, then times 10."
    },
    {
      id: "macro-expr",
      kind: "output",
      topic: "macro_rules!",
      code: rs`
        macro_rules! square {
            ($x:expr) => {
                $x * $x
            };
        }

        fn main() {
            println!("{}", square!(2 + 1));
        }
      `,
      choices: ["9", "5", "6", COMPILE_ERROR],
      answer: 0,
      explain:
        "`macro_rules!` defines a macro by matching patterns in code. `$x:expr` captures a whole expression as one unit, so `2 + 1` stays together and the result is `3 * 3`. A C macro pastes text and would produce `2 + 1 * 2 + 1`, which is 5."
    },
    {
      id: "unsized-parameter",
      kind: "verdict",
      topic: "Types without a known size",
      code: rs`
        fn show(s: str) {
            println!("{s}");
        }

        fn main() {
            show(*"hi");
        }
      `,
      expect: { ok: false, error: "E0277", line: 1 },
      explain:
        "`str` is text of any length, so its size isn't known at compile time. A parameter or variable needs a known size. That is why you always meet `str` behind a pointer, `&str` or `Box<str>`, where the pointer stores the length next to the address."
    },
    {
      id: "state-pattern",
      kind: "output",
      topic: "The state pattern",
      code: rs`
        trait State {
            fn next(self: Box<Self>) -> Box<dyn State>;
            fn name(&self) -> &'static str;
        }

        struct Draft;
        struct Published;

        impl State for Draft {
            fn next(self: Box<Self>) -> Box<dyn State> {
                Box::new(Published)
            }
            fn name(&self) -> &'static str {
                "draft"
            }
        }

        impl State for Published {
            fn next(self: Box<Self>) -> Box<dyn State> {
                self
            }
            fn name(&self) -> &'static str {
                "published"
            }
        }

        fn main() {
            let s: Box<dyn State> = Box::new(Draft);
            let s = s.next();
            let s = s.next();
            println!("{}", s.name());
        }
      `,
      choices: ["published", "draft", COMPILE_ERROR],
      answer: 0,
      explain:
        "Each state is its own type, and `next` decides which state follows. `self: Box<Self>` means the method takes ownership of the box, so the old state is used up and can't be touched again. A draft becomes published, and a published post stays as it is."
    }
  ]
};

const gauntlet: Chapter = {
  id: "gauntlet",
  number: "15",
  book: "All chapters",
  name: "The gauntlet",
  blurb: "A last mixed round, plus a few surprises from every earlier chapter.",
  mixIn: 4,
  questions: [
    {
      id: "partial-move",
      kind: "verdict",
      topic: "Partial move",
      code: rs`
        #[derive(Debug)]
        struct User {
            name: String,
            age: u32,
        }

        fn main() {
            let u = User {
                name: String::from("Ann"),
                age: 30,
            };
            let n = u.name;
            println!("{n} {u:?}");
        }
      `,
      expect: { ok: false, error: "E0382", line: 13 },
      explain:
        "`let n = u.name` moves just one field out. `u.age` is still usable, but `u` as a whole is \"partially moved\" and can't be borrowed to print it."
    },
    {
      id: "getter-borrows",
      kind: "verdict",
      topic: "Methods borrow all of self",
      code: rs`
        struct Game {
            score: u32,
            lives: u32,
        }

        impl Game {
            fn score(&mut self) -> &mut u32 {
                &mut self.score
            }
            fn lives(&mut self) -> &mut u32 {
                &mut self.lives
            }
        }

        fn main() {
            let mut g = Game { score: 0, lives: 3 };
            let s = g.score();
            let l = g.lives();
            *s += 100;
            *l -= 1;
        }
      `,
      expect: { ok: false, error: "E0499", line: 18 },
      explain:
        "Direct field borrows were fine in the borrowing chapter, but a method signature only says `&mut self -> &mut u32`. As far as the caller knows, `s` borrows the whole `Game`, so `g.lives()` can't take a second `&mut`."
    },
    {
      id: "thread-borrow",
      kind: "verdict",
      topic: "Threads need 'static",
      code: rs`
        use std::thread;

        fn main() {
            let v = vec![1, 2, 3];
            let h = thread::spawn(|| {
                println!("{v:?}");
            });
            h.join().unwrap();
        }
      `,
      expect: { ok: false, error: "E0373", line: 5 },
      explain:
        "`thread::spawn` requires a `'static` closure, because the thread may outlive `main`'s locals. The closure only borrows `v`. Write `move ||` to give the thread ownership of it."
    },
    {
      id: "thread-scope",
      kind: "verdict",
      topic: "Scoped threads",
      code: rs`
        use std::thread;

        fn main() {
            let v = vec![1, 2, 3];
            thread::scope(|s| {
                s.spawn(|| println!("{v:?}"));
            });
            println!("{}", v.len());
        }
      `,
      expect: { ok: true },
      explain:
        "`thread::scope` joins every thread it spawned before it returns. The threads can't outlive `v`, so they may borrow it with no `move` and no `'static`."
    },
    {
      id: "rc-count",
      kind: "output",
      topic: "Rc",
      code: rs`
        use std::rc::Rc;

        fn main() {
            let a = Rc::new(String::from("shared"));
            let b = Rc::clone(&a);
            {
                let _c = Rc::clone(&a);
                print!("{} ", Rc::strong_count(&a));
            }
            println!("{}", Rc::strong_count(&b));
        }
      `,
      choices: ["3 3", "3 2", "1 1", "2 2"],
      answer: 1,
      explain:
        "`Rc` lets several owners share one value. `Rc::clone` copies the pointer and bumps the count, and dropping `_c` at the end of its block lowers it. The string is freed when the count reaches zero."
    },
    {
      id: "fix-mem-take",
      kind: "fix",
      topic: "Moving out of &mut",
      code: rs`
        struct Bag {
            items: Vec<String>,
        }

        impl Bag {
            fn empty(&mut self) -> Vec<String> {
                self.items
            }
        }

        fn main() {
            let items = vec!["a".into(), "b".into()];
            let mut b = Bag { items };
            let got = b.empty();
            println!("{} {}", b.items.len(), got.len());
        }
      `,
      expect: { ok: false, error: "E0507", line: 7 },
      line: 7,
      goal: "0 2",
      choices: ["std::mem::take(&mut self.items)", "self.items.clone()", "&self.items"],
      answer: 0,
      explain:
        "You can't move out of a `&mut` and leave nothing behind. `mem::take` swaps in an empty `Vec` and hands you the old one. `clone()` compiles but leaves the bag full (`2 2`). `&self.items` is the wrong type."
    },
    {
      id: "fix-match-ref",
      kind: "fix",
      topic: "Match ergonomics",
      code: rs`
        fn main() {
            let maybe = Some(String::from("kelp"));
            let r = &maybe;
            match *r {
                Some(s) => println!("{s}"),
                None => {}
            }
        }
      `,
      expect: { ok: false, error: "E0507", line: 4 },
      line: 4,
      goal: "kelp",
      choices: ["match r {", "match **r {", "match r.unwrap() {"],
      answer: 0,
      explain:
        "Matching on `*r` tries to move the `String` out of `maybe` through a shared reference. Matching on the reference `r` itself makes `s` a `&String`. `**r` dereferences once too often, and `r.unwrap()` gives a `String`, which the `Some` and `None` patterns don't fit."
    },
    {
      id: "move-closure-copy",
      kind: "output",
      topic: "move closures",
      code: rs`
        fn main() {
            let mut n = 1;
            let mut add = move || {
                n += 10;
                n
            };
            print!("{} ", add());
            print!("{} ", add());
            println!("{n}");
        }
      `,
      choices: ["11 21 21", "11 21 1", "11 11 1", COMPILE_ERROR],
      answer: 1,
      explain:
        "`move` moves captured values into the closure. For a `Copy` type like `i32` that means the closure gets its own copy. It updates that copy on each call, and the outer `n` stays `1`."
    }
  ]
};

export const CHAPTERS: Chapter[] = [
  basics,
  ownership,
  borrowing,
  data,
  modules,
  collections,
  errors,
  lifetimes,
  structs,
  traits,
  closures,
  pointers,
  concurrency,
  advanced,
  gauntlet
];

// Every snippet here is compiled (and, if it compiles, run) by scripts/verify.ts,
// which fails the build if any expectation, line number or answer is wrong.
import { COMPILE_ERROR, PANIC, rs, type Chapter } from "./types";

const ownership: Chapter = {
  id: "ownership",
  number: "01",
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
  number: "02",
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

const lifetimes: Chapter = {
  id: "lifetimes",
  number: "03",
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
  number: "04",
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
  number: "05",
  name: "What can it do?",
  blurb: "Traits: shared behaviour, bounds on generics, and dyn for mixing types.",
  questions: [
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

const gauntlet: Chapter = {
  id: "gauntlet",
  number: "06",
  name: "The gauntlet",
  blurb: "Threads, closures, Rc, patterns, plus a few surprises from earlier rounds.",
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
        "Direct field borrows were fine in round two, but a method signature only says `&mut self -> &mut u32`. As far as the caller knows, `s` borrows the whole `Game`, so `g.lives()` can't take a second `&mut`."
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

export const CHAPTERS: Chapter[] = [ownership, borrowing, lifetimes, structs, traits, gauntlet];

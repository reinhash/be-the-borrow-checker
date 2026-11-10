// Confetti and screen shake, both skipped when the reader prefers reduced motion.
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function confetti(count = 40): void {
  if (reduced()) return;
  const layer = document.createElement("div");
  layer.className = "confetti";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("i");
    bit.style.setProperty("--x", `${Math.random() * 100}vw`);
    bit.style.setProperty("--drift", `${(Math.random() - 0.5) * 30}vw`);
    bit.style.setProperty("--spin", `${(Math.random() - 0.5) * 1440}deg`);
    bit.style.setProperty("--delay", `${Math.random() * 0.4}s`);
    layer.append(bit);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2600);
}

export function shake(el: Element): void {
  if (reduced()) return;
  el.classList.remove("shake");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("shake");
}

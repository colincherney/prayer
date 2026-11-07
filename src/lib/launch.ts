// The first moments after the splash screen are when animations are most likely to stutter, because every screen
// is mounting at once. Background refreshes wait until then; screens draw from the saved copies (localCache, the pet
// cache) in the meantime, so nothing looks empty.

/** How long after the splash hides that background refreshes wait. */
const SETTLE_MS = 1500;

let quietUntil = Number.POSITIVE_INFINITY;

/** Called when the splash screen hides. */
export function markLaunched() {
  if (quietUntil === Number.POSITIVE_INFINITY) quietUntil = Date.now() + SETTLE_MS;
}

/** Runs `fn` now, or once the app has settled after launch. Returns a cancel function. */
export function afterLaunch(fn: () => void): () => void {
  const wait = quietUntil === Number.POSITIVE_INFINITY ? SETTLE_MS : quietUntil - Date.now();
  if (wait <= 0) {
    fn();
    return () => {};
  }
  const timer = setTimeout(fn, wait);
  return () => clearTimeout(timer);
}

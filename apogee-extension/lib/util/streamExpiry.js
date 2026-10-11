// Sliding expiry for buffered streams: each chunk reschedules a full
// window out, so active streams survive while idle ones are reclaimed.
// setTimeout only, so offscreen and unit tests share it; the worker
// mirrors it with chrome.alarms.

export const STREAM_CLEANUP_MS = 2 * 60 * 1000;

export function createSlidingExpiry({
  timeoutMs = STREAM_CLEANUP_MS,
  onExpire,
} = {}) {
  const timers = new Map();

  function cancel(id) {
    const handle = timers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      timers.delete(id);
    }
  }

  function schedule(id) {
    cancel(id);
    const handle = setTimeout(() => {
      timers.delete(id);
      onExpire?.(id);
    }, timeoutMs);
    // Browsers return a number here, so this is a no-op in the extension.
    if (typeof handle?.unref === "function") {
      try {
        handle.unref();
      } catch {
        // unref is unavailable in some environments.
      }
    }
    timers.set(id, handle);
  }

  return { schedule, cancel };
}

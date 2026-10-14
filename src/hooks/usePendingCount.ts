import { useEffect, useState } from "react";

// New enquiries come from the
// website, so the panel cannot be told
// about them; it asks again on this
// interval.
const POLL_MS = 60_000;

// ========================================
// PENDING COUNT
//
// For a sidebar badge, e.g. pending
// new enquiries. Refreshes on an
// interval, when the tab regains focus,
// and when `changedEvent` fires (right
// after the panel changes a record).
// `enabled` is false for accounts without
// the view permission, which never ask.
//
// `fetchCount` must be stable (a module
// level function), or the effect reruns
// on every render.
// ========================================

export function usePendingCount(
  fetchCount: () => Promise<number>,
  changedEvent: string,
  enabled: boolean
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);

      return;
    }

    let cancelled = false;

    const refresh = () => {
      fetchCount()
        .then((pending) => {
          if (!cancelled) {
            setCount(pending);
          }
        })
        // A badge is not worth an error
        // toast; keep the last count.
        .catch(() => undefined);
    };

    refresh();

    const timer = setInterval(
      refresh,
      POLL_MS
    );

    window.addEventListener(
      changedEvent,
      refresh
    );

    window.addEventListener(
      "focus",
      refresh
    );

    return () => {
      cancelled = true;

      clearInterval(timer);

      window.removeEventListener(
        changedEvent,
        refresh
      );

      window.removeEventListener(
        "focus",
        refresh
      );
    };
  }, [fetchCount, changedEvent, enabled]);

  return count;
}

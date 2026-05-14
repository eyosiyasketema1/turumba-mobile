// ============================================================================
// CelebrationContext — shared queue for celebration popups
//
// Any screen can call `useCelebrations().enqueue(event)` to celebrate a
// badge_earned / level_up / milestone_completed event. The CelebrationModal
// is mounted once at the root layout and consumes the queue, playing
// celebrations sequentially.
// ============================================================================

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import CelebrationModal, { type CelebrationEvent } from './CelebrationModal';

interface CelebrationContextValue {
  /** Append one or more events to the celebration queue. */
  enqueue: (event: CelebrationEvent | CelebrationEvent[]) => void;
  /** Pop the head of the queue. Called by the modal on dismiss. */
  dismiss: () => void;
  /** Drop everything in the queue (e.g. on logout). */
  clear: () => void;
  /** Current queue, mostly for debugging / tests. */
  queue: CelebrationEvent[];
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function useCelebrations(): CelebrationContextValue {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    // In non-provider environments (tests, story isolation) return a no-op so
    // calling code doesn't have to guard.
    return {
      enqueue: () => {},
      dismiss: () => {},
      clear: () => {},
      queue: [],
    };
  }
  return ctx;
}

interface CelebrationProviderProps {
  children: React.ReactNode;
}

export function CelebrationProvider({ children }: CelebrationProviderProps) {
  const [queue, setQueue] = useState<CelebrationEvent[]>([]);

  const enqueue = useCallback((event: CelebrationEvent | CelebrationEvent[]) => {
    const events = Array.isArray(event) ? event : [event];
    if (events.length === 0) return;
    setQueue((q) => [...q, ...events]);
  }, []);

  const dismiss = useCallback(() => {
    setQueue((q) => (q.length > 0 ? q.slice(1) : q));
  }, []);

  const clear = useCallback(() => setQueue([]), []);

  const value = useMemo(
    () => ({ enqueue, dismiss, clear, queue }),
    [enqueue, dismiss, clear, queue]
  );

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {queue.length > 0 && <CelebrationModal queue={queue} onDismiss={dismiss} />}
    </CelebrationContext.Provider>
  );
}

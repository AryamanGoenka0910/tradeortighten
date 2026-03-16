"use client";

import { useEffect, useRef, useState } from "react";
import { checkBackend } from "./checkBackend";

export type BackendStatus = "checking" | "live" | "offline";

interface UseBackendStatusResult {
  status: BackendStatus;
  /** Becomes true when status transitions offline → live. Call clearReconnected() to dismiss. */
  reconnected: boolean;
  clearReconnected: () => void;
}

/**
 * Polls the backend every `intervalMs` (default 10 000ms).
 * Returns current status and a one-shot `reconnected` flag that fires
 * whenever the connection comes back after being offline.
 */
export function useBackendStatus(intervalMs = 10_000): UseBackendStatusResult {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [reconnected, setReconnected] = useState(false);
  const prevStatus = useRef<BackendStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const result = await checkBackend();
      if (cancelled) return;

      setStatus(result);

      // Fire reconnected only on offline → live transition
      if (prevStatus.current === "offline" && result === "live") {
        setReconnected(true);
      }
      prevStatus.current = result;

      timer = setTimeout(poll, intervalMs);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [intervalMs]);

  return {
    status,
    reconnected,
    clearReconnected: () => setReconnected(false),
  };
}

/**
 * Opens a WebSocket to the backend and resolves "live" or "offline".
 * Closes the socket immediately after the result is known.
 */
export function checkBackend(
  url = "ws://localhost:8080",
  timeoutMs = 3000
): Promise<"live" | "offline"> {
  return new Promise((resolve) => {
    let settled = false;

    const done = (status: "live" | "offline") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* ignore */ }
      resolve(status);
    };

    const ws = new WebSocket(url);
    const timer = setTimeout(() => done("offline"), timeoutMs);
    ws.onopen = () => done("live");
    ws.onerror = () => done("offline");
  });
}

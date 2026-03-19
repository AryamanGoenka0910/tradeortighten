import { WebSocket as WsWebSocket } from "ws";

const clientSockets = new Map<string, WsWebSocket>();

// Mid-price per asset — updated on every broadcastOrderBook call
const midPrices: Record<number, number> = { 1: 50, 2: 50, 3: 50, 4: 50 };

export const registerSocket = (clientId: string, ws: WsWebSocket): void => {
  clientSockets.set(clientId, ws);
};

export const unregisterSocket = (clientId: string): void => {
  clientSockets.delete(clientId);
}

export const sendToClient = (clientId: string, payload: unknown): void => {
  const socket = clientSockets.get(clientId);
  if (!socket || socket.readyState !== WsWebSocket.OPEN) {
    return;
  };
  socket.send(JSON.stringify(payload));
};

export const broadcastOrderBook = (
  bids: { price: number; qty: number }[],
  asks: { price: number; qty: number }[],
  assetId: number,
  seq: number
): void => {
  // Keep mid-price up to date for leaderboard valuation
  const bestBid = bids[0];
  const bestAsk = asks[0];
  if (bestBid && bestAsk) {
    midPrices[assetId] = (bestBid.price + bestAsk.price) / 2;
  }

  for (const [clientId] of clientSockets) {
    if (!clientId) continue;
    sendToClient(clientId, {
      type: "order_book_update",
      clientId,
      assetId,
      orderBook: { bids, asks },
      midPrice: midPrices[assetId],
      seq,
    });
  }
};

const STARTING_VALUE = 10_000 + 4 * 100 * 50; // cash + 4 assets × 1000 qty × 50

export const broadcastLeaderboardUpdate = (rows: Record<string, unknown>[]): void => {
  const entries = rows
    .map((r) => {
      const positions = (r.positions ?? {}) as Record<string, number>;
      const assetValue = Object.entries(positions).reduce((sum, [assetId, qty]) => {
        return sum + qty * (midPrices[Number(assetId)] ?? 50);
      }, 0);
      const totalValue = Number(r.cash_available) + Number(r.cash_reserved) + assetValue;
      return { clientName: String(r.client_name), pnl: totalValue - STARTING_VALUE };
    })
    .sort((a, b) => b.pnl - a.pnl)
    .map((e, i) => ({ rank: i + 1, ...e }));

  for (const [clientId] of clientSockets) {
    if (!clientId) continue;
    sendToClient(clientId, { type: "leaderboard_update", entries });
  }
};

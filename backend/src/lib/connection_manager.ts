import type { WebSocket as WsWebSocket } from "ws";

const clientSockets = new Map<string, WsWebSocket>();

// Mid-price per asset — updated on every broadcastOrderBook call
const midPrices: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

export const registerSocket = (clientId: string, ws: WsWebSocket): void => {
  clientSockets.set(clientId, ws);
};

export const sendToClient = (clientId: string, payload: unknown): void => {
  const socket = clientSockets.get(clientId);
  if (!socket || socket.readyState !== 1) {
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
  const bestAsk = asks[asks.length - 1];
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
      seq,
    });
  }
};

export const getMidPrices = (): Record<number, number> => ({ ...midPrices });

export const broadcastAll = (payload: unknown): void => {
  for (const [clientId] of clientSockets) {
    if (!clientId) continue;
    sendToClient(clientId, payload);
  }
};

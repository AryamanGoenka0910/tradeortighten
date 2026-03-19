import { WebSocket as WsWebSocket } from "ws";

const clientSockets = new Map<string, WsWebSocket>();

// Mid-price per asset — updated on every broadcastOrderBook call
const midPrices: Record<number, number> = { 1: 50, 2: 50, 3: 50, 4: 50 };

const priceHistory: Record<number, number[]> = {
  1: [],
  2: [],
  3: [],
  4: [],
};

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

export const getMidPrices = (): Record<number, number> => ({ ...midPrices });

export const broadcastOrderBook = (
  bids: { price: number; qty: number }[],
  asks: { price: number; qty: number }[],
  assetId: number,
  seq: number
): void => {
  // Keep mid-price up to date for leaderboard valuation
  const bestBid = bids[0];
  const bestAsk = asks[0];
  if (bestBid && bestBid.qty > 0 && bestAsk && bestAsk.qty > 0) {
    midPrices[assetId] = (bestBid.price + bestAsk.price) / 2;
  } else if (bestBid && bestBid.qty > 0) {
    midPrices[assetId] = bestBid.price;
  } else if (bestAsk && bestAsk.qty > 0) {
    midPrices[assetId] = bestAsk.price;
  } else {
    midPrices[assetId] = 50; // Default mid-price if no bids or asks
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

export const broadcastLeaderboardUpdate = (rows: Record<string, unknown>[]): void => {
  const entries = rows
    .map((r) => {
      const positions = (r.positions ?? {}) as Record<string, number>;
      const assetValue = Object.entries(positions).reduce((sum, [assetId, qty]) => {
        return sum + Number(qty) * (midPrices[Number(assetId)] ?? 50);
      }, 0);
      const portfolioValue = Number(r.cash_available) + assetValue;
      return { clientName: String(r.client_name), portfolioValue };
    })
    .sort((a, b) => b.portfolioValue - a.portfolioValue)
    .map((e, i) => ({ rank: i + 1, ...e }));

  for (const [clientId] of clientSockets) {
    if (!clientId) continue;
    sendToClient(clientId, { type: "leaderboard_update", entries });
  }
};

const MAX_PRICE_HISTORY = 100;

export const broadcastAll = (payload: unknown): void => {
  for (const [clientId] of clientSockets) {
    if (!clientId) continue;
    sendToClient(clientId, payload);
  }
};

export const broadcastPriceHistoryUpdate = (): void => {

  for (const [assetId, midPrice] of Object.entries(midPrices)) {
    const assetIdNum = Number(assetId);
    const history = priceHistory[assetIdNum] ?? [];
    history.push(midPrice);
    if (history.length > MAX_PRICE_HISTORY) history.shift();
    priceHistory[assetIdNum] = history;
  }

  for (const [clientId] of clientSockets) {
    if (!clientId) continue;
    sendToClient(clientId, { type: "price_history_update", priceHistory });
  }
}

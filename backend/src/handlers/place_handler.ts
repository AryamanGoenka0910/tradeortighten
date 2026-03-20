import { pool } from "../db.js";
import type { EngineBridge } from "../order_book_engine/bridge_engine.js";
import { rowToOrderState, rowToPortfolio, deriveOrderStatus } from "../lib/order_utils.js";
import { sendToClient, broadcastOrderBook } from "../lib/connection_manager.js";
import { tradingEnabled, currentRound } from "../lib/trading_state.js";

type PlaceMessage = {
  type: "place";
  clientId: string;
  seq: number;
  clientOrderId: string;
  side: "buy" | "sell";
  price: number;
  qty: number;
  asset: number;
};

export const handlePlace = async (
  message: PlaceMessage,
  submittedToEngine: Set<string>,
  bridge: EngineBridge
): Promise<void> => {

  if (!tradingEnabled) {
    return;
  }

  // Round 2: GAMMA (asset 3) and SIGMA (asset 4) are prediction markets — prices must be 1–99
  if (currentRound === 2 && (message.asset === 3 || message.asset === 4)) {
    if (message.price < 1 || message.price > 99) {
      sendToClient(message.clientId, {
        type: "place_rejected",
        clientId: message.clientId,
        seq: message.seq,
        asset: message.asset,
        reason: "Prediction market price must be between 1 and 99",
      });
      return;
    }
  }

   console.log("Placing order: ", message);

  // 1. Pre-flight DB check
  let pre;
  try {
    const { rows } = await pool.query(
      "select * from trade_or_tighten.place_taker_order($1,$2,$3,$4,$5,$6,$7)",
      [
        message.clientId,
        message.clientOrderId,
        message.seq,
        message.side,
        message.price,
        message.qty,
        message.asset,
      ]
    );
    pre = rows[0];
    console.log("place_taker_order result: ", pre);
  } catch (e) {
    let serverLastSeq: number | undefined;
    try {
      const { rows: seqRows } = await pool.query(
        "select last_seq from trade_or_tighten.clients where client_id = $1",
        [message.clientId]
      );
      if (seqRows[0]) serverLastSeq = Number(seqRows[0].last_seq);
    } catch {}
    
    sendToClient(message.clientId, {
      type: "place_rejected",
      clientId: message.clientId,
      seq: message.seq,
      serverLastSeq,
      asset: message.asset,
      reason: String(e),
    });
    console.error("Error in place_taker_order: ", e);
    return;
  }

  // 2. Duplicate check
  const submitKey = `${message.clientId}:${message.seq}`;
  if (submittedToEngine.has(submitKey)) {
    const preOrder = rowToOrderState(pre);

    sendToClient(message.clientId, {
      type: "place_duplicate_ignored",
      clientId: message.clientId,
      seq: message.seq,
      clientOrderId: message.clientOrderId,
      order: preOrder,
      asset: message.asset,
    });

    return;
  }
  submittedToEngine.add(submitKey);

  // 3. Submit to engine
  // Key is removed after this handler completes so the set doesn't grow unbounded.
  // True late duplicates are rejected by the DB's (client_id, client_order_id) unique constraint.
  const res = await bridge.request({
    op: "place",
    clientId: message.clientId,
    assetId: message.asset,
    side: message.side,
    price: message.price,
    qty: message.qty,
  });

  if (!res.execution_status) {
    // send to Admin Log
    submittedToEngine.delete(submitKey);
    return;
  }

  // 4. Compute taker fill deltas
  let takerPriceDelta = 0;
  let takerAssetDelta = 0;

  for (const trade of res.trades) {
    takerPriceDelta += trade.price * trade.qty;
    takerAssetDelta += trade.qty;
  }

  const takerCurrentQty = Math.max(0, message.qty - takerAssetDelta);
  const takerStatus = deriveOrderStatus(message.qty, takerCurrentQty);

  // 5. Update taker in DB
  try {
    const { rows } = await pool.query(
      "select * from trade_or_tighten.update_taker_order($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        message.clientId,
        message.clientOrderId,
        message.seq,
        res.orderId,
        takerStatus,
        takerCurrentQty,
        takerPriceDelta,
        takerAssetDelta,
        message.asset,
      ]
    );
    const post = rows[0];

    sendToClient(message.clientId, {
      type: "order_update_snapshot",
      clientId: message.clientId,
      seq: message.seq,
      orderId: res.orderId,
      order: rowToOrderState(post),
      portfolio: rowToPortfolio(post, message.asset),
    });

    console.log("Taker order updated: ", post);
  } catch (e) {
    console.error("Error in update_taker_order: ", e);
    submittedToEngine.delete(submitKey);
    return;
  }

  // 6. Update each maker in DB (parallel)
  await Promise.all(res.trades.map(async (trade) => {
    const makerClientId = trade.maker_client_id;
    const makerOrderId = Number(trade.maker_order_id);
    try {
      const { rows } = await pool.query(
        "select * from trade_or_tighten.update_maker_order($1,$2,$3,$4,$5)",
        [makerClientId, makerOrderId, trade.price, trade.qty, message.asset]
      );
      const postMaker = rows[0];
      sendToClient(makerClientId, {
        type: "order_update_snapshot",
        clientId: makerClientId,
        orderId: makerOrderId,
        order: rowToOrderState(postMaker),
        portfolio: rowToPortfolio(postMaker, message.asset),
      });
      console.log(`Maker order ${makerOrderId} updated for client ${makerClientId}: `, postMaker);
    } catch (e) {
      console.error(`Error updating maker order ${makerOrderId} for client ${makerClientId}: `, e);
    }
  }));

  // 7. Broadcast updated order book to all clients
  broadcastOrderBook(res.all_bids, res.all_asks, message.asset, message.seq);

  submittedToEngine.delete(submitKey);
};

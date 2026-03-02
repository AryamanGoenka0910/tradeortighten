import { pool } from "../db.js";
import type { EngineBridge } from "../order_book_engine/bridge_engine.js";
import { rowToOrderState, deriveOrderStatus } from "../lib/order_utils.js";
import { sendToClient, broadcastOrderBook } from "../lib/connection_manager.js";

type PlaceMessage = {
  clientId: string;
  type: "place";
  seq: number;
  clientOrderId: string;
  side: "buy" | "sell";
  price: number;
  qty: number;
  // asset: number;
};

export const handlePlace = async (
  message: PlaceMessage,
  submittedToEngine: Set<string>,
  bridge: EngineBridge
): Promise<void> => {
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
        1
      ]
    );
    pre = rows[0];
    console.log("place_taker_order result: ", pre);
  } catch (e) {
    sendToClient(message.clientId, {
      type: "place_rejected",
      clientId: message.clientId,
      seq: message.seq,
      reason: String(e),
    });
    console.error("Error in place_taker_order: ", e);
    return;
  }

  // 2. Duplicate check
  const submitKey = `${message.clientId}:${message.seq}`;
  const preOrder = rowToOrderState(pre);

  if (submittedToEngine.has(submitKey)) {
    sendToClient(message.clientId, {
      type: "place_duplicate_ignored",
      clientId: message.clientId,
      seq: message.seq,
      clientOrderId: message.clientOrderId,
      order: preOrder,
    });
    return;
  }
  submittedToEngine.add(submitKey);

  // 3. Submit to engine
  const res = await bridge.request({
    op: "place",
    clientId: message.clientId,
    side: message.side,
    price: message.price,
    qty: message.qty,
  });

  if (!res.execution_status) {
    await pool.query(
      "select * from trade_or_tighten.reject_order($1,$2,$3)",
      [message.clientId, message.clientOrderId, message.seq]
    );
    sendToClient(message.clientId, {
      type: "place_rejected",
      clientId: message.clientId,
      seq: message.seq,
      reason: res.order_status,
      response: res,
    });
    console.error("Engine rejected order: ", res);
    return;
  }

  // 4. Compute taker fill deltas
  let takerPriceDelta = 0;
  let takerAsset1Delta = 0;
  for (const trade of res.trades) {
    takerPriceDelta += trade.price * trade.qty;
    takerAsset1Delta += trade.qty;
  }

  const takerCurrentQty = Math.max(0, message.qty - takerAsset1Delta);
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
        takerAsset1Delta,
        1
      ]
    );
    const post = rows[0];

    const takerOrder = {
      ...rowToOrderState(post),
      currentQty: takerCurrentQty,
      status: takerStatus,
    };

    const takerPortfolio = post.positions_available != null ? {
      cashAvailable: Number(post.cash_available),
      cashReserved: Number(post.cash_reserved),
      positionsAvailable: Number(post.positions_available),
      positionsReserved: Number(post.positions_reserved),
    } : undefined;

    sendToClient(message.clientId, {
      type: "order_update_snapshot",
      clientId: message.clientId,
      seq: message.seq,
      orderId: res.orderId,
      order: takerOrder,
      portfolio: takerPortfolio,
    });

    console.log("Taker order updated: ", takerOrder);
  } catch (e) {
    sendToClient(message.clientId, {
      type: "update_taker_order_rejected",
      clientId: message.clientId,
      seq: message.seq,
      reason: String(e),
    });
    console.error("Error in update_taker_order: ", e);
    return;
  }

  // 6. Update each maker in DB
  for (const trade of res.trades) {
    console.log("Processing trade: ", trade);
    const makerClientId = trade.maker_client_id;
    const makerOrderId = Number(trade.maker_order_id);

    try {
      const { rows } = await pool.query(
        "select * from trade_or_tighten.update_maker_order($1,$2,$3,$4, $5)",
        [makerClientId, makerOrderId, trade.price, trade.qty, 1]
      );
      const postMaker = rows[0];
      if (!postMaker) throw new Error("update_maker_order returned no rows");

      sendToClient(makerClientId, {
        type: "order_update_snapshot",
        clientId: makerClientId,
        orderId: makerOrderId,
        order: rowToOrderState(postMaker),
      });
      console.log(`Maker order ${makerOrderId} updated for client ${makerClientId}: `, postMaker);
    } catch (e) {
      sendToClient(makerClientId, {
        type: "update_maker_order_rejected",
        reason: String(e),
        clientId: message.clientId,
        seq: message.seq,
      });
      console.error(`Error updating maker order ${makerOrderId} for client ${makerClientId}: `, e);
      break;
    }
  }

  // 7. Broadcast updated order book to all clients
  broadcastOrderBook(res.all_bids, res.all_asks, message.seq);
};
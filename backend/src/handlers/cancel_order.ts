import { pool } from "../db.js";
import type { EngineBridge } from "../order_book_engine/bridge_engine.js";
import { rowToOrderState, rowToPortfolio } from "../lib/order_utils.js";
import { sendToClient, broadcastOrderBook } from "../lib/connection_manager.js";

type CancelMessage = {
  clientId: string;
  type: "cancel";
  orderId: number;
  assetId: number;
};

export const handleCancel = async (
  message: CancelMessage,
  bridge: EngineBridge
): Promise<void> => {
  console.log("Cancelling order: ", message);

  let cancelOrder;
  try {
    const { rows } = await pool.query(
      "select * from trade_or_tighten.cancel_order($1, $2, $3, $4)",
      [message.clientId, message.orderId, "cancelled", message.assetId]
    );
    cancelOrder = rowToOrderState(rows[0]);
    console.log("cancel_order result: ", rows[0]);
  } catch (e) {
    sendToClient(message.clientId, {
      type: "cancel_rejected",
      clientId: message.clientId,
      orderId: message.orderId,
      reason: String(e),
    });
    return;
  }

  // Cancel in engine (targets the right asset book)
  const res = await bridge.request({
    op: "cancel",
    clientId: message.clientId,
    orderId: message.orderId,
    assetId: message.assetId,
  });

  // Query updated portfolio for the affected asset
  let portfolio;
  try {
    const { rows } = await pool.query(
      `SELECT cc.cash_available, cc.cash_reserved, cp.available as positions_available, cp.reserved as positions_reserved
       FROM trade_or_tighten.client_cash cc
       JOIN trade_or_tighten.client_positions cp ON cp.client_id = cc.client_id AND cp.asset_id = $2
       WHERE cc.client_id = $1`,
      [message.clientId, message.assetId]
    );
    portfolio = rowToPortfolio(rows[0], message.assetId);
  } catch (e) {
    console.error("Error fetching portfolio after cancel: ", e);
  }

  sendToClient(message.clientId, {
    type: "cancel_accepted",
    clientId: message.clientId,
    orderId: message.orderId,
    order: cancelOrder,
    portfolio,
  });

  // Broadcast updated order book for this asset to all clients
  broadcastOrderBook(res.all_bids, res.all_asks, message.assetId, 0);
};

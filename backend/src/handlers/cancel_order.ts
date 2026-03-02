import { pool } from "../db.js";
import type { EngineBridge } from "../order_book_engine/bridge_engine.js";
import { rowToOrderState, deriveOrderStatus } from "../lib/order_utils.js";
import { sendToClient, broadcastOrderBook } from "../lib/connection_manager.js";

type CancelMessage = {
  clientId: string;
  type: "cancel";
  orderId: number;
};

export const handleCancel = async (
  message: CancelMessage,
  bridge: EngineBridge
): Promise<void> => {
  console.log("Cancelling order: ", message);

	let cancelOrder;
  try {
    const { rows } = await pool.query(
      "select * from trade_or_tighten.cancel_order($1, $2, $3)",
      [message.clientId, message.orderId, "canceled"]
    );
    const cancelResult = rows[0];
		cancelOrder = rowToOrderState(cancelResult);
    console.log("cancel_order result: ", cancelResult);

  } catch (e) {
    sendToClient(message.clientId, {
      type: "cancel_rejected",
      clientId: message.clientId,
      orderId: message.orderId,
      reason: String(e),
    });
    return;
  }

	const res = await bridge.request({
		op: "cancel",
		clientId: message.clientId,
		orderId: message.orderId,
	});

	sendToClient(message.clientId, {
		type: "cancel_accepted",
		clientId: message.clientId,
		orderId: message.orderId,
		order: cancelOrder,
	});
	
    // broadcastOrderBook(res.all_bids, res.all_asks, message.seq);
};

import { pool } from "../db.js";
import type { EngineBridge } from "../order_book_engine/bridge_engine.js";
import { sendToClient, broadcastOrderBook, broadcastAll, getMidPrices, setMidPrice } from "../lib/connection_manager.js";
import { setTradingEnabled, setCurrentRound, currentRound } from "../lib/trading_state.js";
import { rowToOrderState, rowToPortfolio } from "../lib/order_utils.js";

export type AdminMessage =
  | { clientId: string; type: "admin_get_orders" }
  | { clientId: string; type: "admin_cancel_order"; ownerId: string; orderId: number; assetId: number }
  | { clientId: string; type: "admin_toggle_trading"; enabled: boolean }
  | { clientId: string; type: "admin_timer_start" }
  | { clientId: string; type: "admin_timer_reset" }
  | { clientId: string; type: "admin_set_round"; round: 1 | 2 | 3 | null }
  | { clientId: string; type: "admin_settle_asset";};

async function queryOpenOrders() {
  const { rows } = await pool.query(`
    SELECT
      co.db_order_id,
      co.client_id,
      c.client_name,
      co.order_id,
      co.asset,
      co.side,
      co.price,
      co.original_qty,
      co.current_qty,
      co.status
    FROM trade_or_tighten.client_orders co
    JOIN trade_or_tighten.clients c ON c.client_id = co.client_id
    WHERE co.status IN ('pending', 'partially_filled')
    ORDER BY co.db_order_id ASC
  `);
  return rows.map((r) => ({
    dbOrderId: Number(r.db_order_id),
    clientId: String(r.client_id),
    clientName: String(r.client_name),
    orderId: r.order_id != null ? Number(r.order_id) : null,
    assetId: Number(r.asset),
    side: String(r.side),
    price: Number(r.price),
    originalQty: Number(r.original_qty),
    currentQty: Number(r.current_qty),
    status: String(r.status),
  }));
}

export const handleAdminMessage = async (
  message: AdminMessage,
  bridge: EngineBridge
): Promise<void> => {
  switch (message.type) {
    case "admin_get_orders": {
      try {
        const orders = await queryOpenOrders();
        sendToClient(message.clientId, { type: "admin_orders_snapshot", orders });
      } catch (e) {
        sendToClient(message.clientId, { type: "admin_error", error: String(e) });
      }
      break;
    }

    case "admin_cancel_order": {
      const { ownerId, orderId, assetId } = message;

      // 1. Cancel in engine (skip if orderId is null/invalid)
      let engineResult;
      if (orderId != null) {
        try {
          engineResult = await bridge.request({
            op: "cancel",
            clientId: ownerId,
            orderId,
            assetId,
          });
        } catch (e) {
          console.error("Admin cancel — engine error:", e);
        }
      }

      // 2. Cancel in DB
      let cancelledOrder;
      try {
        const { rows } = await pool.query(
          "select * from trade_or_tighten.cancel_order($1, $2, $3, $4)",
          [ownerId, orderId, "cancelled", assetId]
        );
        cancelledOrder = rowToOrderState(rows[0]);
      } catch (e) {
        sendToClient(message.clientId, {
          type: "admin_cancel_result",
          success: false,
          orderId,
          error: String(e),
        });
        return;
      }

      // 3. Query updated portfolio for the owner
      let portfolio;
      try {
        const { rows } = await pool.query(
          `SELECT cc.cash_available, cc.cash_reserved, cp.available as positions_available, cp.reserved as positions_reserved
           FROM trade_or_tighten.client_cash cc
           JOIN trade_or_tighten.client_positions cp ON cp.client_id = cc.client_id AND cp.asset_id = $2
           WHERE cc.client_id = $1`,
          [ownerId, assetId]
        );
        portfolio = rowToPortfolio(rows[0], assetId);
      } catch (e) {
        console.error("Admin cancel — failed to fetch owner portfolio:", e);
      }

      // 4. Notify order owner if connected
      sendToClient(ownerId, {
        type: "cancel_accepted",
        clientId: ownerId,
        orderId,
        order: cancelledOrder,
        portfolio,
        adminInitiated: true,
      });

      // 5. Broadcast updated order book
      if (engineResult) {
        broadcastOrderBook(engineResult.all_bids, engineResult.all_asks, assetId, 0);
      }

      // 6. Send updated snapshot back to admin
      try {
        const orders = await queryOpenOrders();
        sendToClient(message.clientId, { type: "admin_orders_snapshot", orders });
      } catch (e) {
        console.error("Admin cancel — failed to refresh orders:", e);
      }

      sendToClient(message.clientId, {
        type: "admin_cancel_result",
        success: true,
        orderId,
      });
      break;
    }

    case "admin_toggle_trading": {
      setTradingEnabled(message.enabled);
      broadcastAll({ type: "trading_state_update", enabled: message.enabled });
      console.log(`Trading ${message.enabled ? "enabled" : "halted"} by admin`);
      break;
    }

    case "admin_timer_start": {
      broadcastAll({ type: "timer_update", action: "start", secondsRemaining: 600 });
      console.log("Timer started by admin");
      break;
    }

    case "admin_timer_reset": {
      broadcastAll({ type: "timer_update", action: "reset", secondsRemaining: 600 });
      console.log("Timer reset by admin");
      break;
    }

    case "admin_set_round": {
      setCurrentRound(message.round);
      broadcastAll({ type: "round_update", round: message.round });
      console.log(`Round set to ${message.round ?? "null"} by admin`);
      break;
    }

    case "admin_settle_asset": {
      const prices = getMidPrices();

      if (currentRound === 1) {
        let newPrice = 0;
        for (let i = 1; i <= 3; i++) {
          newPrice += prices[i] ?? 50;
        }
        newPrice /= 3; 
        newPrice += 62; //# of times Mich beat OSU
        setMidPrice(4, newPrice);

      } else if (currentRound === 2) {
      
        const priceA = prices[1] ?? 50;
        const priceB = prices[2] ?? 50;
        if (priceA > priceB) {
          setMidPrice(3, 100);
          setMidPrice(4, 0);
        } else {
          setMidPrice(3, 0);
          setMidPrice(4, 100);
        }


      } else if (currentRound === 3) {
        
        const priceA = prices[1] ?? 50;
        const priceB = prices[2] ?? 50;
        const priceC = Math.abs(priceA - priceB);

        setMidPrice(3, priceC);
        setMidPrice(4, 184); //10 * 1.05^60 ≈ $184

      }
      broadcastAll({ type: "settlement_update", round: currentRound, prices: getMidPrices() });
      break;
    }
  }
};

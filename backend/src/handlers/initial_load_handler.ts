import { pool } from "../db.js";
import type { EngineBridge } from "../order_book_engine/bridge_engine.js";
import { rowToOrderState } from "../lib/order_utils.js";
import { sendToClient } from "../lib/connection_manager.js";

const STARTING_CASH = 100000;
const STARTING_ASSET1 = 1000;

type InitialLoadMessage = {
  clientId: string;
  type: "initial_load";
  clientName: string;
  lastSeq: number;
};

export const handleInitialLoad = async (
  message: InitialLoadMessage,
  bridge: EngineBridge
): Promise<void> => {
  console.log("Initial load: ", message);

  const clientPortfolioRes = await pool.query(
    "select * from trade_or_tighten.ensure_client_and_portfolio($1,$2,$3,$4)",
    [message.clientId, message.clientName, STARTING_CASH, STARTING_ASSET1]
  );
  const clientRow = clientPortfolioRes.rows[0];

  const openOrdersRes = await pool.query(
    "select * from trade_or_tighten.get_client_open_orders($1)",
    [message.clientId]
  );

  const currentOrders = openOrdersRes.rows.map(rowToOrderState);

  sendToClient(message.clientId, {
    type: "initial_load_snapshot",
    clientId: message.clientId,
    portfolio: {
      cashAvailable: Number(clientRow.cash_available),
      cashReserved: Number(clientRow.cash_reserved),
      asset1Available: Number(clientRow.asset1_available),
      asset1Reserved: Number(clientRow.asset1_reserved),
      asset2Available: Number(clientRow.asset2_available),
      asset2Reserved: Number(clientRow.asset2_reserved),
      asset3Available: Number(clientRow.asset3_available),
      asset3Reserved: Number(clientRow.asset3_reserved),
      asset4Available: Number(clientRow.asset4_available),
      asset4Reserved: Number(clientRow.asset4_reserved),
    },
    client: {
      clientName: clientRow.client_name,
      lastSeq: Number(clientRow.last_seq),
    },
    orders: currentOrders,
  });

  const initialLoadRes = await bridge.request({
    op: "initial_load",
    clientId: message.clientId,
  });

  sendToClient(message.clientId, {
    type: "order_book_update",
    clientId: message.clientId,
    orderBook: {
      bids: initialLoadRes.all_bids,
      asks: initialLoadRes.all_asks,
    },
    seq: Number(clientRow.last_seq),
  });

  console.log("Initial load sent to: ", clientRow.client_id);
  console.log("User Last Seq: ", clientRow.last_seq);
};
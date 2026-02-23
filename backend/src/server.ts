import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";
import { EngineBridge } from "./order_book_engine/bridge_engine.js";
import { pool } from "./db.js";

const wss = new WebSocketServer({ port: 8080 });
const clientSockets = new Map<string, WsWebSocket>();
const submittedToEngine = new Set<string>(); // clientId:seq

const STARTING_CASH = 100000;
const STARTING_ASSET1 = 1000;

type OrderState = {
  orderId: number;
  side: "buy" | "sell";
  price: number;
  originalQty: number;
  currentQty: number;
  status: "pending" | "filled" | "partially_filled";
}

const deriveOrderStatus = (
  originalQty: number,
  currentQty: number
): OrderState["status"] => {
  if (currentQty <= 0) return "filled";
  if (currentQty >= originalQty) return "pending";
  return "partially_filled";
};

const sendToClient = (clientId: string, payload: unknown): void => {
  const socket = clientSockets.get(clientId);
  if (!socket || socket.readyState !== 1) return;
  socket.send(JSON.stringify(payload));
};

console.log("WebSocket server running on ws://localhost:8080");
const bridge = new EngineBridge();
console.log("Bridge created");

type ClientMessage = 
    | { clientId: string, type: "place", seq: number, clientOrderId: string, side: "buy" | "sell", price: number, qty: number }
    | { clientId: string, type: "cancel", orderId: number }
    | { clientId: string, type: "modify", orderId: number, price: number, qty: number }
    | { clientId: string, type: "initial_load", clientName: string, lastSeq: number }

wss.on("connection", (ws: WsWebSocket) => {
  console.log("Client connected");

  ws.on("message", async (raw) => {
    try {
        // 1 Auth Check
        // 2 Parse Message + Validate
        const message = JSON.parse(raw.toString()) as ClientMessage;
        clientSockets.set(message.clientId, ws);

        switch (message.type) {
          case "place":
              console.log("Placing order: ", message);

              // Pre Book Place Taker Order
              let pre;
              try {
                const { rows } = await pool.query(
                  "select * from trade_or_tighten.place_taker_order($1,$2,$3,$4,$5,$6)",
                  [
                    message.clientId, 
                    message.clientOrderId, 
                    message.seq, 
                    message.side, 
                    message.price, 
                    message.qty
                  ]
                );
                pre = rows[0];
                if (!pre) throw new Error("place_taker_order returned no rows");
              } catch (e) {
                sendToClient(message.clientId, { type: "place_rejected", reason: String(e) });
                break;
              }

              // Check if the order has already been submitted to the engine
              const submitKey = `${message.clientId}:${message.seq}`;
              const order: OrderState = {
                orderId: Number(pre.order_id),
                side: pre.side as "buy" | "sell",
                price: Number(pre.price),
                originalQty: Number(pre.original_qty),
                currentQty: Number(pre.current_qty),
                status: pre.status as OrderState["status"],
              };

              if (submittedToEngine.has(submitKey)) {
                sendToClient(message.clientId, {
                  type: "place_duplicate_ignored",
                  clientId: message.clientId,
                  seq: message.seq,
                  clientOrderId: message.clientOrderId,
                  order: order,
                });
                break;
              }
              submittedToEngine.add(submitKey);

              // Submit order to the engine
              const res = await bridge.request({
                  op: "place",
                  clientId: message.clientId,
                  side: message.side,
                  price: message.price,
                  qty: message.qty,
              });

              // Handle engine response
              if (!res.execution_status) {
                sendToClient(message.clientId, {
                  type: "place_rejected",
                  reason: res.order_status,
                  response: res,
                });
                break;
              }

              let takerPriceDelta = 0;
              let takerAsset1Delta = 0;
              
              for (const trade of res.trades) {
                takerPriceDelta += trade.price * trade.qty;
                takerAsset1Delta += trade.qty;
              }

              let takerCurrentQty = Math.max(0, message.qty - takerAsset1Delta);
              let takerStatus = deriveOrderStatus(message.qty, takerCurrentQty);
              
              let post;
              try {
                const { rows } = await pool.query(
                  "select * from trade_or_tighten.update_taker_order($1,$2,$3,$4,$5,$6,$7,$8)",
                  [
                    message.clientId, 
                    message.clientOrderId, 
                    message.seq, 
                    res.orderId, 
                    takerStatus, 
                    takerCurrentQty,
                    takerPriceDelta,
                    takerAsset1Delta
                  ]
                );
                post = rows[0];
                if (!post) throw new Error("update_taker_order returned no rows");

                const order: OrderState = {
                  orderId: Number(post.order_id),
                  side: post.side as "buy" | "sell",
                  price: Number(post.price),
                  originalQty: Number(post.original_qty),
                  currentQty: takerCurrentQty,
                  status: takerStatus,
                };
  
                sendToClient(message.clientId, { 
                  type: "order_update_snapshot",
                  clientId: message.clientId,
                  orderId: res.orderId,
                  order: order
                });

              } catch (e) {
                sendToClient(message.clientId, { type: "update_taker_order_rejected", reason: String(e) });
                break;
              }
            
              for (const trade of res.trades) {
                console.log("Processing trade: ", trade);
                const makerClientId = trade.maker_client_id;
                const makerOrderId = Number(trade.maker_order_id);

                let postMaker;
                try {
                  const { rows } = await pool.query(
                    "select * from trade_or_tighten.update_maker_order($1,$2,$3,$4)",
                    [
                      makerClientId, 
                      makerOrderId, 
                      trade.price,
                      trade.qty
                    ]
                  );
                  postMaker = rows[0];
                  if (!postMaker) throw new Error("update_maker_order returned no rows");

                  const makerOrder: OrderState = {
                    orderId: makerOrderId,
                    side: postMaker.side as "buy" | "sell",
                    price: Number(postMaker.price),
                    originalQty: Number(postMaker.original_qty),
                    currentQty: Number(postMaker.current_qty),
                    status: postMaker.status as OrderState["status"],
                  };
  
                  sendToClient(makerClientId, {
                    type: "order_update_snapshot",
                    clientId: makerClientId,
                    orderId: makerOrderId,
                    order: makerOrder,
                  });
                  
                } catch (e) {
                  sendToClient(makerClientId, { type: "update_maker_order_rejected", reason: String(e) });
                  break;
                }
              }
            break;
        
          case "initial_load":
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
            const currentOrders: OrderState[] = [];
            for (const row of openOrdersRes.rows) {
              currentOrders.push({
                orderId: Number(row.order_id),
                side: row.side as "buy" | "sell",
                price: Number(row.price),
                originalQty: Number(row.original_qty),
                currentQty: Number(row.current_qty),
                status: row.status as OrderState["status"],
              });
            }

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
              orders: Array.from(currentOrders),
            });

            console.log("Initial load sent to: ", message.clientId);
            break;
        }

       
        

    } catch (error) {
      console.error("Error parsing message: ", error);
    }
  });
});

wss.on("close", () => {
  console.log("WebSocket server closed");
});
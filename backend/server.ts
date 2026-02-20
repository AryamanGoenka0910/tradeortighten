import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";
import { EngineBridge } from "./bridge_engine.js";


const wss = new WebSocketServer({ port: 8080 });
const clientSockets = new Map<string, WsWebSocket>();
const clientOrderStates = new Map<string, Map<number, OrderState>>();

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

const getOrCreateClientOrders = (clientId: string): Map<number, OrderState> => {
  let orders = clientOrderStates.get(clientId);
  if (!orders) {
    orders = new Map<number, OrderState>();
    clientOrderStates.set(clientId, orders);
  }
  return orders;
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
    | { clientId: string, type: "place", side: "buy" | "sell", price: number, qty: number }
    | { clientId: string, type: "cancel", orderId: number }
    | { clientId: string, type: "modify", orderId: number, price: number, qty: number }

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
              const side = message.side;
              if (side !== "buy" && side !== "sell") {
                  throw new Error("Invalid side");
              }

              console.log("Placing order: ", message);
              const requesterOrders = getOrCreateClientOrders(message.clientId);

              // handle order placement validation here too to avoid incorrect orders even being sent to book
              const res = await bridge.request({
                  op: "place",
                  clientId: message.clientId,
                  side: message.side,
                  price: message.price,
                  qty: message.qty,
              });

              if (!res.execution_status) {
                sendToClient(message.clientId, {
                  type: "place_rejected",
                  reason: res.order_status,
                  response: res,
                });
                break;
              }

              // Taker comes from the incoming place request.
              let takerCurrentQty = message.qty;
              for (const trade of res.trades) {
                takerCurrentQty -= trade.qty;
              }
              takerCurrentQty = Math.max(0, takerCurrentQty);

              requesterOrders.set(Number(res.orderId), {
                orderId: Number(res.orderId),
                side: message.side,
                price: message.price,
                originalQty: message.qty,
                currentQty: takerCurrentQty,
                status: deriveOrderStatus(message.qty, takerCurrentQty),
              });

              // Maker updates come from trades returned by this placement.
              const impactedClients = new Set<string>([message.clientId]);
              for (const trade of res.trades) {
                const makerClientId = trade.maker_client_id;
                const makerOrders = clientOrderStates.get(makerClientId);
                if (!makerOrders) {
                  console.warn("Missing maker client state for trade", trade);
                  continue;
                }

                const makerOrderId = Number(trade.maker_order_id);
                const makerOrderState = makerOrders.get(makerOrderId);
                if (!makerOrderState) {
                  console.warn("Missing maker order state for trade", trade);
                  continue;
                }

                const nextQty = Math.max(0, makerOrderState.currentQty - trade.qty);
                makerOrders.set(makerOrderId, {
                ...makerOrderState,
                currentQty: nextQty,
                status: deriveOrderStatus(makerOrderState.originalQty, nextQty),
                });
                impactedClients.add(makerClientId);
              }

              // Push state snapshots so UI can visualize live order changes.
              for (const clientId of impactedClients) {
                const orders = clientOrderStates.get(clientId);
                if (!orders) continue;
                sendToClient(clientId, {
                  type: "order_state_snapshot",
                  clientId,
                  orders: Array.from(orders.values()),
                });
              }
            break;
        }

        // 3 Send Response
        

    } catch (error) {
      console.error("Error parsing message: ", error);
    }
  });
});

wss.on("close", () => {
  console.log("WebSocket server closed");
});
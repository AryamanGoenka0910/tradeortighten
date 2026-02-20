import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";
import { EngineBridge } from "./bridge_engine.js";

const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket server running on ws://localhost:8080");
const bridge = new EngineBridge();
console.log("Bridge created");

type ClientMessage = 
    | { type: "place", side: "buy" | "sell", price: number, qty: number }
    | { type: "cancel", orderId: number }
    | { type: "modify", orderId: number, price: number, qty: number }

wss.on("connection", (ws: WsWebSocket) => {
  console.log("Client connected");

  ws.on("message", async (raw) => {
    try {
        // 1 Auth Check

        // 2 Parse Message + Validate
        const message = JSON.parse(raw.toString()) as ClientMessage;
        switch (message.type) {
            case "place":
                const side = message.side;
                if (side !== "buy" && side !== "sell") {
                    throw new Error("Invalid side");
                }
                
                const res = await bridge.request({
                    op: "place",
                    side: message.side,
                    price: message.price,
                    qty: message.qty,
                });

                console.log("Engine response: ", res);

                // check with DB if money is enough
                const price = message.price;
                const qty = message.qty;
                console.log("Placing order: ", message);
                break;
            // case "cancel":
            //     console.log("Cancelling order: ", message);
            //     break;
            // case "modify":
            //     console.log("Modifying order: ", message);
            //     break;
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
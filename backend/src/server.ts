import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";

import { EngineBridge } from "./order_book_engine/bridge_engine.js";
import { registerSocket } from "./lib/connection_manager.js";

import { handleInitialLoad } from "./handlers/initial_load_handler.js";
import { handlePlace } from "./handlers/place_handler.js";

const wss = new WebSocketServer({ port: 8080 });
const clientSockets = new Map<string, WsWebSocket>();
const submittedToEngine = new Set<string>(); // clientId:seq

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
        const message = JSON.parse(raw.toString()) as ClientMessage;
        clientSockets.set(message.clientId, ws);
        registerSocket(message.clientId, ws);

        switch (message.type) {
          case "place":
            await handlePlace(message, submittedToEngine, bridge);
            break;
        
          case "initial_load":
            await handleInitialLoad(message, bridge);
            break;

          case "cancel":
            // await handleCancel(message, bridge);
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
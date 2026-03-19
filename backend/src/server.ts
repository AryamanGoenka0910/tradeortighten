import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";

import { EngineBridge } from "./order_book_engine/bridge_engine.js";
import { registerSocket, unregisterSocket } from "./lib/connection_manager.js";
import { broadcastLeaderboard } from "./lib/leaderboard.js";

import { handleInitialLoad } from "./handlers/initial_load_handler.js";
import { handlePlace } from "./handlers/place_handler.js";
import { handleCancel } from "./handlers/cancel_order.js";

const wss = new WebSocketServer({ port: 8080 });
const submittedToEngine = new Set<string>(); // clientId:seq

console.log("WebSocket server running on ws://localhost:8080");
const bridge = new EngineBridge();
console.log("Bridge created");

let leaderboardRunning = false;
const scheduleLeaderboard = async (): Promise<void> => {
  if (leaderboardRunning) return;
  leaderboardRunning = true;
  try {
    await broadcastLeaderboard();
  } catch (e) {
    console.error("Error broadcasting leaderboard: ", e);
  } finally {
    leaderboardRunning = false;
  }
};

// Broadcast leaderboard every 500ms
setInterval(scheduleLeaderboard, 500);

type ClientMessage =
    | { clientId: string, type: "place", seq: number, clientOrderId: string, side: "buy" | "sell", price: number, qty: number, asset: number }
    | { clientId: string, type: "cancel", orderId: number, assetId: number }
    | { clientId: string, type: "initial_load", clientName: string, lastSeq: number }

wss.on("connection", (ws: WsWebSocket) => {
  console.log("Client connected");
  let connectedClientId: string | null = null;

  ws.on("message", async (raw) => {
    try {
        const message = JSON.parse(raw.toString()) as ClientMessage;
        connectedClientId = message.clientId;
        registerSocket(message.clientId, ws);

        switch (message.type) {
          case "place":
            await handlePlace(message, submittedToEngine, bridge);
            break;

          case "initial_load":
            await handleInitialLoad(message, bridge);
            break;

          case "cancel":
            await handleCancel(message, bridge);
            break;
        }
    } catch (error) {
      console.error("Error parsing message: ", error);
    }
  });

  ws.on("close", () => {
    if (connectedClientId) {
      unregisterSocket(connectedClientId);
      console.log(`Client disconnected: ${connectedClientId}`);
    }
  });
});

wss.on("close", () => {
  console.log("WebSocket server closed");
});

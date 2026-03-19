import { broadcastPriceHistoryUpdate } from "./connection_manager.js";

export const broadcastPriceHistory = async (): Promise<void> => {
  broadcastPriceHistoryUpdate();
};

import { pool } from "../db.js";
import { broadcastLeaderboardUpdate } from "./connection_manager.js";

export const broadcastLeaderboard = async (): Promise<void> => {
  const { rows } = await pool.query(
    "select * from trade_or_tighten.get_leaderboard_data()"
  );
  broadcastLeaderboardUpdate(rows);
};

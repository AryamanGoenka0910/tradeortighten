export type OrderSide = "buy" | "sell";
export type OrderStatus =
    | "pending"
    | "partially_filled"
    | "filled"
    | "cancelled"
    | "rejected";

export type OrderState = {
  orderId: number;
  side: OrderSide;
  price: number;
  originalQty: number;
  currentQty: number;
  status: OrderStatus;
  asset: number;
};

export const deriveOrderStatus = (
  originalQty: number,
  currentQty: number
): OrderState["status"] => {
  if (currentQty <= 0) return "filled";
  if (currentQty >= originalQty) return "pending";
  return "partially_filled";
};

export type PortfolioState = {
  cashAvailable: number;
  cashReserved: number;
  asset: number;
  positionsAvailable: number;
  positionsReserved: number;
};

export const rowToPortfolio = (row: {
  cash_available: unknown;
  cash_reserved: unknown;
  positions_available: unknown;
  positions_reserved: unknown;
}, asset: number): PortfolioState | undefined => {
  if (row.positions_available == null) return undefined;
  return {
    cashAvailable: Number(row.cash_available),
    cashReserved: Number(row.cash_reserved),
    asset,
    positionsAvailable: Number(row.positions_available),
    positionsReserved: Number(row.positions_reserved),
  };
};

const VALID_SIDES = new Set<string>(["buy", "sell"]);
const VALID_STATUSES = new Set<string>(["pending", "partially_filled", "filled", "cancelled", "rejected"]);

export const rowToOrderState = (row: {
  order_id: unknown;
  side: unknown;
  price: unknown;
  original_qty: unknown;
  current_qty: unknown;
  status: unknown;
  asset: unknown;
}): OrderState => {
  const side = String(row.side);
  const status = String(row.status);
  if (!VALID_SIDES.has(side)) throw new Error(`Invalid order side: ${side}`);
  if (!VALID_STATUSES.has(status)) throw new Error(`Invalid order status: ${status}`);
  return {
    orderId: Number(row.order_id),
    side: side as OrderSide,
    price: Number(row.price),
    originalQty: Number(row.original_qty),
    currentQty: Number(row.current_qty),
    status: status as OrderStatus,
    asset: Number(row.asset),
  };
};
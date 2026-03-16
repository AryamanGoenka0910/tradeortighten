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

export const rowToOrderState = (row: {
  order_id: unknown;
  side: unknown;
  price: unknown;
  original_qty: unknown;
  current_qty: unknown;
  status: unknown;
  asset: unknown;
}): OrderState => ({
  orderId: Number(row.order_id),
  side: row.side as OrderSide,
  price: Number(row.price),
  originalQty: Number(row.original_qty),
  currentQty: Number(row.current_qty),
  status: row.status as OrderStatus,
  asset: Number(row.asset),
});
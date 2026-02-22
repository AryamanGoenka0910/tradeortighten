/**
 * Domain invariant: values are integers (no decimals).
 */

export type OrderSide = "buy" | "sell";
export type OrderStatus =
    | "pending"
    | "partially_filled"
    | "filled"
    | "cancelled"
    | "rejected";

export type ClientInfo = {
    clientId: string;
    clientUsername: string;
    lastSeq: number; // last sequence number for the client
};

export type ClientOrder = {
    clientOrderId: string; // unique identifier for the client order
    seq: number; // sequence number for the client order

    clientId: string; // client identifier
    orderId: number; // given by the engine
    side: OrderSide;
    price: number;
    originalQty: number;
    currentQty: number;
    status: OrderStatus;
};

export type ClientPortfolio = {
    clientId: string;
    cashAvailable: number;
    cashReserved: number;
    asset1Available: number;
    asset1Reserved: number;
    asset2Available: number;
    asset2Reserved: number;
    asset3Available: number;
    asset3Reserved: number;
    asset4Available: number;
    asset4Reserved: number;
};
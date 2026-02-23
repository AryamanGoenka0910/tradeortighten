export type EngineRequest = { 
    reqId: string;
    op: "place" | "cancel" | "modify"; 
    [k: string]: unknown 
};

export type EngineTrade = {
    taker_order_id: number;
    maker_order_id: number;
    taker_client_id: string;
    maker_client_id: string;
    price: number;
    qty: number;
  };
  
export type EngineResponse = {
    reqId: string;
    orderId: number;
    clientId: string;
    op: "place" | "cancel" | "modify";
    execution_status: boolean;
    order_status: "Invalid order" | "pending" | "partially_filled" | "filled";
    remainingQty: number;
    trades: EngineTrade[];
  };
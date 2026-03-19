export type EngineRequest = {
    reqId: string;
    op: "place" | "cancel" | "initial_load";
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
    op: "place" | "cancel" | "initial_load";
    assetId: number;
    execution_status: boolean;
    trades: EngineTrade[];
    all_bids: { price: number; qty: number }[];
    all_asks: { price: number; qty: number }[];
    books?: Record<string, { all_bids: { price: number; qty: number }[]; all_asks: { price: number; qty: number }[] }>;
  };

#include "print_utils.h"
#include <iostream>

const char* side_str(lob::Side side) {
    return side == lob::Side::Buy ? "BUY" : "SELL";
}

void print_order(
    const lob::OrderBook::PlaceResult& result,
    lob::Side side,
    lob::Price price,
    lob::Qty qty
) {
    std::cerr << "  ORDER  " << side_str(side) << " px=" << price << " qty=" << qty
              << " -> id=" << result.order_id << " remaining=" << result.remaining_qty << "\n";
    if (result.trades.empty()) {
        std::cerr << "    (no trades - order rested)\n";
        return;
    }

    for (const auto& trade : result.trades) {
        std::cerr << "    TRADE px=" << trade.price << " qty=" << trade.qty
                  << " taker=" << trade.taker_client_id << " maker=" << trade.maker_client_id << "\n";
    }
}

void print_bbo(const lob::OrderBook& order_book) {
    const auto best_bid = order_book.best_bid();
    const auto best_ask = order_book.best_ask();

    std::cerr << "  BBO: ";
    if (best_bid) {
        std::cerr << "BID " << best_bid->first << " x " << best_bid->second;
    } else {
        std::cerr << "BID (none)";
    }

    std::cerr << " | ";
    if (best_ask) {
        std::cerr << "ASK " << best_ask->first << " x " << best_ask->second;
    } else {
        std::cerr << "ASK (none)";
    }
    std::cerr << "\n";
}

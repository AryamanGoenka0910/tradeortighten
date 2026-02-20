#pragma once

#include "order_book.h"

const char* side_str(lob::Side side);

void print_order(
    const lob::OrderBook::PlaceResult& result,
    lob::Side side,
    lob::Price price,
    lob::Qty qty
);

void print_bbo(const lob::OrderBook& order_book);

#include <cassert>
#include <iostream>
#include <stdexcept>

#include "order_book.h"
#include "print_utils.h"

// Test 1: orders rest when there is no crossing price
static void test_no_match() {
    std::cout << "[Test 1] No match - orders rest\n";
    lob::OrderBook ob;

    const auto r1 = ob.place_limit("1", lob::Side::Buy, 100, 5);
    print_order(r1, lob::Side::Buy, 100, 5);

    const auto r2 = ob.place_limit("1", lob::Side::Sell, 101, 3);
    print_order(r2, lob::Side::Sell, 101, 3);

    assert(r1.trades.empty() && r1.remaining_qty == 5);
    assert(r2.trades.empty() && r2.remaining_qty == 3);
    print_bbo(ob);
    std::cout << "  PASSED\n\n";
}

// Test 2: full fill - taker qty == maker qty
static void test_full_fill() {
    std::cout << "[Test 2] Full fill\n";
    lob::OrderBook ob;

    const auto rm = ob.place_limit("1", lob::Side::Sell, 100, 10);
    print_order(rm, lob::Side::Sell, 100, 10);

    const auto r = ob.place_limit("1", lob::Side::Buy, 100, 10);
    print_order(r, lob::Side::Buy, 100, 10);

    assert(r.trades.size() == 1);
    assert(r.trades[0].qty == 10);
    assert(r.trades[0].price == 100);
    assert(r.remaining_qty == 0);
    print_bbo(ob);
    std::cout << "  PASSED\n\n";
}

// Test 3: partial fill - taker larger than maker
static void test_partial_fill_taker_larger() {
    std::cout << "[Test 3] Partial fill - taker larger than maker\n";
    lob::OrderBook ob;

    const auto rm = ob.place_limit("1", lob::Side::Sell, 100, 4);
    print_order(rm, lob::Side::Sell, 100, 4);

    const auto r = ob.place_limit("1", lob::Side::Buy, 100, 10);
    print_order(r, lob::Side::Buy, 100, 10);

    assert(r.trades.size() == 1);
    assert(r.trades[0].qty == 4);
    assert(r.remaining_qty == 6);
    print_bbo(ob);
    std::cout << "  PASSED\n\n";
}

// Test 4: partial fill - maker larger than taker
static void test_partial_fill_maker_larger() {
    std::cout << "[Test 4] Partial fill - maker larger than taker\n";
    lob::OrderBook ob;

    const auto rm = ob.place_limit("1", lob::Side::Sell, 100, 10);
    print_order(rm, lob::Side::Sell, 100, 10);

    const auto r = ob.place_limit("1", lob::Side::Buy, 100, 3);
    print_order(r, lob::Side::Buy, 100, 3);

    assert(r.trades.size() == 1);
    assert(r.trades[0].qty == 3);
    assert(r.remaining_qty == 0);
    print_bbo(ob);
    std::cout << "  PASSED\n\n";
}

// Test 5: sweep multiple price levels
static void test_sweep_multiple_levels() {
    std::cout << "[Test 5] Sweep multiple ask levels\n";
    lob::OrderBook ob;

    const auto rm1 = ob.place_limit("1", lob::Side::Sell, 100, 5);
    print_order(rm1, lob::Side::Sell, 100, 5);

    const auto rm2 = ob.place_limit("1", lob::Side::Sell, 101, 5);
    print_order(rm2, lob::Side::Sell, 101, 5);

    const auto rm3 = ob.place_limit("1", lob::Side::Sell, 102, 5);
    print_order(rm3, lob::Side::Sell, 102, 5);

    const auto r = ob.place_limit("1", lob::Side::Buy, 102, 12);
    print_order(r, lob::Side::Buy, 102, 12);

    assert(r.trades.size() == 3);
    assert(r.remaining_qty == 0);
    print_bbo(ob);
    std::cout << "  PASSED\n\n";
}

// Test 6: FIFO queue priority at same price level
static void test_fifo_priority() {
    std::cout << "[Test 6] FIFO priority at same price\n";
    lob::OrderBook ob;

    const auto r1 = ob.place_limit("1", lob::Side::Sell, 100, 3);
    print_order(r1, lob::Side::Sell, 100, 3);

    const auto r2 = ob.place_limit("1", lob::Side::Sell, 100, 7);
    print_order(r2, lob::Side::Sell, 100, 7);

    const auto r = ob.place_limit("1", lob::Side::Buy, 100, 5);
    print_order(r, lob::Side::Buy, 100, 5);

    assert(r.trades.size() == 2);
    assert(r.trades[0].order_id_maker == r1.order_id && r.trades[0].qty == 3);
    assert(r.trades[1].order_id_maker == r2.order_id && r.trades[1].qty == 2);
    assert(r.remaining_qty == 0);
    print_bbo(ob);
    std::cout << "  PASSED\n\n";
}

// Test 7: invalid qty throws
// TODO: FIX THIS TEST
static void test_invalid_qty() {
    std::cout << "[Test 7] Invalid qty throws\n";
    lob::OrderBook ob;
    bool threw = false;
    try {
        ob.place_limit("1", lob::Side::Buy, 100, 0);
    } catch (const std::invalid_argument&) {
        threw = true;
    }
    assert(threw);
    std::cout << "  ORDER  BUY px=100 qty=0 -> exception: invalid qty\n";
    std::cout << "  PASSED\n\n";
}

int main() {
    test_no_match();
    test_full_fill();
    test_partial_fill_taker_larger();
    test_partial_fill_maker_larger();
    test_sweep_multiple_levels();
    test_fifo_priority();
    test_invalid_qty();

    std::cout << "All tests passed.\n";
    return 0;
}

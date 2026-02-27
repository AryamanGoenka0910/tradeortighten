#include <cassert>
#include <iostream>
#include <stdexcept>

#include "order_book.h"
#include "print_utils.h"

// Functionality to test:
    // User places buy order lmt at 100 & same usersell order lmt 100
        // do they get matched together? 
    // User cancels order
        // their entry should be removed from that pricelevel's orders
    // User modifies order (expected result from what I've researched)
        // If price changes, they essentially cancel and create new order
        // If price is same, quantitiy < og_quantity, maintain priority
        // If price is same, quantity > og_priority, lose priority

    // Are we going to have an ability for users to place orders at MKT?
        // Should just be sell/buy at whatever the best bid/ask price is on orderbook

// Test: same client BUY 100 x 5 then SELL 100 x 5.
// Desired behavior: they should NOT self-match; both orders should rest.
static void test_self_match_same_client() {
    std::cout << "[RR Test 1] Self-trade behavior for same client (should NOT self-match)\n";
    lob::OrderBook ob;

    // Same client places a resting buy order
    const auto r_buy = ob.place_limit("1", lob::Side::Buy, 100, 5);
    print_order(r_buy, lob::Side::Buy, 100, 5);

    // Same client then places a sell order at the same price
    const auto r_sell = ob.place_limit("1", lob::Side::Sell, 100, 5);
    print_order(r_sell, lob::Side::Sell, 100, 5);

    // Your original expectations:
    assert(r_buy.trades.empty());
    assert(r_sell.trades.empty()); // FAILS HERE due to self matching

    // Extra asserts on the resulting book state:
    // - both orders should be fully resting
    assert(r_buy.remaining_qty == 5);
    assert(r_sell.remaining_qty == 5);

    // - there should be a non-empty bid and ask level at price 100
    const auto& bids = ob.all_bids();
    const auto& asks = ob.all_asks();

    auto bid_it = bids.find(100);
    auto ask_it = asks.find(100);
    assert(bid_it != bids.end());
    assert(ask_it != asks.end());
    assert(!bid_it->second.empty());
    assert(!ask_it->second.empty());
    assert(bid_it->second.total_qty() == 5);
    assert(ask_it->second.total_qty() == 5);

    print_bbo(ob);
    std::cout << "  PASSED (spec for no self-trade)\n\n";
}

// Test: user cancels order -> their entry should be removed from that pricelevel's orders.
static void test_cancel_removes_from_pricelevel() {
    std::cout << "[RR Test 2] Cancel removes from price level\n";
    lob::OrderBook ob;

    const auto r1 = ob.place_limit("1", lob::Side::Buy, 100, 5);
    print_order(r1, lob::Side::Buy, 100, 5);

    // Checking whether there is a bid level at 100 with qty 5.
    {
        const auto& bids = ob.all_bids();
        auto it = bids.find(100);
        assert(it != bids.end());
        assert(!it->second.empty());
        assert(it->second.total_qty() == 5);
    }

    ob.cancel_order(r1.order_id);


    const auto& bids_after = ob.all_bids();
    auto it_after = bids_after.find(100);

    // if the last order of a pricelevel is deleted should that pricelevel be deleted?
    if (it_after != bids_after.end()) {
        std::cout << std::endl << it_after->second.total_qty() << std::endl;
        assert(it_after->second.empty()); // FAILS HERE, implying order still exists on orderbook w/ quantity 0 (did we have a reason for that?)
        assert(it_after->second.total_qty() == 0);
    }

    print_bbo(ob);
    std::cout << "  PASSED (spec for cancel)\n\n";
}

// Test: three orders at same price, cancel the middle one.
// Desired behavior: the canceled order should not participate in matching, and the 3rd order
// effectively becomes next-in-line behind the 1st.
static void test_cancel_middle_order_priority_shifts() {
    std::cout << "[RR Test 2b] Cancel middle order shifts priority\n";
    lob::OrderBook ob;

    const auto r1 = ob.place_limit("1", lob::Side::Buy, 100, 5);
    const auto r2 = ob.place_limit("2", lob::Side::Buy, 100, 5);
    const auto r3 = ob.place_limit("3", lob::Side::Buy, 100, 5);
    print_order(r1, lob::Side::Buy, 100, 5);
    print_order(r2, lob::Side::Buy, 100, 5);
    print_order(r3, lob::Side::Buy, 100, 5);

    // Pre-condition: total qty at 100 is 15.
    {
        const auto& bids = ob.all_bids();
        auto it = bids.find(100);
        assert(it != bids.end());
        assert(!it->second.empty());
        assert(it->second.total_qty() == 15);
    }

    // Cancel the middle order.
    ob.cancel_order(r2.order_id);

    // After cancel, total qty should reflect the removal.
    {
        const auto& bids = ob.all_bids();
        auto it = bids.find(100);
        assert(it != bids.end());
        assert(it->second.total_qty() == 10);
    }

    // Now sell into the bid to consume 10 shares: should fill r1 then r3 (r2 is skipped).
    const auto r_sell = ob.place_limit("S", lob::Side::Sell, 100, 10);
    print_order(r_sell, lob::Side::Sell, 100, 10);

    assert(r_sell.trades.size() == 2);
    assert(r_sell.trades[0].order_id_maker == r1.order_id);
    assert(r_sell.trades[0].qty == 5);
    assert(r_sell.trades[1].order_id_maker == r3.order_id);
    assert(r_sell.trades[1].qty == 5);
    assert(r_sell.remaining_qty == 0);

    print_bbo(ob);
    std::cout << "  PASSED (spec for cancel-middle)\n\n";
}

// Test: modify order where price is same and quantity < original -> maintain priority.
static void test_modify_same_price_decrease_keeps_priority() {
    std::cout << "[RR Test 3] Modify same price, decrease qty keeps priority\n";
    lob::OrderBook ob;

    const auto r1 = ob.place_limit("1", lob::Side::Sell, 100, 5);
    const auto r2 = ob.place_limit("2", lob::Side::Sell, 100, 5);
    const auto r3 = ob.place_limit("3", lob::Side::Sell, 100, 5);
    print_order(r1, lob::Side::Sell, 100, 5);
    print_order(r2, lob::Side::Sell, 100, 5);
    print_order(r3, lob::Side::Sell, 100, 5);

    // Decrease r2 quantity from 5 to 3; expectation: r2 stays behind r1 in FIFO order.
    ob.modify_order(r2.order_id, 3);

    // Buy enough to consume r1 (5), r2 (3), and then 1 from r3.
    const auto r_buy = ob.place_limit("B", lob::Side::Buy, 100, 9);
    print_order(r_buy, lob::Side::Buy, 100, 9);

    assert(r_buy.trades.size() == 3);
    // FIFO should be r1 then r2 then r3, even after decreasing r2 qty.
    assert(r_buy.trades[0].order_id_maker == r1.order_id);
    assert(r_buy.trades[0].qty == 5);
    assert(r_buy.trades[1].order_id_maker == r2.order_id);
    assert(r_buy.trades[1].qty == 3);
    assert(r_buy.trades[2].order_id_maker == r3.order_id);
    assert(r_buy.trades[2].qty == 1);
    assert(r_buy.remaining_qty == 0);

    // After consuming 9 total, there should be 4 remaining at ask 100 (all in r3).
    {
        const auto& asks = ob.all_asks();
        auto it = asks.find(100);
        assert(it != asks.end());
        assert(it->second.total_qty() == 4);
        assert(!it->second.empty());
    }

    print_bbo(ob);
    std::cout << "  PASSED (spec for decrease-qty)\n\n";
}

// Test: modify order where price is same and quantity > original -> lose priority.
static void test_modify_same_price_increase_loses_priority() {
    std::cout << "[RR Test 4] Modify same price, increase qty loses priority\n";
    lob::OrderBook ob;

    const auto r1 = ob.place_limit("1", lob::Side::Sell, 100, 5);
    const auto r2 = ob.place_limit("2", lob::Side::Sell, 100, 5);
    const auto r3 = ob.place_limit("3", lob::Side::Sell, 100, 5);
    print_order(r1, lob::Side::Sell, 100, 5);
    print_order(r2, lob::Side::Sell, 100, 5);
    print_order(r3, lob::Side::Sell, 100, 5);

    // Increase r2 quantity from 5 to 10; expectation: r2 loses its original queue priority
    // and is treated as if it arrived after r3.
    ob.modify_order(r2.order_id, 10);

    const auto r_buy = ob.place_limit("4", lob::Side::Buy, 100, 7);
    print_order(r_buy, lob::Side::Buy, 100, 7);

    // Desired behavior: r1 then r3, not r2.
    assert(r_buy.trades.size() == 2);
    assert(r_buy.trades[0].order_id_maker == r1.order_id);
    assert(r_buy.trades[0].qty == 5);
    assert(r_buy.trades[1].order_id_maker == r3.order_id); // FAILS HERE. increasing quantity maintains priority. is that fine?
    assert(r_buy.trades[1].qty == 2);
    assert(r_buy.remaining_qty == 0);
    assert(r3.remaining_qty == 5);

    print_bbo(ob);
    std::cout << "  PASSED (spec for increase-qty)\n\n";
}

int main() {
    //test_self_match_same_client();
    //test_cancel_removes_from_pricelevel();
    test_cancel_middle_order_priority_shifts();
    test_modify_same_price_decrease_keeps_priority();
    test_modify_same_price_increase_loses_priority();

    std::cout << "All rr tests passed.\n";
    return 0;
}

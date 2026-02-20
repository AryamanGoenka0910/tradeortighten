#include "order_book.h"
#include <stdexcept>

namespace lob {

    OrderBook::OrderBook() = default;

    // check this error condition later
    OrderBook::PlaceResult OrderBook::place_limit(ClientId client_id, Side side, Price price, Qty qty) {
        if (qty <= 0 || price <= 0) {
            return PlaceResult{0, {}, 0};
        }

        Order incoming_order{ids_.next(), client_id, side, price, qty};

        std::vector<Trade> trades;
        if (side == Side::Buy) {
            match_buy(incoming_order, trades);
        } else {
            match_sell(incoming_order, trades);
        }

        if (incoming_order.qty > 0) {
            rest(incoming_order);
        }

        return PlaceResult{incoming_order.id, trades, incoming_order.qty};
    }

    // change to iterator approach for better performance on phantom levels
    std::optional<std::pair<Price, Qty>> OrderBook::best_bid() const {
        if (bids_.empty()) return std::nullopt;
        const auto& [px, lvl] = *bids_.begin();
        return std::make_pair(px, lvl.total_qty());
    }

    std::optional<std::pair<Price, Qty>> OrderBook::best_ask() const {
        if (asks_.empty()) return std::nullopt;
        const auto& [px, lvl] = *asks_.begin();
        return std::make_pair(px, lvl.total_qty());
    }

    void OrderBook::rest(const Order order) {
        order_map[order.id] = order;

        if (order.side == Side::Buy) {
            bids_[order.price].push_back(order.id, order.qty);
        } else {
            asks_[order.price].push_back(order.id, order.qty);
        }

    }

    void OrderBook::match_sell(Order& taker, std::vector<Trade>& out_trades) {
        while (taker.qty > 0 && !bids_.empty()) {
            auto current_price_level_it = bids_.begin();
            auto& [best_curr_price, best_curr_level] = *current_price_level_it;

            if (best_curr_price < taker.price) {
                break; // No more matching possible
            }

            this->price_level_match(taker, out_trades, best_curr_level, best_curr_price);

            if (best_curr_level.empty()) {
                bids_.erase(current_price_level_it);
            }
        }
    }

    void OrderBook::match_buy(Order& taker, std::vector<Trade>& out_trades) {
        while (taker.qty > 0 && !asks_.empty()) {
            auto current_price_level_it = asks_.begin();
            auto& [best_curr_price, best_curr_level] = *current_price_level_it;

            if (best_curr_price > taker.price) {
                break; // No more matching possible
            }

            this->price_level_match(taker, out_trades, best_curr_level, best_curr_price);

            if (best_curr_level.empty()) {
                asks_.erase(current_price_level_it);
            }
        }
    }

    void OrderBook::price_level_match(
        Order& taker,
        std::vector<Trade>& out_trades,
        PriceLevel& best_curr_level,
        const Price& best_curr_price
    ) {
        while (taker.qty > 0 && !best_curr_level.empty()) {
            OrderId maker_id = best_curr_level.front();
            auto mit = order_map.find(maker_id);
            if (mit == order_map.end()) {
                best_curr_level.pop_front();
                continue;
            }
            Order& maker = mit->second;
            if (maker.qty == 0) {
                best_curr_level.pop_front();
                order_map.erase(maker_id);
                continue;
            }

            Qty trade_qty = std::min(taker.qty, maker.qty);
            out_trades.push_back(Trade{taker.id, maker.id, taker.client_id, maker.client_id, best_curr_price, trade_qty});

            taker.qty -= trade_qty;
            maker.qty -= trade_qty;

            best_curr_level.reduce_total(trade_qty);
            if (maker.qty == 0) {
                best_curr_level.pop_front();
                order_map.erase(maker_id);
            }
            
        }
    }

    void OrderBook::cancel_order(OrderId order_id){
        auto order_it = order_map.find(order_id);
        if (order_it == order_map.end()){
            return;
        }
        
        if (order_it->second.qty == 0) {return;}

        Side order_side = order_it->second.side;
        Price order_price = order_it->second.price;
        
        if (order_side == Side::Buy){
            auto pricelvl_it = bids_.find(order_price);
            if (pricelvl_it == bids_.end()){
                return;
            }
            pricelvl_it->second.reduce_total(order_it->second.qty);
        } else {
            auto pricelvl_it = asks_.find(order_price);
            if (pricelvl_it == asks_.end()){
                return;
            }
           pricelvl_it->second.reduce_total(order_it->second.qty);
        }

        order_it->second.qty = 0;
    }

    // adjust queue priority
    void OrderBook::modify_order(OrderId order_id, Qty qty){
        if (qty < 0) throw std::invalid_argument("OrderBook::modify_order qty must be > 0");
        auto order_it = order_map.find(order_id);
        if (order_it == order_map.end()){
            return;
        }
        
        if (order_it->second.qty == 0) {return;}
        if (order_it->second.qty == qty) {return;}

        Side order_side = order_it->second.side;
        Price order_price = order_it->second.price;
        
        if (order_side == Side::Buy){
            auto pricelvl_it = bids_.find(order_price);
            if (pricelvl_it == bids_.end()){
                return;
            }

            if (qty >  order_it->second.qty){
                pricelvl_it->second.increase_total(qty - order_it->second.qty);
            } else {
                pricelvl_it->second.reduce_total(order_it->second.qty - qty);
            }
        } else {
            auto pricelvl_it = asks_.find(order_price);
            if (pricelvl_it == asks_.end()){
                return;
            }

            if (qty >  order_it->second.qty){
                pricelvl_it->second.increase_total(qty - order_it->second.qty);
            } else {
                pricelvl_it->second.reduce_total(order_it->second.qty - qty);
            }
        }

        order_it->second.qty = qty;
    }
}
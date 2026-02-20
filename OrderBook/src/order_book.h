#pragma once
#include "price_level.h"
#include "types/types.h"
#include "types/order.h"
#include "types/trade.h"
#include "id_generator.h"

#include <stdexcept>
#include <functional>
#include <utility>
#include <map>
#include <optional>
#include <unordered_map>
#include <vector>

namespace lob {
    class OrderBook final {
        public:
            OrderBook();
              
            struct PlaceResult final {
                OrderId order_id{};
                std::vector<Trade> trades;
                Qty remaining_qty{};
            };
            
            PlaceResult place_limit(
                ClientId client_id,
                Side side, 
                Price price, 
                Qty qty
            );

             // Best bid/ask (price, total qty at that best level)
            std::optional<std::pair<Price, Qty>> best_bid() const;
            std::optional<std::pair<Price, Qty>> best_ask() const;

    
            void cancel_order(
                OrderId id
            );             
        
            void modify_order(
                OrderId id, 
                Qty new_qty
            );

        private:
            std::unordered_map<OrderId, Order> order_map;
            using BidBook = std::map<Price, PriceLevel, std::greater<Price>>;
            using AskBook = std::map<Price, PriceLevel, std::less<Price>>;

            BidBook bids_;
            AskBook asks_;

            IdGenerator ids_;

            void rest(const Order o);

            void match_buy(Order& taker, std::vector<Trade>& out_trades);
            void match_sell(Order& taker, std::vector<Trade>& out_trades);
            void price_level_match(
                Order& taker,
                std::vector<Trade>& out_trades,
                PriceLevel& best_curr_level,
                const Price& best_curr_price
            );
    };
}


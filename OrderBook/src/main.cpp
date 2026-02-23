#include <iostream>
#include <nlohmann/json.hpp>
#include "order_book.h"
#include "print_utils.h"

/*
OrderBook Engine API:

IMPORTANT: 
 - All operations are async and return a Promise
 - Opperations are only validated for OrderBook correctness, not for backend validation for game logic
            
*/

namespace lob {
void to_json(nlohmann::json& json_obj, const Trade& trade) {
    json_obj = nlohmann::json{
        {"taker_order_id", trade.order_id_taker},
        {"maker_order_id", trade.order_id_maker},
        {"taker_client_id", trade.taker_client_id},
        {"maker_client_id", trade.maker_client_id},
        {"price", trade.price},
        {"qty", trade.qty},
    };
}

template <typename Compare>
nlohmann::json book_to_json(
    const std::map<Price, PriceLevel, Compare>& book,
    const std::string& side
) {
    nlohmann::json json_obj;
    json_obj[side] = nlohmann::json::array();
    if (book.empty()) {
        return json_obj[side];
    }
    for (const auto& [price, level] : book) {
        json_obj[side].push_back({{"price", price}, {"qty", level.total_qty()}});
    }
    return json_obj[side];
}
} // namespace lob

int main() {
    lob::OrderBook ob;
    std::string incoming_message;

    while (std::getline(std::cin, incoming_message)) {
        auto req = nlohmann::json::parse(incoming_message);
        auto reqId = req["reqId"];
        auto clientId = req["clientId"];
        auto operation = req["op"];

        if (operation == "place") {

            nlohmann::json resError;
            resError["reqId"] = reqId;
            resError["clientId"] = clientId;
            resError["op"] = operation;
            resError["orderId"] = -1;
            resError["execution_status"] = false;
            resError["trades"] = nlohmann::json::array();

            try {
                auto side_string = req.at("side").get<std::string>();
                lob::Side side;
                if (side_string == "buy") {
                    side = lob::Side::Buy;
                } else if (side_string == "sell") {
                    side = lob::Side::Sell;
                } else {
                    std::cerr << "Error: Invalid side" << std::endl; 
                    std::cout << resError.dump() << "\n" << std::flush;
                    continue;
                }

                auto price = req.at("price").get<int>();
                if (price <= 0) {
                    std::cerr << "Error: Invalid price" << std::endl; 
                    std::cout << resError.dump() << "\n" << std::flush;
                    continue;
                }
                
                auto qty = req.at("qty").get<int>(); // check they can afford this in backend not this orderbook engine
                if (qty <= 0) {
                    std::cerr << "Error: Invalid quantity" << std::endl; 
                    std::cout << resError.dump() << "\n" << std::flush;
                    continue;
                }

                auto result = ob.place_limit(clientId, side, price, qty); // Place Order Result
                if (result.order_id == 0) {
                    std::cerr << "Error: Invalid order" << std::endl; 
                    std::cout << resError.dump() << "\n" << std::flush;
                    continue;
                }

                print_order(result, side, price, qty);
                print_bbo(ob);

                nlohmann::json res;
                res["reqId"] = reqId;
                res["clientId"] = clientId;
                res["op"] = operation;
                res["orderId"] = result.order_id;
                res["execution_status"] = true;
                res["trades"] = result.trades;
                
                res["all_bids"] = book_to_json(ob.all_bids(), "bids");
                res["all_asks"] = book_to_json(ob.all_asks(), "asks");

                std::cout << res.dump() << "\n" << std::flush;

            } catch (const std::exception& e) {
                std::cerr << "Error: " << e.what() << std::endl;
                std::cout << resError.dump() << "\n" << std::flush;
                continue;
            }
        } else if (operation == "initial_load") {
            nlohmann::json res;
            res["reqId"] = reqId;
            res["clientId"] = clientId;
            res["op"] = operation;
            res["all_bids"] = book_to_json(ob.all_bids(), "bids");
            res["all_asks"] = book_to_json(ob.all_asks(), "asks");
            std::cout << res.dump() << "\n" << std::flush;
        }
    }

    return 0;
}

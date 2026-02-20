#include <iostream>
#include <nlohmann/json.hpp>
#include "order_book.h"
#include "print_utils.h"

int main() {
    lob::OrderBook ob;
    std::string incoming_message;

    while (std::getline(std::cin, incoming_message)) {
        auto req = nlohmann::json::parse(incoming_message);
        auto reqId = req["reqId"];
        auto operation = req["op"];

        if (operation == "place") {
            auto side = req["side"];
            if (side == "buy") {
                side = lob::Side::Buy;
            } else if (side == "sell") {
                side = lob::Side::Sell;
            } else {
                throw std::invalid_argument("Invalid side");
            }
            
            auto price = req.at("price").get<int>();
            auto qty = req.at("qty").get<int>();

            auto result = ob.place_limit(side, price, qty);

            print_order(result, side, price, qty);
            print_bbo(ob);
        }

        nlohmann::json res;
        res["reqId"] = reqId;
        res["orderId"] = reqId;
        res["ok"] = true;
        res["data"] = "success";

        std::cout << res.dump() << "\n" << std::flush;
    }

    return 0;
}

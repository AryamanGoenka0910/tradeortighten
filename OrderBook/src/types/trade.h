#pragma once
#include "types.h"

namespace lob {

    struct Trade final {
        OrderId order_id_taker{};
        OrderId order_id_maker{};
        ClientId taker_client_id{};
        ClientId maker_client_id{};
        Price price{};
        Qty qty{};
    };

} 
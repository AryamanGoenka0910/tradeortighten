#pragma once
#include "types.h"

namespace lob {

    struct Trade final {
        OrderId taker_id{};
        OrderId maker_id{};
        Price price{};
        Qty qty{};
    };

} 
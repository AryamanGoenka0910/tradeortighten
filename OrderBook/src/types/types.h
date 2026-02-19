#pragma once
#include <cstdint>

namespace lob {

    enum class Side : uint8_t { Buy = 0, Sell = 1 };

    using Price   = int64_t;   
    using Qty     = int64_t;   
    using OrderId = uint64_t;  
    using ClientId = uint64_t;

}
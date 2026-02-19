#pragma once
#include "types.h"

namespace lob {

struct Order final {
  OrderId id{};
  Side side{};
  Price price{};
  Qty qty{};
};

} // namespace lob
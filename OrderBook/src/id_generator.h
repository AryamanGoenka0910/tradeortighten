#pragma once
#include "types/types.h"

namespace lob {

// Simple monotonic generator.
class IdGenerator final {
 public:
  explicit IdGenerator(OrderId start = 1) : next_(start) {}
  OrderId next();

 private:
  OrderId next_;
};

} // namespace lob
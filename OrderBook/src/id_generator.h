#pragma once
#include "types/types.h"

namespace lob {

// Simple monotonic generator (deterministic, single-thread friendly).
class IdGenerator final {
 public:
  explicit IdGenerator(OrderId start = 1) : next_(start) {}
  OrderId next();

 private:
  OrderId next_;
};

} // namespace lob
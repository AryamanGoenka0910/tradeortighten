#pragma once
#include <deque>
#include <unordered_map>

#include "types/order.h"

namespace lob {

class PriceLevel final {
 public:

  void push_back(const OrderId id, const Qty qty);
  void pop_front();
  OrderId front() const;

  void reduce_total(const Qty qty);
  void increase_total(const Qty qty);
  
  Qty total_qty() const { return total_qty_; }
  bool empty() const { return orders_.empty(); }

 private:
  std::deque<OrderId> orders_;
  Qty total_qty_{0};
};

}
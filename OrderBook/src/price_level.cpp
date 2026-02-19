#include "price_level.h"
#include <stdexcept>

namespace lob {

void PriceLevel::push_back(const OrderId id, const Qty qty) {
  if (qty <= 0) throw std::invalid_argument("PriceLevel::push_back qty must be > 0");
  orders_.push_back(id);
  total_qty_ += qty;
}

void PriceLevel::pop_front() {
  if (orders_.empty()) throw std::runtime_error("PriceLevel::pop_front on empty level");
  orders_.pop_front();
}

OrderId PriceLevel::front() const {
  if (orders_.empty()) throw std::runtime_error("PriceLevel::front on empty level");
  return orders_.front() ;
}

void PriceLevel::reduce_total(Qty qty) {
  if (qty <= 0) return;
  total_qty_ -= qty;
  if (total_qty_ < 0) total_qty_ = 0;
}

void PriceLevel::increase_total(Qty qty) {
  total_qty_ += qty;
}

} // namespace lob
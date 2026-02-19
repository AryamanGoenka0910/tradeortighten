#include "id_generator.h"

namespace lob {

OrderId IdGenerator::next() {
  return next_++;
}

} // namespace lob
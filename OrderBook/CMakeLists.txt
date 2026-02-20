cmake_minimum_required(VERSION 3.20)
project(OrderBook LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(OrderBookCore
    src/price_level.cpp
    src/order_book.cpp
    src/id_generator.cpp
    src/print_utils.cpp
)

find_package(nlohmann_json CONFIG REQUIRED)
target_include_directories(OrderBookCore PUBLIC src)

add_executable(OrderBook src/main.cpp)
target_link_libraries(OrderBook PRIVATE OrderBookCore nlohmann_json::nlohmann_json)

add_executable(OrderBookTests tests/order_book_tests.cpp)
target_link_libraries(OrderBookTests PRIVATE OrderBookCore)

enable_testing()
add_test(NAME orderbook_tests COMMAND OrderBookTests)

if (MSVC)
  target_compile_options(OrderBookCore PRIVATE /W4 /permissive-)
  target_compile_options(OrderBook PRIVATE /W4 /permissive-)
  target_compile_options(OrderBookTests PRIVATE /W4 /permissive-)
else()
  target_compile_options(OrderBookCore PRIVATE -Wall -Wextra -Wpedantic -Wconversion -Wshadow)
  target_compile_options(OrderBook PRIVATE -Wall -Wextra -Wpedantic -Wconversion -Wshadow)
  target_compile_options(OrderBookTests PRIVATE -Wall -Wextra -Wpedantic -Wconversion -Wshadow)
endif()

#cmake -S . -B build
#cmake --build build -j
#ctest --test-dir build --output-on-failure
#./build/OrderBook 
#./build/OrderBookTests
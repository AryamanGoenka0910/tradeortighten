cmake_minimum_required(VERSION 3.20)
project(OrderBook LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(OrderBook
    src/main.cpp
    src/price_level.cpp
    src/order_book.cpp
    src/id_generator.cpp
)

target_include_directories(OrderBook PRIVATE src)

if (MSVC)
  target_compile_options(OrderBook PRIVATE /W4 /permissive-)
else()
  target_compile_options(OrderBook PRIVATE -Wall -Wextra -Wpedantic -Wconversion -Wshadow)
endif()

#cmake -S . -B build
#cmake --build build -j
#./build/OrderBook 
if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/siddarthasuthraye/.gradle/caches/9.3.1/transforms/e75a72bd3b25d7ced07105dd73858e3e/transformed/hermes-android-0.14.1-debug/prefab/modules/hermesvm/libs/android.x86_64/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/siddarthasuthraye/.gradle/caches/9.3.1/transforms/e75a72bd3b25d7ced07105dd73858e3e/transformed/hermes-android-0.14.1-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()


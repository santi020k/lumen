package com.santi020k.lumen

data class LumenCarouselSlide(val id: String, val label: String)
sealed interface LumenCarouselState {
    data class Ready(val index: Int, val count: Int) : LumenCarouselState
    data object Empty : LumenCarouselState
    data object Invalid : LumenCarouselState
}
fun resolveLumenCarousel(slides: List<LumenCarouselSlide>, index: Int): LumenCarouselState {
    if (slides.isEmpty()) return LumenCarouselState.Empty
    val ids = mutableSetOf<String>()
    if (index !in slides.indices || slides.any { it.id.isEmpty() || !ids.add(it.id) }) return LumenCarouselState.Invalid
    return LumenCarouselState.Ready(index, slides.size)
}
fun lumenCarouselTarget(state: LumenCarouselState, requested: Int): Int? =
    if (state is LumenCarouselState.Ready && requested in 0 until state.count && requested != state.index) requested else null

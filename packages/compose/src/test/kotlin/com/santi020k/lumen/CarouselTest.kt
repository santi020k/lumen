package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class CarouselTest {
    private val slides = listOf(LumenCarouselSlide("a", "A"), LumenCarouselSlide("b", "B"), LumenCarouselSlide("c", "C"))
    @Test fun boundedControlledNavigation() {
        val first = resolveLumenCarousel(slides, 0)
        assertEquals(LumenCarouselState.Ready(0, 3), first)
        assertNull(lumenCarouselTarget(first, -1)); assertNull(lumenCarouselTarget(first, 0)); assertNull(lumenCarouselTarget(first, 3))
        assertEquals(1, lumenCarouselTarget(first, 1))
        assertEquals(LumenCarouselState.Ready(2, 3), resolveLumenCarousel(slides, 2))
    }
    @Test fun invalidIdentityAndIndices() {
        assertEquals(LumenCarouselState.Empty, resolveLumenCarousel(emptyList(), 0))
        listOf(-1, 3, Int.MAX_VALUE, Int.MIN_VALUE).forEach { assertEquals(LumenCarouselState.Invalid, resolveLumenCarousel(slides, it)) }
        assertEquals(LumenCarouselState.Invalid, resolveLumenCarousel(listOf(LumenCarouselSlide("", "Empty")), 0))
        assertEquals(LumenCarouselState.Invalid, resolveLumenCarousel(listOf(slides[0], slides[0]), 0))
        assertEquals(listOf("a", "b", "c"), slides.map { it.id })
    }
}

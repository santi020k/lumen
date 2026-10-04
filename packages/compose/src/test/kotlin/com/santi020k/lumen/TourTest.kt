package com.santi020k.lumen

import org.junit.Assert.*
import org.junit.Test

class TourTest {
    private val steps = listOf(LumenTourStep("a", "x", "A", "First"), LumenTourStep("b", "x", "B", "Disabled", true), LumenTourStep("c", "z", "C", "Last"))
    @Test fun identityBoundsAndDisabledNavigation() {
        assertTrue(isLumenTourStepsValid(steps)); assertNull(resolveLumenTourStep(steps + steps, 0))
        assertNull(resolveLumenTourStep(steps, -1)); assertNull(resolveLumenTourStep(steps, 3))
        assertEquals(2, moveLumenTourStep(steps, 0, LumenTourDirection.Next)); assertEquals(0, moveLumenTourStep(steps, 2, LumenTourDirection.Previous))
        assertNull(moveLumenTourStep(steps, 2, LumenTourDirection.Next)); assertNull(moveLumenTourStep(steps, 1, LumenTourDirection.Next))
        assertFalse(isLumenTourStepsValid(listOf(LumenTourStep(" ", "x", "", ""))))
    }
    @Test fun clippedHighlightsAndViewportBounds() {
        val layout = resolveLumenTourLayout(LumenTourRect(-10.0, 50.0, 120.0, 44.0), LumenTourRect(0.0, 0.0, 390.0, 640.0))
        assertEquals(LumenTourRect(0.0, 50.0, 110.0, 44.0), layout?.highlight); assertEquals(102.0, requireNotNull(layout).panel.y, 0.0)
        for (width in listOf(48.0, 100.0, 320.0, 390.0, 900.0)) for (height in listOf(48.0, 100.0, 250.0, 640.0)) {
            for (anchor in listOf(null, LumenTourRect(2.0, 2.0, 20.0, 20.0), LumenTourRect(0.0, 0.0, width, height), LumenTourRect(2000.0, 2000.0, 44.0, 44.0), LumenTourRect(Double.NaN, 0.0, 1.0, 1.0))) {
                val panel = requireNotNull(resolveLumenTourLayout(anchor, LumenTourRect(0.0, 0.0, width, height))).panel
                assertTrue(panel.x >= 0 && panel.y >= 0 && panel.x + panel.width <= width && panel.y + panel.height <= height)
            }
        }
        assertNull(resolveLumenTourLayout(null, LumenTourRect(0.0, 0.0, Double.POSITIVE_INFINITY, 640.0)))
    }
}

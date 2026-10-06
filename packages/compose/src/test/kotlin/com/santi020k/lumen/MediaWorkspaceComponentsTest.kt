package com.santi020k.lumen

import org.junit.Assert.assertEquals
import org.junit.Test

class MediaWorkspaceComponentsTest {
    @Test fun normalizesZoomAndPan() {
        assertEquals(LumenMediaViewportValue(), LumenMediaViewportValue(Float.NaN, Float.POSITIVE_INFINITY, Float.NEGATIVE_INFINITY).normalized())
        assertEquals(LumenMediaViewportValue(4f, 1f, -1f), LumenMediaViewportValue(100f, 2f, -2f).normalized())
        assertEquals(LumenMediaViewportValue(), LumenMediaViewportValue(2f).normalized(0f))
    }
    @Test fun supportsGestureAlternativesAndFit() {
        assertEquals(1.25f, LumenMediaViewportValue().applying(LumenMediaViewportAction.ZoomIn).zoom)
        assertEquals(-0.25f, LumenMediaViewportValue(2f).applying(LumenMediaViewportAction.Left).x)
        assertEquals(0.25f, LumenMediaViewportValue(2f).applying(LumenMediaViewportAction.Right).x)
        assertEquals(-0.25f, LumenMediaViewportValue(2f).applying(LumenMediaViewportAction.Up).y)
        assertEquals(0.25f, LumenMediaViewportValue(2f).applying(LumenMediaViewportAction.Down).y)
        assertEquals(LumenMediaViewportValue(), LumenMediaViewportValue(2f, -1f, 1f).applying(LumenMediaViewportAction.Fit))
    }
    @Test fun boundsPointerPanToTheAvailableExtent() {
        assertEquals(LumenMediaViewportValue(2f, 0.5f, -0.5f), LumenMediaViewportValue(2f).panning(25f, -50f, 100f, 200f))
        assertEquals(LumenMediaViewportValue(2f), LumenMediaViewportValue(2f).panning(25f, -50f, 0f, 200f))
    }
}

package com.santi020k.lumen

import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Test

class StructuredComponentsTest {
    @Test
    fun errorStateAnnouncementsMapToNativeLiveRegions() {
        assertEquals(
            LiveRegionMode.Assertive,
            lumenErrorStateLiveRegion(LumenErrorStateAnnouncement.Assertive)
        )
        assertEquals(null, lumenErrorStateLiveRegion(LumenErrorStateAnnouncement.Off))
        assertEquals(
            LiveRegionMode.Polite,
            lumenErrorStateLiveRegion(LumenErrorStateAnnouncement.Polite)
        )
    }

    @Test
    fun statusBarTonesMapToVisibleSemanticIcons() {
        assertEquals(LumenIconName.Info, lumenStatusBarIconName(LumenMetricTone.Accent))
        assertEquals(LumenIconName.Info, lumenStatusBarIconName(LumenMetricTone.Brand))
        assertEquals(LumenIconName.OctagonX, lumenStatusBarIconName(LumenMetricTone.Danger))
        assertEquals(LumenIconName.Circle, lumenStatusBarIconName(LumenMetricTone.Neutral))
        assertEquals(LumenIconName.CircleCheck, lumenStatusBarIconName(LumenMetricTone.Success))
        assertEquals(LumenIconName.TriangleAlert, lumenStatusBarIconName(LumenMetricTone.Warning))
    }

    @Test
    fun surfaceGeometryExposesTheSharedNativeScale() {
        assertEquals(24.dp, LumenSurfacePadding.Xl.value)
        assertEquals(16.dp, LumenSurfaceRadius.Xl.value)
        assertEquals(20.dp, LumenSurfaceRadius.Size2xl.value)
        assertEquals(24.dp, LumenSurfaceRadius.Size3xl.value)
    }
}

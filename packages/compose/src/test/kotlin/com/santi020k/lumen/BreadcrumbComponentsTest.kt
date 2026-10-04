package com.santi020k.lumen

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BreadcrumbComponentsTest {
    @Test fun stableIdsRejectAmbiguousPathsAndPermitRepeatedLabels() {
        val home = LumenBreadcrumbItem("home", "Home")
        assertTrue(lumenBreadcrumbHasValidIds(emptyList()))
        assertTrue(lumenBreadcrumbHasValidIds(listOf(home, LumenBreadcrumbItem("current", "Home"))))
        assertFalse(lumenBreadcrumbHasValidIds(listOf(home, home)))
        assertFalse(lumenBreadcrumbHasValidIds(listOf(LumenBreadcrumbItem(" \n", "Missing"))))
    }
    @Test fun longPathsPreserveHostIds() {
        val path = (0 until 200).map { LumenBreadcrumbItem("location-$it", "Location $it", enabled = it != 2) }
        assertTrue(lumenBreadcrumbHasValidIds(path))
    }
}

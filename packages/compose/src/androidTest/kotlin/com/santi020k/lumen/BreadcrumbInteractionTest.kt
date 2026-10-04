package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasNoClickAction
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class BreadcrumbInteractionTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    @Test fun ancestorsEmitStableIdsWhileCurrentAndDisabledLocationsCannotNavigate() {
        var lastId = "none"
        val enabled = mutableStateOf(true)
        rule.setContent { LumenTheme {
            LumenBreadcrumb("Location", listOf(LumenBreadcrumbItem("home", "Home"),
                LumenBreadcrumbItem("locked", "Locked", enabled = false), LumenBreadcrumbItem("current", "Current location")),
                { lastId = it }, enabled = enabled.value, currentLabel = "Página actual")
        } }
        rule.onNodeWithText("Home").performClick()
        rule.runOnIdle { assertEquals("home", lastId) }
        rule.onNodeWithText("Locked").assertIsNotEnabled()
        rule.onNodeWithText("Current location").assertHasNoClickAction()
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Página actual"))
        rule.runOnIdle { enabled.value = false }
        rule.onNodeWithText("Home").assertIsNotEnabled()
    }
    @Test fun longPathsScrollAndInvalidIdsHideAmbiguousNavigation() {
        val invalid = mutableStateOf(false)
        var lastId = "none"
        val items = (0..12).map { LumenBreadcrumbItem("location-$it", "Long location $it") }
        rule.setContent { LumenTheme {
            LumenBreadcrumb("Long trail", if (invalid.value) listOf(items[0], items[0]) else items, { lastId = it })
        } }
        rule.onNodeWithText("Long location 11").performScrollTo().performClick()
        rule.runOnIdle { assertEquals("location-11", lastId) }
        rule.onNodeWithText("Long location 12").performScrollTo().assertHasNoClickAction()
        rule.runOnIdle { invalid.value = true }
        rule.onNodeWithText("Long location 0").assertDoesNotExist()
    }
}

package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class RatingAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    @Test fun localizedControlledZeroMaximumWrappingAndLockedActions() {
        val value = mutableStateOf(0)
        val maximum = mutableStateOf(5)
        val readOnly = mutableStateOf(false)
        val enabled = mutableStateOf(true)
        rule.setContent { LumenTheme {
            Column(Modifier.width(230.dp).verticalScroll(rememberScrollState())) {
                LumenRating("Calificación", value.value, { value.value = it }, maximum = maximum.value, readOnly = readOnly.value, enabled = enabled.value,
                    formatOption = { rating, max -> "Calificar $rating de $max" })
            }
        } }
        rule.onNodeWithContentDescription("Calificar 3 de 5").assertIsNotSelected().assertWidthIsAtLeast(44.dp).assertHeightIsAtLeast(44.dp).performClick()
        rule.runOnIdle { assertEquals(3, value.value) }
        rule.onNodeWithContentDescription("Calificar 3 de 5").assertIsSelected()
        rule.runOnIdle { readOnly.value = true }
        rule.onNodeWithContentDescription("Calificar 4 de 5").assertIsNotEnabled().performSemanticsAction(SemanticsActions.OnClick) { it() }
        rule.runOnIdle { assertEquals(3, value.value); readOnly.value = false; enabled.value = false }
        rule.onNodeWithContentDescription("Calificar 4 de 5").assertIsNotEnabled().performSemanticsAction(SemanticsActions.OnClick) { it() }
        rule.runOnIdle { assertEquals(3, value.value); enabled.value = true; maximum.value = 10; value.value = 10 }
        rule.onNodeWithContentDescription("Calificar 10 de 10").performScrollTo().assertIsSelected()
        val first = rule.onNodeWithContentDescription("Calificar 1 de 10").getUnclippedBoundsInRoot()
        val sixth = rule.onNodeWithContentDescription("Calificar 6 de 10").getUnclippedBoundsInRoot()
        assertTrue(sixth.top > first.top)
        rule.runOnIdle { value.value = 0 }
        rule.onNodeWithContentDescription("Calificar 10 de 10").assertIsNotSelected()
    }
    @Test fun invalidAndExtremeInputsRemainBoundedWithAccessibleChoices() {
        val value = mutableStateOf(Int.MIN_VALUE)
        val maximum = mutableStateOf(0)
        rule.setContent { LumenTheme {
            Column(Modifier.width(230.dp).verticalScroll(rememberScrollState())) {
                LumenRating("Score", value.value, { value.value = it }, maximum = maximum.value,
                    formatOption = { rating, max -> "Rate $rating of $max" })
            }
        } }
        rule.onNodeWithContentDescription("Rate 1 of 1").assertIsNotSelected().performClick()
        rule.runOnIdle { assertEquals(1, value.value); maximum.value = Int.MAX_VALUE; value.value = Int.MAX_VALUE }
        rule.onNodeWithContentDescription("Rate 100 of 100").performScrollTo().assertIsSelected().assertWidthIsAtLeast(44.dp).assertHeightIsAtLeast(44.dp)
        rule.onNodeWithContentDescription("Rate 101 of 100").assertDoesNotExist()
        rule.runOnIdle { value.value = 0 }
        rule.onNodeWithContentDescription("Rate 100 of 100").assertIsNotSelected()
    }
}

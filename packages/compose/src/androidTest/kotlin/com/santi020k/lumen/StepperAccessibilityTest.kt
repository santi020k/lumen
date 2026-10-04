package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class StepperAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val steps = listOf(LumenStepItem("choose", "Elegir una experiencia accesible con un título largo", "Detalles"), LumenStepItem("review", "Revisar"), LumenStepItem("confirm", "Confirmar"))
    @Test fun localizedDisplayStatesAndHostNavigation() {
        val current = mutableStateOf(0)
        rule.setContent { LumenTheme { Column(Modifier.width(230.dp)) {
            LumenStepper("Progreso", steps, current.value, formatState = { when (it) { LumenStepState.Complete -> "Completado"; LumenStepState.Current -> "Actual"; LumenStepState.Upcoming -> "Pendiente" } })
            LumenButton(onClick = { current.value++ }) { LumenText("Next") }
        } } }
        val first = rule.onNodeWithContentDescription("1 / 3, Elegir una experiencia accesible con un título largo, Detalles")
        first.assertIsSelected().assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Actual"))
        assertFalse(first.fetchSemanticsNode().config.contains(SemanticsActions.OnClick))
        rule.onNodeWithText("1").assertDoesNotExist()
        rule.onNodeWithText("Next").performClick()
        first.assertIsNotSelected().assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Completado"))
        rule.onNodeWithContentDescription("2 / 3, Revisar").assertIsSelected()
        rule.runOnIdle { current.value = 3 }
        rule.onNodeWithContentDescription("3 / 3, Confirmar").assertIsNotSelected().assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Completado"))
        rule.runOnIdle { current.value = -3 }
        first.assertIsSelected()
        rule.runOnIdle { assertEquals(-3, current.value) }
    }
    @Test fun horizontalScrollAndInvalidIDRecovery() {
        val horizontal = mutableStateOf(true)
        val invalid = mutableStateOf(false)
        rule.setContent { LumenTheme { Column(Modifier.width(230.dp)) {
            LumenStepper("Progreso", if (invalid.value) listOf(steps[0], steps[0]) else steps, 2, horizontal = horizontal.value, invalidText = "Pasos no disponibles")
        } } }
        rule.onNodeWithContentDescription("3 / 3, Confirmar").performScrollTo().assertIsDisplayed().assertIsSelected()
        rule.runOnIdle { horizontal.value = false }
        val first = rule.onNodeWithContentDescription("1 / 3, Elegir una experiencia accesible con un título largo, Detalles").getUnclippedBoundsInRoot()
        val last = rule.onNodeWithContentDescription("3 / 3, Confirmar").getUnclippedBoundsInRoot()
        assertTrue(last.top > first.bottom)
        rule.runOnIdle { invalid.value = true }
        rule.onNodeWithText("Pasos no disponibles").assertIsDisplayed()
        rule.onNodeWithContentDescription("3 / 3, Confirmar").assertDoesNotExist()
        rule.runOnIdle { invalid.value = false }
        rule.onNodeWithContentDescription("3 / 3, Confirmar").assertIsSelected()
    }
}

// cspell:words Capacidad Favorito Informe Máximo Mínimo actualizado
package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import androidx.compose.ui.test.swipeRight
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class V4AdditionsAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    @Test fun appBarExposesHeadingAndNamedNavigationAndActions() {
        var backs = 0
        var saves = 0
        rule.setContent { LumenTheme {
            LumenTopAppBar("Proyectos", navigationIcon = {
                LumenIconButton(LumenIconName.ArrowLeft, "Volver", { backs++ })
            }, actions = { LumenIconButton(LumenIconName.Bookmark, "Guardar", { saves++ }) })
        } }
        rule.onNodeWithText("Proyectos").assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading))
        rule.onNodeWithContentDescription("Volver").performClick()
        rule.onNodeWithContentDescription("Guardar").performClick()
        rule.runOnIdle { assertEquals(1, backs); assertEquals(1, saves) }
    }

    @Test fun swipeActionsResetAndProvideButtonsAndDisabledSemantics() {
        var favorites = 0
        var archives = 0
        val enabled = mutableStateOf(true)
        rule.setContent { LumenTheme {
            LumenSwipeActions(Modifier.width(300.dp).testTag("swipe"),
                startAction = LumenSwipeAction("Favorite", { favorites++ }),
                endAction = LumenSwipeAction("Archive", { archives++ }), enabled = enabled.value) {
                LumenText("Synthetic report", modifier = Modifier.height(72.dp))
            }
        } }
        rule.onNodeWithText("Synthetic report").performTouchInput { swipeRight() }
        rule.runOnIdle { assertEquals(1, favorites) }
        rule.onNodeWithText("Synthetic report").performTouchInput { swipeLeft() }
        rule.runOnIdle { assertEquals(1, archives) }
        rule.onNodeWithText("Favorite").performClick()
        rule.runOnIdle { assertEquals(2, favorites); enabled.value = false }
        rule.onNodeWithText("Archive").assertIsNotEnabled()
        rule.runOnIdle { assertEquals(1, archives) }
    }

    @Test fun multiSelectSearchPreservesSelectionAndReadOnlyDismisses() {
        val values = mutableStateOf(setOf("first"))
        val query = mutableStateOf("")
        val readOnly = mutableStateOf(false)
        val options = listOf(LumenSelectionOption("first", "First"), LumenSelectionOption("second", "Second"), LumenSelectionOption("locked", "Locked", enabled = false))
        rule.setContent { LumenTheme {
            LumenMultiSelect("Teams", options.filter { it.label.contains(query.value, true) }, values.value,
                { values.value = it }, query.value, { query.value = it }, readOnly = readOnly.value)
        } }
        rule.onNodeWithText("Choose options · 1 selected").performClick()
        rule.onNodeWithText("Locked").assertIsNotEnabled()
        rule.onNodeWithText("Search options").performTextReplacement("Second")
        rule.onNodeWithContentDescription("Second").performClick()
        rule.runOnIdle { assertEquals(setOf("first", "second"), values.value); readOnly.value = true }
        rule.onNodeWithText("Done").assertDoesNotExist()
        rule.onNodeWithText("Choose options · 2 selected").assertIsNotEnabled()
    }

    @Test fun multiSelectLoadingErrorRetryAndEmptyStates() {
        val loading = mutableStateOf(true)
        val failed = mutableStateOf(false)
        var retries = 0
        rule.setContent { LumenTheme {
            LumenMultiSelect("Teams", emptyList(), emptySet(), {}, "", {}, loading = loading.value,
                resultsErrorMessage = if (failed.value) "Search failed" else null,
                onRetry = { retries++; failed.value = false })
        } }
        rule.onNodeWithText("Choose options · 0 selected").performClick()
        rule.onNodeWithContentDescription("Loading options").assertExists()
        rule.runOnIdle { loading.value = false; failed.value = true }
        rule.onNodeWithText("Search failed").assertExists()
        rule.onNodeWithText("Retry").performClick()
        rule.onNodeWithText("No matching options").assertExists()
        rule.runOnIdle { assertEquals(1, retries) }
    }

    @Test fun rangeThumbsAreNamedAndAdjustIndependentlyWithDisabledState() {
        val value = mutableStateOf(20f..80f)
        val enabled = mutableStateOf(true)
        rule.setContent { LumenTheme {
            LumenRangeSlider("Capacidad", value.value, { value.value = it }, valueRange = 0f..100f,
                enabled = enabled.value, startLabel = "Mínimo", endLabel = "Máximo", formatValue = { "${it.toInt()}%" })
        } }
        rule.onNodeWithContentDescription("Capacidad · Mínimo").performSemanticsAction(SemanticsActions.SetProgress) { assertTrue(it(30f)) }
        rule.onNodeWithContentDescription("Capacidad · Máximo").performSemanticsAction(SemanticsActions.SetProgress) { assertTrue(it(70f)) }
        rule.runOnIdle { assertEquals(30f..70f, value.value); enabled.value = false }
        rule.onNodeWithContentDescription("Capacidad · Mínimo").assertIsNotEnabled()
        rule.onNodeWithContentDescription("Capacidad · Máximo").assertIsNotEnabled()
    }

    @Test fun adaptiveSelectionAndBackKeepHostOwnership() {
        val selection = mutableStateOf<String?>(null)
        rule.setContent { LumenTheme {
            LumenAdaptiveListDetailScaffold(selection.value, { selection.value = null }, "Projects", "Details",
                listPane = { LumenButton(onClick = { selection.value = "studio" }) { LumenText("Choose Studio") } },
                emptyDetail = { LumenText("No selection") },
                detailPane = { key, _ -> LumenText("Selected $key") })
        } }
        rule.onNodeWithText("Choose Studio").performClick()
        rule.onNodeWithText("Selected studio").assertExists()
        // The standard phone emulator uses one pane. Tablet back stays application-owned.
        rule.onNodeWithText("Back").performClick()
        rule.onNodeWithText("Choose Studio").assertExists()
        rule.runOnIdle { assertEquals(null, selection.value) }
    }
    @Test fun swipeLogicalStartReversesInRtlAndDoesNotReplayOnRecomposition() {
        var calls = 0
        val title = mutableStateOf("Informe")
        rule.setContent { LumenTheme {
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                LumenSwipeActions(Modifier.width(300.dp), startAction = LumenSwipeAction("Favorito", { calls++ })) {
                    LumenText(title.value, modifier = Modifier.height(72.dp))
                }
            }
        } }
        rule.onNodeWithText("Informe").performTouchInput { swipeLeft() }
        rule.runOnIdle { assertEquals(1, calls) }
        rule.runOnIdle { title.value = "Informe actualizado" }
        rule.onNodeWithText("Informe actualizado").assertExists()
        rule.runOnIdle { assertEquals(1, calls) }
        rule.onNodeWithText("Informe actualizado").performTouchInput { swipeRight() }
        rule.runOnIdle { assertEquals(1, calls) }
    }

}

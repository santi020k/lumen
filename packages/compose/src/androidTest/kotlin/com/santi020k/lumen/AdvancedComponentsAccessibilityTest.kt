package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Text
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.accessibility.enableAccessibilityChecks
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeDown
import androidx.compose.ui.test.tryPerformAccessibilityChecks
import androidx.compose.ui.unit.dp
import java.math.BigDecimal
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class AdvancedComponentsAccessibilityTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun timeCancellationPreservesHostValueAndConfirmationPublishesDraft() {
        val value = mutableStateOf<LumenTimeSelection?>(null)
        var changes = 0
        composeRule.setContent {
            LumenTheme {
                LumenTimeField(
                    label = "Meeting time", value = value.value,
                    onValueChange = { value.value = it; changes += 1 },
                    minTime = LumenTimeSelection(8, 30), maxTime = LumenTimeSelection(17, 0),
                    is24Hour = true
                )
            }
        }
        composeRule.onNodeWithContentDescription("Meeting time: Choose a time").performClick()
        composeRule.onNodeWithText("Cancel").performClick()
        composeRule.runOnIdle { assertEquals(null, value.value); assertEquals(0, changes) }
        composeRule.onNodeWithContentDescription("Meeting time: Choose a time").performClick()
        composeRule.onNodeWithText("Confirm").performClick()
        composeRule.runOnIdle { assertEquals(LumenTimeSelection(8, 30), value.value); assertEquals(1, changes) }
        composeRule.onNodeWithContentDescription("Meeting time: 08:30").assertHasClickAction()
    }

    @Test
    fun openTimeDraftTracksHostValueChanges() {
        val value = mutableStateOf<LumenTimeSelection?>(LumenTimeSelection(9, 0))
        composeRule.setContent {
            LumenTheme {
                LumenTimeField("Meeting", value.value, { value.value = it }, is24Hour = true)
            }
        }
        composeRule.onNodeWithContentDescription("Meeting: 09:00").performClick()
        composeRule.runOnIdle { value.value = LumenTimeSelection(14, 30) }
        composeRule.onNodeWithText("Confirm").performClick()
        composeRule.runOnIdle { assertEquals(LumenTimeSelection(14, 30), value.value) }
    }

    @Test
    fun disablingTimeFieldDismissesOpenSelectionWithoutCommitting() {
        val enabled = mutableStateOf(true)
        var changes = 0
        composeRule.setContent {
            LumenTheme {
                LumenTimeField("Meeting", null, { changes += 1 }, enabled = enabled.value)
            }
        }
        composeRule.onNodeWithContentDescription("Meeting: Choose a time").performClick()
        composeRule.onNodeWithText("Cancel").assertExists()
        composeRule.runOnIdle { enabled.value = false }
        composeRule.onNodeWithText("Cancel").assertDoesNotExist()
        composeRule.onNodeWithContentDescription("Meeting: Choose a time").assertIsNotEnabled()
        composeRule.runOnIdle { assertEquals(0, changes) }
    }

    @Test
    fun autocompleteEditsQueryAndSelectsOnlyEnabledResults() {
        val query = mutableStateOf("")
        val selection = mutableStateOf<String?>(null)
        composeRule.setContent {
            LumenTheme {
                LumenAutocomplete(
                    label = "Workspace", query = query.value, onQueryChange = { query.value = it },
                    options = listOf(
                        LumenAutocompleteOption("active", "Active project"),
                        LumenAutocompleteOption("archived", "Archived project", enabled = false)
                    ),
                    value = selection.value, onValueChange = { selection.value = it }
                )
            }
        }
        composeRule.onNodeWithText("Workspace").performTextReplacement("project")
        composeRule.onNodeWithText("Archived project").assertIsNotEnabled().performClick()
        composeRule.runOnIdle { assertEquals(null, selection.value) }
        composeRule.onNodeWithText("Active project").assertIsEnabled().performClick()
        composeRule.runOnIdle { assertEquals("active", selection.value); assertEquals("Active project", query.value) }
        composeRule.onNodeWithText("Archived project").assertDoesNotExist()
    }

    @Test
    fun autocompleteShowsLoadingEmptyAndRetryStatesWithoutStaleOptions() {
        val loading = mutableStateOf(true)
        val error = mutableStateOf<String?>(null)
        var retries = 0
        composeRule.setContent {
            LumenTheme {
                LumenAutocomplete<String>(
                    label = "Search", query = "", onQueryChange = {}, options = emptyList(), onValueChange = {},
                    loading = loading.value, resultsErrorMessage = error.value, onRetry = { retries += 1 },
                    loadingLabel = "Searching projects", emptyLabel = "No matching projects"
                )
            }
        }
        composeRule.onNodeWithText("Search").performClick()
        composeRule.onNodeWithContentDescription("Searching projects").assertExists()
        composeRule.runOnIdle { loading.value = false }
        composeRule.onNodeWithText("No matching projects").assertExists()
        composeRule.runOnIdle { error.value = "Projects unavailable" }
        composeRule.onNodeWithText("No matching projects").assertDoesNotExist()
        composeRule.onNodeWithText("Projects unavailable").assertExists()
        composeRule.onNodeWithText("Retry").performClick()
        composeRule.runOnIdle { assertEquals(1, retries) }
    }

    @Test
    fun readOnlyAutocompleteKeepsItsValueAndDoesNotOpenResults() {
        val query = mutableStateOf("Project")
        composeRule.setContent {
            LumenTheme {
                LumenAutocomplete(
                    label = "Workspace", query = query.value, onQueryChange = { query.value = it },
                    options = listOf(LumenAutocompleteOption("other", "Other project")),
                    onValueChange = {}, readOnly = true
                )
            }
        }
        composeRule.onNodeWithText("Project").performClick()
        composeRule.onNodeWithText("Other project").assertDoesNotExist()
        composeRule.runOnIdle { assertEquals("Project", query.value) }
    }

    @Test
    fun numericDraftsRemainEditableAndExactStepsRespectBounds() {
        val value = mutableStateOf("0.2")
        composeRule.setContent {
            LumenTheme {
                LumenNumberField(
                    label = "Amount", value = value.value, onValueChange = { value.value = it },
                    min = BigDecimal.ZERO, max = BigDecimal.ONE, step = BigDecimal("0.1"), locale = Locale.US
                )
            }
        }
        composeRule.onNodeWithContentDescription("Increase value").performClick()
        composeRule.runOnIdle { assertEquals("0.3", value.value) }
        composeRule.onNodeWithText("Amount").performTextReplacement("-")
        composeRule.runOnIdle { assertEquals("-", value.value) }
        composeRule.onNodeWithContentDescription("Increase value").assertIsNotEnabled()
        composeRule.onNodeWithText("Amount").performTextReplacement("1")
        composeRule.onNodeWithContentDescription("Increase value").assertIsNotEnabled()
        composeRule.onNodeWithContentDescription("Decrease value").performClick()
        composeRule.runOnIdle { assertEquals("0.9", value.value) }
    }

    @Test
    fun numericValidationAndReadOnlyStateExposeContextWithoutMutation() {
        var changes = 0
        composeRule.setContent {
            LumenTheme {
                LumenNumberField(
                    label = "Quantity", value = "12", onValueChange = { changes += 1 }, max = BigDecimal.TEN,
                    outOfRangeLabel = "Maximum quantity is 10", readOnly = true, modifier = Modifier.testTag("quantity")
                )
            }
        }
        composeRule.onNodeWithText("Quantity").assert(
            SemanticsMatcher.expectValue(SemanticsProperties.Error, "Maximum quantity is 10")
        )
        composeRule.onNodeWithContentDescription("Increase value").assertIsNotEnabled().performClick()
        composeRule.onNodeWithContentDescription("Decrease value").assertIsNotEnabled().performClick()
        composeRule.runOnIdle { assertEquals(0, changes) }
    }

    @Test
    fun refreshExposesAnActionAndRemovesItWhileBusyOrDisabled() {
        val refreshing = mutableStateOf(false)
        val enabled = mutableStateOf(true)
        var refreshes = 0
        composeRule.setContent {
            LumenTheme {
                LumenPullToRefresh(
                    isRefreshing = refreshing.value, onRefresh = { refreshes += 1; refreshing.value = true },
                    enabled = enabled.value, modifier = Modifier.testTag("refresh"), refreshLabel = "Refresh projects"
                ) { Text("Projects") }
            }
        }
        val action = composeRule.onNodeWithTag("refresh").fetchSemanticsNode().config[SemanticsActions.CustomActions].single()
        assertEquals("Refresh projects", action.label)
        composeRule.runOnIdle { assertTrue(action.action()) }
        composeRule.onNodeWithTag("refresh").assert(SemanticsMatcher.keyNotDefined(SemanticsActions.CustomActions))
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Refreshing"))
        composeRule.runOnIdle { refreshing.value = false; enabled.value = false }
        composeRule.onNodeWithTag("refresh").assert(SemanticsMatcher.keyNotDefined(SemanticsActions.CustomActions))
        composeRule.runOnIdle { assertEquals(1, refreshes) }
    }

    @Test
    fun nativeRefreshGestureCallsHostAndDisabledGestureDoesNot() {
        val enabled = mutableStateOf(true)
        var refreshes = 0
        composeRule.setContent {
            LumenTheme {
                LumenPullToRefresh(false, { refreshes += 1 }, enabled = enabled.value,
                    modifier = Modifier.width(320.dp).height(400.dp).testTag("refresh")) {
                    LazyColumn(Modifier.fillMaxSize()) { items(20) { Text("Project $it", Modifier.height(48.dp)) } }
                }
            }
        }
        composeRule.onNodeWithTag("refresh").performTouchInput { swipeDown() }
        composeRule.runOnIdle { assertEquals(1, refreshes); enabled.value = false }
        composeRule.onNodeWithTag("refresh").performTouchInput { swipeDown() }
        composeRule.runOnIdle { assertEquals(1, refreshes) }
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun compactFieldsPassAutomatedAccessibilityChecks() {
        composeRule.setContent {
            LumenTheme {
                Box(Modifier.width(320.dp)) {
                    Column {
                        LumenTimeField("Hora de la reunión", LumenTimeSelection(13, 45), {}, is24Hour = true)
                        LumenNumberField("Cantidad", "2,5", {}, locale = Locale.forLanguageTag("es-CO"),
                            incrementLabel = "Aumentar cantidad", decrementLabel = "Disminuir cantidad")
                        LumenAutocomplete<String>("Proyecto", "", {}, emptyList(), {})
                        LumenNumberField("Maximum", "12", {}, max = BigDecimal.TEN, showStepper = false)
                        LumenTimeField("Required time", null, {}, errorMessage = "Choose a meeting time")
                    }
                }
            }
        }
        composeRule.enableAccessibilityChecks()
        composeRule.onRoot().tryPerformAccessibilityChecks()
    }
}

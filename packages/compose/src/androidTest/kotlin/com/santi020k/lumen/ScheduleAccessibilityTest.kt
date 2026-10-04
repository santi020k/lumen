package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class ScheduleAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    @Test fun overlapBoundsAndHostMoveRequests() {
        val first = LumenCalendarDay(2026, 3, 8)
        val readOnly = mutableStateOf(false)
        val events = listOf(
            LumenAgendaEvent(LumenCalendarEvent("a", "Planning", first), 540, 660),
            LumenAgendaEvent(LumenCalendarEvent("b", "Review", first), 570, 630)
        )
        var opened = ""
        var target: LumenCalendarDay? = null
        rule.setContent { LumenTheme {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                LumenSchedule("Week", first, {}, events, dayCount = 1,
                    onEventPress = { event, _ -> opened = event.event.id },
                    onEventMove = { _, date -> target = date }, readOnly = readOnly.value)
            }
        } }
        val planning = rule.onNodeWithContentDescription("2026-03-08, 09:00 – 11:00, Planning")
        val review = rule.onNodeWithContentDescription("2026-03-08, 09:30 – 10:30, Review")
        assertTrue(planning.fetchSemanticsNode().boundsInRoot.right <= review.fetchSemanticsNode().boundsInRoot.left)
        review.performClick()
        rule.onNodeWithText("Move to next day").performScrollTo().performClick()
        rule.runOnIdle { assertEquals("b", opened); assertEquals(first.addingDays(1), target); assertEquals(first, events[1].event.startDay); readOnly.value = true }
        rule.onNodeWithText("Move to next day").assertIsNotEnabled()
        review.assertIsNotEnabled()
    }
    @Test fun statusInvalidAndEmptyRanges() {
        val loading = mutableStateOf(false)
        val count = mutableStateOf(1)
        rule.setContent { LumenTheme {
            LumenSchedule("Week", LumenCalendarDay(2026, 3, 8), {}, emptyList(), dayCount = count.value,
                loading = loading.value, loadingLabel = "Waiting", emptyLabel = "Nothing scheduled")
        } }
        rule.onNodeWithText("Nothing scheduled").assertExists()
        rule.onNodeWithText("Next range").assertExists()
        rule.runOnIdle { loading.value = true }
        rule.onNodeWithText("Waiting").assertExists()
        rule.onNodeWithText("Next range").assertDoesNotExist()
        rule.runOnIdle { loading.value = false; count.value = 8 }
        rule.onNodeWithText("Invalid schedule").assertExists()
    }
}

package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class CalendarGridLayoutTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    @Test fun weekdayAndDayColumnsHaveDistinctBoundsAndDateSelectionAtPhoneWidths() {
        val width = mutableStateOf(350.dp)
        val dark = mutableStateOf(false)
        val selected = mutableStateOf<LumenCalendarDay?>(null)
        val month = LumenCalendarDay(2026, 3, 1)
        rule.setContent { LumenTheme(darkTheme = dark.value) {
            Box(Modifier.width(width.value)) {
                LumenCalendar("Synthetic calendar", month, {}, selected.value, { selected.value = it })
            }
        } }
        for (appearance in listOf(false, true)) for (viewport in listOf(268.dp, 350.dp, 390.dp)) {
            rule.runOnIdle { width.value = viewport; dark.value = appearance; selected.value = null }
            rule.waitForIdle()
            val weekdays = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
            val weekdayBounds = weekdays.map { rule.onNodeWithText(it).getUnclippedBoundsInRoot() }
            val days = (2..8).map { rule.onNodeWithContentDescription("2026-03-0$it") }
            val dayBounds = days.map { it.getUnclippedBoundsInRoot() }
            for (index in 0..5) {
                assertTrue("Weekdays must occupy distinct columns", weekdayBounds[index].right <= weekdayBounds[index + 1].left + 1.dp)
                assertTrue("Date cells must not overlap", dayBounds[index].right <= dayBounds[index + 1].left + 1.dp)
            }
            for (index in 0..6) {
                assertTrue("Date cell width must meet 44dp", dayBounds[index].right - dayBounds[index].left >= 43.5.dp)
                assertTrue("Weekday center must align with its date", kotlin.math.abs((weekdayBounds[index].left.value + weekdayBounds[index].right.value -
                    dayBounds[index].left.value - dayBounds[index].right.value) / 2f) < 1.5f)
            }
            days.last().performScrollTo().performClick().assertIsSelected()
            rule.runOnIdle { assertEquals(LumenCalendarDay(2026, 3, 8), selected.value) }
        }
    }
}

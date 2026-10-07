package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import org.junit.Rule
import org.junit.Test

class ExpandedChartAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    @Test fun calendarPreservesExactDatesWithoutVisibleDisclosure() {
        rule.setContent { LumenTheme {
            LumenCalendarHeatmap(data = listOf(LumenCalendarHeatmapDatum("2024-02-29", 7.0)),
                startDate = "2024-02-28", endDate = "2024-02-29", label = "Daily",
                modifier = Modifier.width(320.dp), showData = false, formatDate = { it },
                labels = LumenChartLabels(notAvailable = "Missing", formatValue = { it.toInt().toString() }))
        } }
        rule.onNodeWithContentDescription("2024-02-28: Missing. 2024-02-29: 7.").assertIsDisplayed()
    }
    @Test fun boxDisclosurePreservesWhiskersStatisticsAndOutliers() {
        rule.setContent { LumenTheme {
            LumenBoxPlot(data = listOf(LumenBoxPlotDatum("a", "A", 1.0, 2.0, 3.0, 4.0, 5.0, listOf(8.0))),
                label = "Distribution", modifier = Modifier.width(320.dp),
                labels = LumenChartLabels(formatValue = { it.toInt().toString() }))
        } }
        rule.onNodeWithContentDescription("View chart data").performClick()
        rule.onNodeWithText("A. Lower whisker: 1. First quartile: 2. Median: 3. Third quartile: 4. Upper whisker: 5. Outliers: 8.").assertIsDisplayed()
    }
    @Test fun boxRetainsEveryExactStatisticWithoutDisclosure() {
        rule.setContent { LumenTheme {
            LumenBoxPlot(data = listOf(LumenBoxPlotDatum("a", "A", 1.0, 2.0, 3.0, 4.0, 5.0, listOf(8.0))),
                label = "Distribution", modifier = Modifier.width(320.dp), showData = false,
                labels = LumenChartLabels(formatValue = { it.toInt().toString() }))
        } }
        rule.onNodeWithContentDescription("A. Lower whisker: 1. First quartile: 2. Median: 3. Third quartile: 4. Upper whisker: 5. Outliers: 8.").assertIsDisplayed()
    }

}

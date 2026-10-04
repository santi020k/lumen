package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.width
import androidx.compose.ui.unit.dp
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Rule
import org.junit.Test

class IntervalChartAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    @Test fun dataDisclosurePreservesExactSignedBalances() {
        rule.setContent { LumenTheme {
            LumenWaterfallChart(label = "Revenue", modifier = Modifier.width(320.dp), data = listOf(
                LumenWaterfallDatum("opening", "Opening", 100.0, LumenWaterfallKind.Total),
                LumenWaterfallDatum("costs", "Costs", -25.0)
            ), labels = LumenChartLabels(formatValue = { it.toInt().toString() }))
        } }
        val row = "Costs, Start: 100, End: 75, Value: -25"
        rule.onNodeWithText(row).assertDoesNotExist()
        rule.onNodeWithContentDescription("View chart data").performClick()
        rule.onNodeWithText(row).assertIsDisplayed()
        rule.onNodeWithContentDescription("View chart data").performClick()
        rule.onNodeWithText(row).assertDoesNotExist()
    }

    @Test fun invalidBinsHaveLocalizedFeedbackAndNoDataDisclosure() {
        rule.setContent { LumenTheme {
            LumenHistogram(label = "Distribution", data = listOf(
                LumenHistogramBin(0.0, 10.0, 5.0), LumenHistogramBin(5.0, 15.0, 3.0)
            ), labels = LumenChartLabels(invalidData = "Check the bins"))
        } }
        rule.onNodeWithText("Check the bins").assertIsDisplayed()
        rule.onNodeWithContentDescription("View chart data").assertDoesNotExist()
    }

    @Test fun densityDataRetainsTheOriginalBinCounts() {
        rule.setContent { LumenTheme {
            LumenHistogram(label = "Distribution", frequency = LumenHistogramFrequency.Density, data = listOf(
                LumenHistogramBin(0.0, 10.0, 5.0), LumenHistogramBin(10.0, 30.0, 10.0)
            ))
        } }
        rule.onNodeWithContentDescription("View chart data").performClick()
        rule.onNodeWithText("10.0–30.0, Start: 10.0, End: 30.0, Density: 0.5, Count: 10.0").assertIsDisplayed()
    }
}

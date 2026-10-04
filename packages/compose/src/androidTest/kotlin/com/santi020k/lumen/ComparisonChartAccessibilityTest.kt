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

class ComparisonChartAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    @Test fun pairedMeasurementsStayReadableWithoutColorAndPreserveMissingValues() {
        rule.setContent { LumenTheme {
            LumenDumbbellChart(data = listOf(LumenComparisonDatum("design", "Design", null, 60.0)), label = "Comparison",
                modifier = Modifier.width(320.dp), referenceLabel = "Previous", valueLabel = "Current",
                labels = LumenChartLabels(notAvailable = "Missing", formatValue = { "${it.toInt()}%" }))
        } }
        rule.onNodeWithText("Design").assertIsDisplayed()
        rule.onNodeWithText("60% → Missing").assertIsDisplayed()
        rule.onNodeWithContentDescription("View chart data").performClick()
        rule.onNodeWithText("Design. Previous: 60%. Current: Missing.").assertIsDisplayed()
    }
}

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

class HeatmapAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    @Test fun disclosureDistinguishesMissingAndZeroAndKeepsTheFirstCoordinate() {
        rule.setContent { LumenTheme {
            LumenHeatmap(label = "Activity", modifier = Modifier.width(320.dp), data = listOf(
                LumenHeatmapDatum("missing", "Mon", "AM", null),
                LumenHeatmapDatum("zero", "Tue", "AM", 0.0),
                LumenHeatmapDatum("duplicate", "Tue", "AM", 40.0),
                LumenHeatmapDatum("negative", "Wed", "AM", -4.0)
            ), colorScale = LumenHeatmapColorScale.Diverging,
                labels = LumenChartLabels(notAvailable = "Missing", formatValue = { it.toInt().toString() }))
        } }
        rule.onNodeWithText("× Missing").assertIsDisplayed()
        rule.onNodeWithText("Tue, AM: 0").assertDoesNotExist()
        rule.onNodeWithContentDescription("View chart data").performClick()
        rule.onNodeWithText("Mon, AM: Missing").assertIsDisplayed()
        rule.onNodeWithText("Tue, AM: 0").assertIsDisplayed()
        rule.onNodeWithText("Wed, AM: -4").assertIsDisplayed()
        rule.onNodeWithText("Tue, AM: 40").assertDoesNotExist()
    }
}

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

class BulletChartAccessibilityTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()

    @Test fun targetAndMissingActualRemainReadableWhenDataIsExpanded() {
        rule.setContent { LumenTheme {
            LumenBulletChart(value = null, target = 95.0, label = "Delivery", modifier = Modifier.width(320.dp),
                ranges = listOf(LumenBulletRange(100.0, "Excellent")), targetLabel = "Goal",
                labels = LumenChartLabels(notAvailable = "Missing", formatValue = { "${it.toInt()}%" }))
        } }
        rule.onNodeWithText("Missing").assertIsDisplayed()
        rule.onNodeWithText("Goal: 95%").assertIsDisplayed()
        rule.onNodeWithText("Value: Missing").assertDoesNotExist()
        rule.onNodeWithContentDescription("View chart data").performClick()
        rule.onNodeWithText("Value: Missing").assertIsDisplayed()
        rule.onNodeWithText("Excellent: 0%–100%").assertIsDisplayed()
    }
}

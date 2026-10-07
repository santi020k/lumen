package com.santi020k.lumen

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class CarouselInteractionTest {
    @get:Rule val rule = createAndroidComposeRule<ComponentActivity>()
    private val slides = listOf(LumenCarouselSlide("a", "Page A"), LumenCarouselSlide("b", "Page B"), LumenCarouselSlide("c", "Page C"))
    @Test fun controlsSwipeAndDisabledHostState() {
        val index = mutableStateOf(0)
        val disabled = mutableStateOf(false)
        rule.setContent { LumenTheme { LumenCarousel("Slides", slides, index.value, { index.value = it }, disabled = disabled.value) { slide, _ ->
            Box(Modifier.fillMaxSize().testTag("page-${slide.id}")) { LumenText(slide.label) }
        } } }
        rule.onNodeWithTag("page-a").performTouchInput { swipeLeft() }
        rule.waitForIdle()
        rule.runOnIdle { assertEquals(1, index.value) }
        rule.onNodeWithText("Next slide").performClick()
        rule.runOnIdle { assertEquals(2, index.value); disabled.value = true }
        rule.onNodeWithText("Previous slide").performClick()
        rule.runOnIdle { assertEquals(2, index.value); disabled.value = false; index.value = 99 }
        rule.onNodeWithTag("page-c").assertDoesNotExist()
        rule.onNodeWithText("Invalid carousel selection").assertIsDisplayed()
        rule.runOnIdle { index.value = 0 }
        rule.onNodeWithTag("page-a").assertIsDisplayed()
    }
    @Test fun nativeAccessibilityPagingUpdatesControlledSelection() {
        val index = mutableStateOf(0)
        rule.setContent { LumenTheme { LumenCarousel("Slides", slides, index.value, { index.value = it }) { slide, _ ->
            Box(Modifier.fillMaxSize().testTag("page-${slide.id}")) { LumenText(slide.label) }
        } } }
        rule.onNode(SemanticsMatcher.keyIsDefined(SemanticsActions.ScrollToIndex), useUnmergedTree = true)
            .performSemanticsAction(SemanticsActions.ScrollToIndex) { it(1) }
        rule.waitForIdle()
        rule.runOnIdle { assertEquals(1, index.value) }
        rule.onNodeWithTag("page-b").assertIsDisplayed()
    }
    @Test fun rejectedSwipeRestoresHostPage() {
        var requested = -1
        rule.setContent { LumenTheme { LumenCarousel("Slides", slides, 0, { requested = it }) { slide, _ ->
            Box(Modifier.fillMaxSize().testTag("page-${slide.id}")) { LumenText(slide.label) }
        } } }
        rule.onNodeWithTag("page-a").performTouchInput { swipeLeft() }
        rule.waitForIdle()
        rule.runOnIdle { assertEquals(1, requested) }
        rule.onNodeWithTag("page-a").assertIsDisplayed()
    }
}

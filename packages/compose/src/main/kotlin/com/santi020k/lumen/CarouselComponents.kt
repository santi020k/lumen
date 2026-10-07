package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class LumenCarouselStatus { Ready, Loading, Error }
data class LumenCarouselLabels(
    val previous: String = "Previous slide", val next: String = "Next slide", val empty: String = "No slides",
    val invalid: String = "Invalid carousel selection", val loading: String = "Loading slides", val error: String = "Unable to load slides",
    val position: (LumenCarouselSlide, Int, Int) -> String = { slide, index, count -> "${slide.label}, slide ${index + 1} of $count" }
)
@Composable
fun LumenCarousel(
    label: String, slides: List<LumenCarouselSlide>, index: Int, onIndexChange: (Int) -> Unit,
    modifier: Modifier = Modifier, height: Dp = 200.dp, disabled: Boolean = false,
    status: LumenCarouselStatus = LumenCarouselStatus.Ready, labels: LumenCarouselLabels = LumenCarouselLabels(),
    content: @Composable (LumenCarouselSlide, Int) -> Unit
) {
    val state = resolveLumenCarousel(slides, index)
    val announcement = when {
        status == LumenCarouselStatus.Loading -> labels.loading
        status == LumenCarouselStatus.Error -> labels.error
        !height.value.isFinite() || height.value <= 0 || height.value > 4096 -> labels.invalid
        state == LumenCarouselState.Empty -> labels.empty
        state == LumenCarouselState.Invalid -> labels.invalid
        else -> null
    }
    Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        if (announcement != null) LumenText(announcement)
        else CarouselReady(slides, index, onIndexChange, height, disabled, labels, content)
    }
}
@Composable
private fun CarouselReady(
    slides: List<LumenCarouselSlide>, index: Int, onIndexChange: (Int) -> Unit,
    height: Dp, disabled: Boolean, labels: LumenCarouselLabels,
    content: @Composable (LumenCarouselSlide, Int) -> Unit
) {
    val theme = LocalLumenTheme.current
    val state = resolveLumenCarousel(slides, index)
    fun navigate(requested: Int) { if (!disabled) lumenCarouselTarget(state, requested)?.let(onIndexChange) }
    val pager = rememberPagerState(initialPage = index) { slides.size }
    var synchronizing by remember { mutableStateOf(false) }
    var synchronizedIndex by remember { mutableIntStateOf(index) }
    var settledAttempt by remember { mutableIntStateOf(0) }
    LaunchedEffect(index, slides.map { it.id }, settledAttempt) {
        synchronizing = true
        try { pager.scrollToPage(index) }
        finally { synchronizedIndex = index; synchronizing = false }
    }
    LaunchedEffect(pager.settledPage, pager.isScrollInProgress, synchronizing, synchronizedIndex, index) {
        if (!pager.isScrollInProgress && !synchronizing && synchronizedIndex == index && pager.settledPage != index) {
            navigate(pager.settledPage)
            settledAttempt++
        }
    }
    HorizontalPager(pager, Modifier.height(height), key = { slides[it].id }, userScrollEnabled = !disabled) { page ->
        Box(Modifier.semantics { contentDescription = labels.position(slides[page], page, slides.size) }) {
            content(slides[page], page)
        }
    }
    FlowRow(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenButton(onClick = { navigate(index - 1) }, enabled = !disabled && index > 0) { LumenText(labels.previous) }
        LumenButton(onClick = { navigate(index + 1) }, enabled = !disabled && index < slides.size - 1) { LumenText(labels.next) }
    }
    Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
        slides.forEachIndexed { offset, slide ->
            Box(Modifier.sizeIn(minWidth = 44.dp, minHeight = 44.dp)
                .background(if (offset == index) theme.colors.brandSoft else theme.colors.surface, RoundedCornerShape(LumenRadius.Sm))
                .selectable(offset == index, enabled = !disabled, role = Role.RadioButton) { navigate(offset) }
                .semantics { contentDescription = labels.position(slide, offset, slides.size) }, contentAlignment = Alignment.Center) {
                LumenText((offset + 1).toString())
            }
        }
    }
}

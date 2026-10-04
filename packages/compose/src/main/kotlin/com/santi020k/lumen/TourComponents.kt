package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.input.key.*
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.*
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

private object TourPopupPosition : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize): IntOffset = anchorBounds.topLeft
}
@Composable
fun LumenTour(label: String, steps: List<LumenTourStep>, anchors: Map<String, LumenTourRect>, open: Boolean, onOpenChange: (Boolean) -> Unit,
    index: Int, onIndexChange: (Int) -> Unit, onFinish: (LumenTourStep) -> Unit, modifier: Modifier = Modifier,
    enabled: Boolean = true, readOnly: Boolean = false, loading: Boolean = false, error: String? = null,
    closeLabel: String = "Close tour", previousLabel: String = "Previous", nextLabel: String = "Next", finishLabel: String = "Finish",
    emptyLabel: String = "No tour steps", invalidLabel: String = "Invalid tour step", disabledLabel: String = "Tour step unavailable",
    loadingLabel: String = "Loading tour", unavailableLabel: String = "Target unavailable", formatProgress: (Int, Int) -> String = { current, count -> "${current + 1} / $count" },
    content: @Composable () -> Unit
) {
    val density = LocalDensity.current
    var viewport by remember { mutableStateOf(LumenTourRect(0.0, 0.0, 0.0, 0.0)) }
    val step = resolveLumenTourStep(steps, index)
    val status = error ?: when {
        loading -> loadingLabel
        !isLumenTourStepsValid(steps) -> invalidLabel
        steps.isEmpty() -> emptyLabel
        step == null -> invalidLabel
        step.disabled -> disabledLabel
        else -> null
    }
    val locked = !open || !enabled || readOnly || status != null
    val layout = resolveLumenTourLayout(if (status == null) step?.let { anchors[it.targetId] } else null, viewport)
    fun close() { onOpenChange(false) }
    fun navigate(direction: LumenTourDirection) { if (!locked) moveLumenTourStep(steps, index, direction)?.let(onIndexChange) }
    fun advance() {
        if (locked || step == null) return
        val next = moveLumenTourStep(steps, index, LumenTourDirection.Next)
        if (next == null) onFinish(step) else onIndexChange(next)
    }
    Box(modifier.onSizeChanged { size ->
        viewport = with(density) { LumenTourRect(0.0, 0.0, size.width.toDp().value.toDouble(), size.height.toDp().value.toDouble()) }
    }) {
        Box(if (open) Modifier.clearAndSetSemantics {} else Modifier) { content() }
        if (open && viewport.width > 0 && viewport.height > 0) {
            Popup(popupPositionProvider = TourPopupPosition, onDismissRequest = ::close,
                properties = PopupProperties(focusable = true, dismissOnBackPress = true, dismissOnClickOutside = false)) {
                TourOverlay(label, viewport, layout, step, status, locked, index, steps.size, closeLabel, previousLabel, nextLabel, finishLabel, unavailableLabel, formatProgress,
                    moveLumenTourStep(steps, index, LumenTourDirection.Previous) != null, moveLumenTourStep(steps, index, LumenTourDirection.Next) != null,
                    ::close, { navigate(LumenTourDirection.Previous) }, ::advance)
            }
        }
    }
}
@Composable
private fun TourOverlay(label: String, viewport: LumenTourRect, layout: LumenTourLayout?, step: LumenTourStep?, status: String?, locked: Boolean,
    index: Int, count: Int, closeLabel: String, previousLabel: String, nextLabel: String, finishLabel: String, unavailableLabel: String,
    formatProgress: (Int, Int) -> String, previousAvailable: Boolean, nextAvailable: Boolean, close: () -> Unit, previous: () -> Unit, advance: () -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    val focus = remember { FocusRequester() }
    LaunchedEffect(index, status) { focus.requestFocus() }
    val target = layout?.highlight
    val panel = layout?.panel ?: viewport
    val panels = if (target == null) listOf(viewport) else listOf(
        LumenTourRect(0.0, 0.0, viewport.width, target.y), LumenTourRect(0.0, target.y, target.x, target.height),
        LumenTourRect(target.x + target.width, target.y, viewport.width - target.x - target.width, target.height),
        LumenTourRect(0.0, target.y + target.height, viewport.width, viewport.height - target.y - target.height))
    Box(Modifier.size(viewport.width.dp, viewport.height.dp).onPreviewKeyEvent { event ->
        if (event.type == KeyEventType.KeyDown && event.key == Key.Escape) { close(); true } else false
    }) {
        Box(Modifier.matchParentSize().clickable(onClick = close).clearAndSetSemantics {})
        panels.forEach { rect -> Box(Modifier.offset(rect.x.dp, rect.y.dp).size(rect.width.dp, rect.height.dp).background(colors.ink.copy(alpha = 0.45f)).clearAndSetSemantics {}) }
        if (target != null) Box(Modifier.offset(target.x.dp, target.y.dp).size(target.width.dp, target.height.dp).border(3.dp, colors.brand, RoundedCornerShape(LumenRadius.Sm)).testTag("tour-highlight").clearAndSetSemantics {})
        Column(Modifier.offset(panel.x.dp, panel.y.dp).size(panel.width.dp, panel.height.dp).background(colors.surface, RoundedCornerShape(LumenRadius.Md))
            .focusRequester(focus).focusable().semantics { paneTitle = label }.verticalScroll(rememberScrollState()).padding(LumenSpacing.Sm), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
            LumenText(status ?: step?.title ?: label, modifier = Modifier.semantics { heading() })
            if (status == null && step != null) {
                LumenText(formatProgress(index, count)); LumenText(step.content)
                if (target == null) LumenText(unavailableLabel)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                    LumenButton(onClick = previous, enabled = !locked && previousAvailable) { LumenText(previousLabel) }
                    LumenButton(onClick = advance, enabled = !locked) { LumenText(if (nextAvailable) nextLabel else finishLabel) }
                }
            }
            LumenButton(onClick = close, intent = LumenButtonIntent.Quiet) { LumenText(closeLabel) }
        }
    }
}

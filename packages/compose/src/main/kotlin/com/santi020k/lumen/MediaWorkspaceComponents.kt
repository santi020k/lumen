package com.santi020k.lumen

import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.calculatePan
import androidx.compose.foundation.gestures.calculateZoom
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import java.text.NumberFormat
import java.util.Locale

/** Zoom relative to fit, with x/y bounded to fractions of the pan extent. */
data class LumenMediaViewportValue(val zoom: Float = 1f, val x: Float = 0f, val y: Float = 0f) {
    fun normalized(maxZoom: Float = 4f): LumenMediaViewportValue {
        val limit = if (maxZoom.isFinite()) maxZoom.coerceIn(1f, 16f) else 4f
        val scale = if (zoom.isFinite()) zoom.coerceIn(1f, limit) else 1f
        return LumenMediaViewportValue(scale,
            if (scale == 1f || !x.isFinite()) 0f else x.coerceIn(-1f, 1f),
            if (scale == 1f || !y.isFinite()) 0f else y.coerceIn(-1f, 1f))
    }

    fun applying(action: LumenMediaViewportAction, maxZoom: Float = 4f): LumenMediaViewportValue {
        val current = normalized(maxZoom)
        return when (action) {
            LumenMediaViewportAction.ZoomIn -> current.copy(zoom = current.zoom + 0.25f)
            LumenMediaViewportAction.ZoomOut -> current.copy(zoom = current.zoom - 0.25f)
            LumenMediaViewportAction.Fit -> LumenMediaViewportValue()
            LumenMediaViewportAction.Left -> current.copy(x = current.x - 0.25f)
            LumenMediaViewportAction.Right -> current.copy(x = current.x + 0.25f)
            LumenMediaViewportAction.Up -> current.copy(y = current.y - 0.25f)
            LumenMediaViewportAction.Down -> current.copy(y = current.y + 0.25f)
        }.normalized(maxZoom)
    }

    fun panning(dx: Float, dy: Float, width: Float, height: Float, maxZoom: Float = 4f): LumenMediaViewportValue {
        val current = normalized(maxZoom)
        val extent = (current.zoom - 1f) / 2f
        if (extent == 0f || !width.isFinite() || !height.isFinite() || width <= 0f || height <= 0f) return current
        return current.copy(
            x = current.x + if (dx.isFinite()) dx / width / extent else 0f,
            y = current.y + if (dy.isFinite()) dy / height / extent else 0f
        ).normalized(maxZoom)
    }
}

enum class LumenMediaViewportAction { ZoomIn, ZoomOut, Fit, Left, Right, Up, Down }

data class LumenMediaViewportLabels(
    val zoomIn: String = "Zoom in", val zoomOut: String = "Zoom out", val fit: String = "Fit to view",
    val left: String = "Pan left", val right: String = "Pan right", val up: String = "Pan up", val down: String = "Pan down"
) {
    fun label(action: LumenMediaViewportAction): String = when (action) {
        LumenMediaViewportAction.ZoomIn -> zoomIn
        LumenMediaViewportAction.ZoomOut -> zoomOut
        LumenMediaViewportAction.Fit -> fit
        LumenMediaViewportAction.Left -> left
        LumenMediaViewportAction.Right -> right
        LumenMediaViewportAction.Up -> up
        LumenMediaViewportAction.Down -> down
    }
}

@Composable
fun LumenMediaViewport(
    label: String, value: LumenMediaViewportValue, onValueChange: (LumenMediaViewportValue) -> Unit,
    modifier: Modifier = Modifier, maxZoom: Float = 4f, aspectRatio: Float = 16f / 9f, enabled: Boolean = true,
    labels: LumenMediaViewportLabels = LumenMediaViewportLabels(), locale: Locale = Locale.getDefault(),
    content: @Composable () -> Unit
) {
    val current = value.normalized(maxZoom)
    val latestValue by rememberUpdatedState(current)
    val latestCallback by rememberUpdatedState(onValueChange)
    var size by remember { mutableStateOf(IntSize.Zero) }
    val ratio = aspectRatio.takeIf { it.isFinite() && it in 0.1f..10f } ?: 16f / 9f
    val zoomLabel = NumberFormat.getPercentInstance(locale).format(current.zoom.toDouble())
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        Box(Modifier.fillMaxWidth().aspectRatio(ratio).clip(RoundedCornerShape(LumenRadius.Lg))
            .onSizeChanged { size = it }
            .pointerInput(enabled, maxZoom) {
                if (enabled) awaitEachGesture {
                    awaitFirstDown(requireUnconsumed = false)
                    do {
                        val event = awaitPointerEvent()
                        val inspecting = latestValue.zoom > 1f || event.changes.count { it.pressed } > 1
                        if (inspecting && event.changes.none { it.isConsumed }) {
                            val pan = event.calculatePan()
                            val zoomed = latestValue.copy(zoom = latestValue.zoom * event.calculateZoom()).normalized(maxZoom)
                            latestCallback(zoomed.panning(pan.x, pan.y, size.width.toFloat(), size.height.toFloat(), maxZoom))
                            event.changes.forEach { it.consume() }
                        }
                    } while (event.changes.any { it.pressed })
                }
            }) {
            Box(Modifier.fillMaxSize().graphicsLayer {
                scaleX = current.zoom
                scaleY = current.zoom
                translationX = current.x * (current.zoom - 1f) * size.width / 2f
                translationY = current.y * (current.zoom - 1f) * size.height / 2f
            }) { content() }
        }
        Text(label)
        Text(zoomLabel, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
        FlowRow(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
            LumenMediaViewportAction.entries.forEach { action ->
                val next = current.applying(action, maxZoom)
                LumenButton(onClick = { onValueChange(next) }, intent = LumenButtonIntent.Secondary,
                    enabled = enabled && next != current) { Text(labels.label(action)) }
            }
        }
    }
}

enum class LumenMediaThumbnailState { Ready, Loading, Error }

@Composable
fun LumenMediaThumbnail(
    label: String, selected: Boolean, onSelectionChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier, order: Int? = null, enabled: Boolean = true,
    state: LumenMediaThumbnailState = LumenMediaThumbnailState.Ready, stateLabel: String = if (state == LumenMediaThumbnailState.Loading) "Loading" else "Unavailable",
    content: @Composable () -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    LumenButton(onClick = { onSelectionChange(!selected) }, intent = LumenButtonIntent.Secondary,
        enabled = enabled && state == LumenMediaThumbnailState.Ready,
        modifier = modifier.border(if (selected) 2.dp else 1.dp, if (selected) colors.brand else colors.line,
            RoundedCornerShape(LumenRadius.Sm)).semantics { this.selected = selected; contentDescription = label }) {
        Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
            Box(Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(LumenRadius.Sm))) { content() }
            Text(if (selected) "✓ $label" else label)
            if (order != null && order > 0) Text(order.toString())
            if (state != LumenMediaThumbnailState.Ready) Text(stateLabel)
        }
    }
}

@Composable
fun LumenMediaFilmstrip(label: String, selectionLabel: String, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        Text(label)
        Text(selectionLabel, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) { content() }
    }
}

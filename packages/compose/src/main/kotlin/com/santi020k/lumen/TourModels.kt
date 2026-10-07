package com.santi020k.lumen

import kotlin.math.*

data class LumenTourStep(val id: String, val targetId: String, val title: String, val content: String, val disabled: Boolean = false)
data class LumenTourRect(val x: Double, val y: Double, val width: Double, val height: Double)
data class LumenTourLayout(val highlight: LumenTourRect?, val panel: LumenTourRect)
enum class LumenTourDirection { Next, Previous }
fun isLumenTourStepsValid(steps: List<LumenTourStep>): Boolean {
    val ids = mutableSetOf<String>()
    return steps.all { it.id.isNotBlank() && it.targetId.isNotBlank() && ids.add(it.id) }
}
fun resolveLumenTourStep(steps: List<LumenTourStep>, index: Int): LumenTourStep? = if (isLumenTourStepsValid(steps)) steps.getOrNull(index) else null
fun moveLumenTourStep(steps: List<LumenTourStep>, index: Int, direction: LumenTourDirection): Int? {
    val current = resolveLumenTourStep(steps, index) ?: return null
    if (current.disabled) return null
    val delta = if (direction == LumenTourDirection.Next) 1 else -1
    var target = index + delta
    while (target in steps.indices) {
        if (!steps[target].disabled) return target
        target += delta
    }
    return null
}
private fun validTourRect(rect: LumenTourRect): Boolean = listOf(rect.x, rect.y, rect.width, rect.height).all { it.isFinite() } && rect.width > 0 && rect.height > 0
fun resolveLumenTourLayout(anchor: LumenTourRect?, viewport: LumenTourRect): LumenTourLayout? {
    if (!validTourRect(viewport) || viewport.width < 48 || viewport.height < 48) return null
    val width = viewport.width; val height = viewport.height; val margin = 12.0
    val panelWidth = min(320.0, width - margin * 2); val panelHeight = min(240.0, height - margin * 2)
    var highlight: LumenTourRect? = null
    if (anchor != null && validTourRect(anchor)) {
        val x = max(0.0, anchor.x); val y = max(0.0, anchor.y)
        val right = min(width, anchor.x + anchor.width); val bottom = min(height, anchor.y + anchor.height)
        if (right > x && bottom > y) highlight = LumenTourRect(x, y, right - x, bottom - y)
    }
    if (highlight != null) {
        val below = height - margin - highlight.y - highlight.height - 8; val above = highlight.y - margin - 8
        val available = max(below, above)
        if (available >= 88) {
            val h = min(panelHeight, available)
            val y = if (below >= h) highlight.y + highlight.height + 8 else highlight.y - 8 - h
            return LumenTourLayout(highlight, LumenTourRect(min(max(margin, highlight.x), width - margin - panelWidth), y, panelWidth, h))
        }
    }
    return LumenTourLayout(null, LumenTourRect((width - panelWidth) / 2, (height - panelHeight) / 2, panelWidth, panelHeight))
}

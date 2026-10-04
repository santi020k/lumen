package com.santi020k.lumen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun LumenTimeline(
    label: String,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier.semantics { contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md), content = content)
}

@Composable
fun LumenTimelineItem(
    modifier: Modifier = Modifier,
    dot: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val colors = LocalLumenTheme.current.colors
    Box(modifier.drawBehind {
        drawLine(colors.line, Offset(10.dp.toPx(), 12.dp.toPx()),
            Offset(10.dp.toPx(), size.height.coerceAtLeast(28.dp.toPx())), strokeWidth = 1.dp.toPx())
    }) {
        Box(Modifier.padding(start = 6.dp).clearAndSetSemantics {}) {
            if (dot != null) dot() else Box(Modifier.size(8.dp).background(colors.brandSolid, CircleShape))
        }
        Column(Modifier.padding(start = 20.dp + LumenSpacing.Md), content = content)
    }
}

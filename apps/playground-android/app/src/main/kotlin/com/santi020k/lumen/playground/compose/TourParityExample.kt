package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.boundsInParent
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.santi020k.lumen.*

@Composable
fun TourParityExample() {
    var open by remember { mutableStateOf(false) }
    var index by remember { mutableStateOf(0) }
    var anchors by remember { mutableStateOf<Map<String, LumenTourRect>>(emptyMap()) }
    var preview by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("Start the guided tour") }
    var readOnly by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    val density = LocalDensity.current.density
    val steps = listOf(LumenTourStep("preview-step", "preview", "Preview", "This control toggles the local preview."),
        LumenTourStep("save-step", "save", "Save", "This control records a local example action."),
        LumenTourStep("missing-step", "missing", "Optional control", "This target is intentionally absent. Guidance remains dismissible."))
    fun anchor(id: String): Modifier = Modifier.onGloballyPositioned { coordinates ->
        val rect = coordinates.boundsInParent()
        anchors = anchors + (id to LumenTourRect(rect.left.toDouble() / density, rect.top.toDouble() / density, rect.width.toDouble() / density, rect.height.toDouble() / density))
    }
    LumenTour("Example tour", steps, anchors, open, { open = it }, index, { index = it }, onFinish = { step -> message = "Completed ${step.title}"; open = false },
        readOnly = readOnly, loading = loading, error = if (error) "Tour unavailable" else null, formatProgress = { current, count -> "Step ${current + 1} of $count" }) {
        Column(Modifier.fillMaxWidth().heightIn(min = 520.dp), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
            LumenCheckbox("Read only", readOnly, { readOnly = it })
            LumenCheckbox("Loading", loading, { loading = it })
            LumenCheckbox("Error", error, { error = it })
            LumenButton(onClick = { index = 0; open = true }) { LumenText("Start tour") }
            LumenButton(onClick = { preview = !preview }, modifier = anchor("preview")) { LumenText(if (preview) "Preview enabled" else "Preview disabled") }
            LumenButton(onClick = { message = "Local example saved" }, modifier = anchor("save")) { LumenText("Save example") }
            LumenText(message)
        }
    }
}

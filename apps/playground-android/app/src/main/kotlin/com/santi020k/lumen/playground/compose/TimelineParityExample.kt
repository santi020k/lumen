package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.key
import com.santi020k.lumen.*

private data class TimelineExampleEvent(val id: String, val time: String, val title: String, val detail: String)
@Composable
internal fun TimelineParityExample() {
    var spanish by remember { mutableStateOf(false) }
    var custom by remember { mutableStateOf(false) }
    var reverse by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    var disabled by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf("") }
    val source = listOf(
        TimelineExampleEvent("design", "10:00", if (spanish) "Aprobación de diseño" else "Design approval",
            if (spanish) "Revisión de diseño sintética con contenido extenso para pantallas pequeñas.\nSegunda línea: Unicode 😀." else
                "Synthetic design review with long content for narrow screens.\nSecond line: Unicode 😀."),
        TimelineExampleEvent("build", "12:20", if (spanish) "Revisión de compilación" else "Build review",
            if (spanish) "Revisión de compilación sintética. El contenido conserva sus controles." else "Synthetic build review. Host content retains its own controls."),
        TimelineExampleEvent("release", "14:30", if (spanish) "Preparación del lanzamiento" else "Release preparation",
            if (spanish) "Preparación del lanzamiento sintética. El marcador final no tiene conector." else "Synthetic release preparation. The terminal marker has no connector."))
    val events = if (empty) emptyList() else if (reverse) source.reversed() else source
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenButton(onClick = { spanish = !spanish }) { LumenText("English / Español") }
        LumenButton(onClick = { custom = !custom }) { LumenText(if (spanish) "Marcador personalizado" else "Custom marker") }
        LumenButton(onClick = { reverse = !reverse }) { LumenText(if (spanish) "Invertir orden" else "Reverse order") }
        LumenButton(onClick = { empty = !empty }) { LumenText(if (spanish) "Vacío" else "Empty") }
        LumenButton(onClick = { disabled = !disabled }) { LumenText(if (spanish) "Deshabilitar acciones" else "Disable actions") }
        LumenButton(onClick = { empty = false; reverse = false; custom = false; disabled = false; selected = "" }) { LumenText(if (spanish) "Restaurar" else "Restore") }
        LumenTimeline(if (spanish) "Cronología de ejemplo" else "Example timeline") {
            events.forEach { event -> key(event.id) {
                LumenTimelineItem(isLast = event.id == events.last().id, dot = if (custom) ({ LumenText("✓", variant = LumenTextVariant.Caption) }) else null) {
                    LumenText("${event.time} ${event.title}", variant = LumenTextVariant.Title)
                    LumenText(event.detail)
                    LumenButton(onClick = { selected = event.id }, enabled = !disabled) { LumenText("${if (spanish) "Ver detalles" else "View details"} ${event.time}") }
                }
            } }
            if (empty) LumenText(if (spanish) "Sin eventos" else "No events")
        }
        LumenText("${if (spanish) "Acción elegida" else "Selected action"}: $selected")
    }
}

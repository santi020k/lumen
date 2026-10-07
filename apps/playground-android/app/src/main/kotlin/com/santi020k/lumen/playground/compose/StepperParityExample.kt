package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.*
import com.santi020k.lumen.*

@Composable
internal fun StepperParityExample() {
    var current by remember { mutableIntStateOf(0) }
    var horizontal by remember { mutableStateOf(false) }
    var invalid by remember { mutableStateOf(false) }
    var spanish by remember { mutableStateOf(false) }
    val titles = if (spanish) listOf("Elegir una experiencia accesible con un título largo", "Revisar los detalles", "Confirmar") else listOf("Choose an accessible experience with a longer title", "Review the details", "Confirm")
    val steps = titles.mapIndexed { index, title -> LumenStepItem(if (invalid) "duplicate" else "step-$index", title, if (spanish) "La aplicación controla el progreso." else "The host owns navigation and saves progress.") }
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenButton(onClick = { spanish = !spanish }, intent = LumenButtonIntent.Secondary) { LumenText("English / Español") }
        LumenCheckbox(if (spanish) "Vista horizontal" else "Horizontal layout", horizontal, { horizontal = it })
        LumenCheckbox(if (spanish) "IDs duplicados" else "Duplicate IDs", invalid, { invalid = it })
        LumenStepper(if (spanish) "Progreso del ejemplo" else "Example progress", steps, current, horizontal = horizontal, invalidText = if (spanish) "Pasos no disponibles" else "Steps unavailable", formatState = {
            when (it) {
                LumenStepState.Complete -> if (spanish) "Completado" else "Complete"
                LumenStepState.Current -> if (spanish) "Actual" else "Current"
                LumenStepState.Upcoming -> if (spanish) "Pendiente" else "Upcoming"
            }
        })
        LumenText(if (spanish) "Índice del host: $current" else "Host index: $current")
        LumenButton(onClick = { current = (current - 1).coerceIn(0, 3) }, intent = LumenButtonIntent.Secondary) { LumenText(if (spanish) "Atrás" else "Back") }
        LumenButton(onClick = { current = (current + 1).coerceIn(0, 3) }) { LumenText(if (spanish) "Siguiente" else "Next") }
        LumenButton(onClick = { current = 0 }, intent = LumenButtonIntent.Secondary) { LumenText(if (spanish) "Reiniciar" else "Reset progress") }
        LumenButton(onClick = { current = 99 }, intent = LumenButtonIntent.Secondary) { LumenText(if (spanish) "Después del final" else "Past the end") }
        LumenButton(onClick = { current = -3 }, intent = LumenButtonIntent.Secondary) { LumenText(if (spanish) "Índice negativo" else "Negative index") }
    }
}

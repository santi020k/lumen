package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import com.santi020k.lumen.*

@Composable
fun RatingParityExample() {
    var value by remember { mutableStateOf(0) }
    var maximum by remember { mutableStateOf(5) }
    var readOnly by remember { mutableStateOf(false) }
    var disabled by remember { mutableStateOf(false) }
    var invalid by remember { mutableStateOf(false) }
    var spanish by remember { mutableStateOf(false) }
    val model = LumenRatingModel(if (invalid) 0 else maximum)
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenButton(onClick = { spanish = !spanish }, intent = LumenButtonIntent.Secondary) { LumenText("English / Español") }
        LumenCheckbox(if (spanish) "Solo lectura" else "Read only", readOnly, { readOnly = it })
        LumenCheckbox(if (spanish) "Deshabilitado" else "Disabled", disabled, { disabled = it })
        LumenCheckbox(if (spanish) "Valores inválidos" else "Invalid values", invalid, { invalid = it })
        LumenButton(onClick = { invalid = false; maximum = if (maximum == 5) 10 else if (maximum == 10) 1 else 5 }, intent = LumenButtonIntent.Secondary) {
            LumenText(if (spanish) "Máximo: $maximum" else "Maximum: $maximum")
        }
        LumenRating(if (spanish) "Calificación del ejemplo" else "Example rating", if (invalid) -3 else value, { invalid = false; value = it },
            maximum = if (invalid) 0 else maximum, enabled = !disabled, readOnly = readOnly,
            formatOption = { rating, total -> if (spanish) "Calificar $rating de $total" else "Rate $rating of $total" })
        LumenText(if (spanish) "Calificación: ${model.resolved(if (invalid) -3 else value)} de ${model.resolvedMaximum}" else "Rating: ${model.resolved(if (invalid) -3 else value)} of ${model.resolvedMaximum}")
        LumenButton(onClick = { invalid = false; value = 0 }, intent = LumenButtonIntent.Secondary) { LumenText(if (spanish) "Sin calificar" else "Clear rating") }
        LumenButton(onClick = { invalid = false; value = maximum }, intent = LumenButtonIntent.Secondary) { LumenText(if (spanish) "Calificación máxima" else "Set maximum rating") }
    }
}

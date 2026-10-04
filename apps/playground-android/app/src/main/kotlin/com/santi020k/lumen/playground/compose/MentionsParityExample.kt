package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.*

@Composable
internal fun MentionsParityExample() {
    var value by remember { mutableStateOf(LumenMentionsValue("Hello 😀 @al!", LumenMentionsSelection(12, 12))) }
    var spanish by remember { mutableStateOf(false) }
    var disabled by remember { mutableStateOf(false) }
    var readOnly by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf(LumenMentionsStatus.Ready) }
    val options = listOf(LumenMentionOption("alice", "Alice — Design", "alice"), LumenMentionOption("alex", "Alex — Engineering", "alex"),
        LumenMentionOption("archived", "Albert — Archived", "albert", true))
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenButton(onClick = { spanish = !spanish }) { LumenText("English / Español") }
        LumenButton(onClick = { disabled = !disabled }) { LumenText("${if (spanish) "Deshabilitado" else "Disabled"}: $disabled") }
        LumenButton(onClick = { readOnly = !readOnly }) { LumenText("${if (spanish) "Solo lectura" else "Read-only"}: $readOnly") }
        LumenButton(onClick = { status = if (status == LumenMentionsStatus.Loading) LumenMentionsStatus.Ready else LumenMentionsStatus.Loading }) { LumenText("Loading") }
        LumenButton(onClick = { status = if (status == LumenMentionsStatus.Error) LumenMentionsStatus.Ready else LumenMentionsStatus.Error }) { LumenText("Error") }
        LumenButton(onClick = { value = value.copy(selection = LumenMentionsSelection(-1, -1)) }) { LumenText(if (spanish) "Selección inválida" else "Invalid selection") }
        LumenButton(onClick = {
            value = LumenMentionsValue("Hello 😀 @al!", LumenMentionsSelection(12, 12))
            disabled = false; readOnly = false; status = LumenMentionsStatus.Ready
        }) { LumenText(if (spanish) "Restaurar" else "Restore") }
        LumenMentions(if (spanish) "Menciones de ejemplo" else "Example mentions", value, { value = it }, options,
            disabled = disabled, readOnly = readOnly, status = status,
            labels = if (spanish) LumenMentionsLabels("Sugerencias", "Sin coincidencias", "Cargando sugerencias",
                "No se pudieron cargar las sugerencias", "Selección inválida", "Solo lectura") else LumenMentionsLabels())
        LumenText(value.text)
    }
}

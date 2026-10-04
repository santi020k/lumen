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
internal fun TableParityExample() {
    var spanish by remember { mutableStateOf(false) }
    var scroll by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    var invalid by remember { mutableStateOf(false) }
    val columns = listOf(
        LumenTableColumn("description", if (spanish) "Descripción y notas en varias líneas" else "Description and multiline notes"),
        LumenTableColumn("owner", if (spanish) "Responsable / región" else "Owner / region"),
        LumenTableColumn("status", if (spanish) "Estado" else "Status"))
    val rows = listOf(
        LumenTableRow("design", if (spanish) "Registro de diseño" else "Design record", mapOf(
            "description" to LumenTableCell(if (spanish) "Revisión del sistema de diseño para pantallas pequeñas.\nSegunda línea: ejemplo sintético 😀." else
                "Design system review for narrow screens.\nSecond line: synthetic example 😀."),
            "owner" to LumenTableCell("Alex — Bogotá / Design"), "status" to LumenTableCell(if (spanish) "En revisión" else "In review"))),
        LumenTableRow("engineering", if (spanish) "Registro de ingeniería" else "Engineering record", mapOf(
            "description" to LumenTableCell(if (spanish) "Verificación de etiquetas extensas y contenido sin truncar." else
                "Verification of long labels and content without truncation."), "status" to LumenTableCell(if (spanish) "Pendiente" else "Pending"))))
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenButton(onClick = { spanish = !spanish }) { LumenText("English / Español") }
        LumenButton(onClick = { scroll = !scroll }) { LumenText(if (spanish) (if (scroll) "Desplazamiento" else "Registros") else (if (scroll) "Scroll" else "Records")) }
        LumenButton(onClick = { empty = !empty }) { LumenText(if (spanish) "Vacío" else "Empty") }
        LumenButton(onClick = { invalid = !invalid }) { LumenText(if (spanish) "Datos inválidos" else "Invalid data") }
        LumenButton(onClick = { empty = false; invalid = false; scroll = false }) { LumenText(if (spanish) "Restaurar" else "Restore") }
        LumenTable(if (spanish) "Registros de ejemplo" else "Example records", columns,
            if (invalid) rows + rows.first() else if (empty) emptyList() else rows,
            layout = if (scroll) LumenTableLayout.Scroll else LumenTableLayout.Records,
            emptyLabel = if (spanish) "Sin registros" else "No records",
            invalidLabel = if (spanish) "Identidades de registros inválidas" else "Invalid record identities",
            missingLabel = if (spanish) "Faltante" else "Missing")
    }
}

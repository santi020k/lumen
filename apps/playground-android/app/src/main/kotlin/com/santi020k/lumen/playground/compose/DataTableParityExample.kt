package com.santi020k.lumen.playground.compose

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.*

@Composable
fun DataTableParityExample() {
    var sort by remember { mutableStateOf<LumenTableSort?>(null) }
    var selected by remember { mutableStateOf(setOf("archived", "filtered-out")) }
    var client by remember { mutableStateOf(true) }
    var scroll by remember { mutableStateOf(false) }
    var hideReact by remember { mutableStateOf(false) }
    var readOnly by remember { mutableStateOf(false) }
    var disabled by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    var spanish by remember { mutableStateOf(false) }
    fun copy(english: String, translated: String) = if (spanish) translated else english
    fun formatSort(value: LumenTableSort?): String = when (value?.direction) {
        LumenTableSortDirection.Ascending -> copy("Ascending", "Ascendente")
        LumenTableSortDirection.Descending -> copy("Descending", "Descendente")
        null -> copy("Unsorted", "Sin orden")
    }
    val columns = listOf(LumenTableColumn("package", copy("Package", "Paquete"), true),
        LumenTableColumn("target", copy("Target", "Plataforma")), LumenTableColumn("downloads", copy("Downloads", "Descargas"), true),
        LumenTableColumn("status", copy("Status", "Estado")))
    val allRows = listOf(
        LumenTableRow("astro", "Astro", mapOf("package" to LumenTableCell("@santi020k/lumen-astro"), "target" to LumenTableCell("Astro"),
            "downloads" to LumenTableCell(copy("24,800", "24.800"), LumenTableSortValue.Number(24800.0)), "status" to LumenTableCell(copy("Ready", "Listo")))),
        LumenTableRow("react", "React", mapOf("package" to LumenTableCell("@santi020k/lumen-react"), "target" to LumenTableCell("React"),
            "downloads" to LumenTableCell(copy("8,450", "8.450"), LumenTableSortValue.Number(8450.0)), "status" to LumenTableCell(copy("In review", "En revisión")))),
        LumenTableRow("elements", "Elements", mapOf("package" to LumenTableCell("@santi020k/lumen-elements"),
            "target" to LumenTableCell(copy("Custom elements for responsive product interfaces", "Elementos personalizados para interfaces adaptables")),
            "downloads" to LumenTableCell(copy("5,120", "5.120"), LumenTableSortValue.Number(5120.0)), "status" to LumenTableCell(copy("Ready", "Listo")))),
        LumenTableRow("archived", copy("Locked archive", "Archivo bloqueado"), mapOf("package" to LumenTableCell(copy("Synthetic archived package", "Paquete sintético archivado")),
            "target" to LumenTableCell(copy("Archive", "Archivo")), "downloads" to LumenTableCell("—", LumenTableSortValue.Missing)), enabled = false)
    )
    val rows = if (empty) emptyList() else allRows.filter { !hideReact || it.id != "react" }
    LumenCheckbox(copy("Sort locally", "Ordenar aquí"), checked = client, onCheckedChange = { client = it })
    LumenCheckbox(copy("Horizontal table", "Tabla horizontal"), checked = scroll, onCheckedChange = { scroll = it })
    LumenCheckbox(copy("Hide React", "Ocultar React"), checked = hideReact, onCheckedChange = { hideReact = it })
    LumenCheckbox(copy("Read only", "Solo lectura"), checked = readOnly, onCheckedChange = { readOnly = it })
    LumenCheckbox(copy("Disable table", "Deshabilitar tabla"), checked = disabled, onCheckedChange = { disabled = it })
    LumenCheckbox(copy("Loading", "Cargando"), checked = loading, onCheckedChange = { loading = it })
    LumenCheckbox("Error", checked = error, onCheckedChange = { error = it })
    LumenCheckbox(copy("Empty records", "Sin registros"), checked = empty, onCheckedChange = { empty = it })
    LumenCheckbox("Español", checked = spanish, onCheckedChange = { spanish = it })
    LumenText("${copy("Selected IDs", "IDs seleccionados")}: ${selected.sorted().joinToString(", ")}")
    LumenText("${if (client) "Client" else "Manual"}: ${formatSort(sort)}")
    LumenDataTable(copy("Synthetic packages", "Paquetes sintéticos"), columns, rows,
        layout = if (scroll) LumenTableLayout.Scroll else LumenTableLayout.Records, sort = sort,
        sortMode = if (client) LumenTableSortMode.Client else LumenTableSortMode.Manual, onSortChange = { sort = it },
        selectedIds = selected, onSelectionChange = { selected = it }, enabled = !disabled, readOnly = readOnly, loading = loading,
        loadingLabel = copy("Loading packages", "Cargando paquetes"), error = if (error) copy("Packages unavailable", "Paquetes no disponibles") else null,
        onRetry = { error = false }, retryLabel = copy("Retry packages", "Reintentar paquetes"), emptyLabel = copy("No packages", "No hay paquetes"),
        missingLabel = copy("Unavailable", "Sin datos"), selectAllLabel = copy("Select visible packages", "Seleccionar visibles"),
        deselectAllLabel = copy("Deselect visible packages", "Deseleccionar visibles"), formatSort = ::formatSort)
}

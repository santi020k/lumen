package com.santi020k.lumen.playground.compose

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.santi020k.lumen.LumenAdaptiveListDetailScaffold
import com.santi020k.lumen.LumenBarChart
import com.santi020k.lumen.LumenChartDatum
import com.santi020k.lumen.LumenChartLabels
import com.santi020k.lumen.LumenChartSeries
import com.santi020k.lumen.LumenChartX
import com.santi020k.lumen.LumenSpinner
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenButtonIntent
import com.santi020k.lumen.LumenFieldGroup
import com.santi020k.lumen.LumenSearchField
import com.santi020k.lumen.LumenSheet
import com.santi020k.lumen.LumenSpacing
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTextarea
import com.santi020k.lumen.LumenTextField

private val workspaceTextListSaver = listSaver<List<String>, String>(
    save = { it },
    restore = { it.toList() }
)

/** App-owned bounded navigation and saved form state survive resizing and Activity recreation. */
@Composable
internal fun WorkspaceExample(onBack: () -> Unit) {
    var names by rememberSaveable(stateSaver = workspaceTextListSaver) { mutableStateOf(List(200) { "Lumen ${(it + 1).toString().padStart(3, '0')}" }) }
    var notes by rememberSaveable(stateSaver = workspaceTextListSaver) { mutableStateOf(List(200) { "" }) }
    var query by rememberSaveable { mutableStateOf("") }
    var selected by rememberSaveable { mutableStateOf<Int?>(null) }
    var editing by rememberSaveable { mutableStateOf(false) }
    var draftName by rememberSaveable { mutableStateOf("") }
    var draftNote by rememberSaveable { mutableStateOf("") }
    var saved by rememberSaveable { mutableStateOf(false) }
    var spanish by rememberSaveable { mutableStateOf(false) }
    var state by rememberSaveable { mutableStateOf("success") }
    val text: (String, String) -> String = { english, translation -> if (spanish) translation else english }

    Box(Modifier.fillMaxSize().statusBarsPadding()) {
        LumenAdaptiveListDetailScaffold(
            selectedKey = selected?.toString(),
            onBack = { selected = null },
            listLabel = text("Records", "Registros"),
            detailLabel = text("Record details", "Detalles del registro"),
            backLabel = text("Back", "Volver"),
            modifier = Modifier.fillMaxSize(),
            listPane = {
                LazyColumn(Modifier.fillMaxSize().padding(LumenSpacing.Md), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
                            LumenButton(onClick = onBack, intent = LumenButtonIntent.Quiet) { Text(text("Back to examples", "Volver a ejemplos")) }
                            LumenButton(onClick = { spanish = !spanish }, intent = LumenButtonIntent.Secondary) { Text(if (spanish) "English" else "Español") }
                            LumenSearchField(value = query, onValueChange = { query = it }, prompt = text("Search records", "Buscar registros"), clearLabel = text("Clear search", "Borrar búsqueda"))
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                                LumenButton(onClick = { state = "success" }, intent = LumenButtonIntent.Quiet) { Text(text("Ready", "Listo")) }
                                LumenButton(onClick = { state = "loading" }, intent = LumenButtonIntent.Quiet) { Text(text("Loading", "Cargando")) }
                                LumenButton(onClick = { state = "empty" }, intent = LumenButtonIntent.Quiet) { Text(text("Empty", "Vacío")) }
                                LumenButton(onClick = { state = "error" }, intent = LumenButtonIntent.Quiet) { Text("Error") }
                            }
                        }
                    }
                    val visible = if (state == "success") names.indices.filter { names[it].contains(query.trim(), ignoreCase = true) } else emptyList()
                    items(visible, key = { it }) { index ->
                        LumenButton(onClick = { selected = index; saved = false }, intent = LumenButtonIntent.Quiet) { Text(names[index]) }
                    }
                    if (visible.isEmpty()) item { WorkspacePlaceholder(state, spanish) { state = "success" } }
                }
            },
            emptyDetail = { LumenText(text("Choose a record", "Elige un registro")) }
        ) { key, detailOnly ->
            val index = key.toInt()
            BackHandler(enabled = detailOnly && !editing) { selected = null }
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(LumenSpacing.Md), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Lg)) {
                LumenText(names[index])
                if (saved) LumenText(text("Changes saved locally", "Cambios guardados localmente"))
                LumenButton(onClick = { draftName = names[index]; draftNote = notes[index]; saved = false; editing = true }) { Text(text("Edit record", "Editar registro")) }
                LumenText(notes[index])
                if (state == "success") {
                    val chartData = listOf(3, 7, 4, 8, 5).mapIndexed { day, count ->
                        LumenChartDatum(day.toString(), LumenChartX.Category((day + 1).toString()), count.toDouble())
                    }
                    val chartLabels = if (spanish) LumenChartLabels(
                        chartData = "Datos del gráfico", empty = "No hay datos disponibles.",
                        notAvailable = "No disponible", size = "Tamaño",
                        formatSummary = { "Actividad semanal, cinco valores." }
                    ) else LumenChartLabels()
                    LumenBarChart(
                        label = text("Weekly activity", "Actividad semanal"),
                        series = listOf(LumenChartSeries("activity", text("Changes", "Cambios"), chartData)),
                        labels = chartLabels
                    )
                } else WorkspacePlaceholder(state, spanish) { state = "success" }
            }
        }
        LumenSheet(visible = editing, onDismiss = { editing = false }, dismissible = false, title = text("Edit record", "Editar registro"), actions = {
            LumenButton(onClick = { editing = false }, intent = LumenButtonIntent.Quiet) { Text(text("Cancel", "Cancelar")) }
            LumenButton(enabled = draftName.trim().isNotEmpty(), onClick = {
                selected?.let { index ->
                    names = names.mapIndexed { record, name -> if (record == index) draftName.trim() else name }
                    notes = notes.mapIndexed { record, note -> if (record == index) draftNote else note }
                    saved = true
                    editing = false
                }
            }) { Text(text("Save", "Guardar")) }
        }) {
            LumenFieldGroup(label = text("Name", "Nombre"), required = true, requiredLabel = text("required", "obligatorio")) {
                LumenTextField(value = draftName, onValueChange = { draftName = it }, label = text("Name", "Nombre"), error = draftName.trim().isEmpty())
            }
            LumenTextarea(value = draftNote, onValueChange = { draftNote = it }, label = text("Notes", "Notas"))
        }
    }
}

@Composable
private fun WorkspacePlaceholder(state: String, spanish: Boolean, onRetry: () -> Unit) {
    when (state) {
        "loading" -> LumenSpinner(label = if (spanish) "Cargando" else "Loading")
        "error" -> Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
            LumenText(if (spanish) "No se pudieron cargar los registros" else "Records could not load")
            LumenButton(onClick = onRetry) { Text(if (spanish) "Reintentar" else "Retry") }
        }
        else -> LumenText(if (spanish) "No se encontraron registros" else "No records found")
    }
}

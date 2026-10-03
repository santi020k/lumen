package com.santi020k.lumen.playground.compose

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenButtonIntent
import com.santi020k.lumen.LumenFieldGroup
import com.santi020k.lumen.LumenSearchField
import com.santi020k.lumen.LumenSheet
import com.santi020k.lumen.LumenSpacing
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTextarea
import com.santi020k.lumen.LumenTextField

/** App-owned bounded navigation and saved form state survive resizing and Activity recreation. */
@Composable
internal fun WorkspaceExample(onBack: () -> Unit) {
    var names by rememberSaveable { mutableStateOf(ArrayList((1..200).map { "Lumen ${it.toString().padStart(3, '0')}" })) }
    var notes by rememberSaveable { mutableStateOf(ArrayList(List(200) { "" })) }
    var query by rememberSaveable { mutableStateOf("") }
    var selected by rememberSaveable { mutableStateOf<Int?>(null) }
    var editing by rememberSaveable { mutableStateOf(false) }
    var draftName by rememberSaveable { mutableStateOf("") }
    var draftNote by rememberSaveable { mutableStateOf("") }
    var saved by rememberSaveable { mutableStateOf(false) }
    var spanish by rememberSaveable { mutableStateOf(false) }
    val text: (String, String) -> String = { english, translation -> if (spanish) translation else english }

    BoxWithConstraints(Modifier.fillMaxSize()) {
        val wide = maxWidth >= 840.dp && LocalDensity.current.fontScale < 2f
        BackHandler(enabled = selected != null && !wide && !editing) { selected = null }
        Row(Modifier.fillMaxSize()) {
            if (wide || selected == null) {
                LazyColumn(Modifier.weight(1f).padding(LumenSpacing.Md), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
                            LumenButton(onClick = onBack, intent = LumenButtonIntent.Quiet) { Text(text("Back to examples", "Volver a ejemplos")) }
                            LumenButton(onClick = { spanish = !spanish }, intent = LumenButtonIntent.Secondary) { Text(if (spanish) "English" else "Español") }
                            LumenSearchField(value = query, onValueChange = { query = it }, prompt = text("Search records", "Buscar registros"), clearLabel = text("Clear search", "Borrar búsqueda"))
                        }
                    }
                    val visible = names.indices.filter { names[it].contains(query.trim(), ignoreCase = true) }
                    items(visible, key = { it }) { index ->
                        LumenButton(onClick = { selected = index; saved = false }, intent = LumenButtonIntent.Quiet) { Text(names[index]) }
                    }
                    if (visible.isEmpty()) item { LumenText(text("No records found", "No se encontraron registros")) }
                }
            }
            selected?.let { index ->
                Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(LumenSpacing.Md), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Lg)) {
                    if (!wide) LumenButton(onClick = { selected = null }, intent = LumenButtonIntent.Quiet) { Text(text("Back", "Volver")) }
                    LumenText(names[index])
                    LumenText(notes[index])
                    LumenButton(onClick = { draftName = names[index]; draftNote = notes[index]; saved = false; editing = true }) { Text(text("Edit record", "Editar registro")) }
                    if (saved) LumenText(text("Changes saved locally", "Cambios guardados localmente"))
                }
            }
        }
        LumenSheet(visible = editing, onDismiss = { editing = false }, dismissible = false, title = text("Edit record", "Editar registro"), actions = {
            LumenButton(onClick = { editing = false }, intent = LumenButtonIntent.Quiet) { Text(text("Cancel", "Cancelar")) }
            LumenButton(enabled = draftName.trim().isNotEmpty(), onClick = {
                selected?.let { index ->
                    names = ArrayList(names).apply { set(index, draftName.trim()) }
                    notes = ArrayList(notes).apply { set(index, draftNote) }
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

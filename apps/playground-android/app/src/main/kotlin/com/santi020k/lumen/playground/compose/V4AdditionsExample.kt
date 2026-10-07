// cspell:words Archivar Añadido Cambiar Capacidad Detalles Equipos Favorito Informe Ingeniería Máximo Mínimo Quitar cambiar deshabilitado equipos favoritos guardado seleccionados ventana
package com.santi020k.lumen.playground.compose

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import com.santi020k.lumen.LumenAdaptiveListDetailScaffold
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenButtonIntent
import com.santi020k.lumen.LumenEmptyState
import com.santi020k.lumen.LumenIconButton
import com.santi020k.lumen.LumenIconName
import com.santi020k.lumen.LumenMultiSelect
import com.santi020k.lumen.LumenRangeSlider
import com.santi020k.lumen.LumenSelectionOption
import com.santi020k.lumen.LumenSpacing
import com.santi020k.lumen.LumenSwipeAction
import com.santi020k.lumen.LumenSwipeActions
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTopAppBar
import com.santi020k.lumen.LumenTopAppBarScrollMode
import com.santi020k.lumen.rememberLumenTopAppBarScrollBehavior

internal val v4AdditionNames = setOf("Top app bar", "Swipe actions", "Multi select", "Range slider", "Adaptive list detail scaffold")

@Composable
internal fun V4AdditionsExample(component: String) {
    var spanish by rememberSaveable { mutableStateOf(false) }
    var disabled by rememberSaveable { mutableStateOf(false) }
    var readOnly by rememberSaveable { mutableStateOf(false) }
    fun text(en: String, es: String) = if (spanish) es else en
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LumenButton(onClick = { spanish = !spanish }, intent = LumenButtonIntent.Secondary) { LumenText(if (spanish) "English" else "Español") }
        if (component != "Adaptive list detail scaffold") LumenButton(onClick = { disabled = !disabled }, intent = LumenButtonIntent.Quiet) { LumenText(text("Toggle disabled", "Cambiar deshabilitado")) }
        if (component in setOf("Multi select", "Range slider", "Swipe actions")) LumenButton(onClick = { readOnly = !readOnly }, intent = LumenButtonIntent.Quiet) { LumenText(text("Toggle read-only", "Cambiar solo lectura")) }
        when (component) {
            "Top app bar" -> {
                val behavior = rememberLumenTopAppBarScrollBehavior(LumenTopAppBarScrollMode.EnterAlways)
                var saved by rememberSaveable { mutableStateOf(false) }
                Scaffold(Modifier.height(320.dp).nestedScroll(behavior.nestedScrollConnection), topBar = {
                    LumenTopAppBar(text("Projects", "Proyectos"), scrollBehavior = behavior,
                        actions = { LumenIconButton(LumenIconName.Bookmark, text("Save project", "Guardar proyecto"), onClick = { saved = true }, enabled = !disabled) })
                }) { padding ->
                    LazyColumn(Modifier.padding(padding)) {
                        if (saved) item { LumenText(text("Project saved", "Proyecto guardado")) }
                        items((1..20).toList()) { LumenText("${text("Project", "Proyecto")} $it", modifier = Modifier.padding(LumenSpacing.Lg)) }
                    }
                }
            }
            "Swipe actions" -> {
                var status by rememberSaveable { mutableStateOf("") }
                LumenSwipeActions(enabled = !disabled && !readOnly,
                    startAction = LumenSwipeAction(text("Favorite", "Favorito"), { status = text("Added to favorites", "Añadido a favoritos") }),
                    endAction = LumenSwipeAction(text("Archive", "Archivar"), { status = text("Archived locally", "Archivado localmente") })) {
                    LumenText(text("Quarterly report", "Informe trimestral"), modifier = Modifier.padding(LumenSpacing.Lg))
                }
                LumenText(status)
            }
            "Multi select" -> {
                var query by rememberSaveable { mutableStateOf("") }
                var values by rememberSaveable { mutableStateOf(listOf("design")) }
                var loading by rememberSaveable { mutableStateOf(false) }
                var failed by rememberSaveable { mutableStateOf(false) }
                val options = listOf(LumenSelectionOption("design", text("Design", "Diseño")), LumenSelectionOption("engineering", text("Engineering", "Ingeniería")), LumenSelectionOption("locked", text("Unavailable", "No disponible"), enabled = false))
                LumenButton(onClick = { loading = !loading }, intent = LumenButtonIntent.Quiet) { LumenText(text("Toggle loading", "Cambiar carga")) }
                LumenButton(onClick = { failed = !failed }, intent = LumenButtonIntent.Quiet) { LumenText(text("Toggle results error", "Cambiar error de resultados")) }
                LumenMultiSelect(text("Teams", "Equipos"), options.filter { it.label.contains(query, ignoreCase = true) }, values.toSet(), { values = it.toList() }, query, { query = it },
                    enabled = !disabled, readOnly = readOnly, loading = loading,
                    resultsErrorMessage = if (failed) text("Unable to load teams", "No se pudieron cargar los equipos") else null,
                    onRetry = { failed = false }, retryLabel = text("Retry", "Reintentar"),
                    chooseLabel = text("Choose teams", "Elegir equipos"), searchLabel = text("Search teams", "Buscar equipos"),
                    clearSearchLabel = text("Clear search", "Borrar búsqueda"), doneLabel = text("Done", "Listo"),
                    emptyLabel = text("No matching teams", "No hay equipos coincidentes"), loadingLabel = text("Loading teams", "Cargando equipos"),
                    selectionLabel = { text("$it selected", "$it seleccionados") }, removeLabel = { text("Remove $it", "Quitar $it") })
            }
            "Range slider" -> {
                var lower by rememberSaveable { mutableFloatStateOf(20f) }
                var upper by rememberSaveable { mutableFloatStateOf(80f) }
                LumenRangeSlider(text("Capacity", "Capacidad"), lower..upper, { lower = it.start; upper = it.endInclusive },
                    valueRange = 0f..100f, steps = 9, enabled = !disabled, readOnly = readOnly,
                    startLabel = text("Minimum", "Mínimo"), endLabel = text("Maximum", "Máximo"), formatValue = { "${it.toInt()}%" })
            }
            "Adaptive list detail scaffold" -> AdaptiveListDetailExample(modifier = Modifier.fillMaxWidth().height(420.dp), spanish = spanish)
        }
    }
}

/** Also used as a full-window example from the Examples destination. */
@Composable
internal fun AdaptiveListDetailExample(modifier: Modifier = Modifier, spanish: Boolean = false) {
    var selected by rememberSaveable { mutableStateOf<String?>(null) }
    val names = listOf("Studio", "Lumen", "Workspace")
    LumenAdaptiveListDetailScaffold(selected, { selected = null },
        listLabel = if (spanish) "Proyectos" else "Projects", detailLabel = if (spanish) "Detalles del proyecto" else "Project details",
        modifier = modifier.fillMaxSize(), backLabel = if (spanish) "Volver" else "Back",
        listPane = { LazyColumn(Modifier.fillMaxSize()) {
            items(names) { name -> LumenButton(onClick = { selected = name }, intent = LumenButtonIntent.Quiet) { LumenText(name) } }
        } },
        emptyDetail = { LumenEmptyState(if (spanish) "Elige un proyecto" else "Choose a project") },
        detailPane = { key, detailOnly ->
            BackHandler(enabled = detailOnly) { selected = null }
            Column(Modifier.padding(LumenSpacing.Lg)) {
                LumenText(key)
                LumenText(if (spanish) "La selección se conserva al cambiar el tamaño de la ventana." else "Selection survives window resizing.")
            }
        })
}

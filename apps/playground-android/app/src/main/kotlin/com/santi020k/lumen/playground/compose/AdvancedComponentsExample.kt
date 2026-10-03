package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.santi020k.lumen.LumenAutocomplete
import com.santi020k.lumen.LumenAutocompleteOption
import com.santi020k.lumen.LumenNumberField
import com.santi020k.lumen.LumenPullToRefresh
import com.santi020k.lumen.LumenSegmentedControl
import com.santi020k.lumen.LumenSelectionOption
import com.santi020k.lumen.LumenSpacing
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTextVariant
import com.santi020k.lumen.LumenTimeField
import com.santi020k.lumen.LumenTimeSelection
import java.math.BigDecimal
import java.util.Locale
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

internal val advancedFormNames = setOf("Time field", "Autocomplete", "Number field")

/** Synthetic examples keep requests and localization in the application. */
@Composable
internal fun AdvancedFormsExample(component: String = "") {
    var language by remember { mutableStateOf("en") }
    val spanish = language == "es"
    var time by remember { mutableStateOf<LumenTimeSelection?>(LumenTimeSelection(13, 45)) }
    var number by remember(language) { mutableStateOf(if (spanish) "2,5" else "2.5") }
    var query by remember { mutableStateOf("") }
    var selected by remember { mutableStateOf<String?>(null) }
    var resultState by remember { mutableStateOf("ready") }
    val projects = listOf(
        LumenAutocompleteOption("design", if (spanish) "Sistema de diseño" else "Design system"),
        LumenAutocompleteOption("android", if (spanish) "Aplicación Android" else "Android application"),
        LumenAutocompleteOption("archive", if (spanish) "Proyecto archivado" else "Archived project", enabled = false)
    )
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LumenSegmentedControl(
            label = "Language / Idioma", value = language, onValueChange = { language = it },
            options = listOf(LumenSelectionOption("en", "English"), LumenSelectionOption("es", "Español"))
        )
        if (component.isEmpty() || component == "Time field") {
            LumenTimeField(
                label = if (spanish) "Hora de la reunión" else "Meeting time",
                value = time, onValueChange = { time = it },
                minTime = LumenTimeSelection(8, 30), maxTime = LumenTimeSelection(17, 0),
                is24Hour = true,
                description = if (spanish) "Disponible entre las 08:30 y las 17:00." else "Available from 08:30 to 17:00.",
                placeholder = if (spanish) "Elegir una hora" else "Choose a time",
                confirmLabel = if (spanish) "Confirmar" else "Confirm",
                dismissLabel = if (spanish) "Cancelar" else "Cancel",
                inputLabel = if (spanish) "Usar teclado" else "Use keyboard",
                dialLabel = if (spanish) "Usar reloj" else "Use clock",
                rangeErrorLabel = if (spanish) "Elige una hora dentro del horario disponible" else "Choose a time within the allowed range"
            )
            LumenTimeField(
                label = if (spanish) "Hora de solo lectura" else "Read-only time",
                value = LumenTimeSelection(9, 0), onValueChange = {}, is24Hour = true, readOnly = true
            )
        }
        if (component.isEmpty() || component == "Number field") {
            LumenNumberField(
                label = if (spanish) "Cantidad" else "Quantity", value = number, onValueChange = { number = it },
                min = BigDecimal.ZERO, max = BigDecimal.TEN, step = BigDecimal("0.5"),
                locale = if (spanish) Locale.forLanguageTag("es-CO") else Locale.US,
                description = if (spanish) "De 0 a 10, en pasos de 0,5." else "From 0 to 10, in steps of 0.5.",
                invalidNumberLabel = if (spanish) "Introduce un número válido" else "Enter a valid number",
                outOfRangeLabel = if (spanish) "Introduce un número entre 0 y 10" else "Enter a number from 0 to 10",
                incrementLabel = if (spanish) "Aumentar cantidad" else "Increase quantity",
                decrementLabel = if (spanish) "Disminuir cantidad" else "Decrease quantity"
            )
            LumenNumberField(
                label = if (spanish) "Cantidad fuera de rango" else "Out-of-range quantity", value = "12", onValueChange = {},
                max = BigDecimal.TEN, readOnly = true,
                outOfRangeLabel = if (spanish) "La cantidad máxima es 10" else "Maximum quantity is 10",
                incrementLabel = if (spanish) "Aumentar cantidad" else "Increase quantity",
                decrementLabel = if (spanish) "Disminuir cantidad" else "Decrease quantity"
            )
        }
        if (component.isEmpty() || component == "Autocomplete") {
            LumenSegmentedControl(
                label = if (spanish) "Estado de los resultados" else "Result state", value = resultState, onValueChange = { resultState = it },
                options = listOf(
                    LumenSelectionOption("ready", if (spanish) "Listo" else "Ready"),
                    LumenSelectionOption("loading", if (spanish) "Cargando" else "Loading"),
                    LumenSelectionOption("empty", if (spanish) "Vacío" else "Empty"),
                    LumenSelectionOption("error", "Error")
                )
            )
            LumenAutocomplete(
                label = if (spanish) "Proyecto" else "Project", query = query, onQueryChange = { query = it; selected = null },
                value = selected, onValueChange = { selected = it },
                options = if (resultState == "empty") emptyList() else projects.filter { it.label.contains(query, ignoreCase = true) },
                loading = resultState == "loading",
                resultsErrorMessage = if (resultState == "error") {
                    if (spanish) "No se pudieron cargar los proyectos" else "Projects could not be loaded"
                } else null,
                onRetry = { resultState = "ready" },
                description = if (spanish) "Escribe para buscar un proyecto." else "Type to find a project.",
                loadingLabel = if (spanish) "Buscando proyectos" else "Searching projects",
                emptyLabel = if (spanish) "No hay proyectos coincidentes" else "No matching projects",
                retryLabel = if (spanish) "Reintentar" else "Retry"
            )
            LumenText(if (spanish) "Selección: ${selected ?: "ninguna"}" else "Selection: ${selected ?: "none"}")
        }
    }
}

@Composable
internal fun PullToRefreshExample() {
    var refreshing by remember { mutableStateOf(false) }
    var refreshCount by remember { mutableStateOf(0) }
    var language by remember { mutableStateOf("en") }
    val spanish = language == "es"
    val scope = rememberCoroutineScope()
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LumenSegmentedControl(
            label = "Language / Idioma", value = language, onValueChange = { language = it },
            options = listOf(LumenSelectionOption("en", "English"), LumenSelectionOption("es", "Español"))
        )
        LumenText(if (spanish) "Desliza hacia abajo para actualizar." else "Pull down to refresh.", variant = LumenTextVariant.Label)
        LumenPullToRefresh(
            isRefreshing = refreshing,
            onRefresh = {
                refreshing = true
                scope.launch { delay(800); refreshCount += 1; refreshing = false }
            },
            modifier = Modifier.height(220.dp),
            refreshLabel = if (spanish) "Actualizar proyectos" else "Refresh projects",
            refreshingLabel = if (spanish) "Actualizando proyectos" else "Refreshing projects"
        ) {
            LazyColumn(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
                items(12) { index ->
                    LumenText(
                        if (spanish) "Proyecto ${index + 1}" else "Project ${index + 1}",
                        modifier = Modifier.padding(LumenSpacing.Md)
                    )
                }
            }
        }
        LumenText(if (spanish) "Actualizaciones completadas: $refreshCount" else "Completed refreshes: $refreshCount")
    }
}

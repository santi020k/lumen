package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.santi020k.lumen.*

@Composable
internal fun CarouselParityExample() {
    var index by remember { mutableStateOf(0) }
    var spanish by remember { mutableStateOf(false) }
    var disabled by remember { mutableStateOf(false) }
    var empty by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf(LumenCarouselStatus.Ready) }
    val slides = listOf(LumenCarouselSlide("dashboard", "Dashboard"), LumenCarouselSlide("portfolio", "Portfolio"), LumenCarouselSlide("storefront", "Storefront"))
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenButton(onClick = { spanish = !spanish }) { LumenText("English / Español") }
        LumenButton(onClick = { disabled = !disabled }) { LumenText("${if (spanish) "Deshabilitado" else "Disabled"}: $disabled") }
        LumenButton(onClick = { empty = !empty }) { LumenText("${if (spanish) "Vacío" else "Empty"}: $empty") }
        LumenButton(onClick = { status = if (status == LumenCarouselStatus.Loading) LumenCarouselStatus.Ready else LumenCarouselStatus.Loading }) { LumenText(if (spanish) "Cargando" else "Loading") }
        LumenButton(onClick = { status = if (status == LumenCarouselStatus.Error) LumenCarouselStatus.Ready else LumenCarouselStatus.Error }) { LumenText("Error") }
        LumenButton(onClick = { index = 99 }) { LumenText(if (spanish) "Índice inválido" else "Invalid index") }
        LumenButton(onClick = { index = 0; empty = false; status = LumenCarouselStatus.Ready }) { LumenText(if (spanish) "Restaurar" else "Restore") }
        LumenCarousel(if (spanish) "Diapositivas de ejemplo" else "Example slides", if (empty) emptyList() else slides,
            index, { index = it }, disabled = disabled, status = status,
            labels = if (spanish) LumenCarouselLabels("Diapositiva anterior", "Diapositiva siguiente", "Sin diapositivas", "Índice inválido",
                "Cargando diapositivas", "No se pudieron cargar las diapositivas", { slide, page, count -> "${slide.label}, diapositiva ${page + 1} de $count" }) else LumenCarouselLabels()) { slide, _ ->
            LumenCard(Modifier.fillMaxSize()) { LumenText(slide.label) }
        }
        LumenText(index.toString())
    }
}

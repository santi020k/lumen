package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.LumenBreadcrumb
import com.santi020k.lumen.LumenBreadcrumbItem
import com.santi020k.lumen.LumenCheckbox
import com.santi020k.lumen.LumenText

@Composable
fun BreadcrumbParityExample() {
    var disabled by remember { mutableStateOf(false) }
    var spanish by remember { mutableStateOf(false) }
    var longPath by remember { mutableStateOf(false) }
    var lastId by remember { mutableStateOf("none") }
    val items = buildList {
        add(LumenBreadcrumbItem("home", if (spanish) "Inicio" else "Home"))
        add(LumenBreadcrumbItem("library", if (spanish) "Biblioteca" else "Library"))
        add(LumenBreadcrumbItem("locked", if (spanish) "Archivo bloqueado" else "Locked archive", enabled = false))
        if (longPath) {
            add(LumenBreadcrumbItem("platforms", if (spanish) "Plataformas y componentes compartidos" else "Platforms and shared components"))
            add(LumenBreadcrumbItem("guides", if (spanish) "Guías de navegación accesible" else "Accessible navigation guides"))
        }
        add(LumenBreadcrumbItem("current", if (spanish) "Ruta actual" else "Current location"))
    }
    Column {
        LumenCheckbox("Disable trail", disabled, { disabled = it })
        LumenCheckbox("Long trail", longPath, { longPath = it })
        LumenCheckbox("Español", spanish, { spanish = it })
        LumenBreadcrumb(if (spanish) "Ubicación" else "Location", items, { lastId = it },
            currentLabel = if (spanish) "Página actual" else "Current page", enabled = !disabled)
        LumenText("Host navigation ID: $lastId")
    }
}

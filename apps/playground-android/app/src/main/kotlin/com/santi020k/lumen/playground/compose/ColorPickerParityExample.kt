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
internal fun ColorPickerParityExample() {
    var value by remember { mutableStateOf("#3366cc80") }
    var spanish by remember { mutableStateOf(false) }
    var readOnly by remember { mutableStateOf(false) }
    var disabled by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Sm)) {
        LumenButton(onClick = { spanish = !spanish }) { LumenText("English / Español") }
        LumenButton(onClick = { value = "bad" }) { LumenText(if (spanish) "Color inválido" else "Invalid color") }
        LumenButton(onClick = { value = "#3366cc80" }) { LumenText(if (spanish) "Restaurar" else "Restore") }
        LumenButton(onClick = { value = "#00000000" }) { LumenText(if (spanish) "Transparente" else "Transparent black") }
        LumenButton(onClick = { readOnly = !readOnly }) { LumenText("${if (spanish) "Solo lectura" else "Read only"}: $readOnly") }
        LumenButton(onClick = { disabled = !disabled }) { LumenText("${if (spanish) "Deshabilitado" else "Disabled"}: $disabled") }
        LumenColorPicker(if (spanish) "Color de acento" else "Accent color", value, { value = it }, allowAlpha = true,
            disabled = disabled, readOnly = readOnly,
            palette = listOf(LumenColorSwatch("blue", if (spanish) "Azul" else "Blue", "#3366cc80"),
                LumenColorSwatch("red", if (spanish) "Rojo" else "Red", "#cc3333ff")),
            labels = if (spanish) LumenColorPickerLabels("Color hexadecimal o RGBA", "Matiz", "Saturación", "Brillo", "Opacidad",
                "Introduce un color válido", "Color seleccionado") else LumenColorPickerLabels())
        LumenText(value)
    }
}

package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenQRCode
import com.santi020k.lumen.LumenText

@Composable
internal fun QRCodeParityExample() {
    var value by remember { mutableStateOf("https://lumen.santi020k.com") }
    var spanish by remember { mutableStateOf(false) }
    Column {
        LumenButton(onClick = { spanish = !spanish }) { LumenText("English / Español") }
        LumenButton(onClick = { value = "https://lumen.santi020k.com/日本語?name=Molina🌞" }) { LumenText("Unicode") }
        LumenButton(onClick = { value = "" }) { LumenText(if (spanish) "Vacío" else "Empty") }
        LumenButton(onClick = { value = "A".repeat(10000) }) { LumenText(if (spanish) "Exceso" else "Oversize") }
        LumenButton(onClick = { value = "https://lumen.santi020k.com" }) { LumenText(if (spanish) "Restaurar" else "Restore") }
        LumenQRCode(value, if (spanish) "Código QR de ejemplo" else "Example QR code",
                    errorLabel = if (spanish) "No se pudo generar el código QR" else "Unable to generate QR code",
                    showValue = value.length < 200)
    }
}

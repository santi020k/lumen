package com.santi020k.lumen

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.google.zxing.EncodeHintType
import com.google.zxing.WriterException
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import com.google.zxing.qrcode.encoder.Encoder

/** Offline QR result; host state is never rewritten when encoding fails. */
sealed interface LumenQRCodeResult {
    data class Ready(val modules: List<List<Boolean>>) : LumenQRCodeResult
    enum class Error : LumenQRCodeResult { Empty, Capacity, Options }
}

enum class LumenQRCodeCorrection { Low, Medium, Quartile, High }

fun encodeLumenQRCode(value: String, correction: LumenQRCodeCorrection = LumenQRCodeCorrection.Medium,
                     quietZone: Int = 4): LumenQRCodeResult {
    if (quietZone !in 4..32) return LumenQRCodeResult.Error.Options
    if (value.isEmpty()) return LumenQRCodeResult.Error.Empty
    if (value.length > 7089) return LumenQRCodeResult.Error.Capacity
    val level = when (correction) {
        LumenQRCodeCorrection.Low -> ErrorCorrectionLevel.L
        LumenQRCodeCorrection.Medium -> ErrorCorrectionLevel.M
        LumenQRCodeCorrection.Quartile -> ErrorCorrectionLevel.Q
        LumenQRCodeCorrection.High -> ErrorCorrectionLevel.H
    }
    return try {
        val matrix = Encoder.encode(value, level, mapOf(EncodeHintType.CHARACTER_SET to "UTF-8")).matrix
        val side = matrix.width + 2 * quietZone
        LumenQRCodeResult.Ready(List(side) { y -> List(side) { x ->
            x in quietZone until side - quietZone && y in quietZone until side - quietZone &&
                matrix.get(x - quietZone, y - quietZone).toInt() == 1
        } })
    } catch (_: WriterException) { LumenQRCodeResult.Error.Capacity }
}

@Composable
fun LumenQRCode(
    value: String,
    label: String,
    modifier: Modifier = Modifier,
    size: Dp = 160.dp,
    correction: LumenQRCodeCorrection = LumenQRCodeCorrection.Medium,
    quietZone: Int = 4,
    errorLabel: String = "Unable to generate QR code",
    showValue: Boolean = true
) {
    val result = remember(value, correction, quietZone) { encodeLumenQRCode(value, correction, quietZone) }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(LumenSpacing.Xs)) {
        if (result is LumenQRCodeResult.Ready && size.value.isFinite() && size.value > 0 && size.value <= 4096) {
            Canvas(Modifier.size(size).semantics { role = Role.Image; contentDescription = "$label: $value" }) {
                drawRect(Color.White)
                val side = result.modules.size
                val unit = this.size.width / side
                result.modules.forEachIndexed { y, row -> row.forEachIndexed { x, dark ->
                    if (dark) drawRect(Color.Black, Offset(x * unit, y * unit), Size(unit, unit))
                } }
            }
        } else { LumenText(errorLabel) }
        if (showValue) LumenText(value)
    }
}

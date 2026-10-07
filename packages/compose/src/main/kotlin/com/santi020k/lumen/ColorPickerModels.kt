package com.santi020k.lumen

import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToInt

data class LumenRGBA(val red: Int, val green: Int, val blue: Int, val alpha: Double = 1.0) {
    val isValid: Boolean get() = red in 0..255 && green in 0..255 && blue in 0..255 && alpha.isFinite() && alpha in 0.0..1.0
}
data class LumenHSVA(val hue: Double, val saturation: Double, val value: Double, val alpha: Double = 1.0)
data class LumenColorSwatch(val id: String, val label: String, val value: String, val disabled: Boolean = false)

fun parseLumenColor(input: String): LumenRGBA? {
    if (input.length > 64) return null
    val text = input.trim().lowercase(Locale.ROOT)
    if (text.startsWith("#")) {
        val digits = text.drop(1)
        if (digits.length !in listOf(3, 4, 6, 8) || digits.any { it !in '0'..'9' && it !in 'a'..'f' }) return null
        val full = if (digits.length < 5) digits.flatMap { listOf(it, it) }.joinToString("") else digits
        val bytes = full.chunked(2).map { it.toInt(16) }
        return LumenRGBA(bytes[0], bytes[1], bytes[2], if (bytes.size == 4) bytes[3] / 255.0 else 1.0)
    }
    if (!text.startsWith("rgba(") || !text.endsWith(")")) return null
    val parts = text.drop(5).dropLast(1).split(',').map { it.trim() }
    if (parts.size != 4) return null
    val numbers = parts.map { part ->
        if (part.none { it in '0'..'9' } || part.count { it == '.' } > 1 || part.any { it !in '0'..'9' && it != '.' }) return null
        part.toDoubleOrNull() ?: return null
    }
    if (numbers.take(3).any { !it.isFinite() || it !in 0.0..255.0 || it % 1 != 0.0 } || !numbers[3].isFinite() || numbers[3] !in 0.0..1.0) return null
    return LumenRGBA(numbers[0].toInt(), numbers[1].toInt(), numbers[2].toInt(), numbers[3])
}
fun formatLumenColor(color: LumenRGBA, allowAlpha: Boolean = false): String? {
    if (!color.isValid || (!allowAlpha && color.alpha != 1.0)) return null
    val bytes = listOf(color.red, color.green, color.blue) + if (allowAlpha) listOf((color.alpha * 255).roundToInt()) else emptyList()
    return "#" + bytes.joinToString("") { it.toString(16).padStart(2, '0') }
}
fun lumenRGBAToHSVA(color: LumenRGBA): LumenHSVA? {
    if (!color.isValid) return null
    val r = color.red / 255.0; val g = color.green / 255.0; val b = color.blue / 255.0
    val maximum = maxOf(r, g, b); val delta = maximum - minOf(r, g, b)
    var hue = 0.0
    if (delta > 0) {
        hue = when (maximum) { r -> ((g - b) / delta) % 6; g -> (b - r) / delta + 2; else -> (r - g) / delta + 4 }
        hue = (hue * 60 + 360) % 360
    }
    return LumenHSVA(hue, if (maximum == 0.0) 0.0 else delta / maximum, maximum, color.alpha)
}
fun lumenHSVAToRGBA(color: LumenHSVA): LumenRGBA? {
    if (!color.hue.isFinite() || color.hue !in 0.0..360.0 || listOf(color.saturation, color.value, color.alpha).any { !it.isFinite() || it !in 0.0..1.0 }) return null
    val hue = color.hue % 360 / 60
    val c = color.value * color.saturation; val x = c * (1 - abs(hue % 2 - 1)); val m = color.value - c
    val sectors = listOf(listOf(c,x,0.0), listOf(x,c,0.0), listOf(0.0,c,x), listOf(0.0,x,c), listOf(x,0.0,c), listOf(c,0.0,x))
    val channels = sectors[hue.toInt()].map { ((it + m) * 255).roundToInt() }
    return LumenRGBA(channels[0], channels[1], channels[2], color.alpha)
}

internal fun lumenValidColorPalette(palette: List<LumenColorSwatch>, allowAlpha: Boolean): List<LumenColorSwatch> {
    val ids = mutableSetOf<String>()
    val colors = mutableSetOf<String>()
    return palette.filter { swatch ->
        val color = parseLumenColor(swatch.value)?.let { formatLumenColor(it, allowAlpha) }
        if (swatch.id.isBlank() || swatch.label.isBlank() || color == null || swatch.id in ids || color in colors) false
        else { ids.add(swatch.id); colors.add(color); true }
    }
}

package com.santi020k.lumen

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale

enum class LumenImageFit {
    Contain,
    Cover
}

enum class LumenImageRadius {
    Full,
    Lg,
    Md,
    None,
    Sm
}

@Composable
fun LumenImage(
    painter: Painter,
    label: String?,
    modifier: Modifier = Modifier,
    aspectRatio: Float? = null,
    fit: LumenImageFit = LumenImageFit.Cover,
    radius: LumenImageRadius = LumenImageRadius.Lg
) {
    val safeAspectRatio = aspectRatio?.takeIf { it.isFinite() && it > 0f }
    val radiusValue = when (radius) {
        LumenImageRadius.Full -> LumenRadius.Full
        LumenImageRadius.Lg -> LumenRadius.Lg
        LumenImageRadius.Md -> LumenRadius.Md
        LumenImageRadius.None -> LumenSpacing.Zero
        LumenImageRadius.Sm -> LumenRadius.Sm
    }
    val scale = when (fit) {
        LumenImageFit.Contain -> ContentScale.Fit
        LumenImageFit.Cover -> ContentScale.Crop
    }
    val aspectModifier = if (safeAspectRatio == null) {
        Modifier
    } else {
        Modifier.aspectRatio(safeAspectRatio)
    }

    Image(
        painter = painter,
        contentDescription = label,
        contentScale = scale,
        modifier = modifier
            .then(aspectModifier)
            .fillMaxWidth()
            .clip(RoundedCornerShape(radiusValue))
    )
}

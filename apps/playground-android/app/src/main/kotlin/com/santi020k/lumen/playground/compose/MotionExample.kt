package com.santi020k.lumen.playground.compose

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenCard
import com.santi020k.lumen.LumenDisclosure
import com.santi020k.lumen.LumenMotion
import com.santi020k.lumen.LumenSheet
import com.santi020k.lumen.LumenSpacing
import com.santi020k.lumen.LumenSpinner
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenToggle
import kotlinx.coroutines.delay

@Composable
internal fun MotionExample() {
    var reduceDemo by remember { mutableStateOf(false) }
    var expanded by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var saved by remember { mutableStateOf(false) }
    var sheet by remember { mutableStateOf(false) }
    val duration = if (reduceDemo) 0 else LumenMotion.StandardDurationMillis

    LaunchedEffect(saving) {
        if (saving) { delay(700); saving = false; saved = true }
    }

    LumenCard {
        Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Lg)) {
            LumenText("Motion playground")
            LumenText("Brief, optional transitions. This save is simulated; no data is sent.")
            LumenToggle("Reduce demo effects", reduceDemo, { reduceDemo = it })
            LumenText(if (reduceDemo) "Demo effects are immediate." else "Demo effects follow the system animation scale.")
            Column(Modifier.animateContentSize(animationSpec = tween(duration))) {
                LumenDisclosure("Expandable details", expanded, { expanded = it }) {
                    LumenText("Content stays readable while its surrounding layout changes.")
                }
            }
            if (saving) LumenSpinner()
            Column(Modifier.semantics { liveRegion = LiveRegionMode.Polite }) {
                if (!saved) LumenText(if (saving) "Saving demonstration…" else "Ready to preview.")
                AnimatedVisibility(saved, enter = fadeIn(tween(duration)), exit = fadeOut(tween(duration))) {
                    LumenText("Demonstration saved.")
                }
            }
            LumenButton(onClick = { saved = false; saving = true }, enabled = !saving) { Text("Simulate save") }
            LumenButton(onClick = { sheet = true }) { Text("Open sheet") }
            LumenText("Native sheet motion follows the operating system.")
        }
    }
    LumenSheet(sheet, { sheet = false }, title = "Native sheet motion", actions = {
        LumenButton(onClick = { sheet = false }) { Text("Close sheet") }
    }) {
        LumenText("Open, close, and reopen. The application owns state; the platform owns presentation.")
    }
}

package com.santi020k.lumen.playground.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.santi020k.lumen.ExperimentalLumenWearApi
import com.santi020k.lumen.LocalLumenTheme
import com.santi020k.lumen.LumenWearActionButton
import com.santi020k.lumen.LumenWearListRow
import com.santi020k.lumen.LumenWearMetric
import com.santi020k.lumen.LumenWearProgressRing
import com.santi020k.lumen.LumenWearStatus
import com.santi020k.lumen.LumenWearTheme
import com.santi020k.lumen.LumenWearTone

class WearMainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LumenWearGallery(
                initialComponent = intent.getStringExtra(COMPONENT_EXTRA).orEmpty()
            )
        }
    }

    private companion object {
        const val COMPONENT_EXTRA = "component"
    }
}

@OptIn(ExperimentalLumenWearApi::class)
@Composable
private fun LumenWearGallery(initialComponent: String) {
    LumenWearTheme {
        val colors = LocalLumenTheme.current.colors

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.canvas)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            BasicText(
                if (initialComponent.isBlank()) "Lumen Wear" else initialComponent,
                style = TextStyle(color = colors.ink, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            )
            when (initialComponent) {
                "Action button" -> WearActionExample()
                "Progress ring" -> WearProgressExample()
                "Status" -> LumenWearStatus("Candidate ready", tone = LumenWearTone.Success)
                "Metric" -> WearMetricExample()
                "List row" -> WearListRowExample()
                else -> WearCatalogExample()
            }
        }
    }
}

@Composable
private fun WearActionExample(dimension: Dp = 120.dp) {
    val colors = LocalLumenTheme.current.colors
    LumenWearActionButton(
        accessibilityLabel = "Start timer",
        dimension = dimension,
        onClick = {}
    ) {
        BasicText(
            "Start",
            style = TextStyle(color = colors.onBrand, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        )
    }
}

@Composable
private fun WearProgressExample() {
    val colors = LocalLumenTheme.current.colors
    LumenWearProgressRing(
        value = 42f,
        maximum = 60f,
        modifier = Modifier.padding(12.dp)
    ) {
        Box(modifier = Modifier.size(112.dp), contentAlignment = Alignment.Center) {
            BasicText(
                "42 min",
                style = TextStyle(color = colors.ink, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            )
        }
    }
}

@OptIn(ExperimentalLumenWearApi::class)
@Composable
private fun WearMetricExample() {
    LumenWearMetric(
        label = "Elapsed",
        value = "42 min",
        detail = "18 min remaining",
        tone = LumenWearTone.Accent
    )
}

@OptIn(ExperimentalLumenWearApi::class)
@Composable
private fun WearListRowExample() {
    val colors = LocalLumenTheme.current.colors
    LumenWearListRow(
        leading = { LumenWearStatus("Live", tone = LumenWearTone.Danger) },
        trailing = {
            BasicText("88%", style = TextStyle(color = colors.inkSoft, fontSize = 12.sp))
        }
    ) {
        BasicText(
            "Heart rate",
            modifier = Modifier.weight(1f),
            style = TextStyle(color = colors.ink, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        )
    }
}

@OptIn(ExperimentalLumenWearApi::class)
@Composable
private fun WearCatalogExample() {
    LumenWearStatus("Candidate ready", tone = LumenWearTone.Success)
    WearProgressExample()
    WearMetricExample()
    WearListRowExample()
}

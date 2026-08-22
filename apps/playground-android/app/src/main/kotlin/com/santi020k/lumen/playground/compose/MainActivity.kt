package com.santi020k.lumen.playground.compose

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.santi020k.lumen.LumenAlert
import com.santi020k.lumen.LumenAlertVariant
import com.santi020k.lumen.LumenAvatar
import com.santi020k.lumen.LumenAvatarSize
import com.santi020k.lumen.LumenBadge
import com.santi020k.lumen.LumenBadgeTone
import com.santi020k.lumen.LumenBanner
import com.santi020k.lumen.LumenBannerVariant
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenButtonIntent
import com.santi020k.lumen.LumenCard
import com.santi020k.lumen.LumenCardVariant
import com.santi020k.lumen.LumenDivider
import com.santi020k.lumen.LumenEmptyState
import com.santi020k.lumen.LumenIcon
import com.santi020k.lumen.LumenIconButton
import com.santi020k.lumen.LumenListRow
import com.santi020k.lumen.LumenMetricTone
import com.santi020k.lumen.LumenProgress
import com.santi020k.lumen.LumenSearchField
import com.santi020k.lumen.LumenSectionHeader
import com.santi020k.lumen.LumenSettingsRow
import com.santi020k.lumen.LumenSpinner
import com.santi020k.lumen.LumenStat
import com.santi020k.lumen.LumenStatusBar
import com.santi020k.lumen.LumenSurface
import com.santi020k.lumen.LumenSurfacePadding
import com.santi020k.lumen.LumenSurfaceRadius
import com.santi020k.lumen.LumenSurfaceTone
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTextField
import com.santi020k.lumen.LumenTextTone
import com.santi020k.lumen.LumenTextVariant
import com.santi020k.lumen.LumenTheme
import com.santi020k.lumen.LumenToggle

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { LumenAndroidPlayground() }
    }
}

private data class PlaygroundSection(
    val description: String,
    val names: Set<String>,
    val title: String
)

private val sections = listOf(
    PlaygroundSection(
        title = "Foundations",
        description = "Theme, text, surfaces, and Material icons use shared semantic roles.",
        names = setOf("Theme", "Text", "Surface", "Icon", "Icon button")
    ),
    PlaygroundSection(
        title = "Actions",
        description = "Buttons expose intent, loading, enabled, and pressed states.",
        names = setOf("Button")
    ),
    PlaygroundSection(
        title = "Forms",
        description = "Text, search, toggle, and settings controls retain native behavior.",
        names = setOf("Text field", "Toggle", "Settings row", "Search field")
    ),
    PlaygroundSection(
        title = "Feedback",
        description = "Badges, banners, alerts, progress, and status communicate outcomes.",
        names = setOf("Badge", "Divider", "Spinner", "Alert", "Progress", "Banner", "Status bar")
    ),
    PlaygroundSection(
        title = "Data display",
        description = "Cards, avatars, metrics, headers, and rows compose into product content.",
        names = setOf("Card", "Avatar", "Empty state", "List row", "Stat", "Section header")
    )
)

@Composable
private fun LumenAndroidPlayground() {
    var darkTheme by remember { mutableStateOf(false) }

    LumenTheme(darkTheme = darkTheme) {
        PlaygroundContent(
            darkTheme = darkTheme,
            onToggleTheme = { darkTheme = !darkTheme }
        )
    }
}

@Composable
private fun PlaygroundContent(
    darkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    var email by remember { mutableStateOf("hello@lumen.dev") }
    var notificationsEnabled by remember { mutableStateOf(true) }
    var query by remember { mutableStateOf("") }
    var saved by remember { mutableStateOf(false) }
    var showBanner by remember { mutableStateOf(true) }
    val visibleSections = sections.filter { section ->
        query.isBlank() || section.names.any { it.contains(query, ignoreCase = true) }
    }
    val visibleCount = sections
        .flatMap { it.names }
        .count { query.isBlank() || it.contains(query, ignoreCase = true) }

    LumenSurface(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding(),
        tone = LumenSurfaceTone.Canvas,
        padding = LumenSurfacePadding.None,
        radius = LumenSurfaceRadius.None
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        LumenBadge("Jetpack Compose", tone = LumenBadgeTone.Success)
                        LumenText("Lumen Android Playground", variant = LumenTextVariant.Title)
                        LumenText(
                            "Explore every public Compose primitive with real Android state.",
                            tone = LumenTextTone.Soft
                        )
                    }
                    LumenButton(onClick = onToggleTheme, intent = LumenButtonIntent.Secondary) {
                        Text(if (darkTheme) "Light" else "Dark")
                    }
                }
            }

            item {
                LumenSearchField(
                    value = query,
                    onValueChange = { query = it },
                    prompt = "Search components",
                    modifier = Modifier.fillMaxWidth()
                ) {
                    LumenIcon(Icons.Default.Search, contentDescription = null)
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    LumenText("$visibleCount components", variant = LumenTextVariant.Label)
                    LumenText("Android · Compose", variant = LumenTextVariant.Caption, tone = LumenTextTone.Muted)
                }
            }

            items(visibleSections, key = { it.title }) { section ->
                ComponentSection(section) {
                    when (section.title) {
                        "Foundations" -> FoundationsExample()
                        "Actions" -> ActionsExample()
                        "Forms" -> FormsExample(
                            email = email,
                            onEmailChange = { email = it },
                            notificationsEnabled = notificationsEnabled,
                            onNotificationsChange = { notificationsEnabled = it }
                        )
                        "Feedback" -> FeedbackExample(
                            showBanner = showBanner,
                            onBannerVisibilityChange = { showBanner = it }
                        )
                        "Data display" -> DataExample(saved = saved, onToggleSaved = { saved = !saved })
                    }
                }
            }

            if (visibleSections.isEmpty()) {
                item {
                    LumenEmptyState(
                        title = "No matching component",
                        description = "Try another component name or reset the catalog.",
                        graphic = { LumenIcon(Icons.Default.Search, contentDescription = null) },
                        actions = {
                            LumenButton(
                                onClick = { query = "" },
                                intent = LumenButtonIntent.Secondary
                            ) {
                                Text("Clear search")
                            }
                        }
                    )
                }
            }

            item {
                LumenStatusBar(
                    message = "Powered by the local lumen-compose module",
                    tone = LumenMetricTone.Success,
                    trailing = {
                        LumenText("23 shared", variant = LumenTextVariant.Caption, tone = LumenTextTone.Muted)
                    }
                )
            }
        }
    }
}

@Composable
private fun ComponentSection(
    section: PlaygroundSection,
    content: @Composable () -> Unit
) {
    LumenCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                LumenText(section.title, variant = LumenTextVariant.Label)
                LumenText(section.description, variant = LumenTextVariant.Caption, tone = LumenTextTone.Muted)
            }
            LumenDivider()
            content()
        }
    }
}

@Composable
private fun FoundationsExample() {
    LumenSurface(
        modifier = Modifier.fillMaxWidth(),
        tone = LumenSurfaceTone.Muted,
        padding = LumenSurfacePadding.Lg
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    LumenIcon(Icons.Default.Search, contentDescription = "Search")
                    LumenText("Shared native foundations", variant = LumenTextVariant.Label)
                }
                LumenIconButton(
                    imageVector = Icons.Default.Check,
                    contentDescription = "Mark complete",
                    onClick = {}
                )
            }
            LumenText("Colors, spacing, radii, and typography remain Compose-native.", tone = LumenTextTone.Soft)
        }
    }
}

@Composable
private fun ActionsExample() {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            LumenButton(onClick = {}) { Text("Primary") }
            LumenButton(onClick = {}, intent = LumenButtonIntent.Secondary) { Text("Secondary") }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            LumenButton(onClick = {}, intent = LumenButtonIntent.Danger) { Text("Danger") }
            LumenButton(onClick = {}, loading = true) { Text("Loading") }
            LumenButton(onClick = {}, enabled = false) { Text("Disabled") }
        }
    }
}

@Composable
private fun FormsExample(
    email: String,
    onEmailChange: (String) -> Unit,
    notificationsEnabled: Boolean,
    onNotificationsChange: (Boolean) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        LumenTextField(
            value = email,
            onValueChange = onEmailChange,
            label = "Email address",
            modifier = Modifier.fillMaxWidth()
        )
        LumenTextField(
            value = "lumen playground",
            onValueChange = {},
            label = "Project slug",
            error = true,
            errorMessage = "Use letters, numbers, and hyphens.",
            modifier = Modifier.fillMaxWidth()
        )
        LumenToggle(
            label = "Release notifications",
            description = "Receive component release notes.",
            checked = notificationsEnabled,
            onCheckedChange = onNotificationsChange
        )
        LumenSettingsRow(
            title = "Automatic updates",
            description = "Download stable updates automatically.",
            graphic = { LumenIcon(Icons.Default.Check, contentDescription = null) }
        ) {
            LumenToggle(
                label = "Automatic updates",
                checked = notificationsEnabled,
                showLabel = false,
                onCheckedChange = onNotificationsChange
            )
        }
    }
}

@Composable
private fun FeedbackExample(
    showBanner: Boolean,
    onBannerVisibilityChange: (Boolean) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            LumenBadge("Ready", tone = LumenBadgeTone.Success)
            LumenBadge("Review", tone = LumenBadgeTone.Warning)
            LumenBadge("Blocked", tone = LumenBadgeTone.Danger)
            LumenSpinner(label = "Loading component data")
        }
        LumenAlert(modifier = Modifier.fillMaxWidth(), variant = LumenAlertVariant.Success) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                LumenText("Playground is ready", variant = LumenTextVariant.Label, tone = LumenTextTone.Success)
                LumenText("This screen uses the real lumen-compose module.", tone = LumenTextTone.Soft)
            }
        }
        LumenProgress(value = 86f, label = "Documentation coverage")
        if (showBanner) {
            LumenBanner(
                title = "Native structured feedback",
                description = "Dismiss this notice to exercise local state.",
                variant = LumenBannerVariant.Accent,
                onDismiss = { onBannerVisibilityChange(false) }
            )
        } else {
            LumenButton(
                onClick = { onBannerVisibilityChange(true) },
                intent = LumenButtonIntent.Secondary
            ) {
                Text("Restore banner")
            }
        }
    }
}

@Composable
private fun DataExample(saved: Boolean, onToggleSaved: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        LumenSectionHeader(
            title = "Workspace",
            subtitle = "Shared native contracts",
            count = "23",
            actions = {
                LumenButton(
                    onClick = onToggleSaved,
                    intent = LumenButtonIntent.Quiet
                ) {
                    Text("Refresh")
                }
            }
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            LumenStat(
                label = "Shared components",
                value = "23",
                modifier = Modifier.weight(1f),
                detail = "Across three adapters",
                tone = LumenMetricTone.Accent
            )
            LumenStat(
                label = "Verification",
                value = "Passing",
                modifier = Modifier.weight(1f),
                detail = "All repository gates",
                tone = LumenMetricTone.Success
            )
        }
        LumenCard(
            modifier = Modifier.fillMaxWidth(),
            variant = if (saved) LumenCardVariant.Success else LumenCardVariant.Muted,
            onClick = onToggleSaved
        ) {
            LumenListRow(
                leading = { LumenAvatar(fallback = "LU", size = LumenAvatarSize.Lg, label = "Lumen UI") },
                trailing = {
                    LumenBadge(
                        if (saved) "Saved" else "Draft",
                        tone = if (saved) LumenBadgeTone.Success else LumenBadgeTone.Neutral
                    )
                }
            ) {
                Column {
                    LumenText("Lumen UI", variant = LumenTextVariant.Label)
                    LumenText(
                        "Native design system",
                        variant = LumenTextVariant.Caption,
                        tone = LumenTextTone.Muted
                    )
                }
            }
        }
    }
}

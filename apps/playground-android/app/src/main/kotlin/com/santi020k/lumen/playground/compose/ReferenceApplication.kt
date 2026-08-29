package com.santi020k.lumen.playground.compose

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.UriHandler
import androidx.compose.ui.unit.dp
import com.santi020k.lumen.LumenAdaptiveNavigationScaffold
import com.santi020k.lumen.LumenAlert
import com.santi020k.lumen.LumenAlertDialog
import com.santi020k.lumen.LumenAlertVariant
import com.santi020k.lumen.LumenBadge
import com.santi020k.lumen.LumenBadgeTone
import com.santi020k.lumen.LumenBarChart
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenButtonGroup
import com.santi020k.lumen.LumenButtonIntent
import com.santi020k.lumen.LumenCard
import com.santi020k.lumen.LumenCardVariant
import com.santi020k.lumen.LumenChartDatum
import com.santi020k.lumen.LumenChartSeries
import com.santi020k.lumen.LumenChartTone
import com.santi020k.lumen.LumenChartX
import com.santi020k.lumen.LumenCheckbox
import com.santi020k.lumen.LumenChip
import com.santi020k.lumen.LumenDivider
import com.santi020k.lumen.LumenEmptyState
import com.santi020k.lumen.LumenGraphic
import com.santi020k.lumen.LumenGraphicSize
import com.santi020k.lumen.LumenGraphicTone
import com.santi020k.lumen.LumenGraphicVariant
import com.santi020k.lumen.LumenIcon
import com.santi020k.lumen.LumenIconName
import com.santi020k.lumen.LumenIllustration
import com.santi020k.lumen.LumenIllustrationSize
import com.santi020k.lumen.LumenIllustrationVariant
import com.santi020k.lumen.LumenListRow
import com.santi020k.lumen.LumenMetricTone
import com.santi020k.lumen.LumenNavigationItem
import com.santi020k.lumen.LumenPicker
import com.santi020k.lumen.LumenPickerOption
import com.santi020k.lumen.LumenProgress
import com.santi020k.lumen.LumenSectionHeader
import com.santi020k.lumen.LumenSegmentedControl
import com.santi020k.lumen.LumenSelectionOption
import com.santi020k.lumen.LumenSettingsRow
import com.santi020k.lumen.LumenSkeleton
import com.santi020k.lumen.LumenSkeletonShape
import com.santi020k.lumen.LumenStat
import com.santi020k.lumen.LumenStatusBar
import com.santi020k.lumen.LumenSurface
import com.santi020k.lumen.LumenSurfacePadding
import com.santi020k.lumen.LumenSurfaceRadius
import com.santi020k.lumen.LumenSurfaceTone
import com.santi020k.lumen.LumenTabs
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTextField
import com.santi020k.lumen.LumenTextTone
import com.santi020k.lumen.LumenTextVariant
import com.santi020k.lumen.LumenTextarea
import com.santi020k.lumen.LumenToast
import com.santi020k.lumen.LumenToggle

internal data class CatalogCategorySummary(val name: String, val componentCount: Int)

private enum class PlaygroundDestination { Home, Examples, Components, Settings }
private enum class ExamplePattern(val label: String) { Release("Release"), Health("Health"), Profile("Profile") }
private enum class ExampleState { Loading, Empty, Error, Success }
private enum class PlaygroundLocale(val label: String) { English("English"), Spanish("Español") }

@Composable
internal fun LumenReferenceApplication(
    darkTheme: Boolean,
    themePreset: PlaygroundThemePreset,
    onThemePresetChange: (PlaygroundThemePreset) -> Unit,
    onToggleTheme: () -> Unit,
    catalog: List<CatalogCategorySummary>,
    components: @Composable () -> Unit
) {
    var destination by remember { mutableStateOf(PlaygroundDestination.Home) }
    val navigationItems = remember {
        listOf(
            LumenNavigationItem(PlaygroundDestination.Home, "Home", Icons.Default.Home),
            LumenNavigationItem(PlaygroundDestination.Examples, "Examples", Icons.Default.Add),
            LumenNavigationItem(PlaygroundDestination.Components, "Components", Icons.Default.Search),
            LumenNavigationItem(PlaygroundDestination.Settings, "Settings", Icons.Default.Settings)
        )
    }
    LumenAdaptiveNavigationScaffold(
        items = navigationItems,
        selectedValue = destination,
        onValueChange = { destination = it },
        onReselect = {}
    ) {
        when (destination) {
            PlaygroundDestination.Home -> HomeScreen(
                catalog,
                onOpenExamples = { destination = PlaygroundDestination.Examples },
                onOpenComponents = { destination = PlaygroundDestination.Components }
            )
            PlaygroundDestination.Examples -> ExamplesScreen(catalog)
            PlaygroundDestination.Components -> components()
            PlaygroundDestination.Settings -> SettingsScreen(
                darkTheme,
                themePreset,
                onThemePresetChange,
                onToggleTheme
            )
        }
    }
}

@Composable
private fun ResponsiveScreen(content: LazyListScope.(wide: Boolean) -> Unit) {
    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val wide = maxWidth >= 720.dp
        LumenSurface(
            modifier = Modifier.fillMaxSize().statusBarsPadding(),
            tone = LumenSurfaceTone.Canvas,
            padding = LumenSurfacePadding.None,
            radius = LumenSurfaceRadius.None
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(if (wide) 28.dp else 16.dp),
                verticalArrangement = Arrangement.spacedBy(if (wide) 20.dp else 14.dp)
            ) { content(wide) }
        }
    }
}

@Composable
private fun DestinationHeader(eyebrow: String, title: String, description: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        LumenGraphic(
            modifier = Modifier.size(60.dp),
            size = LumenGraphicSize.Sm,
            tone = LumenGraphicTone.Brand,
            variant = LumenGraphicVariant.Orbit,
            label = "$title destination"
        ) { LumenIcon(LumenIconName.Sparkles, contentDescription = null) }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                LumenText(title, variant = LumenTextVariant.Title)
                LumenBadge(eyebrow, tone = LumenBadgeTone.Accent)
            }
            LumenText(description, variant = LumenTextVariant.Caption, tone = LumenTextTone.Muted)
        }
    }
}

@Composable
private fun HomeScreen(
    catalog: List<CatalogCategorySummary>,
    onOpenExamples: () -> Unit,
    onOpenComponents: () -> Unit
) {
    val componentCount = catalog.sumOf { it.componentCount }
    ResponsiveScreen { wide ->
        item {
            DestinationHeader(
                "Compose",
                "Release workspace",
                "Review the current Lumen Android catalog and its product patterns."
            )
        }
        item {
            LumenSurface(
                modifier = Modifier.fillMaxWidth(),
                tone = LumenSurfaceTone.Muted,
                padding = LumenSurfacePadding.Lg
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    LumenGraphic(
                        modifier = Modifier.size(if (wide) 128.dp else 88.dp),
                        size = if (wide) LumenGraphicSize.Md else LumenGraphicSize.Sm,
                        tone = LumenGraphicTone.Accent,
                        variant = LumenGraphicVariant.Grid,
                        label = "Lumen Android release workspace"
                    ) { LumenIcon(LumenIconName.Check, contentDescription = null) }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            LumenBadge("Local", tone = LumenBadgeTone.Success)
                            LumenBadge("No data collection", tone = LumenBadgeTone.Neutral)
                        }
                        LumenText("Native catalog ready for review", variant = LumenTextVariant.Label)
                        LumenText(
                            "$componentCount public components across ${catalog.size} focused categories.",
                            variant = LumenTextVariant.Caption,
                            tone = LumenTextTone.Muted
                        )
                        LumenButtonGroup {
                            LumenButton(onClick = onOpenComponents) { Text("Review catalog") }
                            LumenButton(onClick = onOpenExamples, intent = LumenButtonIntent.Secondary) {
                                Text("Open patterns")
                            }
                        }
                    }
                }
            }
        }
        item {
            if (wide) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                    ReleaseReadiness(componentCount, catalog.size, Modifier.weight(1.15f))
                    FeaturedWorkflows(onOpenExamples, Modifier.weight(0.85f))
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    ReleaseReadiness(componentCount, catalog.size, Modifier.fillMaxWidth())
                    FeaturedWorkflows(onOpenExamples, Modifier.fillMaxWidth())
                }
            }
        }
        item {
            LumenStatusBar(
                message = "Adaptive phone and tablet navigation · offline reference data",
                tone = LumenMetricTone.Success
            )
        }
    }
}

@Composable
private fun ReleaseReadiness(componentCount: Int, categoryCount: Int, modifier: Modifier) {
    LumenCard(modifier = modifier, variant = LumenCardVariant.Accent) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            LumenSectionHeader(title = "Release readiness", subtitle = "Current checked-in Android catalog")
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                LumenStat(
                    label = "Components",
                    value = componentCount.toString(),
                    detail = "Public catalog",
                    tone = LumenMetricTone.Accent,
                    modifier = Modifier.weight(1f)
                )
                LumenStat(
                    label = "Categories",
                    value = categoryCount.toString(),
                    detail = "Discovery groups",
                    tone = LumenMetricTone.Brand,
                    modifier = Modifier.weight(1f)
                )
            }
            LumenProgress(value = 100f, label = "Primary destination coverage")
            LumenStatusBar(message = "Build and lint verified locally", tone = LumenMetricTone.Success)
        }
    }
}

@Composable
private fun FeaturedWorkflows(onOpenExamples: () -> Unit, modifier: Modifier) {
    LumenSurface(modifier = modifier, tone = LumenSurfaceTone.Muted, padding = LumenSurfacePadding.Lg) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            LumenSectionHeader(title = "Featured workflows", subtitle = "Composed patterns to exercise")
            WorkflowRow(LumenIconName.Check, "Release readiness", "Validation, review, and confirmation")
            LumenDivider()
            WorkflowRow(LumenIconName.Sparkles, "Catalog health", "Truthful category distribution")
            LumenDivider()
            WorkflowRow(LumenIconName.Settings, "Profile setup", "Forms, choices, and saved feedback")
            LumenButton(onClick = onOpenExamples, intent = LumenButtonIntent.Secondary) {
                Text("Explore workflows")
            }
        }
    }
}

@Composable
private fun WorkflowRow(icon: LumenIconName, title: String, description: String) {
    LumenListRow(leading = { LumenIcon(icon, contentDescription = null) }) {
        Column {
            LumenText(title, variant = LumenTextVariant.Label)
            LumenText(description, variant = LumenTextVariant.Caption, tone = LumenTextTone.Muted)
        }
    }
}

@Composable
private fun ExamplesScreen(catalog: List<CatalogCategorySummary>) {
    var pattern by remember { mutableStateOf(ExamplePattern.Release) }
    var projectName by remember { mutableStateOf("Lumen Android") }
    var accessibilityReview by remember { mutableStateOf(true) }
    var releaseState by remember { mutableStateOf(ExampleState.Success) }
    var releaseLoading by remember { mutableStateOf(false) }
    var showResetDialog by remember { mutableStateOf(false) }
    var profileName by remember { mutableStateOf("Santiago") }
    var profileEmail by remember { mutableStateOf("hello@lumen.dev") }
    var role by remember { mutableStateOf("designer") }
    var updatesEnabled by remember { mutableStateOf(true) }
    var showSavedToast by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        ResponsiveScreen { wide ->
            item {
                DestinationHeader(
                    "3 patterns",
                    "Examples",
                    "Switch tasks, change state, and inspect complete product compositions."
                )
            }
            item {
                LumenTabs(
                    label = "Example pattern",
                    options = ExamplePattern.entries.map { LumenSelectionOption(it.name, it.label) },
                    value = pattern.name,
                    onValueChange = { pattern = ExamplePattern.valueOf(it) }
                ) {
                    when (pattern) {
                    ExamplePattern.Release -> ReleasePattern(
                        wide,
                        projectName,
                        { projectName = it },
                        accessibilityReview,
                        { accessibilityReview = it },
                        releaseState,
                        { releaseState = it },
                        releaseLoading,
                        { releaseLoading = true },
                        {
                            releaseLoading = false
                            releaseState = ExampleState.Success
                        },
                        { showResetDialog = true }
                    )
                    ExamplePattern.Health -> HealthPattern(catalog, releaseState) { releaseState = it }
                    ExamplePattern.Profile -> ProfilePattern(
                        wide,
                        profileName,
                        { profileName = it },
                        profileEmail,
                        { profileEmail = it },
                        role,
                        { role = it },
                        updatesEnabled,
                        { updatesEnabled = it },
                        { showSavedToast = true }
                    )
                    }
                }
            }
        }
        if (showSavedToast) {
            LumenToast(
                title = "Profile saved",
                modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp),
                description = "Local example preferences were updated.",
                variant = com.santi020k.lumen.LumenBannerVariant.Success,
                onDismiss = { showSavedToast = false }
            )
        }
    }
    LumenAlertDialog(
        visible = showResetDialog,
        title = "Reset release example?",
        description = "The local workflow will return to its reviewed state.",
        confirmLabel = "Reset",
        destructive = true,
        onConfirm = {
            projectName = "Lumen Android"
            accessibilityReview = true
            releaseState = ExampleState.Success
            releaseLoading = false
            showResetDialog = false
        },
        onDismiss = { showResetDialog = false }
    )
}

@Composable
private fun ReleasePattern(
    wide: Boolean,
    projectName: String,
    onProjectNameChange: (String) -> Unit,
    accessibilityReview: Boolean,
    onAccessibilityReviewChange: (Boolean) -> Unit,
    state: ExampleState,
    onStateChange: (ExampleState) -> Unit,
    loading: Boolean,
    onPrepare: () -> Unit,
    onComplete: () -> Unit,
    onReset: () -> Unit
) {
    val editor: @Composable () -> Unit = {
        LumenCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                LumenSectionHeader(title = "Release checklist", subtitle = "Prepare a local Android review")
                LumenTextField(
                    value = projectName,
                    onValueChange = onProjectNameChange,
                    label = "Release name",
                    error = projectName.isBlank(),
                    errorMessage = if (projectName.isBlank()) "Enter a release name." else null,
                    modifier = Modifier.fillMaxWidth()
                )
                LumenCheckbox(
                    label = "Accessibility review complete",
                    description = "Labels, focus, contrast, large text, and TalkBack were considered.",
                    checked = accessibilityReview,
                    onCheckedChange = onAccessibilityReviewChange
                )
                LumenButtonGroup {
                    LumenButton(
                        onClick = onPrepare,
                        loading = loading,
                        enabled = projectName.isNotBlank() && accessibilityReview
                    ) { Text("Prepare") }
                    if (loading) {
                        LumenButton(onClick = onComplete, intent = LumenButtonIntent.Secondary) {
                            Text("Complete check")
                        }
                    } else {
                        LumenButton(onClick = {}, enabled = false, intent = LumenButtonIntent.Secondary) {
                            Text("Publish unavailable")
                        }
                    }
                }
            }
        }
    }
    val preview: @Composable () -> Unit = {
        LumenSurface(
            modifier = Modifier.fillMaxWidth(),
            tone = LumenSurfaceTone.Muted,
            padding = LumenSurfacePadding.Lg
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                LumenSectionHeader(title = "State preview", subtitle = "Interactive release outcomes")
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    ExampleState.entries.forEach { option ->
                        LumenChip(option.name, selected = state == option, onClick = { onStateChange(option) })
                    }
                }
                ExampleStateContent(state, onStateChange)
                LumenButton(onClick = onReset, intent = LumenButtonIntent.Danger) { Text("Reset example") }
            }
        }
    }
    if (wide) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(20.dp)) {
            Column(modifier = Modifier.weight(1f)) { editor() }
            Column(modifier = Modifier.weight(1f)) { preview() }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) { editor(); preview() }
    }
}

@Composable
private fun ExampleStateContent(state: ExampleState, onStateChange: (ExampleState) -> Unit) {
    when (state) {
        ExampleState.Loading -> Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                LumenSkeleton(width = 40.dp, height = 40.dp, shape = LumenSkeletonShape.Circle)
                Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    LumenSkeleton(width = 170.dp, height = 14.dp, label = "Loading release review")
                    LumenSkeleton(width = 110.dp, height = 10.dp)
                }
            }
            LumenButton(onClick = { onStateChange(ExampleState.Success) }, intent = LumenButtonIntent.Secondary) {
                Text("Finish loading")
            }
        }
        ExampleState.Empty -> LumenEmptyState(
            title = "No release notes",
            description = "Add the first reviewed change to continue.",
            graphic = {
                LumenIllustration(
                    variant = LumenIllustrationVariant.Empty,
                    size = LumenIllustrationSize.Sm,
                    label = "Empty release notes"
                )
            },
            actions = {
                LumenButton(onClick = { onStateChange(ExampleState.Success) }) { Text("Add example note") }
            }
        )
        ExampleState.Error -> Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            LumenAlert(variant = LumenAlertVariant.Destructive) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    LumenText("Review blocked", variant = LumenTextVariant.Label, tone = LumenTextTone.Danger)
                    LumenText("Accessibility evidence is missing.", tone = LumenTextTone.Soft)
                }
            }
            LumenButton(onClick = { onStateChange(ExampleState.Success) }, intent = LumenButtonIntent.Secondary) {
                Text("Restore reviewed state")
            }
        }
        ExampleState.Success -> LumenAlert(variant = LumenAlertVariant.Success) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                LumenText("Ready for review", variant = LumenTextVariant.Label, tone = LumenTextTone.Success)
                LumenText("The local checklist is complete.", tone = LumenTextTone.Soft)
            }
        }
    }
}

@Composable
private fun HealthPattern(
    catalog: List<CatalogCategorySummary>,
    state: ExampleState,
    onStateChange: (ExampleState) -> Unit
) {
    val largestCategories = catalog.sortedByDescending { it.componentCount }.take(6)
    val series = remember(catalog) {
        LumenChartSeries(
            id = "catalog",
            label = "Components",
            tone = LumenChartTone.Accent,
            data = largestCategories.map {
                LumenChartDatum(it.name, LumenChartX.Category(it.name), it.componentCount.toDouble())
            }
        )
    }
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            LumenStat(
                label = "Components",
                value = catalog.sumOf { it.componentCount }.toString(),
                detail = "Current public catalog",
                tone = LumenMetricTone.Accent,
                modifier = Modifier.weight(1f)
            )
            LumenStat(
                label = "Categories",
                value = catalog.size.toString(),
                detail = "Search filters",
                tone = LumenMetricTone.Success,
                modifier = Modifier.weight(1f)
            )
        }
        LumenCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                LumenSectionHeader(
                    title = "Catalog distribution",
                    subtitle = "Largest six categories by checked-in component count"
                )
                LumenBarChart(
                    series = listOf(series),
                    label = "Component counts for the six largest Android catalog categories",
                    showData = false
                )
            }
        }
        LumenSurface(tone = LumenSurfaceTone.Muted, padding = LumenSurfacePadding.Lg) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                LumenSectionHeader(title = "Health state", subtitle = "Change the operational outcome")
                LumenSegmentedControl(
                    label = "Catalog health state",
                    options = ExampleState.entries.map { LumenSelectionOption(it.name, it.name) },
                    value = state.name,
                    onValueChange = { onStateChange(ExampleState.valueOf(it)) }
                )
                ExampleStateContent(state, onStateChange)
            }
        }
    }
}

@Composable
private fun ProfilePattern(
    wide: Boolean,
    name: String,
    onNameChange: (String) -> Unit,
    email: String,
    onEmailChange: (String) -> Unit,
    role: String,
    onRoleChange: (String) -> Unit,
    updatesEnabled: Boolean,
    onUpdatesEnabledChange: (Boolean) -> Unit,
    onSave: () -> Unit
) {
    val fields: @Composable () -> Unit = {
        LumenCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                LumenSectionHeader(title = "Reference profile", subtitle = "A compact onboarding composition")
                LumenTextField(
                    value = name,
                    onValueChange = onNameChange,
                    label = "Display name",
                    error = name.isBlank(),
                    errorMessage = if (name.isBlank()) "Enter a display name." else null,
                    modifier = Modifier.fillMaxWidth()
                )
                LumenTextField(
                    value = email,
                    onValueChange = onEmailChange,
                    label = "Email",
                    error = !email.contains("@"),
                    errorMessage = if (!email.contains("@")) "Enter a valid email address." else null,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
    val preferences: @Composable () -> Unit = {
        LumenSurface(
            modifier = Modifier.fillMaxWidth(),
            tone = LumenSurfaceTone.Muted,
            padding = LumenSurfacePadding.Lg
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                LumenSectionHeader(title = "Preferences", subtitle = "Role and local example updates")
                LumenSegmentedControl(
                    label = "Primary role",
                    options = listOf(
                        LumenSelectionOption("designer", "Design"),
                        LumenSelectionOption("developer", "Develop"),
                        LumenSelectionOption("reviewer", "Review")
                    ),
                    value = role,
                    onValueChange = onRoleChange
                )
                LumenToggle(
                    label = "Show release update examples",
                    description = "This changes local demonstration state only.",
                    checked = updatesEnabled,
                    onCheckedChange = onUpdatesEnabledChange
                )
                LumenButton(onClick = onSave, enabled = name.isNotBlank() && email.contains("@")) {
                    Text("Save profile")
                }
            }
        }
    }
    if (wide) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(20.dp)) {
            Column(modifier = Modifier.weight(1f)) { fields() }
            Column(modifier = Modifier.weight(1f)) { preferences() }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) { fields(); preferences() }
    }
}

@Composable
private fun SettingsScreen(
    darkTheme: Boolean,
    themePreset: PlaygroundThemePreset,
    onThemePresetChange: (PlaygroundThemePreset) -> Unit,
    onToggleTheme: () -> Unit
) {
    var reduceMotion by remember { mutableStateOf(false) }
    var showHints by remember { mutableStateOf(true) }
    var status by remember { mutableStateOf("Preferences are local to this session") }
    val uriHandler = LocalUriHandler.current
    ResponsiveScreen { wide ->
        item {
            DestinationHeader("Local", "Settings", "Preview theme, accessibility context, and application details.")
        }
        item {
            if (wide) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        AppearanceSettings(
                            darkTheme,
                            themePreset,
                            reduceMotion,
                            onThemePresetChange,
                            onToggleTheme,
                            onMotionChange = {
                                reduceMotion = it
                                status = if (it) "Decorative motion reduced" else "Standard motion restored"
                            },
                            onStatus = { status = it }
                        )
                    }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        AccessibilitySettings(showHints) {
                            showHints = it
                            status = if (it) "Accessibility guidance shown" else "Guidance hidden"
                        }
                    }
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    AppearanceSettings(
                        darkTheme,
                        themePreset,
                        reduceMotion,
                        onThemePresetChange,
                        onToggleTheme,
                        onMotionChange = {
                            reduceMotion = it
                            status = if (it) "Decorative motion reduced" else "Standard motion restored"
                        },
                        onStatus = { status = it }
                    )
                    AccessibilitySettings(showHints) {
                        showHints = it
                        status = if (it) "Accessibility guidance shown" else "Guidance hidden"
                    }
                    RuntimeLocalizationSettings()
                    ApplicationSettings()
                    ResourceSettings(uriHandler)
                }
            }
        }
        if (wide) {
            item { RuntimeLocalizationSettings() }
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                    Column(modifier = Modifier.weight(1f)) { ApplicationSettings() }
                    Column(modifier = Modifier.weight(1f)) { ResourceSettings(uriHandler) }
                }
            }
        }
        item { LumenStatusBar(message = status, tone = LumenMetricTone.Accent) }
    }
}

@Composable
private fun ThemePreview(
    darkTheme: Boolean,
    themePreset: PlaygroundThemePreset,
    onThemePresetChange: (PlaygroundThemePreset) -> Unit,
    onToggleTheme: () -> Unit,
    onStatus: (String) -> Unit
) {
    LumenSurface(
        modifier = Modifier.fillMaxWidth(),
        tone = LumenSurfaceTone.Muted,
        padding = LumenSurfacePadding.Lg
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                LumenGraphic(
                    modifier = Modifier.size(64.dp),
                    size = LumenGraphicSize.Sm,
                    tone = if (darkTheme) LumenGraphicTone.Accent else LumenGraphicTone.Brand,
                    variant = LumenGraphicVariant.Glow,
                    label = if (darkTheme) "Dark theme preview" else "Light theme preview"
                ) { LumenIcon(LumenIconName.Sparkles, contentDescription = null) }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    LumenText(
                        "${themePreset.label} · ${if (darkTheme) "Dark" else "Light"}",
                        variant = LumenTextVariant.Label
                    )
                    LumenText(
                        "Canvas, surface, ink, and brand roles update together.",
                        variant = LumenTextVariant.Caption,
                        tone = LumenTextTone.Muted
                    )
                }
            }
            LumenPicker(
                label = "Theme",
                value = themePreset.name,
                options = PlaygroundThemePreset.entries.map { preset ->
                    LumenPickerOption(preset.name, preset.label)
                },
                onValueChange = { value ->
                    PlaygroundThemePreset.entries.firstOrNull { it.name == value }?.let { preset ->
                        onThemePresetChange(preset)
                        onStatus("${preset.label} theme applied")
                    }
                }
            )
            LumenToggle(
                label = "Dark theme",
                checked = darkTheme,
                onCheckedChange = {
                    onToggleTheme()
                    onStatus(if (darkTheme) "Light theme applied" else "Dark theme applied")
                }
            )
        }
    }
}

@Composable
private fun AppearanceSettings(
    darkTheme: Boolean,
    themePreset: PlaygroundThemePreset,
    reduceMotion: Boolean,
    onThemePresetChange: (PlaygroundThemePreset) -> Unit,
    onToggleTheme: () -> Unit,
    onMotionChange: (Boolean) -> Unit,
    onStatus: (String) -> Unit
) {
    SettingsGroup("Appearance", "Motion and platform preferences") {
        ThemePreview(darkTheme, themePreset, onThemePresetChange, onToggleTheme, onStatus)
        LumenDivider()
        LumenSettingsRow(title = "Reduce decorative motion", description = "Keep transitions quiet and functional") {
            LumenToggle(
                label = "Reduce decorative motion",
                checked = reduceMotion,
                showLabel = false,
                onCheckedChange = onMotionChange
            )
        }
        LumenDivider()
        LumenSettingsRow(title = "Text and display size", description = "Managed by Android settings") {
            LumenBadge("System", tone = LumenBadgeTone.Neutral)
        }
    }
}

@Composable
private fun AccessibilitySettings(showHints: Boolean, onHintsChange: (Boolean) -> Unit) {
    SettingsGroup("Accessibility", "TalkBack, contrast, focus, and scaling") {
        LumenSettingsRow(title = "Review guidance", description = "Show inclusive design reminders") {
            LumenToggle(
                label = "Accessibility guidance",
                checked = showHints,
                showLabel = false,
                onCheckedChange = onHintsChange
            )
        }
        LumenDivider()
        if (showHints) {
            LumenAlert {
                LumenText(
                    "TalkBack and scaling follow Android system settings; controls retain labeled touch targets.",
                    tone = LumenTextTone.Soft
                )
            }
        } else {
            LumenStatusBar(message = "Accessibility guidance hidden")
        }
    }
}

@Composable
private fun RuntimeLocalizationSettings() {
    var locale by remember { mutableStateOf(PlaygroundLocale.English) }
    var releaseNote by remember { mutableStateOf("") }
    var validated by remember { mutableStateOf(false) }
    val spanish = locale == PlaygroundLocale.Spanish
    val errorMessage = if (validated && releaseNote.isBlank()) {
        if (spanish) "La nota de la versión es obligatoria." else "A release note is required."
    } else {
        null
    }

    SettingsGroup("Runtime localization", "Switch application-owned English and Spanish copy") {
        LumenSegmentedControl(
            label = "Language",
            options = PlaygroundLocale.entries.map { LumenSelectionOption(it.name, it.label) },
            value = locale.name,
            onValueChange = { value ->
                locale = PlaygroundLocale.valueOf(value)
                validated = false
            }
        )
        LumenTextarea(
            value = releaseNote,
            onValueChange = {
                releaseNote = it
                validated = false
            },
            label = if (spanish) "Nota de la versión" else "Release note",
            description = if (spanish) {
                "Describe qué cambió para tus usuarios."
            } else {
                "Describe what changed for your users."
            },
            errorMessage = errorMessage
        )
        LumenButton(onClick = { validated = true }) {
            Text(if (spanish) "Validar nota" else "Validate note")
        }
        if (validated && errorMessage == null) {
            LumenAlert(variant = LumenAlertVariant.Success) {
                LumenText(
                    if (spanish) "La nota de la versión está lista." else "The release note is ready.",
                    tone = LumenTextTone.Success
                )
            }
        }
    }
}

@Composable
private fun ApplicationSettings() {
    SettingsGroup("App and platform", "Platform, build, and privacy") {
        LumenSettingsRow(title = "Platform", description = "Android · Jetpack Compose") {
            LumenBadge("Native", tone = LumenBadgeTone.Success)
        }
        LumenDivider()
        LumenSettingsRow(title = "Version", description = BuildConfig.VERSION_NAME) {
            LumenBadge("${BuildConfig.VERSION_CODE}", tone = LumenBadgeTone.Neutral)
        }
        LumenDivider()
        LumenSettingsRow(title = "Data collection", description = "No account, analytics, or remote storage") {
            LumenBadge("None", tone = LumenBadgeTone.Success)
        }
    }
}

@Composable
private fun ResourceSettings(uriHandler: UriHandler) {
    SettingsGroup("Privacy and resources", "Documentation, privacy, and support") {
        ResourceButton("Android documentation") { uriHandler.openUri("https://lumen.santi020k.com/docs/android") }
        ResourceButton("Privacy") { uriHandler.openUri("https://lumen.santi020k.com/privacy") }
        ResourceButton("Support") { uriHandler.openUri("https://lumen.santi020k.com/support") }
        ResourceButton("santi020k") { uriHandler.openUri("https://santi020k.com") }
    }
}

@Composable
private fun SettingsGroup(title: String, description: String, content: @Composable () -> Unit) {
    LumenCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
            LumenSectionHeader(title = title, subtitle = description)
            LumenDivider()
            content()
        }
    }
}

@Composable
private fun ResourceButton(label: String, onClick: () -> Unit) {
    LumenButton(onClick = onClick, intent = LumenButtonIntent.Secondary, modifier = Modifier.fillMaxWidth()) {
        Text(label)
    }
}

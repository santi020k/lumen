package com.santi020k.lumen.playground.compose

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import com.santi020k.lumen.LumenAlert
import com.santi020k.lumen.LumenAlertDialog
import com.santi020k.lumen.LumenAdaptiveNavigationScaffold
import com.santi020k.lumen.LumenAlertVariant
import com.santi020k.lumen.LumenAvatar
import com.santi020k.lumen.LumenAvatarSize
import com.santi020k.lumen.LumenBadge
import com.santi020k.lumen.LumenBadgeTone
import com.santi020k.lumen.LumenBanner
import com.santi020k.lumen.LumenBannerVariant
import com.santi020k.lumen.LumenBackdrop
import com.santi020k.lumen.LumenBackdropIntensity
import com.santi020k.lumen.LumenBackdropTone
import com.santi020k.lumen.LumenBackdropVariant
import com.santi020k.lumen.LumenButton
import com.santi020k.lumen.LumenButtonGroup
import com.santi020k.lumen.LumenButtonIntent
import com.santi020k.lumen.LumenBarChart
import com.santi020k.lumen.LumenCard
import com.santi020k.lumen.LumenCardVariant
import com.santi020k.lumen.LumenCheckbox
import com.santi020k.lumen.LumenChip
import com.santi020k.lumen.LumenChartDatum
import com.santi020k.lumen.LumenChartSeries
import com.santi020k.lumen.LumenChartX
import com.santi020k.lumen.LumenComboChart
import com.santi020k.lumen.LumenComboMark
import com.santi020k.lumen.LumenDateField
import com.santi020k.lumen.LumenDateRangeField
import com.santi020k.lumen.LumenDateRangeSelection
import com.santi020k.lumen.LumenDivider
import com.santi020k.lumen.LumenDisclosure
import com.santi020k.lumen.LumenEmptyState
import com.santi020k.lumen.LumenErrorState
import com.santi020k.lumen.LumenErrorStateKind
import com.santi020k.lumen.LumenFieldGroup
import com.santi020k.lumen.LumenFloatingActionButton
import com.santi020k.lumen.LumenFloatingActionButtonIntent
import com.santi020k.lumen.LumenFloatingActionButtonSize
import com.santi020k.lumen.LumenGauge
import com.santi020k.lumen.LumenGraphic
import com.santi020k.lumen.LumenGraphicSize
import com.santi020k.lumen.LumenGraphicTone
import com.santi020k.lumen.LumenGraphicVariant
import com.santi020k.lumen.LumenHeatmap
import com.santi020k.lumen.LumenHeatmapDatum
import com.santi020k.lumen.LumenIcon
import com.santi020k.lumen.LumenIconButton
import com.santi020k.lumen.LumenIconName
import com.santi020k.lumen.LumenImage
import com.santi020k.lumen.LumenIllustration
import com.santi020k.lumen.LumenIllustrationSize
import com.santi020k.lumen.LumenIllustrationVariant
import com.santi020k.lumen.LumenListRow
import com.santi020k.lumen.LumenLineChart
import com.santi020k.lumen.LumenMetricTone
import com.santi020k.lumen.LumenMenu
import com.santi020k.lumen.LumenMenuItem
import com.santi020k.lumen.LumenNavigationBadge
import com.santi020k.lumen.LumenNavigationBar
import com.santi020k.lumen.LumenNavigationBarAccessory
import com.santi020k.lumen.LumenNavigationItem
import com.santi020k.lumen.LumenProgress
import com.santi020k.lumen.LumenPicker
import com.santi020k.lumen.LumenPickerOption
import com.santi020k.lumen.LumenPhoneCountries
import com.santi020k.lumen.LumenPhoneInput
import com.santi020k.lumen.LumenPhoneNumber
import com.santi020k.lumen.LumenPieChart
import com.santi020k.lumen.LumenRadioGroup
import com.santi020k.lumen.LumenRangeChart
import com.santi020k.lumen.LumenRangeDatum
import com.santi020k.lumen.LumenSearchField
import com.santi020k.lumen.LumenScatterChart
import com.santi020k.lumen.LumenSectionHeader
import com.santi020k.lumen.LumenSettingsRow
import com.santi020k.lumen.LumenShareButton
import com.santi020k.lumen.LumenSharePayload
import com.santi020k.lumen.LumenSheet
import com.santi020k.lumen.LumenSegmentedControl
import com.santi020k.lumen.LumenSelectionOption
import com.santi020k.lumen.LumenSkeleton
import com.santi020k.lumen.LumenSkeletonShape
import com.santi020k.lumen.LumenSpinner
import com.santi020k.lumen.LumenSparkline
import com.santi020k.lumen.LumenSlider
import com.santi020k.lumen.LumenStat
import com.santi020k.lumen.LumenStatusBar
import com.santi020k.lumen.LumenSurface
import com.santi020k.lumen.LumenSurfacePadding
import com.santi020k.lumen.LumenSurfaceRadius
import com.santi020k.lumen.LumenSurfaceTone
import com.santi020k.lumen.LumenTabs
import com.santi020k.lumen.LumenText
import com.santi020k.lumen.LumenTextField
import com.santi020k.lumen.LumenTextarea
import com.santi020k.lumen.LumenTextTone
import com.santi020k.lumen.LumenTextVariant
import com.santi020k.lumen.LumenColorPalette
import com.santi020k.lumen.LumenTheme
import com.santi020k.lumen.LumenThemeValues
import com.santi020k.lumen.LumenToggle
import com.santi020k.lumen.LumenToast
import com.santi020k.lumen.lumenNavigationBarScrollBehavior
import com.santi020k.lumen.rememberLumenNavigationBarScrollState

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LumenAndroidPlayground(
                initialDarkTheme = intent.getBooleanExtra(DARK_THEME_EXTRA, false),
                initialComponent = intent.getStringExtra(COMPONENT_EXTRA).orEmpty()
            )
        }
    }

    private companion object {
        const val COMPONENT_EXTRA = "component"
        const val DARK_THEME_EXTRA = "darkTheme"
    }
}

internal enum class PlaygroundThemePreset(val label: String) {
    Lumen("Lumen"),
    Santi020k("santi020k");

    fun values(darkTheme: Boolean): LumenThemeValues = LumenThemeValues(
        colors = when {
            this == Santi020k && darkTheme -> santi020kDark
            this == Santi020k -> santi020kLight
            darkTheme -> com.santi020k.lumen.LumenColors.Dark
            else -> com.santi020k.lumen.LumenColors.Light
        },
        isDark = darkTheme
    )

    private companion object {
        val santi020kLight = palette(
            0xFFFAF9FB, 0xFFFFFFFF, 0xFFF5F3F7, 0xFFE5E2E9, 0xFFD6D0DC,
            0xFF332E38, 0xFF5B5463, 0xFF47434C, 0xFF620AE6, 0xFF5709CE,
            0xFFEEE7F9, 0xFF7D29FA, 0xFF16A249, 0xFFF59F0A, 0xFFEF4343, 0xFF000000
        )
        val santi020kDark = palette(
            0xFF110C1D, 0xFF1C1528, 0xFF231D30, 0xFF322B40, 0xFF494158,
            0xFFDFDDE3, 0xFFB6B2BD, 0xFF8D8896, 0xFFA56EF7, 0xFF6F16F3,
            0xFF2A1943, 0xFF9F64F7, 0xFF21C45D, 0xFFF6A823, 0xFFF15B5B, 0xFF110C1D
        )

        fun palette(
            canvas: Long, surface: Long, surfaceMuted: Long, surfaceStrong: Long, line: Long,
            ink: Long, inkSoft: Long, inkMuted: Long, brand: Long, brandSolid: Long,
            brandSoft: Long, accent: Long, success: Long, warning: Long, danger: Long, onDanger: Long
        ) = LumenColorPalette(
            canvas = androidx.compose.ui.graphics.Color(canvas),
            surface = androidx.compose.ui.graphics.Color(surface),
            surfaceMuted = androidx.compose.ui.graphics.Color(surfaceMuted),
            surfaceStrong = androidx.compose.ui.graphics.Color(surfaceStrong),
            line = androidx.compose.ui.graphics.Color(line),
            ink = androidx.compose.ui.graphics.Color(ink),
            inkSoft = androidx.compose.ui.graphics.Color(inkSoft),
            inkMuted = androidx.compose.ui.graphics.Color(inkMuted),
            brand = androidx.compose.ui.graphics.Color(brand),
            brandSolid = androidx.compose.ui.graphics.Color(brandSolid),
            brandSoft = androidx.compose.ui.graphics.Color(brandSoft),
            onBrand = androidx.compose.ui.graphics.Color.White,
            accent = androidx.compose.ui.graphics.Color(accent),
            success = androidx.compose.ui.graphics.Color(success),
            warning = androidx.compose.ui.graphics.Color(warning),
            danger = androidx.compose.ui.graphics.Color(danger),
            onDanger = androidx.compose.ui.graphics.Color(onDanger)
        )
    }
}

@Composable
private fun LumenAndroidPlayground(initialComponent: String, initialDarkTheme: Boolean) {
    var darkTheme by remember(initialDarkTheme) { mutableStateOf(initialDarkTheme) }
    var themePreset by remember { mutableStateOf(PlaygroundThemePreset.Lumen) }

    LumenTheme(darkTheme = darkTheme, values = themePreset.values(darkTheme)) {
        if (initialComponent.isNotBlank()) {
            PlaygroundContent(
                darkTheme = darkTheme,
                initialComponent = initialComponent,
                enhancedDiscovery = false,
                onToggleTheme = { darkTheme = !darkTheme }
            )
        } else {
            LumenReferenceApplication(
                darkTheme = darkTheme,
                themePreset = themePreset,
                onThemePresetChange = { themePreset = it },
                onToggleTheme = { darkTheme = !darkTheme },
                catalog = playgroundSections.map { section ->
                    CatalogCategorySummary(section.title, section.names.size)
                },
                components = {
                    PlaygroundContent(
                        darkTheme = darkTheme,
                        initialComponent = "",
                        enhancedDiscovery = true,
                        onToggleTheme = { darkTheme = !darkTheme }
                    )
                }
            )
        }
    }
}

@Composable
private fun PlaygroundContent(
    darkTheme: Boolean,
    initialComponent: String,
    enhancedDiscovery: Boolean,
    onToggleTheme: () -> Unit
) {
    var email by remember { mutableStateOf("hello@lumen.dev") }
    var notificationsEnabled by remember { mutableStateOf(true) }
    var accessibilityReviewed by remember { mutableStateOf(false) }
    var profile by remember { mutableStateOf("balanced") }
    var density by remember { mutableStateOf("comfortable") }
    var disclosureExpanded by remember { mutableStateOf(true) }
    var query by remember(initialComponent) { mutableStateOf(initialComponent) }
    var saved by remember { mutableStateOf(false) }
    var showBanner by remember { mutableStateOf(true) }
    var selectedCategory by remember(enhancedDiscovery) {
        mutableStateOf(if (enhancedDiscovery) playgroundSections.first().title else ALL_CATEGORIES)
    }
    val visibleSections = playgroundSections.filter { section ->
        (selectedCategory == ALL_CATEGORIES || section.title == selectedCategory) &&
            (query.isBlank() || section.names.any { it.contains(query, ignoreCase = true) })
    }
    val visibleCount = visibleSections.sumOf { section ->
        section.names.count { query.isBlank() || it.contains(query, ignoreCase = true) }
    }

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
                if (enhancedDiscovery) {
                    CatalogHeader(darkTheme = darkTheme, onToggleTheme = onToggleTheme)
                } else {
                    CaptureCatalogHeader(darkTheme = darkTheme, onToggleTheme = onToggleTheme)
                }
            }

            item {
                LumenSearchField(
                    value = query,
                    onValueChange = { value ->
                        query = value
                        if (enhancedDiscovery && value.isNotBlank()) selectedCategory = ALL_CATEGORIES
                    },
                    prompt = "Search components",
                    modifier = Modifier.fillMaxWidth()
                ) {
                    LumenIcon(LumenIconName.Search, contentDescription = null)
                }
            }

            if (enhancedDiscovery) {
                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(listOf(ALL_CATEGORIES) + playgroundSections.map { it.title }) { category ->
                            LumenChip(
                                label = category,
                                selected = category == selectedCategory,
                                onClick = {
                                    selectedCategory = category
                                    query = ""
                                }
                            )
                        }
                    }
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    LumenText("$visibleCount components", variant = LumenTextVariant.Label)
                    LumenText(
                        if (enhancedDiscovery) "$selectedCategory · Android" else "Android · Compose",
                        variant = LumenTextVariant.Caption,
                        tone = LumenTextTone.Muted
                    )
                }
            }

            items(visibleSections, key = { it.title }) { section ->
                ComponentSection(section) {
                    when (section.title) {
                        "Foundations" -> Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            FoundationsExample()
                            VisualContentExample()
                        }
                        "Actions" -> Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            ActionsExample()
                            SystemActionsExample()
                        }
                        "Forms" -> FormsExample(
                            email = email,
                            onEmailChange = { email = it },
                            notificationsEnabled = notificationsEnabled,
                            onNotificationsChange = { notificationsEnabled = it },
                            accessibilityReviewed = accessibilityReviewed,
                            onAccessibilityReviewedChange = { accessibilityReviewed = it },
                            profile = profile,
                            onProfileChange = { profile = it },
                            density = density,
                            onDensityChange = { density = it }
                        )
                        "Feedback" -> Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            FeedbackExample(
                                showBanner = showBanner,
                                onBannerVisibilityChange = { showBanner = it }
                            )
                            FeedbackStatesExample()
                        }
                        "Data" -> Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            DataExample(saved = saved, onToggleSaved = { saved = !saved })
                            DisclosureExample(
                                expanded = disclosureExpanded,
                                onExpandedChange = { disclosureExpanded = it }
                            )
                            ChartExample(
                                section.names.filterTo(mutableSetOf()) { name ->
                                    query.isBlank() || name.contains(query, ignoreCase = true)
                                }
                            )
                        }
                        "Navigation" -> Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            NavigationOverlaysExample(initialComponent)
                            NavigationExample(initialComponent)
                        }
                    }
                }
            }

            if (visibleSections.isEmpty()) {
                item {
                    LumenEmptyState(
                        title = "No matching component",
                        description = "Try another component name or reset the catalog.",
                        graphic = { LumenIcon(LumenIconName.Search, contentDescription = null) },
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

            if (query.isBlank()) {
                item {
                    AboutPlayground()
                }
            }

            item {
                LumenStatusBar(
                    message = "Built with lumen-compose",
                    tone = LumenMetricTone.Success,
                    trailing = {
                        LumenText(
                            "${playgroundSections.flatMap { it.names }.toSet().size} components",
                            variant = LumenTextVariant.Caption,
                            tone = LumenTextTone.Muted
                        )
                    }
                )
            }
        }
    }
}

private const val ALL_CATEGORIES = "All"

@Composable
private fun CatalogHeader(darkTheme: Boolean, onToggleTheme: () -> Unit) {
    LumenSurface(
        modifier = Modifier.fillMaxWidth(),
        tone = LumenSurfaceTone.Muted,
        padding = LumenSurfacePadding.Lg
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            LumenGraphic(
                modifier = Modifier.size(64.dp),
                size = LumenGraphicSize.Sm,
                tone = LumenGraphicTone.Brand,
                variant = LumenGraphicVariant.Grid,
                label = "Lumen component catalog"
            ) {
                LumenIcon(LumenIconName.Search, contentDescription = null)
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                LumenText("Component catalog", variant = LumenTextVariant.Title)
                LumenText(
                    "Search every public primitive or focus the catalog by category.",
                    variant = LumenTextVariant.Caption,
                    tone = LumenTextTone.Muted
                )
            }
            LumenButton(onClick = onToggleTheme, intent = LumenButtonIntent.Secondary) {
                Text(if (darkTheme) "Light" else "Dark")
            }
        }
    }
}

@Composable
private fun CaptureCatalogHeader(darkTheme: Boolean, onToggleTheme: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalAlignment = Alignment.Top
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            LumenBadge("Jetpack Compose", tone = LumenBadgeTone.Success)
            LumenText("Lumen Playground", variant = LumenTextVariant.Title)
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

@Composable
private fun AboutPlayground() {
    val uriHandler = LocalUriHandler.current

    LumenCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            LumenText("About Lumen Playground", variant = LumenTextVariant.Label)
            LumenText(
                "A living, offline catalog for evaluating Lumen's native Compose components.",
                variant = LumenTextVariant.Caption,
                tone = LumenTextTone.Muted
            )
            LumenDivider()
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                LumenBadge("Version ${BuildConfig.VERSION_NAME}", tone = LumenBadgeTone.Accent)
                LumenBadge("No data collection", tone = LumenBadgeTone.Success)
            }
            LumenText(
                "Search the complete catalog, exercise interactive states, and compare light and dark themes without creating an account.",
                tone = LumenTextTone.Soft
            )
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                LumenButton(
                    onClick = { uriHandler.openUri("https://lumen.santi020k.com/docs/android") },
                    intent = LumenButtonIntent.Secondary
                ) {
                    Text("Documentation")
                }
                LumenButton(
                    onClick = { uriHandler.openUri("https://lumen.santi020k.com/support") },
                    intent = LumenButtonIntent.Secondary
                ) {
                    Text("Support")
                }
                LumenButton(
                    onClick = { uriHandler.openUri("https://lumen.santi020k.com/privacy") },
                    intent = LumenButtonIntent.Secondary
                ) {
                    Text("Privacy")
                }
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
                    LumenIcon(LumenIconName.Search, contentDescription = "Search")
                    LumenIcon(LumenIconName.BrandGithub, contentDescription = "GitHub")
                    LumenText("Shared native foundations", variant = LumenTextVariant.Label)
                }
                LumenIconButton(
                    name = LumenIconName.Check,
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
    var designSelected by remember { mutableStateOf(true) }

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        LumenButtonGroup {
            LumenButton(onClick = {}) { Text("Primary") }
            LumenButton(onClick = {}, intent = LumenButtonIntent.Secondary) { Text("Secondary") }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            LumenButton(onClick = {}, intent = LumenButtonIntent.Danger) { Text("Danger") }
            LumenButton(onClick = {}, loading = true) { Text("Loading") }
            LumenButton(onClick = {}, enabled = false) { Text("Disabled") }
            LumenChip(
                label = "Design",
                selected = designSelected,
                onClick = { designSelected = !designSelected }
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            LumenFloatingActionButton(
                imageVector = Icons.Default.Add,
                contentDescription = "Create component",
                onClick = {}
            )
            LumenFloatingActionButton(
                imageVector = Icons.Default.Add,
                contentDescription = "Create urgent component",
                onClick = {},
                intent = LumenFloatingActionButtonIntent.Danger,
                size = LumenFloatingActionButtonSize.Small
            )
        }
    }
}

@Composable
private fun FormsExample(
    email: String,
    onEmailChange: (String) -> Unit,
    notificationsEnabled: Boolean,
    onNotificationsChange: (Boolean) -> Unit,
    accessibilityReviewed: Boolean,
    onAccessibilityReviewedChange: (Boolean) -> Unit,
    profile: String,
    onProfileChange: (String) -> Unit,
    density: String,
    onDensityChange: (String) -> Unit
) {
    var notes by remember { mutableStateOf("Native components now share one documented contract.") }
    var pickerProfile by remember { mutableStateOf("balanced") }
    var sliderValue by remember { mutableStateOf(72f) }
    var activeTab by remember { mutableStateOf("overview") }
    var releaseDateMillis by remember { mutableStateOf<Long?>(null) }
    var releaseRange by remember {
        mutableStateOf(LumenDateRangeSelection(startDateMillis = null, endDateMillis = null))
    }
    val defaultPhoneCountry = remember {
        requireNotNull(LumenPhoneCountries.forRegion("CO"))
    }
    var careTeamPhone by remember {
        mutableStateOf(LumenPhoneNumber.empty(defaultPhoneCountry))
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        LumenTextField(
            value = email,
            onValueChange = onEmailChange,
            label = "Email address",
            modifier = Modifier.fillMaxWidth()
        )
        LumenPhoneInput(
            value = careTeamPhone,
            onValueChange = { careTeamPhone = it },
            label = "Care team phone number",
            description = careTeamPhone.e164 ?: "Choose a country and enter the complete number."
        )
        LumenTextarea(
            value = notes,
            onValueChange = { notes = it },
            label = "Release notes",
            description = "Summarize the native release."
        )
        LumenFieldGroup(
            label = "Publication checks",
            description = "Contained controls retain independent focus and labels.",
            required = true
        ) {
            LumenCheckbox(
                label = "Confirm accessibility review",
                checked = accessibilityReviewed,
                onCheckedChange = onAccessibilityReviewedChange
            )
        }
        LumenTextField(
            value = "lumen playground",
            onValueChange = {},
            label = "Project slug",
            error = true,
            errorMessage = "Use letters, numbers, and hyphens.",
            modifier = Modifier.fillMaxWidth()
        )
        LumenDateField(
            label = "Release date",
            value = releaseDateMillis,
            onValueChange = { releaseDateMillis = it },
            description = "Choose when this component becomes available."
        )
        LumenDateRangeField(
            label = "Release window",
            value = releaseRange,
            onValueChange = { releaseRange = it },
            description = "Choose the inclusive availability window."
        )
        LumenToggle(
            label = "Demo notification preference",
            description = "Example state only. The playground does not register for notifications.",
            checked = notificationsEnabled,
            onCheckedChange = onNotificationsChange
        )
        LumenSettingsRow(
            title = "Demo automatic updates",
            description = "Example state only. The playground does not download updates.",
            graphic = { LumenIcon(LumenIconName.Check, contentDescription = null) }
        ) {
            LumenToggle(
                label = "Demo automatic updates",
                checked = notificationsEnabled,
                showLabel = false,
                onCheckedChange = onNotificationsChange
            )
        }
        LumenCheckbox(
            label = "Confirm accessibility review",
            description = "Required before publishing this native component set.",
            checked = accessibilityReviewed,
            onCheckedChange = onAccessibilityReviewedChange
        )
        LumenRadioGroup(
            label = "Performance profile",
            options = listOf(
                LumenSelectionOption("quiet", "Quiet", "Reduce background activity."),
                LumenSelectionOption("balanced", "Balanced", "Recommended for most projects."),
                LumenSelectionOption("performance", "Performance", "Prioritize responsiveness.")
            ),
            value = profile,
            onValueChange = onProfileChange
        )
        LumenSegmentedControl(
            label = "Control density",
            options = listOf(
                LumenSelectionOption("compact", "Compact"),
                LumenSelectionOption("comfortable", "Comfortable"),
                LumenSelectionOption("spacious", "Spacious", enabled = false)
            ),
            value = density,
            onValueChange = onDensityChange
        )
        LumenTabs(
            label = "Workspace views",
            options = listOf(
                LumenSelectionOption("overview", "Overview"),
                LumenSelectionOption("activity", "Activity"),
                LumenSelectionOption("billing", "Billing", enabled = false)
            ),
            value = activeTab,
            onValueChange = { activeTab = it }
        ) { selected ->
            LumenSurface(tone = LumenSurfaceTone.Muted, padding = LumenSurfacePadding.Md) {
                LumenText(
                    if (selected == "overview") {
                        "Workspace health is ready."
                    } else {
                        "Three components updated today."
                    },
                    variant = LumenTextVariant.Label
                )
            }
        }
        LumenPicker(
            label = "Profile",
            value = pickerProfile,
            options = listOf(
                LumenPickerOption("quiet", "Quiet"),
                LumenPickerOption("balanced", "Balanced"),
                LumenPickerOption("performance", "Performance")
            ),
            onValueChange = { pickerProfile = it }
        )
        LumenSlider(
            label = "Documentation coverage",
            value = sliderValue,
            onValueChange = { sliderValue = it },
            valueRange = 0f..100f,
            steps = 99,
            valueLabel = "${sliderValue.toInt()}%"
        )
    }
}

@Composable
private fun FeedbackStatesExample() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            LumenSkeleton(width = 44.dp, height = 44.dp, shape = LumenSkeletonShape.Circle)
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                LumenSkeleton(width = 180.dp, height = 16.dp, label = "Loading profile")
                LumenSkeleton(width = 120.dp, height = 12.dp)
            }
        }
        LumenEmptyState(
            title = "No pending reviews",
            description = "Every Compose component has an owner and verification state.",
            graphic = {
                LumenIllustration(
                    variant = LumenIllustrationVariant.Success,
                    size = LumenIllustrationSize.Sm
                )
            },
            actions = {
                LumenButton(onClick = {}, intent = LumenButtonIntent.Secondary) {
                    Text("View release")
                }
            }
        )
        LumenErrorState(
            title = "Could not load projects",
            description = "Check your connection and try again.",
            kind = LumenErrorStateKind.Offline,
            reference = "REQ-4F82",
            actions = {
                LumenButton(onClick = {}, intent = LumenButtonIntent.Secondary) {
                    Text("Try again")
                }
            }
        )
    }
}

@Composable
private fun DisclosureExample(expanded: Boolean, onExpandedChange: (Boolean) -> Unit) {
    LumenDisclosure(
        title = "Implementation notes",
        description = "Tap the header to verify native expanded state.",
        expanded = expanded,
        onExpandedChange = onExpandedChange
    ) {
        LumenText("Each adapter owns its native rendering and focus behavior.", tone = LumenTextTone.Soft)
    }
}

@Composable
private fun VisualContentExample() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        LumenGraphic(
            size = LumenGraphicSize.Sm,
            tone = LumenGraphicTone.Accent,
            variant = LumenGraphicVariant.Orbit,
            label = "Orbit graphic surrounding the Lumen mark",
            modifier = Modifier.align(Alignment.CenterHorizontally)
        ) {
            LumenIcon(LumenIconName.Sparkles, contentDescription = null)
        }
        LumenBackdrop(
            modifier = Modifier
                .fillMaxWidth()
                .height(176.dp),
            variant = LumenBackdropVariant.Aurora,
            tone = LumenBackdropTone.Brand,
            intensity = LumenBackdropIntensity.Medium
        ) {
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                LumenBadge("Semantic backdrop", tone = LumenBadgeTone.Accent)
                LumenText("Application content stays interactive", variant = LumenTextVariant.Label)
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            LumenIllustration(
                variant = LumenIllustrationVariant.Empty,
                size = LumenIllustrationSize.Sm,
                label = "Empty state illustration"
            )
            LumenIllustration(
                variant = LumenIllustrationVariant.Success,
                size = LumenIllustrationSize.Sm,
                label = "Success illustration"
            )
            LumenIllustration(
                variant = LumenIllustrationVariant.Offline,
                size = LumenIllustrationSize.Sm,
                label = "Offline illustration"
            )
        }
        LumenImage(
            painter = rememberVectorPainter(Icons.Default.Home),
            label = "Lumen image placeholder",
            aspectRatio = 16f / 9f,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun SystemActionsExample() {
    var showMenu by remember { mutableStateOf(false) }
    var lastAction by remember { mutableStateOf("No system action selected") }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Box {
            LumenIconButton(
                name = LumenIconName.EllipsisVertical,
                contentDescription = "Workspace actions",
                onClick = { showMenu = true }
            )
            LumenMenu(
                expanded = showMenu,
                onDismissRequest = { showMenu = false },
                items = listOf(
                    LumenMenuItem("Duplicate", leadingIcon = Icons.Default.Add) {
                        lastAction = "Workspace duplicated"
                    },
                    LumenMenuItem("Archive", enabled = false) {},
                    LumenMenuItem("Delete", destructive = true) {
                        lastAction = "Workspace deleted"
                    }
                )
            )
        }
        LumenShareButton(
            payload = LumenSharePayload(
                text = "Explore Lumen UI for Jetpack Compose",
                subject = "Lumen Compose"
            ),
            chooserTitle = "Share Lumen Compose",
            label = "Share component gallery"
        )
        LumenText(lastAction, variant = LumenTextVariant.Caption, tone = LumenTextTone.Muted)
    }
}

@Composable
private fun NavigationOverlaysExample(initialComponent: String) {
    var showDialog by remember(initialComponent) {
        mutableStateOf(initialComponent.equals("Alert dialog", ignoreCase = true))
    }
    var showSheet by remember(initialComponent) {
        mutableStateOf(initialComponent.equals("Sheet", ignoreCase = true))
    }
    var lastAction by remember { mutableStateOf("No overlay action selected") }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        LumenButtonGroup {
            LumenButton(onClick = { showDialog = true }, intent = LumenButtonIntent.Danger) {
                Text("Delete dialog")
            }
            LumenButton(onClick = { showSheet = true }, intent = LumenButtonIntent.Secondary) {
                Text("Open sheet")
            }
        }
        LumenText(lastAction, variant = LumenTextVariant.Caption, tone = LumenTextTone.Muted)
    }

    LumenAlertDialog(
        visible = showDialog,
        title = "Delete workspace?",
        description = "This controlled example requires explicit confirmation.",
        confirmLabel = "Delete",
        destructive = true,
        onConfirm = {
            lastAction = "Workspace deleted"
            showDialog = false
        },
        onDismiss = { showDialog = false }
    )
    LumenSheet(
        visible = showSheet,
        title = "Publish component",
        description = "Review the native release before publishing.",
        onDismiss = { showSheet = false },
        actions = {
            LumenButton(onClick = { showSheet = false }) { Text("Done") }
        }
    ) {
        LumenStatusBar(
            message = "Accessibility and API checks passed",
            tone = LumenMetricTone.Success
        )
    }
}

@Composable
private fun NavigationExample(initialComponent: String) {
    var destination by remember { mutableStateOf("home") }
    var reselectionCount by remember { mutableStateOf(0) }
    val scrollState = rememberLumenNavigationBarScrollState()
    val items = remember {
        listOf(
            LumenNavigationItem(
                value = "home",
                label = "Home",
                icon = Icons.Default.Home
            ),
            LumenNavigationItem(
                value = "search",
                label = "Search",
                icon = Icons.Default.Search,
                badge = LumenNavigationBadge.count(7)
            ),
            LumenNavigationItem(
                value = "settings",
                label = "Settings",
                icon = Icons.Default.Settings,
                badge = LumenNavigationBadge.dot("Settings require attention")
            )
        )
    }

    Column(
        modifier = Modifier.lumenNavigationBarScrollBehavior(scrollState),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        LumenNavigationBarAccessory {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                LumenText("Uploading component screenshots", variant = LumenTextVariant.Label)
                LumenBadge("3", tone = LumenBadgeTone.Accent)
            }
        }
        LumenNavigationBar(
            items = items,
            selectedValue = destination,
            onValueChange = { destination = it },
            onReselect = { reselectionCount += 1 },
            scrollState = scrollState
        )
        if (initialComponent.equals("Navigation bar scroll behavior", ignoreCase = true)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                LumenButton(
                    onClick = scrollState::hide,
                    intent = LumenButtonIntent.Secondary
                ) {
                    Text("Hide on scroll")
                }
                LumenButton(
                    onClick = scrollState::show,
                    intent = LumenButtonIntent.Secondary
                ) {
                    Text("Show on scroll")
                }
            }
        }
        LumenText(
            "Selected: $destination · reselected $reselectionCount times",
            variant = LumenTextVariant.Caption,
            tone = LumenTextTone.Muted
        )
        LumenAdaptiveNavigationScaffold(
            items = items,
            selectedValue = destination,
            onValueChange = { destination = it },
            onReselect = { reselectionCount += 1 },
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
        ) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                LumenEmptyState(
                    title = "Adaptive $destination destination",
                    description = "Resize the window to switch between Material bar and rail."
                )
            }
        }
    }
}

@Composable
private fun FeedbackExample(
    showBanner: Boolean,
    onBannerVisibilityChange: (Boolean) -> Unit
) {
    var showToast by remember { mutableStateOf(true) }

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
        if (showToast) {
            LumenToast(
                title = "Changes saved",
                description = "All shared native catalogs were updated.",
                variant = LumenBannerVariant.Success,
                onDismiss = { showToast = false }
            )
        }
        LumenStatusBar(
            message = "All Android verification gates passed",
            tone = LumenMetricTone.Success
        )
    }
}

@Composable
private fun DataExample(saved: Boolean, onToggleSaved: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        LumenSectionHeader(
            title = "Workspace",
            subtitle = "Shared native contracts",
            count = "28",
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
                value = "28",
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
            LumenGauge(
                label = "Coverage",
                value = 86f,
                valueLabel = "86%",
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

@Composable
private fun ChartExample(visibleNames: Set<String>) {
    if ("Sparkline" in visibleNames) {
        LumenSparkline(values = listOf(12.0, 18.0, 16.0, 27.0, 35.0), label = "Weekly adoption trend")
    }
    if ("Line chart" in visibleNames) {
        LumenLineChart(
            label = "Weekly adoption chart",
            heading = "Weekly adoption",
            area = true,
            series = listOf(
                LumenChartSeries(
                    id = "adoption",
                    label = "Projects",
                    data = listOf(
                        LumenChartDatum("mon", LumenChartX.Category("Mon"), 18.0),
                        LumenChartDatum("tue", LumenChartX.Category("Tue"), 26.0),
                        LumenChartDatum("wed", LumenChartX.Category("Wed"), null),
                        LumenChartDatum("thu", LumenChartX.Category("Thu"), 41.0),
                        LumenChartDatum("fri", LumenChartX.Category("Fri"), 53.0)
                    )
                )
            )
        )
    }
    if ("Bar chart" in visibleNames) {
        LumenBarChart(
            label = "Components by platform",
            series = listOf(
                LumenChartSeries(
                    "components",
                    "Components",
                    listOf(
                        LumenChartDatum("web", LumenChartX.Category("Web"), 82.0),
                        LumenChartDatum("ios", LumenChartX.Category("iOS"), 61.0),
                        LumenChartDatum("android", LumenChartX.Category("Android"), 58.0)
                    )
                )
            )
        )
    }
    if ("Pie chart" in visibleNames) {
        LumenPieChart(
            label = "Issue status distribution",
            series = LumenChartSeries(
                "issues",
                "Issues",
                listOf(
                    LumenChartDatum("complete", LumenChartX.Category("Complete"), 68.0),
                    LumenChartDatum("active", LumenChartX.Category("Active"), 22.0),
                    LumenChartDatum("blocked", LumenChartX.Category("Blocked"), 10.0)
                )
            )
        )
    }
    if ("Scatter chart" in visibleNames) {
        LumenScatterChart(
            label = "Bundle size and render time",
            series = listOf(
                LumenChartSeries(
                    "releases",
                    "Releases",
                    listOf(
                        LumenChartDatum("one", LumenChartX.Number(12.0), 28.0, size = 12.0),
                        LumenChartDatum("two", LumenChartX.Number(20.0), 41.0, size = 20.0),
                        LumenChartDatum("three", LumenChartX.Number(31.0), 54.0, size = 28.0)
                    )
                )
            )
        )
    }
    if ("Heatmap" in visibleNames) {
        LumenHeatmap(
            label = "Activity by day and period",
            data = listOf(
                LumenHeatmapDatum("mon-am", "Mon", "Morning", 18.0),
                LumenHeatmapDatum("tue-am", "Tue", "Morning", 32.0),
                LumenHeatmapDatum("mon-pm", "Mon", "Evening", 47.0),
                LumenHeatmapDatum("tue-pm", "Tue", "Evening", null)
            )
        )
    }
    if ("Range chart" in visibleNames) {
        LumenRangeChart(
            label = "Daily forecast range",
            data = listOf(
                LumenRangeDatum("mon", LumenChartX.Category("Mon"), 16.0, 28.0),
                LumenRangeDatum("tue", LumenChartX.Category("Tue"), 21.0, 35.0),
                LumenRangeDatum("wed", LumenChartX.Category("Wed"), 27.0, 42.0)
            )
        )
    }
    if ("Combo chart" in visibleNames) {
        LumenComboChart(
            label = "Deployments and reliability",
            series = listOf(
                LumenChartSeries(
                    "deployments",
                    "Deployments",
                    listOf(
                        LumenChartDatum("dep-apr", LumenChartX.Category("Apr"), 24.0),
                        LumenChartDatum("dep-may", LumenChartX.Category("May"), 31.0),
                        LumenChartDatum("dep-jun", LumenChartX.Category("Jun"), 38.0)
                    ),
                    mark = LumenComboMark.Bar
                ),
                LumenChartSeries(
                    "reliability",
                    "Reliability",
                    listOf(
                        LumenChartDatum("rel-apr", LumenChartX.Category("Apr"), 94.0),
                        LumenChartDatum("rel-may", LumenChartX.Category("May"), 97.0),
                        LumenChartDatum("rel-jun", LumenChartX.Category("Jun"), 99.0)
                    )
                )
            )
        )
    }
}

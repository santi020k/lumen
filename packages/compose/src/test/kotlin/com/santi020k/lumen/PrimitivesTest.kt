package com.santi020k.lumen

import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Test

class PrimitivesTest {
    @Test
    fun foundationMotionAndElevationMatchCanonicalTokens() {
        assertEquals(160, LumenMotion.StandardDurationMillis)
        assertEquals(LumenCubicBezier(0.32f, 0.72f, 0f, 1f), LumenMotion.StandardEasing)
        assertEquals(LumenCubicBezier(0.22f, 1f, 0.36f, 1f), LumenMotion.EmphasizedEasing)
        assertEquals(1.dp, LumenElevation.Resting)
        assertEquals(3.dp, LumenElevation.Raised)
        assertEquals(6.dp, LumenElevation.Overlay)
    }

    @Test
    fun materialColorSchemesMapToLumenSemanticRoles() {
        val material = lightColorScheme(
            primary = Color(0xFF112233),
            secondary = Color(0xFF445566),
            background = Color(0xFFF8F9FA),
            error = Color(0xFFAA0000)
        )
        val palette = material.toLumenColorPalette(
            fallback = LumenColors.Light,
            overrides = LumenMaterialColorOverrides(
                brand = Color(0xFF123456),
                success = Color(0xFF008844),
                warning = Color(0xFFFFAA00)
            )
        )

        assertEquals(Color(0xFF123456), palette.brand)
        assertEquals(Color(0xFF445566), palette.accent)
        assertEquals(Color(0xFF008844), palette.success)
        assertEquals(Color(0xFFFFAA00), palette.warning)
        assertEquals(Color(0xFFAA0000), palette.danger)
        assertEquals(Color(0xFFF8F9FA), palette.canvas)
    }

    @Test
    fun lumenPalettesMapBackToMaterialSemanticRoles() {
        val material = LumenColors.Dark.toMaterialColorScheme(isDark = true)

        assertEquals(LumenColors.Dark.brand, material.primary)
        assertEquals(LumenColors.Dark.brandSoft, material.primaryContainer)
        assertEquals(LumenColors.Dark.accent, material.secondary)
        assertEquals(LumenColors.Dark.canvas, material.background)
        assertEquals(LumenColors.Dark.surfaceMuted, material.surfaceVariant)
        assertEquals(LumenColors.Dark.surfaceStrong, material.surfaceContainerHigh)
        assertEquals(LumenColors.Dark.inkMuted, material.onSurfaceVariant)
        assertEquals(LumenColors.Dark.danger, material.error)
    }

    @Test
    fun materialMappingsKeepCanonicalSuccessAndWarningWithoutOverrides() {
        val palette = lightColorScheme().toLumenColorPalette(fallback = LumenColors.Dark)

        assertEquals(LumenColors.Dark.success, palette.success)
        assertEquals(LumenColors.Dark.warning, palette.warning)
    }

    @Test
    fun buttonMetricsPreserveNativeTouchTargets() {
        assertEquals(36.dp, LumenButtonMetrics.resolve(LumenControlSize.Sm).minHeight)
        assertEquals(44.dp, LumenButtonMetrics.resolve(LumenControlSize.Md).minHeight)
        assertEquals(52.dp, LumenButtonMetrics.resolve(LumenControlSize.Lg).minHeight)
    }

    @Test
    fun iconMetricsStayConsistentAndAccessible() {
        assertEquals(LumenIconSize.Sm, LumenIconButtonMetrics.resolve(LumenControlSize.Sm).iconSize)
        assertEquals(44.dp, LumenIconButtonMetrics.resolve(LumenControlSize.Sm).touchTarget)
        assertEquals(44.dp, LumenIconButtonMetrics.resolve(LumenControlSize.Md).touchTarget)
        assertEquals(52.dp, LumenIconButtonMetrics.resolve(LumenControlSize.Lg).touchTarget)
    }

    @Test
    fun floatingActionButtonsUseMaterialMetricsAndSemanticIntents() {
        assertEquals(
            LumenFloatingActionButtonMetrics(40.dp, LumenIconSize.Md),
            LumenFloatingActionButtonMetrics.resolve(LumenFloatingActionButtonSize.Small)
        )
        assertEquals(
            LumenFloatingActionButtonMetrics(56.dp, LumenIconSize.Lg),
            LumenFloatingActionButtonMetrics.resolve(LumenFloatingActionButtonSize.Regular)
        )
        assertEquals(
            LumenFloatingActionButtonPalette(LumenColors.Light.brandSolid, LumenColors.Light.onBrand),
            lumenFloatingActionButtonPalette(LumenColors.Light, LumenFloatingActionButtonIntent.Brand)
        )
        assertEquals(
            LumenFloatingActionButtonPalette(LumenColors.Dark.danger, LumenColors.Dark.onDanger),
            lumenFloatingActionButtonPalette(LumenColors.Dark, LumenFloatingActionButtonIntent.Danger)
        )
    }

    @Test
    fun navigationDestinationsUseControlledSelection() {
        assertEquals(true, isLumenNavigationItemSelected("home", "home"))
        assertEquals(false, isLumenNavigationItemSelected("search", "home"))
    }

    @Test
    fun navigationSelectionSeparatesChangesFromReselection() {
        val changes = mutableListOf<String>()
        val reselectionEvents = mutableListOf<String>()

        dispatchLumenNavigationSelection("search", "home", changes::add, reselectionEvents::add)
        dispatchLumenNavigationSelection("home", "home", changes::add, reselectionEvents::add)

        assertEquals(listOf("search"), changes)
        assertEquals(listOf("home"), reselectionEvents)
    }

    @Test
    fun navigationBadgesCapVisibleCountsAndRetainAccessibleValues() {
        assertEquals(LumenNavigationBadge(text = "7", accessibilityLabel = "7 new items"), LumenNavigationBadge.count(7))
        assertEquals(
            LumenNavigationBadge(text = "99+", accessibilityLabel = "128 new items"),
            LumenNavigationBadge.count(128)
        )
        assertEquals(LumenNavigationBadge(), LumenNavigationBadge.dot())
    }

    @Test
    fun navigationBarScrollStateUsesThresholdAndDirectionChanges() {
        val state = LumenNavigationBarScrollState(initiallyVisible = true, thresholdPx = 16f)

        state.recordScrollDelta(-8f)
        assertEquals(true, state.isVisible)
        state.recordScrollDelta(-8f)
        assertEquals(false, state.isVisible)

        state.recordScrollDelta(8f)
        state.recordScrollDelta(-4f)
        state.recordScrollDelta(12f)
        assertEquals(false, state.isVisible)
        state.recordScrollDelta(4f)
        assertEquals(true, state.isVisible)
    }

    @Test
    fun navigationBarScrollStateSupportsExplicitVisibilityAndIgnoresInvalidDeltas() {
        val state = LumenNavigationBarScrollState(initiallyVisible = false, thresholdPx = 16f)

        state.recordScrollDelta(Float.NaN)
        assertEquals(false, state.isVisible)
        state.show()
        assertEquals(true, state.isVisible)
        state.hide()
        assertEquals(false, state.isVisible)
    }

    @Test
    fun floatingActionsCanHideOrFollowNavigationVisibility() {
        assertEquals(
            false,
            lumenFloatingActionButtonVisible(
                LumenFloatingActionButtonNavigationBehavior.HideWithNavigation,
                navigationVisible = false
            )
        )
        assertEquals(
            true,
            lumenFloatingActionButtonVisible(
                LumenFloatingActionButtonNavigationBehavior.AlwaysVisible,
                navigationVisible = false
            )
        )
        assertEquals(
            16.dp,
            lumenFloatingActionButtonOffset(
                LumenFloatingActionButtonNavigationBehavior.FollowNavigation,
                navigationVisible = false
            )
        )
    }

    @Test
    fun sharePayloadsRequireTextOrAContentUri() {
        assertEquals(false, LumenSharePayload().hasContent)
        assertEquals(false, LumenSharePayload(text = "   ").hasContent)
        assertEquals(true, LumenSharePayload(text = "Share this report").hasContent)
    }

    @Test
    fun progressValuesAreFiniteAndClamped() {
        assertEquals(LumenProgressValue(100f, 100f), LumenProgressValue.resolve(120f, 100f))
        assertEquals(LumenProgressValue(100f, 0f), LumenProgressValue.resolve(-10f, 0f))
        assertEquals(LumenProgressValue(100f, 0f), LumenProgressValue.resolve(Float.NaN, Float.NaN))
    }

    @Test
    fun avatarDimensionsMatchTheSharedContract() {
        assertEquals(32.dp, LumenAvatarSize.Sm.dimension)
        assertEquals(40.dp, LumenAvatarSize.Md.dimension)
        assertEquals(56.dp, LumenAvatarSize.Lg.dimension)
    }

    @Test
    fun graphicDimensionsMatchTheSharedContract() {
        assertEquals(160.dp, LumenGraphicSize.Sm.dimension)
        assertEquals(240.dp, LumenGraphicSize.Md.dimension)
        assertEquals(320.dp, LumenGraphicSize.Lg.dimension)
    }

    @Test
    fun backdropAndIllustrationMetricsMatchTheSharedContract() {
        assertEquals(0.4f, LumenBackdropIntensity.Subtle.opacity)
        assertEquals(0.68f, LumenBackdropIntensity.Medium.opacity)
        assertEquals(1f, LumenBackdropIntensity.Strong.opacity)
        assertEquals(96.dp, LumenIllustrationSize.Sm.dimension)
        assertEquals(128.dp, LumenIllustrationSize.Md.dimension)
        assertEquals(176.dp, LumenIllustrationSize.Lg.dimension)
        assertEquals(
            LumenColors.Light.success,
            lumenIllustrationColor(
                LumenColors.Light,
                LumenIllustrationTone.Auto,
                LumenIllustrationVariant.Success
            )
        )
    }

    @Test
    fun structuredComponentsUseSemanticToneColors() {
        assertEquals(LumenColors.Light.accent, lumenMetricColor(LumenColors.Light, LumenMetricTone.Accent))
        assertEquals(LumenColors.Dark.inkMuted, lumenMetricColor(LumenColors.Dark, LumenMetricTone.Neutral))
        assertEquals(
            LumenColors.Light.brand,
            lumenBannerPalette(LumenColors.Light, LumenBannerVariant.Default).accent
        )
        assertEquals(
            LumenColors.Dark.success,
            lumenBannerPalette(LumenColors.Dark, LumenBannerVariant.Success).accent
        )
    }

    @Test
    fun searchFieldOnlyClearsEditableQueries() {
        assertEquals(true, LumenSearchFieldState.resolve("lumen", true).showClearAction)
        assertEquals(false, LumenSearchFieldState.resolve("", true).showClearAction)
        assertEquals(false, LumenSearchFieldState.resolve("lumen", false).showClearAction)
    }

    @Test
    fun selectionAndSkeletonModelsUseSafeDefaults() {
        assertEquals(
            LumenSelectionOption(value = "balanced", label = "Balanced"),
            LumenSelectionOption(value = "balanced", label = "Balanced", enabled = true)
        )
        assertEquals(24.dp, resolveLumenSkeletonHeight(24.dp))
        assertEquals(16.dp, resolveLumenSkeletonHeight(0.dp))
        assertEquals(16.dp, resolveLumenSkeletonHeight(Float.NaN.dp))
    }

    @Test
    fun pickerAndAdditionalComponentModelsPreserveStableDefaults() {
        assertEquals(
            LumenPickerOption(value = "balanced", label = "Balanced"),
            LumenPickerOption(value = "balanced", label = "Balanced", enabled = true)
        )
        assertEquals(LumenButtonGroupOrientation.Horizontal, LumenButtonGroupOrientation.valueOf("Horizontal"))
        assertEquals(LumenProgressValue(100f, 72f), LumenProgressValue.resolve(72f, 100f))
    }

    @Test
    fun cardVariantsUseSemanticSurfaces() {
        assertEquals(
            LumenCardPalette(LumenColors.Light.surfaceMuted, LumenColors.Light.line),
            lumenCardPalette(LumenColors.Light, LumenCardVariant.Muted)
        )
        assertEquals(
            LumenColors.Dark.warning.copy(alpha = 0.24f),
            lumenCardPalette(LumenColors.Dark, LumenCardVariant.Warning).border
        )
    }
}

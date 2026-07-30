/* eslint-disable complexity */
import { exportThemeDesignTokens, exportThemeFigmaVariables } from "./figma.js";
import {
  createThemeFromHue,
  exportThemeCss,
  type LumenThemeTokens,
} from "./theme.js";

export type LumenThemeBuilderExportFormat = "css" | "figma" | "tokens";

export type LumenThemeBuilderMode = "generated" | "manual";

export type LumenThemeBuilderScheme = "dark" | "light";

export interface LumenThemeBuilderOptions {
  accentHue?: number | string | null;
  hue?: number | string | null;
  mode?: string | null;
  primaryColor?: string | null;
  scheme?: string | null;
  secondaryColor?: string | null;
}

export interface LumenThemeBuilderResult {
  accentHue: number;
  hue: number;
  mode: LumenThemeBuilderMode;
  scheme: LumenThemeBuilderScheme;
  tokens: LumenThemeTokens;
}

export const coerceThemeBuilderExportFormat = (
  value?: string | null,
): LumenThemeBuilderExportFormat => {
  if (value === "figma" || value === "tokens") return value;

  return "css";
};

export const coerceThemeBuilderMode = (
  value?: string | null,
): LumenThemeBuilderMode => (value === "manual" ? "manual" : "generated");

export const coerceThemeBuilderScheme = (
  value?: string | null,
): LumenThemeBuilderScheme => (value === "dark" ? "dark" : "light");

export const normalizeThemeBuilderHue = (
  value: number | string | null | undefined,
  fallback = 0,
): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return ((Math.round(parsed) % 360) + 360) % 360;
};

export const normalizeThemeBuilderHex = (value: string): string | null => {
  const hex = value.trim().replace(/^#/, "");

  if (/^[\da-f]{3}$/i.test(hex)) {
    return `#${hex.charAt(0)}${hex.charAt(0)}${hex.charAt(1)}${hex.charAt(1)}${hex.charAt(2)}${hex.charAt(2)}`.toLowerCase();
  }

  return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
};

export const themeBuilderHexToHsl = (
  value: string,
): { hue: number; value: string } | null => {
  const normalized = normalizeThemeBuilderHex(value);

  if (!normalized) return null;

  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  const normalizedHue = normalizeThemeBuilderHue(hue);

  return {
    hue: normalizedHue,
    value: `${normalizedHue} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`,
  };
};

export const createThemeBuilderTokens = (
  options: LumenThemeBuilderOptions = {},
): LumenThemeBuilderResult => {
  const hue = normalizeThemeBuilderHue(options.hue);
  const accentHue = normalizeThemeBuilderHue(
    options.accentHue,
    normalizeThemeBuilderHue(hue + 150),
  );
  const mode = coerceThemeBuilderMode(options.mode);
  const scheme = coerceThemeBuilderScheme(options.scheme);
  const primary = options.primaryColor
    ? themeBuilderHexToHsl(options.primaryColor)
    : null;
  const secondary = options.secondaryColor
    ? themeBuilderHexToHsl(options.secondaryColor)
    : null;
  const baseHue = mode === "manual" ? (primary?.hue ?? hue) : hue;
  const baseAccentHue =
    mode === "manual" ? (secondary?.hue ?? accentHue) : accentHue;

  const tokens = createThemeFromHue(baseHue, {
    accentHue: baseAccentHue,
    scheme,
  });

  if (mode === "manual") {
    if (primary) {
      tokens.brand = primary.value;

      tokens["brand-solid"] = primary.value;
    }

    if (secondary) {
      tokens.accent = secondary.value;
    }
  }

  return {
    accentHue: baseAccentHue,
    hue: baseHue,
    mode,
    scheme,
    tokens,
  };
};

export const exportThemeBuilderCss = (
  tokens: LumenThemeTokens,
  scheme: LumenThemeBuilderScheme,
): string =>
  exportThemeCss(tokens).replace("{", `{\n  color-scheme: ${scheme};`);

export const exportThemeBuilderValue = (
  tokens: LumenThemeTokens,
  scheme: LumenThemeBuilderScheme,
  format: LumenThemeBuilderExportFormat,
): string => {
  if (format === "figma") {
    return JSON.stringify(
      exportThemeFigmaVariables(tokens, {
        collectionName: "Lumen",
        modeName: scheme === "dark" ? "Dark" : "Light",
      }),
      null,
      2,
    );
  }

  if (format === "tokens") {
    return JSON.stringify(exportThemeDesignTokens(tokens), null, 2);
  }

  return exportThemeBuilderCss(tokens, scheme);
};

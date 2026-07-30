export const lumenChartTones = [
  "series-1",
  "series-2",
  "series-3",
  "series-4",
  "series-5",
  "series-6",
  "series-7",
  "series-8",
  "brand",
  "accent",
  "success",
  "warning",
  "danger",
  "neutral",
] as const;

export type LumenChartTone = (typeof lumenChartTones)[number];

export interface LumenChartDatum {
  label?: string;
  tone?: LumenChartTone;
  x: number | string;
  xLabel?: string;
  y: number | null;
}

export interface LumenChartSeries {
  data: readonly LumenChartDatum[];
  id: string;
  label: string;
  tone?: LumenChartTone;
}

export interface LumenChartDomain {
  max: number;
  min: number;
}

export interface LumenChartGeometryPoint extends LumenChartDatum {
  xCoordinate: number;
  yCoordinate: number;
}

export interface LumenLineGeometry {
  areaPaths: readonly string[];
  domain: LumenChartDomain;
  path: string;
  points: readonly LumenChartGeometryPoint[];
}

export interface LumenLineGeometryOptions {
  domain?: Partial<LumenChartDomain>;
  height?: number;
  includeZero?: boolean;
  padding?: number;
  width?: number;
}

export type LumenBarChartLayout = "grouped" | "stacked";
export type LumenChartOrientation = "horizontal" | "vertical";

export interface LumenBarGeometryMark {
  category: number | string;
  height: number;
  seriesId: string;
  seriesLabel: string;
  tone: LumenChartTone;
  value: number;
  width: number;
  x: number;
  y: number;
}

export interface LumenBarGeometryCategory {
  category: number | string;
  label: number | string;
  x: number;
  y: number;
}

export interface LumenBarGeometry {
  categories: readonly LumenBarGeometryCategory[];
  domain: LumenChartDomain;
  height: number;
  marks: readonly LumenBarGeometryMark[];
  width: number;
}

export interface LumenBarGeometryOptions {
  categoryWidth?: number;
  height?: number;
  layout?: LumenBarChartLayout;
  orientation?: LumenChartOrientation;
  width?: number;
}

export type LumenPieChartVariant = "donut" | "pie";

const lumenChartToneClassNames: Record<LumenChartTone, string> = {
  accent: "ui-chart-tone--accent",
  brand: "ui-chart-tone--brand",
  danger: "ui-chart-tone--danger",
  neutral: "ui-chart-tone--neutral",
  "series-1": "ui-chart-tone--series-1",
  "series-2": "ui-chart-tone--series-2",
  "series-3": "ui-chart-tone--series-3",
  "series-4": "ui-chart-tone--series-4",
  "series-5": "ui-chart-tone--series-5",
  "series-6": "ui-chart-tone--series-6",
  "series-7": "ui-chart-tone--series-7",
  "series-8": "ui-chart-tone--series-8",
  success: "ui-chart-tone--success",
  warning: "ui-chart-tone--warning",
};

const lumenPieChartVariantClassNames: Record<LumenPieChartVariant, string> = {
  donut: "ui-pie-chart--donut",
  pie: "ui-pie-chart--pie",
};

export interface LumenPieGeometrySlice {
  label: string;
  path: string;
  percentage: number;
  tone: LumenChartTone;
  value: number;
  x: number | string;
}

export interface LumenPieGeometry {
  center: number;
  innerRadius: number;
  outerRadius: number;
  size: number;
  slices: readonly LumenPieGeometrySlice[];
  total: number;
}

export interface LumenPieGeometryOptions {
  padding?: number;
  size?: number;
  variant?: LumenPieChartVariant;
}

const defaultChartSize = 100;
const defaultChartPadding = 4;
const finiteValues = (values: readonly (number | null)[]): number[] =>
  values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );

export const hasLumenChartData = (
  series: readonly LumenChartSeries[],
): boolean =>
  series.some((item) =>
    item.data.some((datum) => datum.y !== null && Number.isFinite(datum.y)),
  );

export const hasLumenPieData = (data: readonly LumenChartDatum[]): boolean =>
  data.some(
    (datum) => datum.y !== null && Number.isFinite(datum.y) && datum.y > 0,
  );

export const getLumenChartDomain = (
  values: readonly (number | null)[],
  includeZero = true,
): LumenChartDomain => {
  const available = finiteValues(values);

  if (available.length === 0) return { max: 1, min: 0 };

  let min = Math.min(...available);
  let max = Math.max(...available);

  if (includeZero) {
    min = Math.min(0, min);

    max = Math.max(0, max);
  }

  if (min === max) {
    const offset = Math.abs(min || 1) * 0.1;

    min -= offset;

    max += offset;
  }

  return { max, min };
};

export const scaleLumenChartValue = (
  value: number,
  domain: LumenChartDomain,
  rangeStart: number,
  rangeEnd: number,
): number => {
  const domainSize = domain.max - domain.min;

  if (!Number.isFinite(value) || domainSize === 0) return rangeStart;

  const ratio = (value - domain.min) / domainSize;

  return rangeStart + ratio * (rangeEnd - rangeStart);
};

export const getLumenChartTicks = (
  domain: LumenChartDomain,
  count = 5,
): number[] => {
  const safeCount = Math.max(2, Math.round(count));
  const step = (domain.max - domain.min) / (safeCount - 1);

  return Array.from(
    { length: safeCount },
    (_, index) => domain.min + step * index,
  );
};

export const resolveLumenChartTone = (
  tone: LumenChartTone | undefined,
  index = 0,
): LumenChartTone => tone ?? lumenChartTones[index % 8] ?? "series-1";

export const getLumenChartToneClassName = (
  tone: LumenChartTone | undefined,
  index = 0,
): string => lumenChartToneClassNames[resolveLumenChartTone(tone, index)];

export const getLumenPieChartVariantClassName = (
  variant: LumenPieChartVariant,
): string => lumenPieChartVariantClassNames[variant];

interface LumenPolarPoint {
  x: number;
  y: number;
}

const polarPoint = (
  center: number,
  radius: number,
  angle: number,
): LumenPolarPoint => {
  const radians = (angle * Math.PI) / 180;

  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius,
  };
};

const formatPieCoordinate = (value: number): string => value.toFixed(3);
const pieArc = (
  radius: number,
  largeArc: boolean,
  sweep: 0 | 1,
  point: LumenPolarPoint,
): string =>
  `A ${formatPieCoordinate(radius)} ${formatPieCoordinate(radius)} 0 ${largeArc ? 1 : 0} ${sweep} ${formatPieCoordinate(point.x)} ${formatPieCoordinate(point.y)}`;

const fullPiePath = (
  center: number,
  outerRadius: number,
  innerRadius: number,
): string => {
  const topOuter = polarPoint(center, outerRadius, -90);
  const bottomOuter = polarPoint(center, outerRadius, 90);

  const outer = [
    `M ${formatPieCoordinate(topOuter.x)} ${formatPieCoordinate(topOuter.y)}`,
    pieArc(outerRadius, true, 1, bottomOuter),
    pieArc(outerRadius, true, 1, topOuter),
    "Z",
  ];

  if (innerRadius === 0) return outer.join(" ");

  const topInner = polarPoint(center, innerRadius, -90);
  const bottomInner = polarPoint(center, innerRadius, 90);

  return [
    ...outer,
    `M ${formatPieCoordinate(topInner.x)} ${formatPieCoordinate(topInner.y)}`,
    pieArc(innerRadius, true, 0, bottomInner),
    pieArc(innerRadius, true, 0, topInner),
    "Z",
  ].join(" ");
};

const pieSlicePath = (
  center: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string => {
  if (endAngle - startAngle >= 359.999) {
    return fullPiePath(center, outerRadius, innerRadius);
  }

  const outerStart = polarPoint(center, outerRadius, startAngle);
  const outerEnd = polarPoint(center, outerRadius, endAngle);
  const largeArc = endAngle - startAngle > 180;

  if (innerRadius === 0) {
    return [
      `M ${formatPieCoordinate(center)} ${formatPieCoordinate(center)}`,
      `L ${formatPieCoordinate(outerStart.x)} ${formatPieCoordinate(outerStart.y)}`,
      pieArc(outerRadius, largeArc, 1, outerEnd),
      "Z",
    ].join(" ");
  }

  const innerStart = polarPoint(center, innerRadius, startAngle);
  const innerEnd = polarPoint(center, innerRadius, endAngle);

  return [
    `M ${formatPieCoordinate(outerStart.x)} ${formatPieCoordinate(outerStart.y)}`,
    pieArc(outerRadius, largeArc, 1, outerEnd),
    `L ${formatPieCoordinate(innerEnd.x)} ${formatPieCoordinate(innerEnd.y)}`,
    pieArc(innerRadius, largeArc, 0, innerStart),
    "Z",
  ].join(" ");
};

export const createLumenPieGeometry = (
  data: readonly LumenChartDatum[],
  options: LumenPieGeometryOptions = {},
): LumenPieGeometry => {
  const size = Math.max(1, options.size ?? 320);
  const padding = Math.max(0, options.padding ?? 12);
  const center = size / 2;
  const outerRadius = Math.max(0, center - padding);
  const innerRadius = options.variant === "pie" ? 0 : outerRadius * 0.58;

  const available = data.filter(
    (datum): datum is LumenChartDatum & { y: number } =>
      datum.y !== null && Number.isFinite(datum.y) && datum.y > 0,
  );

  const total = available.reduce((sum, datum) => sum + datum.y, 0);
  let angle = -90;

  const slices = available.map((datum, index) => {
    const percentage = total === 0 ? 0 : datum.y / total;
    const startAngle = angle;
    const endAngle =
      index === available.length - 1 ? 270 : startAngle + percentage * 360;

    angle = endAngle;

    return {
      label: datum.label ?? datum.xLabel ?? String(datum.x),
      path: pieSlicePath(
        center,
        outerRadius,
        innerRadius,
        startAngle,
        endAngle,
      ),
      percentage,
      tone: resolveLumenChartTone(datum.tone, index),
      value: datum.y,
      x: datum.x,
    };
  });

  return {
    center,
    innerRadius,
    outerRadius,
    size,
    slices,
    total,
  };
};

const splitGeometrySegments = (
  data: readonly LumenChartDatum[],
  domain: LumenChartDomain,
  width: number,
  height: number,
  padding: number,
): LumenChartGeometryPoint[][] => {
  const drawableWidth = Math.max(0, width - padding * 2);
  const drawableHeight = Math.max(0, height - padding * 2);
  const denominator = Math.max(1, data.length - 1);
  const segments: LumenChartGeometryPoint[][] = [];
  let current: LumenChartGeometryPoint[] = [];

  for (const [index, datum] of data.entries()) {
    if (datum.y === null || !Number.isFinite(datum.y)) {
      if (current.length > 0) segments.push(current);

      current = [];

      continue;
    }

    current.push({
      ...datum,
      xCoordinate:
        padding +
        (data.length === 1 ? 0.5 : index / denominator) * drawableWidth,
      yCoordinate: scaleLumenChartValue(
        datum.y,
        domain,
        padding + drawableHeight,
        padding,
      ),
    });
  }

  if (current.length > 0) segments.push(current);

  return segments;
};

const segmentPath = (points: readonly LumenChartGeometryPoint[]): string =>
  points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.xCoordinate.toFixed(3)} ${point.yCoordinate.toFixed(3)}`,
    )
    .join(" ");

export const createLumenLineGeometry = (
  data: readonly LumenChartDatum[],
  options: LumenLineGeometryOptions = {},
): LumenLineGeometry => {
  const width = options.width ?? defaultChartSize;
  const height = options.height ?? defaultChartSize;
  const padding = options.padding ?? defaultChartPadding;

  const calculatedDomain = getLumenChartDomain(
    data.map((datum) => datum.y),
    options.includeZero ?? false,
  );

  const domain = {
    max: options.domain?.max ?? calculatedDomain.max,
    min: options.domain?.min ?? calculatedDomain.min,
  };

  const segments = splitGeometrySegments(data, domain, width, height, padding);

  const baseline = scaleLumenChartValue(
    Math.max(domain.min, Math.min(domain.max, 0)),
    domain,
    height - padding,
    padding,
  );

  return {
    areaPaths: segments
      .map((points) => {
        const first = points[0];
        const last = points[points.length - 1];

        if (!first || !last) return "";

        return `${segmentPath(points)} L ${last.xCoordinate.toFixed(3)} ${baseline.toFixed(3)} L ${first.xCoordinate.toFixed(3)} ${baseline.toFixed(3)} Z`;
      })
      .filter(Boolean),
    domain,
    path: segments.map(segmentPath).join(" "),
    points: segments.flat(),
  };
};

export const getLumenChartValueRatio = (
  value: number,
  domain: LumenChartDomain,
): number => {
  const ratio = scaleLumenChartValue(value, domain, 0, 1);

  return Math.max(0, Math.min(1, ratio));
};

export const getLumenChartCategories = (
  series: readonly LumenChartSeries[],
): (number | string)[] => {
  const categories = new Map<string, number | string>();

  for (const item of series) {
    for (const datum of item.data) {
      const key = `${typeof datum.x}:${String(datum.x)}`;

      if (!categories.has(key)) categories.set(key, datum.x);
    }
  }

  return [...categories.values()];
};

export const alignLumenChartSeries = (
  series: LumenChartSeries,
  categories: readonly (number | string)[],
): LumenChartSeries => ({
  ...series,
  data: categories.map(
    (category) =>
      series.data.find((datum) => datum.x === category) ?? {
        x: category,
        y: null,
      },
  ),
});

const getDatumValue = (
  series: LumenChartSeries,
  category: number | string,
): number => series.data.find((datum) => datum.x === category)?.y ?? 0;

const getStackedDomain = (
  series: readonly LumenChartSeries[],
  categories: readonly (number | string)[],
): LumenChartDomain => {
  const totals = categories.flatMap((category) => {
    let positive = 0;
    let negative = 0;

    for (const item of series) {
      const value = getDatumValue(item, category);

      if (value >= 0) positive += value;
      else negative += value;
    }

    return [negative, positive];
  });

  return getLumenChartDomain(totals);
};

const getBarStartValue = (
  layout: LumenBarChartLayout,
  value: number,
  positiveOffset: number,
  negativeOffset: number,
): number => {
  if (layout !== "stacked") return 0;

  return value >= 0 ? positiveOffset : negativeOffset;
};

/* eslint-disable complexity -- Bar geometry deliberately keeps both orientations and layouts in one deterministic pass. */
export const createLumenBarGeometry = (
  series: readonly LumenChartSeries[],
  options: LumenBarGeometryOptions = {},
): LumenBarGeometry => {
  const width = options.width ?? 640;
  const height = options.height ?? 320;
  const orientation = options.orientation ?? "vertical";
  const layout = options.layout ?? "grouped";
  const categories = getLumenChartCategories(series);
  const values = series.flatMap((item) => item.data.map((datum) => datum.y));
  const domain =
    layout === "stacked"
      ? getStackedDomain(series, categories)
      : getLumenChartDomain(values);

  const margin =
    orientation === "horizontal"
      ? {
          bottom: 24,
          left: Math.max(64, Math.min(240, options.categoryWidth ?? 112)),
          right: 20,
          top: 16,
        }
      : { bottom: 52, left: 52, right: 16, top: 16 };

  const plotWidth = Math.max(1, width - margin.left - margin.right);
  const plotHeight = Math.max(1, height - margin.top - margin.bottom);
  const categorySize =
    (orientation === "horizontal" ? plotHeight : plotWidth) /
    Math.max(1, categories.length);
  const categoryGap = Math.min(16, categorySize * 0.24);
  const usableCategorySize = Math.max(1, categorySize - categoryGap);
  const seriesSize = usableCategorySize / Math.max(1, series.length);
  const marks: LumenBarGeometryMark[] = [];
  const categoryPositions: LumenBarGeometryCategory[] = [];

  for (const [categoryIndex, category] of categories.entries()) {
    const categoryStart =
      (orientation === "horizontal" ? margin.top : margin.left) +
      categoryIndex * categorySize +
      categoryGap / 2;

    let positiveOffset = 0;
    let negativeOffset = 0;

    categoryPositions.push({
      category,
      label:
        series
          .flatMap((item) => item.data)
          .find((datum) => datum.x === category)?.xLabel ?? category,
      x:
        orientation === "horizontal"
          ? margin.left - 8
          : categoryStart + usableCategorySize / 2,
      y:
        orientation === "horizontal"
          ? categoryStart + usableCategorySize / 2
          : height - 20,
    });

    for (const [seriesIndex, item] of series.entries()) {
      const value = getDatumValue(item, category);
      const tone = resolveLumenChartTone(item.tone, seriesIndex);

      if (orientation === "horizontal") {
        const startValue = getBarStartValue(
          layout,
          value,
          positiveOffset,
          negativeOffset,
        );
        const endValue = startValue + value;
        const start = scaleLumenChartValue(
          startValue,
          domain,
          margin.left,
          margin.left + plotWidth,
        );
        const end = scaleLumenChartValue(
          endValue,
          domain,
          margin.left,
          margin.left + plotWidth,
        );

        marks.push({
          category,
          height:
            layout === "stacked"
              ? usableCategorySize
              : Math.max(1, seriesSize - 2),
          seriesId: item.id,
          seriesLabel: item.label,
          tone,
          value,
          width: Math.abs(end - start),
          x: Math.min(start, end),
          y:
            categoryStart +
            (layout === "stacked" ? 0 : seriesIndex * seriesSize + 1),
        });
      } else {
        const startValue = getBarStartValue(
          layout,
          value,
          positiveOffset,
          negativeOffset,
        );
        const endValue = startValue + value;
        const start = scaleLumenChartValue(
          startValue,
          domain,
          margin.top + plotHeight,
          margin.top,
        );
        const end = scaleLumenChartValue(
          endValue,
          domain,
          margin.top + plotHeight,
          margin.top,
        );

        marks.push({
          category,
          height: Math.abs(end - start),
          seriesId: item.id,
          seriesLabel: item.label,
          tone,
          value,
          width:
            layout === "stacked"
              ? usableCategorySize
              : Math.max(1, seriesSize - 2),
          x:
            categoryStart +
            (layout === "stacked" ? 0 : seriesIndex * seriesSize + 1),
          y: Math.min(start, end),
        });
      }

      if (layout === "stacked") {
        if (value >= 0) positiveOffset += value;
        else negativeOffset += value;
      }
    }
  }

  return {
    categories: categoryPositions,
    domain,
    height,
    marks,
    width,
  };
};
/* eslint-enable complexity */

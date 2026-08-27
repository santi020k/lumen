import LumenWidgetUI
import SwiftUI
import WidgetKit

private struct LumenWidgetEntry: TimelineEntry {
  let date: Date
}

private struct LumenWidgetProvider: TimelineProvider {
  func placeholder(in _: Context) -> LumenWidgetEntry {
    LumenWidgetEntry(date: Date())
  }

  func getSnapshot(in _: Context, completion: @escaping (LumenWidgetEntry) -> Void) {
    completion(LumenWidgetEntry(date: Date()))
  }

  func getTimeline(in _: Context, completion: @escaping (Timeline<LumenWidgetEntry>) -> Void) {
    completion(Timeline(entries: [LumenWidgetEntry(date: Date())], policy: .never))
  }
}

private struct LumenWidgetPlaygroundView: View {
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @Environment(\.widgetFamily) private var family

  let entry: LumenWidgetEntry

  @ViewBuilder
  var body: some View {
    if #available(iOS 17.0, *) {
      content.containerBackground(for: .widget) {
        backgroundColor
      }
    } else {
      content.background(backgroundColor)
    }
  }

  private var backgroundColor: Color {
    colorScheme == .dark ? LumenWidgetColors.dark.canvas : LumenWidgetColors.light.canvas
  }

  private var content: some View {
    Group {
      switch family {
      case .systemMedium where !dynamicTypeSize.isAccessibilitySize:
        mediumContent
      case .accessoryRectangular:
        accessoryContent
      default:
        compactContent
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .accessibilityElement(children: .contain)
  }

  private var compactContent: some View {
    VStack(alignment: .leading, spacing: LumenWidgetSpacing.md) {
      statusHeader
      LumenWidgetText(.verbatim("Lumen Widget"), style: .title)
      Spacer(minLength: LumenWidgetSpacing.zero)
      LumenWidgetCompactStat(
        label: .verbatim("Duration"),
        value: .verbatim("01:15"),
        iconSystemName: "timer"
      )
      updatedTime
    }
  }

  private var mediumContent: some View {
    HStack(alignment: .center, spacing: LumenWidgetSpacing.xl) {
      VStack(alignment: .leading, spacing: LumenWidgetSpacing.sm) {
        statusHeader
        Spacer(minLength: LumenWidgetSpacing.zero)
        LumenWidgetIcon(systemName: "sparkles", tone: .accent, size: 22)
        LumenWidgetText(.verbatim("Lumen Widget"), style: .title)
        LumenWidgetText(
          .verbatim("WidgetKit reference"),
          style: .caption,
          tone: .secondary
        )
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)

      VStack(alignment: .leading, spacing: LumenWidgetSpacing.sm) {
        LumenWidgetText(.verbatim("Current session"), style: .label, tone: .secondary)
        Spacer(minLength: LumenWidgetSpacing.zero)
        LumenWidgetCompactStat(
          label: .verbatim("Duration"),
          value: .verbatim("01:15"),
          iconSystemName: "timer"
        )
        Spacer(minLength: LumenWidgetSpacing.zero)
        updatedTime
      }
      .padding(LumenWidgetSpacing.lg)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .background(palette.surfaceMuted, in: RoundedRectangle(cornerRadius: LumenWidgetRadius.xl))
      .overlay {
        RoundedRectangle(cornerRadius: LumenWidgetRadius.xl)
          .stroke(palette.line, lineWidth: 1)
      }
    }
  }

  private var accessoryContent: some View {
    HStack(spacing: LumenWidgetSpacing.sm) {
      LumenWidgetIcon(systemName: "timer", tone: .accent, size: 14)
      LumenWidgetText(.verbatim("Lumen"), style: .label)
      Spacer(minLength: LumenWidgetSpacing.xs)
      LumenWidgetText(.verbatim("01:15"), style: .label, tone: .accent)
    }
  }

  private var statusHeader: some View {
    HStack(spacing: LumenWidgetSpacing.sm) {
      LumenWidgetBadge(
        .verbatim("Ready"),
        iconSystemName: "checkmark.circle.fill",
        tone: .success
      )
      Spacer(minLength: LumenWidgetSpacing.zero)
    }
  }

  private var updatedTime: some View {
    LumenWidgetText(
      .verbatim("Updated \(entry.date.formatted(date: .omitted, time: .shortened))"),
      style: .caption,
      tone: .secondary
    )
  }

  private var palette: LumenWidgetColorPalette {
    colorScheme == .dark ? LumenWidgetColors.dark : LumenWidgetColors.light
  }
}

private struct LumenWidgetPlayground: Widget {
  let kind = "LumenWidgetPlayground"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: LumenWidgetProvider()) { entry in
      LumenWidgetPlaygroundView(entry: entry)
    }
    .configurationDisplayName("Lumen Widget")
    .description("Review LumenWidgetUI presentation on a physical device.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
  }
}

@main
private struct LumenWidgetPlaygroundBundle: WidgetBundle {
  var body: some Widget {
    LumenWidgetPlayground()
  }
}

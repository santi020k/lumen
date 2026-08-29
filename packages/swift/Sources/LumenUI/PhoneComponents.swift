#if os(iOS) || os(macOS) || os(visionOS)
import Foundation
import SwiftUI

private let lumenRegionalIndicatorA = 0x1F1E6
private let lumenMaximumNationalPhoneDigits = 15

private struct LumenPhoneFormatMetadata: Decodable, Sendable {
    let leadingDigits: [String]
    let nationalPrefixFormattingRule: String?
    let pattern: String
    let template: String
}

private struct LumenPhoneRegionMetadata: Decodable, Sendable {
    let callingCode: String
    let formats: [LumenPhoneFormatMetadata]
    let leadingDigits: String?
    let nationalPattern: String
    let nationalPrefixForParsing: String?
    let nationalPrefixTransformRule: String?
    let possibleLengths: [Int]
    let regionCode: String
    let typePatterns: [String]
}

private struct LumenPhoneMetadataDocument: Decodable, Sendable {
    let callingCodeRegions: [String: [String]]
    let countries: [LumenPhoneRegionMetadata]
}

private final class LumenPhoneMetadata: @unchecked Sendable {
    static let shared = LumenPhoneMetadata()

    let callingCodeRegions: [String: [String]]
    let countries: [LumenPhoneRegionMetadata]
    let countriesByRegion: [String: LumenPhoneRegionMetadata]

    private init() {
        guard let resourceURL = Bundle.module.url(
            forResource: "LumenPhoneMetadata",
            withExtension: "json"
        ), let data = try? Data(contentsOf: resourceURL),
              let document = try? JSONDecoder().decode(LumenPhoneMetadataDocument.self, from: data) else {
            preconditionFailure("Lumen phone metadata is missing or invalid.")
        }

        callingCodeRegions = document.callingCodeRegions
        countries = document.countries
        countriesByRegion = Dictionary(
            uniqueKeysWithValues: document.countries.map { ($0.regionCode, $0) }
        )
    }
}

/// Localized metadata for one ISO region in the phone-country picker.
public struct LumenPhoneCountry: Hashable, Identifiable, Sendable {
    public let callingCode: String
    public let displayName: String
    public let regionCode: String

    public var flag: String {
        regionCode.unicodeScalars.compactMap { scalar in
            UnicodeScalar(lumenRegionalIndicatorA + Int(scalar.value) - 65).map(String.init)
        }.joined()
    }

    public var id: String { regionCode }

    public var pickerLabel: String {
        "\(flag) \(displayName) (\(callingCode))"
    }

    public init(regionCode: String, callingCode: String, displayName: String) {
        precondition(regionCode.count == 2, "regionCode must be an ISO 3166-1 alpha-2 code.")
        precondition(callingCode.hasPrefix("+"), "callingCode must begin with +.")
        precondition(!displayName.isEmpty, "displayName must not be empty.")

        self.regionCode = regionCode.uppercased()
        self.callingCode = callingCode
        self.displayName = displayName
    }
}

/// Controlled phone input state. `e164` is present only when `isValid` is true.
public struct LumenPhoneNumber: Equatable, Sendable {
    public let country: LumenPhoneCountry
    public let e164: String?
    public let isValid: Bool
    public let nationalNumber: String

    public init(
        country: LumenPhoneCountry,
        nationalNumber: String,
        e164: String?,
        isValid: Bool
    ) {
        self.country = country
        self.nationalNumber = nationalNumber
        self.e164 = e164
        self.isValid = isValid
    }

    public static func empty(country: LumenPhoneCountry) -> LumenPhoneNumber {
        LumenPhoneNumber(
            country: country,
            nationalNumber: "",
            e164: nil,
            isValid: false
        )
    }
}

/// Metadata-backed country choices for `LumenPhoneInput`.
public enum LumenPhoneCountries {
    public static func all(locale: Locale = .current) -> [LumenPhoneCountry] {
        LumenPhoneMetadata.shared.countries.compactMap { metadata in
            forRegion(metadata.regionCode, locale: locale)
        }.sorted { left, right in
            left.displayName.localizedStandardCompare(right.displayName) == .orderedAscending
        }
    }

    public static func forRegion(
        _ regionCode: String,
        locale: Locale = .current
    ) -> LumenPhoneCountry? {
        let normalizedRegion = regionCode.uppercased()

        guard normalizedRegion.unicodeScalars.count == 2,
              normalizedRegion.unicodeScalars.allSatisfy({ 65...90 ~= $0.value }) else {
            return nil
        }

        guard let metadata = LumenPhoneMetadata.shared.countriesByRegion[normalizedRegion] else {
            return nil
        }

        let displayName = locale.localizedString(forRegionCode: normalizedRegion) ?? normalizedRegion

        return LumenPhoneCountry(
            regionCode: normalizedRegion,
            callingCode: "+\(metadata.callingCode)",
            displayName: displayName
        )
    }
}

public func sanitizeLumenPhoneInput(_ input: String) -> String {
    var normalized = ""

    for character in input.trimmingCharacters(in: .whitespacesAndNewlines) {
        if character.isASCII && character.isNumber {
            normalized.append(character)
        } else if character == "+" && normalized.isEmpty {
            normalized.append(character)
        }
    }

    return normalized
}

private func lumenPhoneRegularExpression(_ pattern: String) -> NSRegularExpression? {
    try? NSRegularExpression(pattern: pattern)
}

private func lumenPhoneMatches(_ value: String, pattern: String) -> Bool {
    guard let expression = lumenPhoneRegularExpression("^(?:\(pattern))$") else { return false }
    let range = NSRange(value.startIndex..<value.endIndex, in: value)
    return expression.firstMatch(in: value, range: range) != nil
}

private func lumenPhoneStartsWith(_ value: String, pattern: String) -> Bool {
    guard let expression = lumenPhoneRegularExpression("^(?:\(pattern))") else { return false }
    let range = NSRange(value.startIndex..<value.endIndex, in: value)
    return expression.firstMatch(in: value, range: range) != nil
}

private func isValidLumenPhoneNumber(
    _ nationalNumber: String,
    metadata: LumenPhoneRegionMetadata
) -> Bool {
    guard nationalNumber.count <= lumenMaximumNationalPhoneDigits,
          metadata.possibleLengths.contains(nationalNumber.count),
          lumenPhoneMatches(nationalNumber, pattern: metadata.nationalPattern) else {
        return false
    }

    return metadata.typePatterns.isEmpty || metadata.typePatterns.contains { pattern in
        lumenPhoneMatches(nationalNumber, pattern: pattern)
    }
}

private func extractLumenNationalNumber(
    _ digits: String,
    metadata: LumenPhoneRegionMetadata
) -> String {
    guard digits.count <= lumenMaximumNationalPhoneDigits + 3,
          let prefixPattern = metadata.nationalPrefixForParsing,
          let expression = lumenPhoneRegularExpression("^(?:\(prefixPattern))") else {
        return digits
    }

    let range = NSRange(digits.startIndex..<digits.endIndex, in: digits)
    guard let match = expression.firstMatch(in: digits, range: range) else { return digits }

    let hasCapturedGroups = expression.numberOfCaptureGroups > 0 &&
        match.range(at: expression.numberOfCaptureGroups).location != NSNotFound
    let extracted: String

    if let transformRule = metadata.nationalPrefixTransformRule, hasCapturedGroups {
        extracted = expression.stringByReplacingMatches(
            in: digits,
            range: match.range,
            withTemplate: transformRule
        )
    } else {
        guard let matchedRange = Range(match.range, in: digits) else { return digits }
        extracted = String(digits[matchedRange.upperBound...])
    }

    guard extracted != digits,
          metadata.possibleLengths.contains(extracted.count),
          !(lumenPhoneMatches(digits, pattern: metadata.nationalPattern) &&
              !lumenPhoneMatches(extracted, pattern: metadata.nationalPattern)) else {
        return digits
    }

    return extracted
}

private func formatLumenNationalNumber(
    _ digits: String,
    metadata: LumenPhoneRegionMetadata
) -> String {
    guard digits.count <= lumenMaximumNationalPhoneDigits else { return digits }

    for format in metadata.formats {
        if let leadingPattern = format.leadingDigits.last,
           !lumenPhoneStartsWith(digits, pattern: leadingPattern) {
            continue
        }
        guard let expression = lumenPhoneRegularExpression("^(?:\(format.pattern))$"),
              expression.firstMatch(
                in: digits,
                range: NSRange(digits.startIndex..<digits.endIndex, in: digits)
              ) != nil else {
            continue
        }

        var template = format.template
        if let prefixRule = format.nationalPrefixFormattingRule,
           let firstGroup = template.range(of: #"\$\d"#, options: .regularExpression) {
            template.replaceSubrange(firstGroup, with: prefixRule)
        }

        return expression.stringByReplacingMatches(
            in: digits,
            range: NSRange(digits.startIndex..<digits.endIndex, in: digits),
            withTemplate: template
        )
    }

    return digits
}

private func resolveLumenInternationalMetadata(
    _ digits: String
) -> (metadata: LumenPhoneRegionMetadata, nationalNumber: String)? {
    let store = LumenPhoneMetadata.shared

    for callingCodeLength in stride(from: min(3, digits.count), through: 1, by: -1) {
        let callingCode = String(digits.prefix(callingCodeLength))
        guard let regionCodes = store.callingCodeRegions[callingCode] else { continue }

        let nationalNumber = String(digits.dropFirst(callingCodeLength))
        let candidates = regionCodes.compactMap { store.countriesByRegion[$0] }
        if nationalNumber.count > lumenMaximumNationalPhoneDigits,
           let metadata = candidates.first {
            return (metadata, nationalNumber)
        }
        let leadingCandidates = candidates.filter { metadata in
            metadata.leadingDigits.map { lumenPhoneStartsWith(nationalNumber, pattern: $0) } ?? true
        }
        let selectedCandidates = leadingCandidates.isEmpty ? candidates : leadingCandidates
        let metadata = selectedCandidates.first { candidate in
            isValidLumenPhoneNumber(nationalNumber, metadata: candidate)
        } ?? selectedCandidates.first

        if let metadata { return (metadata, nationalNumber) }
    }

    return nil
}

/// Formats and validates `input` for `country`, returning E.164 only when valid.
public func resolveLumenPhoneNumber(
    country: LumenPhoneCountry,
    input: String,
    locale: Locale = .current
) -> LumenPhoneNumber {
    let normalized = sanitizeLumenPhoneInput(input)

    guard !normalized.isEmpty, normalized != "+" else {
        return .empty(country: country)
    }

    let metadata: LumenPhoneRegionMetadata
    let nationalNumber: String

    if normalized.hasPrefix("+"),
       let international = resolveLumenInternationalMetadata(String(normalized.dropFirst())) {
        metadata = international.metadata
        nationalNumber = international.nationalNumber
    } else if let localMetadata = LumenPhoneMetadata.shared.countriesByRegion[country.regionCode] {
        metadata = localMetadata
        nationalNumber = extractLumenNationalNumber(normalized, metadata: localMetadata)
    } else {
        return LumenPhoneNumber(
            country: country,
            nationalNumber: normalized,
            e164: nil,
            isValid: false
        )
    }

    let resolvedCountry = LumenPhoneCountries.forRegion(metadata.regionCode, locale: locale) ?? country
    let isValid = isValidLumenPhoneNumber(nationalNumber, metadata: metadata)

    return LumenPhoneNumber(
        country: resolvedCountry,
        nationalNumber: formatLumenNationalNumber(nationalNumber, metadata: metadata),
        e164: isValid ? "+\(metadata.callingCode)\(nationalNumber)" : nil,
        isValid: isValid
    )
}

func resolveLumenPhoneInputValue(
    countries: [LumenPhoneCountry],
    country: LumenPhoneCountry,
    input: String,
    locale: Locale = .current
) -> LumenPhoneNumber {
    let resolved = resolveLumenPhoneNumber(country: country, input: input, locale: locale)
    let allowedRegionCodes = Set(countries.map(\.regionCode))

    guard sanitizeLumenPhoneInput(input).hasPrefix("+"),
          !allowedRegionCodes.contains(resolved.country.regionCode) else {
        return resolved
    }

    return resolveLumenPhoneNumber(
        country: country,
        input: resolved.nationalNumber,
        locale: locale
    )
}

func constrainLumenPhoneInputValue(
    countries: [LumenPhoneCountry],
    value: LumenPhoneNumber,
    locale: Locale = .current
) -> LumenPhoneNumber {
    guard let country = countries.first(where: { $0.regionCode == value.country.regionCode }) ?? countries.first else {
        return value
    }
    guard country.regionCode != value.country.regionCode else { return value }

    return resolveLumenPhoneNumber(
        country: country,
        input: value.nationalNumber,
        locale: locale
    )
}

/// A controlled international phone editor with searchable country metadata and E.164 output.
public struct LumenPhoneInput: View {
    @Binding private var value: LumenPhoneNumber
    @Environment(\.isEnabled) private var isEnvironmentEnabled
    @Environment(\.lumenTheme) private var theme
    @State private var countryQuery = ""
    @State private var pickerPresented = false

    private let countries: [LumenPhoneCountry]
    private let countryPickerTitle: String
    private let countrySearchLabel: String
    private let countrySelectorLabel: String
    private let description: String?
    private let enabled: Bool
    private let errorMessage: String?
    private let invalidNumberMessage: String
    private let label: String
    private let locale: Locale
    private let numberLabel: String
    private let required: Bool
    private let showValidationError: Bool

    public init(
        _ label: String,
        value: Binding<LumenPhoneNumber>,
        countries: [LumenPhoneCountry]? = nil,
        locale: Locale = .current,
        description: String? = nil,
        errorMessage: String? = nil,
        showValidationError: Bool = true,
        invalidNumberMessage: String = "Enter a complete phone number.",
        numberLabel: String = "Phone number",
        countrySelectorLabel: String = "Country code",
        countryPickerTitle: String = "Select country",
        countrySearchLabel: String = "Search countries",
        required: Bool = false,
        enabled: Bool = true
    ) {
        self.label = label
        _value = value
        self.locale = locale
        self.countries = countries ?? LumenPhoneCountries.all(locale: locale)
        self.description = description
        self.errorMessage = errorMessage
        self.showValidationError = showValidationError
        self.invalidNumberMessage = invalidNumberMessage
        self.numberLabel = numberLabel
        self.countrySelectorLabel = countrySelectorLabel
        self.countryPickerTitle = countryPickerTitle
        self.countrySearchLabel = countrySearchLabel
        self.required = required
        self.enabled = enabled
    }

    public var body: some View {
        phoneField
            .disabled(!enabled)
            .sheet(isPresented: $pickerPresented) {
                countryPicker
            }
    }

    private var phoneField: some View {
        LumenFieldGroup(
            LocalizedStringKey(label),
            description: localizedDescription,
            errorMessage: localizedError,
            required: required
        ) {
            HStack(spacing: LumenSpacing.sm) {
                countryButton
                phoneTextField
            }
        }
    }

    private var countryButton: some View {
        Button {
            pickerPresented = true
        } label: {
            Text("\(displayValue.country.flag) \(displayValue.country.callingCode)")
                .foregroundStyle(theme.colors.ink)
                .frame(minHeight: 44)
                .padding(.horizontal, LumenSpacing.md)
                .background(theme.colors.surface)
                .overlay {
                    RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                        .stroke(borderColor, lineWidth: 1)
                }
                .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled || countries.isEmpty)
        .accessibilityLabel(countryButtonAccessibilityLabel)
    }

    private var countryButtonAccessibilityLabel: String {
        "\(countrySelectorLabel), \(displayValue.country.displayName), \(displayValue.country.callingCode)"
    }

    private var borderColor: Color {
        effectiveError == nil ? theme.colors.line : theme.colors.danger
    }

    private var effectiveError: String? {
        if let errorMessage { return errorMessage }
        if showValidationError && !displayValue.nationalNumber.isEmpty && !displayValue.isValid {
            return invalidNumberMessage
        }

        return nil
    }

    private var filteredCountries: [LumenPhoneCountry] {
        let query = countryQuery.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !query.isEmpty else { return countries }

        return countries.filter { country in
            country.displayName.localizedCaseInsensitiveContains(query) ||
                country.regionCode.localizedCaseInsensitiveContains(query) ||
                country.callingCode.contains(query)
        }
    }

    private var displayValue: LumenPhoneNumber {
        constrainLumenPhoneInputValue(countries: countries, value: value, locale: locale)
    }

    private var isEnabled: Bool { enabled && isEnvironmentEnabled }

    private var localizedDescription: LocalizedStringKey? {
        guard let description else { return nil }

        return LocalizedStringKey(description)
    }

    private var localizedError: LocalizedStringKey? {
        guard let effectiveError else { return nil }

        return LocalizedStringKey(effectiveError)
    }

    @ViewBuilder
    private var phoneTextField: some View {
        let field = TextField(numberLabel, text: Binding(
            get: { displayValue.nationalNumber },
            set: { input in
                value = resolveLumenPhoneInputValue(
                    countries: countries,
                    country: displayValue.country,
                    input: input,
                    locale: locale
                )
            }
        ))
        .textFieldStyle(.plain)
        .foregroundStyle(theme.colors.ink)
        .frame(minHeight: 44)
        .padding(.horizontal, LumenSpacing.md)
        .background(theme.colors.surface)
        .overlay {
            RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous)
                .stroke(borderColor, lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: LumenRadius.sm, style: .continuous))
        .lumenAccessibilityHint(localizedError ?? localizedDescription)
        .accessibilityLabel(numberLabel)

        #if os(iOS)
        field
            .keyboardType(.phonePad)
            .textContentType(.telephoneNumber)
        #else
        field
        #endif
    }

    private var countryPicker: some View {
        NavigationStack {
            VStack(spacing: LumenSpacing.md) {
                LumenSearchField(countrySearchLabel, text: $countryQuery)

                List(filteredCountries) { country in
                    Button {
                        value = resolveLumenPhoneNumber(
                            country: country,
                            input: displayValue.nationalNumber,
                            locale: locale
                        )
                        pickerPresented = false
                        countryQuery = ""
                    } label: {
                        HStack {
                            Text(country.pickerLabel)
                                .foregroundStyle(theme.colors.ink)
                            Spacer()
                            if country.regionCode == displayValue.country.regionCode {
                                LumenIcon(name: .check)
                                    .accessibilityHidden(true)
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(country.displayName), \(country.callingCode)")
                    .accessibilityAddTraits(
                        country.regionCode == displayValue.country.regionCode ? .isSelected : []
                    )
                }
                .listStyle(.plain)
            }
            .padding(.top, LumenSpacing.md)
            .navigationTitle(countryPickerTitle)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        pickerPresented = false
                        countryQuery = ""
                    }
                }
            }
        }
    }
}
#endif

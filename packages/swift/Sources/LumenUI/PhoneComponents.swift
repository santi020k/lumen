#if os(iOS) || os(macOS)
import Foundation
import PhoneNumberKit
import SwiftUI

private let lumenRegionalIndicatorA = 0x1F1E6

private final class LumenPhoneMetadata: @unchecked Sendable {
    static let shared = LumenPhoneMetadata()

    let utility = PhoneNumberUtility()

    private init() {}
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
        LumenPhoneMetadata.shared.utility.allCountries().compactMap { regionCode in
            forRegion(regionCode, locale: locale)
        }.sorted { left, right in
            left.displayName.localizedStandardCompare(right.displayName) == .orderedAscending
        }
    }

    public static func forRegion(
        _ regionCode: String,
        locale: Locale = .current
    ) -> LumenPhoneCountry? {
        let normalizedRegion = regionCode.uppercased()
        let utility = LumenPhoneMetadata.shared.utility

        guard normalizedRegion.unicodeScalars.count == 2,
              normalizedRegion.unicodeScalars.allSatisfy({ 65...90 ~= $0.value }) else {
            return nil
        }

        guard let countryCode = utility.countryCode(for: normalizedRegion) else { return nil }

        let displayName = locale.localizedString(forRegionCode: normalizedRegion) ?? normalizedRegion

        return LumenPhoneCountry(
            regionCode: normalizedRegion,
            callingCode: "+\(countryCode)",
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

    let utility = LumenPhoneMetadata.shared.utility
    let formatter = PartialFormatter(
        utility: utility,
        defaultRegion: country.regionCode,
        withPrefix: normalized.hasPrefix("+")
    )
    let formattedInput = formatter.formatPartial(normalized)

    guard let parsed = try? utility.parse(normalized, withRegion: country.regionCode) else {
        return LumenPhoneNumber(
            country: country,
            nationalNumber: formattedInput,
            e164: nil,
            isValid: false
        )
    }

    let parsedRegion = utility.getRegionCode(of: parsed)
    let resolvedCountry = normalized.hasPrefix("+") ?
        parsedRegion.flatMap { LumenPhoneCountries.forRegion($0, locale: locale) } ?? country :
        country

    return LumenPhoneNumber(
        country: resolvedCountry,
        nationalNumber: utility.format(parsed, toType: .national),
        e164: utility.format(parsed, toType: .e164),
        isValid: true
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

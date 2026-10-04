import Foundation
import Testing
@testable import LumenUI

@Test func decimalDraftsPreserveIntermediateInputAndRejectUnboundedValues() {
    let english = Locale(identifier: "en_US")
    #expect(parseLumenDecimalDraft("", locale: english) == .empty)
    for value in ["-", ".", "-.", "12."] { #expect(parseLumenDecimalDraft(value, locale: english) == .incomplete) }
    for value in ["1,000", "1e3", " 1", "--1", "1.2.3", String(repeating: "9", count: 100_000)] {
        #expect(parseLumenDecimalDraft(value, locale: english) == .invalid)
    }
    guard case let .valid(value) = parseLumenDecimalDraft("١٢٫٣", locale: Locale(identifier: "ar_EG")) else {
        Issue.record("Localized decimal was rejected")
        return
    }
    #expect(value.formatted(locale: english) == "12.3")
}

@Test func exactDecimalStepsHandleLargeValuesCarryBorrowAndInclusiveBounds() {
    let locale = Locale(identifier: "en_US")
    for (value, direction, step, expected) in [
        ("9007199254740993.1", 1, "0.2", "9007199254740993.3"),
        ("0.1", 1, "0.2", "0.3"), ("9.9", 1, "0.1", "10"),
        ("10", -1, "0.1", "9.9"), ("-0.1", 1, "0.2", "0.1"),
        ("0.1", -1, "0.2", "-0.1"), ("-1", -1, "0.1", "-1.1")
    ] {
        let configuration = LumenNumberConfiguration(min: nil, max: nil, step: step)
        #expect(configuration.stepped(parseLumenDecimalDraft(value, locale: locale), direction: direction, locale: locale) == expected)
    }
    let bounded = LumenNumberConfiguration(min: "0", max: "10", step: "0.2")
    #expect(bounded.stepped(parseLumenDecimalDraft("9.9", locale: locale), direction: 1, locale: locale) == "10")
    #expect(bounded.stepped(.incomplete, direction: 1, locale: locale) == nil)
    #expect(bounded.stepped(.empty, direction: 1, locale: locale) == "0.2")
    let spanish = Locale(identifier: "es_CO")
    #expect(bounded.stepped(parseLumenDecimalDraft("0,1", locale: spanish), direction: 1, locale: spanish) == "0,3")
}

@Test func negativeLocalizedDecimalsRoundTripAndKeepStepping() {
    let english = Locale(identifier: "en_US_POSIX")
    let configuration = LumenNumberConfiguration(min: nil, max: nil, step: "0.5")
    for identifier in ["ar_EG", "fa_IR"] {
        let locale = Locale(identifier: identifier)
        let formatter = NumberFormatter()
        formatter.locale = locale
        let minus = formatter.minusSign ?? "-"
        #expect(parseLumenDecimalDraft(minus, locale: locale) == .incomplete)
        var draft = parseLumenDecimalDraft("0", locale: locale)
        for expected in ["-0.5", "-1", "-1.5"] {
            guard let next = configuration.stepped(draft, direction: -1, locale: locale) else {
                Issue.record("Localized negative draft could not be stepped")
                return
            }
            draft = parseLumenDecimalDraft(next, locale: locale)
            #expect(draft == parseLumenDecimalDraft(expected, locale: english))
            #expect(parseLumenDecimalDraft(minus + next, locale: locale) == .invalid)
            #expect(parseLumenDecimalDraft(next + minus, locale: locale) == .invalid)
        }
    }
}

@Test func numericOTPHandlesLocalizedPasteAndRejectsInvalidOrExcessInput() {
    #expect(normalizeLumenNumericOTP("١٢٣-４５６", length: 6) == "123456")
    #expect(normalizeLumenNumericOTP("123 456", length: 6) == "123456")
    #expect(normalizeLumenNumericOTP("code 123456", length: 6) == nil)
    #expect(normalizeLumenNumericOTP("1234567", length: 6) == nil)
    #expect(normalizeLumenNumericOTP(String(repeating: "9", count: 100_000), length: 6) == nil)
}

@Test func wallClockTimeRetainsSameDayValuesAndInclusiveBounds() {
    let start = LumenTimeSelection(hour: 9, minute: 30)
    let end = LumenTimeSelection(hour: 17, minute: 0)
    #expect(start.isInBounds(min: start, max: end))
    #expect(!LumenTimeSelection(hour: 9, minute: 29).isInBounds(min: start, max: end))
    #expect(LumenTimeSelection(date: start.date) == start)
}

#if os(iOS) || os(macOS) || os(visionOS)
import SwiftUI

@MainActor @Test func advancedNativeControlsCompileWithControlledAndReadOnlyStates() {
    _ = LumenNumberField("Cantidad", text: .constant("12,"), step: "0.1", readOnly: true).body
    _ = LumenPasswordField("Contraseña", text: .constant("synthetic-fixture"), newPassword: true, readOnly: true).body
    _ = LumenInputOTP("Código", text: .constant("123"), masked: true, readOnly: true).body
    _ = LumenAutocomplete("Ciudad", query: .constant(""), selection: .constant(nil as String?), options: [LumenAutocompleteOption(value: "bogota", label: "Bogotá")], readOnly: true).body
    _ = LumenTimeField("Hora", selection: .constant(nil), readOnly: true).body
    _ = LumenImageComparison("Comparación", value: .constant(.nan)) { Color.gray } after: { Color.blue }.body
}
#endif

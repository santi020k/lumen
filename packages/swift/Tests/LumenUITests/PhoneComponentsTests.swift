#if os(iOS) || os(macOS) || os(visionOS)
import Foundation
import Testing
@testable import LumenUI

@Suite("Phone component contracts")
struct PhoneComponentsTests {
    private func colombia() throws -> LumenPhoneCountry {
        try #require(LumenPhoneCountries.forRegion("CO", locale: Locale(identifier: "en_US")))
    }

    @Test("Country metadata includes localized names, flags, and calling codes")
    func countryMetadata() throws {
        let colombia = try colombia()

        #expect(colombia.regionCode == "CO")
        #expect(colombia.callingCode == "+57")
        #expect(colombia.displayName == "Colombia")
        #expect(colombia.flag == "🇨🇴")
        #expect(LumenPhoneCountries.all(locale: Locale(identifier: "en_US")).count > 200)
    }

    @Test("A valid national number resolves to E.164")
    func validNationalNumber() throws {
        let colombia = try colombia()
        let number = resolveLumenPhoneNumber(
            country: colombia,
            input: "6015550123",
            locale: Locale(identifier: "en_US")
        )

        #expect(number.isValid)
        #expect(number.e164 == "+576015550123")
        #expect(number.nationalNumber.filter(\.isNumber) == "6015550123")
    }

    @Test("Incomplete input stays editable without producing E.164")
    func incompleteNumber() throws {
        let colombia = try colombia()
        let number = resolveLumenPhoneNumber(country: colombia, input: "60155")

        #expect(!number.isValid)
        #expect(number.e164 == nil)
        #expect(number.nationalNumber.filter(\.isNumber) == "60155")
    }

    @Test("Pasted international input selects its actual country")
    func pastedInternationalNumber() throws {
        let colombia = try colombia()
        let number = resolveLumenPhoneNumber(
            country: colombia,
            input: "+1 212 555 0123",
            locale: Locale(identifier: "en_US")
        )

        #expect(number.isValid)
        #expect(number.country.regionCode == "US")
        #expect(number.country.callingCode == "+1")
        #expect(number.e164 == "+12125550123")
    }

    @Test("Shared calling codes resolve the matching region")
    func sharedCallingCode() throws {
        let colombia = try colombia()
        let number = resolveLumenPhoneNumber(
            country: colombia,
            input: "+1 604 555 0123",
            locale: Locale(identifier: "en_US")
        )

        #expect(number.isValid)
        #expect(number.country.regionCode == "CA")
        #expect(number.e164 == "+16045550123")
    }

    @Test("National dialing prefixes are removed from E.164 and retained in display formatting")
    func nationalPrefix() throws {
        let france = try #require(
            LumenPhoneCountries.forRegion("FR", locale: Locale(identifier: "en_US"))
        )
        let number = resolveLumenPhoneNumber(country: france, input: "01 42 68 53 00")

        #expect(number.isValid)
        #expect(number.e164 == "+33142685300")
        #expect(number.nationalNumber == "01 42 68 53 00")
    }

    @Test("Invalid patterns and excessive input never produce E.164")
    func invalidAndAdversarialInput() throws {
        let unitedStates = try #require(
            LumenPhoneCountries.forRegion("US", locale: Locale(identifier: "en_US"))
        )
        let invalid = resolveLumenPhoneNumber(country: unitedStates, input: "1234567890")
        let excessiveInput = String(repeating: "9", count: 100_000)
        let excessive = resolveLumenPhoneNumber(country: unitedStates, input: excessiveInput)

        #expect(!invalid.isValid)
        #expect(invalid.e164 == nil)
        #expect(!excessive.isValid)
        #expect(excessive.e164 == nil)
        #expect(excessive.nationalNumber.count == excessiveInput.count)
    }

    @Test("Restricted inputs preserve their configured country allow-list")
    func restrictedInternationalNumber() throws {
        let colombia = try colombia()
        let number = resolveLumenPhoneInputValue(
            countries: [colombia],
            country: colombia,
            input: "+1 212 555 0123",
            locale: Locale(identifier: "en_US")
        )

        #expect(number.country.regionCode == "CO")
        #expect(number.e164 == nil)
        #expect(number.nationalNumber.filter(\.isNumber) == "2125550123")
    }

    @Test("Controlled restricted inputs display an allowed country")
    func controlledRestrictedInput() throws {
        let colombia = try colombia()
        let unitedStates = try #require(LumenPhoneCountries.forRegion("US", locale: Locale(identifier: "en_US")))
        let externalValue = resolveLumenPhoneNumber(
            country: unitedStates,
            input: "2125550123",
            locale: Locale(identifier: "en_US")
        )
        let number = constrainLumenPhoneInputValue(
            countries: [colombia],
            value: externalValue,
            locale: Locale(identifier: "en_US")
        )

        #expect(number.country.regionCode == "CO")
        #expect(number.e164 == nil)
        #expect(number.nationalNumber.filter(\.isNumber) == "2125550123")
    }

    @Test("Unsupported regions and noisy input are handled safely")
    func unsupportedAndNoisyInput() {
        #expect(LumenPhoneCountries.forRegion("ZZ") == nil)
        #expect(sanitizeLumenPhoneInput(" +57 (601) 555-0123 ext. 9 ") == "+5760155501239")
    }
}
#endif

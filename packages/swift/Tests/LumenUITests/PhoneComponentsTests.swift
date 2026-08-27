#if os(iOS) || os(macOS)
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

    @Test("Unsupported regions and noisy input are handled safely")
    func unsupportedAndNoisyInput() {
        #expect(LumenPhoneCountries.forRegion("ZZ") == nil)
        #expect(sanitizeLumenPhoneInput(" +57 (601) 555-0123 ext. 9 ") == "+5760155501239")
    }
}
#endif

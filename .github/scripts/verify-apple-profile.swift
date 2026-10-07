import Foundation
import Security

func require(_ condition: Bool) throws {
    if !condition { throw NSError(domain: "LumenProfileSignature", code: 1) }
}

do {
    try require(CommandLine.arguments.count == 2)
    let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
    var optionalDecoder: CMSDecoder?
    try require(CMSDecoderCreate(&optionalDecoder) == errSecSuccess)
    guard let decoder = optionalDecoder else { throw NSError(domain: "LumenProfileSignature", code: 2) }
    let updated = data.withUnsafeBytes { bytes -> OSStatus in
        guard let address = bytes.baseAddress else { return errSecParam }
        return CMSDecoderUpdateMessage(decoder, address, data.count)
    }
    try require(updated == errSecSuccess)
    try require(CMSDecoderFinalizeMessage(decoder) == errSecSuccess)
    var count = 0
    try require(CMSDecoderGetNumSigners(decoder, &count) == errSecSuccess && count == 1)
    var status: CMSSignerStatus = .unsigned
    var trust: SecTrust?
    var certificateResult: OSStatus = errSecSuccess
    try require(CMSDecoderCopySignerStatus(decoder, 0, SecPolicyCreateBasicX509(), true, &status, &trust, &certificateResult) == errSecSuccess)
    try require(status == .valid && certificateResult == errSecSuccess)
    guard let trust else { throw NSError(domain: "LumenProfileSignature", code: 3) }
    try require(SecTrustEvaluateWithError(trust, nil))
    var content: CFData?
    try require(CMSDecoderCopyContent(decoder, &content) == errSecSuccess)
    guard let content else { throw NSError(domain: "LumenProfileSignature", code: 4) }
    FileHandle.standardOutput.write(content as Data)
} catch {
    FileHandle.standardError.write(Data("Distribution profile CMS signature or signer trust is invalid.\n".utf8))
    exit(1)
}

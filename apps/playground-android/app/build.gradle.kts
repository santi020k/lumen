// cspell:words keyboardqualification performancequalification
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

val qualificationInstall = providers.gradleProperty("lumenQualification")
    .map { value ->
        require(value == "true" || value == "false") { "lumenQualification must be true or false." }
        value == "true"
    }
    .orElse(false)

val lumenComposeVersion = providers.gradleProperty("lumenComposeVersion")
val releaseVersionCode = providers
    .environmentVariable("LUMEN_PLAYGROUND_VERSION_CODE")
    .orElse("1")
    .map { value ->
        value.toIntOrNull()?.takeIf { it in 1..2_100_000_000 }
            ?: error("LUMEN_PLAYGROUND_VERSION_CODE must be an integer from 1 through 2100000000.")
    }
val releaseVersionName = providers
    .environmentVariable("LUMEN_PLAYGROUND_VERSION_NAME")
    .orElse("1.0.0")
    .map { value ->
        value.takeIf { it.matches(Regex("^[0-9]+(\\.[0-9]+){1,2}$")) }
            ?: error("LUMEN_PLAYGROUND_VERSION_NAME must use a version such as 1.0 or 1.0.0.")
    }
val uploadKeystorePath = providers.environmentVariable("LUMEN_PLAYGROUND_KEYSTORE_PATH").orNull
val uploadKeystorePassword = providers.environmentVariable("LUMEN_PLAYGROUND_KEYSTORE_PASSWORD").orNull
val uploadKeyAlias = providers.environmentVariable("LUMEN_PLAYGROUND_KEY_ALIAS").orNull
val uploadKeyPassword = providers.environmentVariable("LUMEN_PLAYGROUND_KEY_PASSWORD").orNull
val hasUploadSigning = listOf(
    uploadKeystorePath,
    uploadKeystorePassword,
    uploadKeyAlias,
    uploadKeyPassword
).all { !it.isNullOrBlank() }

android {
    namespace = "com.santi020k.lumen.playground.compose"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.santi020k.lumen.playground.compose"
        minSdk = 23
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        targetSdk = 37
        versionCode = releaseVersionCode.get()
        versionName = releaseVersionName.get()
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }

    signingConfigs {
        if (hasUploadSigning) {
            create("release") {
                storeFile = file(requireNotNull(uploadKeystorePath))
                storePassword = requireNotNull(uploadKeystorePassword)
                keyAlias = requireNotNull(uploadKeyAlias)
                keyPassword = requireNotNull(uploadKeyPassword)
            }
        }
    }

    buildTypes {
        getByName("debug") {
            if (qualificationInstall.get()) {
                applicationIdSuffix = ".keyboardqualification"
            }
        }
        getByName("release") {
            signingConfig = signingConfigs.findByName("release")
        }
        create("benchmark") {
            initWith(getByName("release"))
            applicationIdSuffix = ".performancequalification"
            signingConfig = signingConfigs.getByName("debug")
            isDebuggable = false
            matchingFallbacks += "release"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.09.00")

    implementation("com.santi020k:lumen-compose:${lumenComposeVersion.get()}")
    implementation(composeBom)
    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material:material-icons-core")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    androidTestImplementation(composeBom)
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test:runner:1.7.0")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

tasks.register("verifyLumenArtifactIsolation") {
    group = "verification"
    description = "Verifies that the phone consumer does not acquire the Wear-only artifact."

    doLast {
        val moduleNames = configurations
            .getByName("debugRuntimeClasspath")
            .incoming
            .resolutionResult
            .allComponents
            .mapNotNull { it.moduleVersion?.name }
            .toSet()

        require("lumen-compose" in moduleNames) {
            "The phone consumer did not resolve lumen-compose."
        }
        require("lumen-compose-wear" !in moduleNames) {
            "The phone consumer acquired the Wear-only artifact."
        }

        val resolvedVersion = configurations
            .getByName("debugRuntimeClasspath")
            .incoming
            .resolutionResult
            .allComponents
            .mapNotNull { it.moduleVersion }
            .single { it.name == "lumen-compose" }
            .version

        require(resolvedVersion == lumenComposeVersion.get()) {
            "The phone consumer resolved lumen-compose $resolvedVersion instead of " +
                lumenComposeVersion.get() + "."
        }
    }
}

val verifyLumenPlayUploadSigning = tasks.register("verifyLumenPlayUploadSigning") {
    group = "verification"
    description = "Fails unless every Google Play upload-signing value is available."

    doLast {
        require(hasUploadSigning) {
            "Google Play upload signing is incomplete. Provide all four " +
                "LUMEN_PLAYGROUND_KEYSTORE_* and LUMEN_PLAYGROUND_KEY_* environment values."
        }

        require(file(requireNotNull(uploadKeystorePath)).isFile) {
            "LUMEN_PLAYGROUND_KEYSTORE_PATH must identify an existing keystore file."
        }
    }
}

tasks.matching { it.name == "bundleRelease" }.configureEach {
    mustRunAfter(verifyLumenPlayUploadSigning)
}

tasks.register("bundleForPlay") {
    group = "distribution"
    description = "Builds a release app bundle only after upload-signing preflight succeeds."
    dependsOn(verifyLumenPlayUploadSigning, "bundleRelease")
}

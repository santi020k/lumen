plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

val lumenComposeVersion = providers.gradleProperty("lumenComposeVersion")
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
        targetSdk = 37
        versionCode = 1
        versionName = "1.0.0"
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
        getByName("release") {
            signingConfig = signingConfigs.findByName("release")
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.08.00")

    implementation("com.santi020k:lumen-compose:${lumenComposeVersion.get()}")
    implementation(composeBom)
    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material:material-icons-core")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
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

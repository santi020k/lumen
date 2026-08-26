plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

val lumenComposeVersion = providers.gradleProperty("lumenComposeVersion")

android {
    namespace = "com.santi020k.lumen.playground.wear"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.santi020k.lumen.playground.wear"
        minSdk = 30
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.08.00")

    implementation("com.santi020k:lumen-compose-wear:${lumenComposeVersion.get()}")
    implementation(composeBom)
    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.runtime:runtime")
    implementation("androidx.compose.ui:ui")
}

tasks.register("verifyLumenArtifactVersions") {
    group = "verification"
    description = "Verifies the exact foundation and Wear artifact versions."

    doLast {
        val lumenVersions = configurations
            .getByName("debugRuntimeClasspath")
            .incoming
            .resolutionResult
            .allComponents
            .mapNotNull { it.moduleVersion }
            .filter { it.group == "com.santi020k" && it.name.startsWith("lumen-compose") }
            .associate { it.name to it.version }
        val expectedVersion = lumenComposeVersion.get()
        val expectedVersions = if (providers.gradleProperty("lumenComposeRepository").isPresent) {
            mapOf(
                "lumen-compose" to expectedVersion,
                "lumen-compose-wear" to expectedVersion
            )
        } else {
            mapOf("lumen-compose" to expectedVersion)
        }

        require(lumenVersions == expectedVersions) {
            "The watch consumer resolved $lumenVersions instead of $expectedVersions."
        }
    }
}

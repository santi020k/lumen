plugins {
    id("com.android.library") version "9.1.1"
    id("maven-publish")
    id("org.jetbrains.kotlin.plugin.compose") version "2.3.21"
}

group = "com.santi020k"
version = "0.1.0"

android {
    namespace = "com.santi020k.lumen"
    compileSdk = 37

    defaultConfig {
        minSdk = 23
        consumerProguardFiles("consumer-rules.pro")
    }

    buildFeatures {
        compose = true
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.08.00")

    implementation(composeBom)
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.runtime:runtime")
    implementation("androidx.compose.ui:ui")
    testImplementation("junit:junit:4.13.2")
}

publishing {
    publications {
        register<MavenPublication>("release") {
            artifactId = "lumen-compose"

            afterEvaluate {
                from(components["release"])
            }
        }
    }
}

import org.gradle.api.tasks.bundling.Jar
import org.gradle.api.tasks.bundling.Zip

plugins {
    id("com.android.library")
    id("maven-publish")
    id("org.jetbrains.dokka-javadoc") version "2.2.0"
    id("org.jetbrains.kotlin.plugin.compose")
    id("signing")
}

group = "com.santi020k"
val lumenComposeVersion = providers.gradleProperty("lumenComposeVersion").get()
version = lumenComposeVersion

android {
    namespace = "com.santi020k.lumen"
    compileSdk = 37

    defaultConfig {
        minSdk = 23
        consumerProguardFiles("consumer-rules.pro")
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }

    lint {
        warningsAsErrors = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.08.00")

    implementation(composeBom)
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.runtime:runtime")
    implementation("androidx.compose.ui:ui")
    androidTestImplementation(composeBom)
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4-accessibility")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test:runner:1.7.0")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    testImplementation("junit:junit:4.13.2")
}

val dokkaJavadocJar by tasks.registering(Jar::class) {
    group = "documentation"
    description = "Packages the generated public API reference for Maven consumers."
    dependsOn(tasks.named("dokkaGeneratePublicationJavadoc"))
    archiveClassifier.set("javadoc")
    from(layout.buildDirectory.dir("dokka/javadoc"))
}

publishing {
    publications {
        register<MavenPublication>("release") {
            artifactId = "lumen-compose"
            artifact(dokkaJavadocJar)

            afterEvaluate {
                from(components["release"])
            }

            pom {
                name.set("Lumen UI for Jetpack Compose")
                description.set("Accessible Jetpack Compose foundations and primitives for Lumen UI.")
                url.set("https://github.com/santi020k/lumen")

                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/license/mit")
                        distribution.set("repo")
                    }
                }

                developers {
                    developer {
                        id.set("santi020k")
                        name.set("Santiago Molina")
                        url.set("https://santi020k.com")
                    }
                }

                scm {
                    connection.set("scm:git:https://github.com/santi020k/lumen.git")
                    developerConnection.set("scm:git:ssh://git@github.com/santi020k/lumen.git")
                    url.set("https://github.com/santi020k/lumen")
                }
            }
        }
    }

    repositories {
        maven {
            name = "centralStaging"
            url = uri(layout.buildDirectory.dir("central-staging"))
        }
    }
}

val signingKey = providers.environmentVariable("MAVEN_SIGNING_KEY")
val signingPassword = providers.environmentVariable("MAVEN_SIGNING_PASSWORD")

if (signingKey.isPresent && signingPassword.isPresent) {
    signing {
        useInMemoryPgpKeys(signingKey.get(), signingPassword.get())
        sign(publishing.publications["release"])
    }
}

tasks.register("verifyMavenPublication") {
    group = "verification"
    description = "Verifies the unsigned local publication shape and required Maven Central metadata."
    dependsOn("publishReleasePublicationToCentralStagingRepository")

    doLast {
        val coordinateDirectory = layout.buildDirectory
            .dir("central-staging/com/santi020k/lumen-compose/$lumenComposeVersion")
            .get()
            .asFile
        val prefix = "lumen-compose-$lumenComposeVersion"
        val requiredArtifacts = listOf(
            "$prefix.aar",
            "$prefix.module",
            "$prefix.pom",
            "$prefix-sources.jar",
            "$prefix-javadoc.jar"
        )
        val missingArtifacts = requiredArtifacts.filterNot { coordinateDirectory.resolve(it).isFile }

        require(missingArtifacts.isEmpty()) {
            "Maven publication is missing: ${missingArtifacts.joinToString()}"
        }

        val pom = coordinateDirectory.resolve("$prefix.pom").readText()
        listOf("<name>", "<description>", "<licenses>", "<developers>", "<scm>").forEach { element ->
            require(element in pom) { "Maven publication POM is missing $element metadata." }
        }
    }
}

tasks.register<Zip>("centralPortalBundle") {
    group = "publishing"
    description = "Builds the signed deployment bundle accepted by the Maven Central Portal."
    dependsOn("publishReleasePublicationToCentralStagingRepository")
    archiveFileName.set("lumen-compose-$lumenComposeVersion-central.zip")
    destinationDirectory.set(layout.buildDirectory.dir("central-bundle"))

    val coordinatePath = "com/santi020k/lumen-compose/$lumenComposeVersion"
    from(layout.buildDirectory.dir("central-staging/$coordinatePath")) {
        into(coordinatePath)
    }

    doFirst {
        require(signingKey.isPresent && signingPassword.isPresent) {
            "MAVEN_SIGNING_KEY and MAVEN_SIGNING_PASSWORD are required for a Central Portal bundle."
        }
    }

    doLast {
        val coordinateDirectory = layout.buildDirectory
            .dir("central-staging/$coordinatePath")
            .get()
            .asFile
        val prefix = "lumen-compose-$lumenComposeVersion"
        val signedArtifacts = listOf(
            "$prefix.aar",
            "$prefix.module",
            "$prefix.pom",
            "$prefix-sources.jar",
            "$prefix-javadoc.jar"
        )
        val missingSignatures = signedArtifacts
            .map { "$it.asc" }
            .filterNot { coordinateDirectory.resolve(it).isFile }

        require(missingSignatures.isEmpty()) {
            "Maven Central bundle is missing signatures: ${missingSignatures.joinToString()}"
        }
    }
}

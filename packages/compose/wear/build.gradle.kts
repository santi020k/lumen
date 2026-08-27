plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.dokka-javadoc") version "2.2.0"
    id("maven-publish")
    id("signing")
}

group = "com.santi020k"
val lumenComposeVersion = providers.gradleProperty("lumenComposeVersion").get()
version = lumenComposeVersion

android {
    namespace = "com.santi020k.lumen.wear"
    compileSdk = 37

    defaultConfig {
        minSdk = 30
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

    api(project(":"))
    implementation(composeBom)
    implementation("androidx.compose.foundation:foundation")
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

val dokkaJavadocJar = tasks.register<Jar>("dokkaJavadocJar") {
    group = "documentation"
    description = "Packages the generated public API reference for Maven consumers."
    dependsOn(tasks.named("dokkaGeneratePublicationJavadoc"))
    archiveClassifier.set("javadoc")
    from(layout.buildDirectory.dir("dokka/javadoc"))
}

publishing {
    publications {
        register<MavenPublication>("release") {
            artifactId = "lumen-compose-wear"
            artifact(dokkaJavadocJar)

            afterEvaluate {
                from(components["release"])
            }

            pom {
                name.set("Lumen UI for Wear OS")
                description.set("At-a-glance, accessible wearable primitives for Lumen UI.")
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
                    tag.set("compose-v$lumenComposeVersion")
                    url.set("https://github.com/santi020k/lumen/tree/compose-v$lumenComposeVersion")
                }
            }
        }
    }

    repositories {
        maven {
            name = "centralStaging"
            url = rootProject.layout.buildDirectory.dir("central-staging").get().asFile.toURI()
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

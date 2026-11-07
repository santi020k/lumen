pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }

    plugins {
        id("com.android.library") version "9.5.1"
        id("org.jetbrains.kotlin.plugin.compose") version "2.4.21"
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

apply(from = "gradle/security-dependencies.gradle")

rootProject.name = "lumen-compose"

include(":wear")

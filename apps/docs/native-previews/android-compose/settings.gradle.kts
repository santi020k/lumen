pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

apply(from = "../../../../packages/compose/gradle/security-dependencies.gradle")

rootProject.name = "lumen-compose-preview"
include(":app")
include(":lumen-compose")
project(":lumen-compose").projectDir = file("../../../../packages/compose")

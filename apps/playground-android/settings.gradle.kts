pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

val lumenComposeRepository = providers.gradleProperty("lumenComposeRepository")

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        if (lumenComposeRepository.isPresent) {
            maven {
                url = uri(lumenComposeRepository.get())
            }
        }
        google()
        mavenCentral()
    }
}

rootProject.name = "lumen-android-playground"
include(":app")
include(":wear")

if (!lumenComposeRepository.isPresent) {
    includeBuild("../../packages/compose") {
        dependencySubstitution {
            substitute(module("com.santi020k:lumen-compose")).using(project(":"))
            substitute(module("com.santi020k:lumen-compose-wear")).using(project(":wear"))
        }
    }
}

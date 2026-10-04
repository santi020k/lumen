plugins {
    id("com.android.application")
}

android {
    namespace = "com.santi020k.lumen.playground.restoration"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.santi020k.lumen.playground.restoration"
        minSdk = 23
        targetSdk = 37
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
}

dependencies {
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test:runner:1.7.0")
    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.4.0")
}

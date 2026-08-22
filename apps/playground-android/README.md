# Lumen Android Playground

A searchable Jetpack Compose gallery for every public component in `lumen-compose`.

Open this directory, not the repository root, in Android Studio. Wait for Gradle sync, select an
emulator or connected device, and run the `app` configuration. Android SDK 37 and JDK 17 or newer
are required.

Alternatively, build an installable debug APK from the repository root:

```bash
pnpm playground:android:build
```

The APK is written to `app/build/outputs/apk/debug/app-debug.apk`. See
[`docs/playgrounds.md`](../../docs/playgrounds.md) for prerequisites, device installation, signing,
and Google Play distribution.

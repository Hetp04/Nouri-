---
description: how to run the app on your phone with Expo Go
---

1.  **Install Expo Go**: Download the "Expo Go" app from the [App Store](https://apps.apple.com/us/app/expo-go/id982107779) (iOS) or [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android).
2.  **Start the Server**: Open your terminal in the project directory and run:
    ```bash
    npx expo start
    ```
3.  **Scan the QR Code**:
    - **Android**: Open the Expo Go app and tap "Scan QR Code".
    - **iOS**: Open the native Camera app and point it at the QR code shown in the terminal.
4.  **Network Check**: Ensure your phone and computer are on the **same Wi-Fi network**.

> [!TIP]
> If you have trouble connecting over Wi-Fi, try the tunnel mode:
> ```bash
> npx expo start --tunnel
> ```

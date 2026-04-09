This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Android APK (Capacitor)

The app is wrapped with **Capacitor** so the **production** site opens in a native WebView (required for Next.js SSR, auth, and Supabase).

1. **Deploy** the web app to Vercel (or your HTTPS host) first.
2. From the repo root, **point the shell at that URL** and sync:

   ```bash
   export CAPACITOR_SERVER_URL=https://your-deployment.vercel.app
   pnpm android:sync
   ```

3. **Install** [Android Studio](https://developer.android.com/studio) (includes Android SDK). Open **SDK Manager** and install a recent SDK + build tools.
4. **Build a debug APK** (command line):

   ```bash
   cd apps/web/android && ./gradlew assembleDebug
   ```

   Debug APK path: `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`

   Or open the project in Android Studio: `pnpm android:open` → **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

5. **Release** builds need signing in Android Studio (**Build → Generate Signed Bundle / APK**).

**Emulator:** To load a machine on your LAN, use `http://10.0.2.2:3000` as `CAPACITOR_SERVER_URL` (Android emulator maps that to the host’s localhost). Use `pnpm` / `cap sync` after changing the URL.

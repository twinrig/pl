# Play Log

Laptop app for logging football plays. One game at a time, kept for a whole season.

The Flutter app in `lib/` is the one to run. The TypeScript sources under `src/` are the original app and stay in the repo.

## Run the Flutter app

Use Flutter 3.47 or newer. From this directory:

```bash
flutter pub get
flutter test
flutter run -d linux
```

A Linux desktop build needs the desktop toolchain:

```bash
sudo apt-get install -y clang cmake ninja-build pkg-config libgtk-3-dev libstdc++-12-dev
```

The open season is saved on this computer as `play-log-season-v1.json`. Season → Save backup writes the same JSON the browser app accepts, and Season → Load backup reads that file.

In VSCodium, open this folder and launch `lib/main.dart` with the Dart extension. A launch config is in `.vscode/launch.json`.

## Original browser app

The screen, season, and roster code is in `src/components/play-book.tsx`. Play sentences are in `src/lib/plays.ts`.

## Run it with no internet

Open `public/Play-Log.html` in a browser. Save that file and double-click it. Games stay in the browser for that file.

## Work on the source

```bash
npm install
npm run dev
```

The preview is at http://127.0.0.1:8080/

Build a new offline file:

```bash
npx vite build --config scripts/vite.local.config.ts
```

Then pack `artifacts/play-log-build/app.css` and `app.js` into one HTML file and replace `public/Play-Log.html`.

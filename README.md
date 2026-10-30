# Fortune Muse — frontend

One Expo app for **web, Android and iOS** (Expo SDK 58, Expo Router, TypeScript).

```
src/app/            screens (file = route)
  welcome, register, login, forgot, reset, verify, magic   M1
  home              spirit picker, memory greeting, topic, daily draw, rooms
  ask               question, tier, voucher, consent, payment
  reading/[id]      M4 result card, feedback (M5), room + draw entry
  draw              M6 daily card + odds
  room/[id]         M7 chat, members, report / block / leave
  settings, memories, avatar, history, export, legal/[doc]   M2/M5/M8/M9
src/components/     Avatar (animated SVG), DeityArt, SafetyCard, ui kit
src/lib/            api client, session, config, theme, legal copy
```

## Run

```
copy .env.example .env     # set EXPO_PUBLIC_API_URL
npm install
npm run web                # browser
npm run android            # Android emulator (API at http://10.0.2.2:4000)
npm run ios                # iOS simulator (macOS only)
npm run typecheck
npm run build:web          # static site in dist/ (single-page app)
```

On a real phone, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP. Native builds and store submission: `npx eas-cli@latest build -p ios|android` (bundle id / package `app.fortunemuse`). See the root README for the in-app purchase decision before submitting to the stores.

# Namma LifeLog 🏠🎙️

A Tanglish voice life-tracker for the whole family — say **"200 achu paal"**, **"bicep 2 set 13 rep poten"** or
**"Appa 6 - 6:10 meditation"** and it's logged, animated and tracked.

## Get the app on your phone
1. Open **Releases → latest** on this repo from your Android phone.
2. Download **NammaLifeLog.apk** and tap it. Allow "Install unknown apps" for your browser/Files app when asked.
3. Every new build installs as an update — your data stays.

## Features
- 🎙️ Tap-to-talk logging (English + Tamil words), ⌨️ keyboard option
- ✏️ Voice corrections: "paal 200 illa 220", "13 illa 15", "change last to 2500", "delete last"
- 🏠 Namma Veedu: whole family in one animated scene — day/night, beds at night, streak flames, outfits & vehicle colours to unlock
- 📊 Budgets (80% warning, 100% alarm), mileage (say "petrol 500 odometer 12450"), workout progress, habit charts, rest-day tips, weekly Tanglish report, monthly family story
- ⏰ Daily reminders + 10 PM summary notification
- 📱 Home-screen widget that only logs (🎙️ / ⌨️)
- 📜 Full history with search, edit and delete; backup / restore

## How it's built
`www/` is the app (plain HTML/CSS/JS). Capacitor wraps it into an Android app (`android/`), with the
home-screen widget in `android/app/src/main/java/com/namma/lifelog/QuickLogWidget.java`.
GitHub Actions (`.github/workflows/build-apk.yml`) builds the APK on every push.

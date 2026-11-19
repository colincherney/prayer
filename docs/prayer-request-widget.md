# Prayer request widget (iPhone)

One small Home Screen widget, **Share a prayer request**, opens the existing
request form at `prayer:///prayerRequest`. The whole widget is tappable. It uses
the app's cream and navy palettes for the iPhone's light and dark appearances.
It shows no prayer content or account data, and tapping it never submits a prayer.

The initial layout is bundled into the iOS extension, so it can render before
the app's first launch. A signed-out user signs in or continues anonymously,
then arrives at the request form. Normal sign-in still opens the home screen.

## Build and add it

Widgets require a new native build; Expo Go and an over-the-air JavaScript
update cannot install an iOS extension. From `prayer`, build with:

```sh
eas build --platform ios --profile development
```

Use `production` instead for a TestFlight/App Store build. EAS configures the
extension `com.saintcentral.app.widgets` and the shared App Group
`group.com.saintcentral.app`. Capability syncing is enabled in `eas.json` so
EAS can provision the new App Group for both targets. The first build may
require an interactive Apple Developer sign-in to register the group.

After installing the new build, touch and hold the iPhone Home Screen, choose
**Edit → Add Widget**, find **Saint Central**, and add **Share a prayer request**.

## Device checks

- Add the widget and check its layout in light, dark, and tinted Home Screen modes.
- With the app closed and a saved session, tap it: the request form should open.
- Repeat with the app already running, including from another tab.
- Sign out, tap the widget, then sign in (password/code or anonymous): the form
  should open after authentication.
- Go back from the form, then sign out and sign in normally: home should open.
- Submit a request through the usual form to verify the existing flow.

Reference: [Expo Widgets](https://docs.expo.dev/versions/latest/sdk/widgets/).

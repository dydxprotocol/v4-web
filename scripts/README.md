## App Integrations
### Amplitude
Analytics service used to collect data to help the dYdX Product team make informed product decisions.

<b>To use with dydxprotocol/v4-web:</b>
1. Amplitude account with API key.
2. Add API key in Github > Secrets and Variables > Actions as `AMPLITUDE_API_KEY`
3. In your deploy scripts add `pnpm run build:inject-amplitude` after your pnpm build / vite build command.

### Bugsnag
Error handling service used to collect handled/unhandled errors within the app. The information collected is used to help debug and alert the engineering team of crashes/unhandled errors within the app to improve stability.

<b>To use with dydxprotocol/v4-web:</b>
1. Bugsnag account with API key.
2. Add API key in Github > Secrets and Variables > Actions as `BUGSNAG_API_KEY`
3. In your deploy scripts add `pnpm run build:inject-bugsnag` after your pnpm build / vite build command.
4. If you are using with the Amplitude deployment scripts, your build command may look like the following: `pnpm build && pnpm run build:inject-amplitude && pnpm run build:inject-bugsnag`

### StatusPage
Service used to inform users of any status updates to our platform. These status updates are manually set and updated by the On Call engineers.

<b>To use with dydxprotocol/v4-web:</b>
1. StatusPage account and script URI
2. Add API key in Github > Secrets and Variables > Actions as `STATUS_PAGE_SCRIPT_URI`
3. In your deploy scripts add `pnpm run build:inject-statuspage` after your pnpm build / vite build command.
4. If you are using with the Amplitude deployment scripts, your build command may look like the following: `pnpm build && pnpm run build:inject-amplitude && pnpm run build:inject-statuspage`

### Intercom
Service used for live customer support (chat/inbox) as well as home for Help Articles.

<b>To use with dydxprotocol/v4-web:</b>
1. Create Intercom account
2. In Intercom UI
Getting started > Set up Messenger > will give you your API Key on Step 2
Customize Intercom Messenger by adding logo and brand colors
3. Add API key in Github > Secrets and Variables > Actions as `INTERCOM_APP_ID`
4. In your deploy scripts add `pnpm run build:inject-intercom` after your pnpm build / vite build command.
5. If you are using with the Amplitude deployment scripts, your build command may look like the following: `pnpm build && pnpm run build:inject-amplitude && pnpm run build:inject-intercom`

### Smartbanner
Smartbanner to show download links to iOS and/or Android native apps on mobile devices.

<b>To use with dydxprotocol/v4-web:</b>
1. iOS app App Store link or Android app Google Play link.
2. Add configurations in Github > Secrets and Variables > Actions as 
    `SMARTBANNER_APP_NAME` for app name
    `SMARTBANNER_ORG_NAME` for organization name
    `SMARTBANNER_ICON_URL` for icon image
    `SMARTBANNER_APPSTORE_URL` for iOS App Store link
    `SMARTBANNER_GOOGLEPLAY_URL` for Android Google Play link
3. In your deploy scripts add `pnpm run build:inject-smartbanner` after your pnpm build / vite build command.
4. If you are using with the Amplitude deployment scripts, your build command may look like the following: `pnpm build && pnpm run build:inject-smartbanner`

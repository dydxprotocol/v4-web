<p align="center"><img src="https://dydx.exchange/icon.svg?" width="256" /></p>

<h1 align="center">dYdX Chain Web</h1>

<div align="center">
  <a href='https://github.com/dydxprotocol/v4-web/blob/main/LICENSE'>
    <img src='https://img.shields.io/badge/License-AGPL_v3-blue.svg' alt='License' />
  </a>
</div>

## Prerequisites

- Node.js version 18 and `pnpm` installed on your system
- Wallet Connect account

For deploying with Vercel, create an account with [Vercel](https://vercel.com/signup) if you don't have one already.

For deploying to IPFS, choose one of the following:

- **Option 1:** A free [web3.storage](https://web3.storage/) account
- **Option 2:** An IPFS client such as [IPFS Kubo](https://docs.ipfs.tech/install/command-line/)

For web3.storage, sign up for an account and generate an API token on the [API tokens page](https://web3.storage/manage/tokens). web3.storage offers an easy-to-use interface for storing and retrieving content on IPFS.

Alternatively, follow the [IPFS Kubo installation guide](https://docs.ipfs.tech/install/command-line/) to download the IPFS command-line tool.

## Part 1: Setting up your local environment

### 1. Clone the repo

Clone the repository and navigate to its directory:

```bash
git clone https://github.com/dydxprotocol/v4-web.git
cd v4-web
```

### 2. Install pnpm and dependencies

Install pnpm and the project dependencies:

```bash
npm i -g pnpm
pnpm i
```

## Part 2: Running the project locally

Run the following command in the project directory to start the development server:

```bash
pnpm dev
```

The development server will be running at `http://localhost:5173` (or the port number displayed in the terminal). Visit this URL to interact with the web app and see your changes in real-time.

To view component stories:

```bash
pnpm ladle
```

This will automatically open your default browser at `http://localhost:61000`.

## Part 3: Configuring environment

Add or modify the relevant endpoints, links and options in `/public/configs/v1/env.json`.

NOTE: There exists a deprecated file `/public/configs/env.json`. If you have users running older mobile versions you may
need to keep feature flags between the two files in sync but may otherwise ignore it.

You'll need to provide a Wallet Connect project id to enable onboarding and wallet connection:

- Create a project on https://cloud.walletconnect.com/app
- Copy over the project ID into this [field](https://github.com/dydxprotocol/v4-web/blob/67ecbd75b43e0c264b7b4d2d9b3d969830b0621c/public/configs/env.json#L822C33-L822C46)

## Part 4: Set Enviornment variables

Set environment variables via `.env`.

- `VITE_BASE_URL` (required): The base URL of the deployment (e.g., `https://www.example.com`).
- `VITE_ALCHEMY_API_KEY` (optional): Add an Alchemy API key for EVM interactions; the app will fall back to public RPCs if not provided.
- `VITE_PK_ENCRYPTION_KEY` (optional): AES encryption key used for signature obfuscation; necessary for enabling the "Remember Me" feature.
- `VITE_V3_TOKEN_ADDRESS` (optional): Address of the V3 $DYDX token.
- `VITE_TOKEN_MIGRATION_URI` (optional): The URL of the token migration website.
- `AMPLITUDE_API_KEY` (optional): Amplitude API key for enabling Amplitude; used with `pnpm run build:inject-amplitude`.
- `AMPLITUDE_SERVER_URL` (optional): Custom Amplitude server URL
- `HOTJAR_SITE_ID`, `HOTJAR_VERSION` (optional): used for enabling Hotjar tracking; used with `pnpm run build:inject-hotjar`
- `BUGSNAG_API_KEY` (optional): API key for enabling Bugsnag; used with `pnpm run build:inject-bugsnag`.
- `IOS_APP_ID` (optional): iOS app ID used for enabling deep linking to the iOS app; used with `pnpm run build:inject-app-deeplinks`.
- `INTERCOM_APP_ID` (optional): Used for enabling Intercom; utilized with `pnpm run build:inject-intercom`.
- `STATUS_PAGE_SCRIPT_URI` (optional): Used for enabling the status page; used with `pnpm run build:inject-statuspage`.
- `SMARTBANNER_APP_NAME`, `SMARTBANNER_ORG_NAME`, `SMARTBANNER_ICON_URL`, `SMARTBANNER_APPSTORE_URL` (optional): Used for enabling the smart app banner; used with `pnpm run build:inject-smartbanner`.
- `VITE_PRIVY_APP_ID` (optional): App ID used for enabling Privy authentication. For deployment of DYDX token holders use `clua5njf801bncvpa0woolzq4`.
- `VITE_PRIVY_APP_CLIENT_ID` (optional): App Client ID used for enabling Privy authentication.

## Part 5: Configure entry points

### HTML files

Edit `scripts/generate-entry-points.js` and set up entry points according to your SEO needs. At least one entry point must be configured,
i.e. at least one element must be present in the `ENTRY_POINTS` array. This array consists of objects of the form:

```
{
    title: 'Page title',
    description: 'Page description.',
    fileName: 'HTML entry point file name, e.g.: index.html',
},
```

The build script will traverse these entries and create files in `entry-points` directory, modifying the `template.html` file accordingly
for each entry. The `rollupOptions` config option in `vite.config.ts` informs the framework about the location of all the entry points
created above.

### Rewrite rules

Edit `vercel.json` and configure the `rewrites` configuration option. It is an array of objects of the form:

```
    {
      "source": "Regexp for matching the URL path, e.g.: /portfolio(/?.*)",
      "destination": "Entry point file to use, e.g.: /entry-points/portfolio.html"
    },
```

Note: The first matching rule takes precedence over anything defined afterwards in the array.

# Testing

## Unit testing

Run unit tests with the following command: `pnpm run test`

## Functional Testing

Functional testing is supported via Browserstack. To run the tests you need to set the following environment variables:

- `BROWSERSTACK_USERNAME`: username of your browserstack account
- `BROWSERSTACK_ACCESS_KEY`: access key of your browserstack account
- `E2E_ENVIRONMENT_URL`: the URL you want to run the functional tests against

To run the tests run: `pnpm run wdio`

# Local Abacus Development

## Directory structure

Our tooling assumes that the [v4-abacus repo](https://github.com/dydxprotocol/v4-abacus) is checked out alongside v4-web:

```
--- parent folder
 |___ v4-web
 |___ v4-abacus
```

## Using your local v4-abacus repo

Whenever you have changes in v4-abacus that you'd like to test in your local v4-web branch, use the following command:

```
pnpm run install-local-abacus --clean
```

The `--clean` option will do some extra cleaning, **it is not needed on subsequent runs.**

## Reverting to remote abacus

Revert any changes to @dydxprotocol/v4-abacus in package.json and pnpm-lock.yaml. If you haven't made any other package changes, you can use:

```
git restore main package.json
git restore main pnpm-lock.yaml
```

Then run `pnpm install`

**Remember to revert to remote abacus before making a PR.**

# Local Client-js Development

## Directory structure

Our tooling assumes that the [v4-clients repo](https://github.com/dydxprotocol/v4-clients) is checked out alongside v4-web:

```
--- parent folder
 |___ v4-web
 |___ v4-clients
```

## Using your local v4-clients repo

Whenever you have changes in v4-clients that you'd like to test in your local v4-web branch, use the following command:

```
pnpm run install-local-client-js --clean
```

The `--clean` option will uninstall the package first, **it is not needed on subsequent runs.**

## Reverting to remote clients

Revert any changes to @dydxprotocol/v4-clients in package.json and pnpm-lock.yaml. If you haven't made any other package changes, you can use:

```
git restore main package.json
git restore main pnpm-lock.yaml
```

Then run `pnpm install`

**Remember to revert to remote v4-clients before making a PR.**

# Local Localization (l10n) Development

## Directory structure

Our tooling assumes that the [v4-localization repo](https://github.com/dydxprotocol/v4-localization) is checked out alongside v4-web:

```
--- parent folder
 |___ v4-web
 |___ v4-localization
```

## Using your local v4-localization repo

When you want to begin developing in v4-localization:
**kill your dev server first** then use the following command:

```
pnpm run install-local-l10n
```

## Reverting to remote localization

You'll need to unlink your local localization package with the following command:

```
pnpm run remove-local-l10n
```

Unlike with abacus, you will need to **restart your dev server** to see the revert take effect.

# Deployments

## Deploying with Vercel

### Step 1: Connect your repository to Vercel

Select "Import Git Repository" from your dashboard, and provide the URL of this repository or your forked repository.

### Step 2: Configure your project

For the "Build & Development Settings", we recommend the following:

- Framework Preset: `Vite`
- Build Command (override): `pnpm run build`

By default, the dev server runs in development mode and the build command runs in production mode. To override the default mode, you can pass in the `--mode` option flag. For example, if you want to build your app for testnet:

```
pnpm run build --mode testnet
```

If you wish to incorporate analytics via Amplitude, Hotjar and Bugsnag, you can use our scripts:
`pnpm run build:inject-amplitude`, `pnpm run build:inject-hotjar` and `pnpm run build:inject-bugsnag`. You will need to provide your own API keys for these services. In the Environment Variables section, name the variables as `AMPLITUDE_API_KEY`, `HOTJAR_SITE_ID`, `HOTJAR_VERSION` and `BUGSNAG_API_KEY` and provide the respective keys as their values.
To incorporate all three services with a single command use `pnpm run build:inject-analytics`.

If you wish to incorporate smart banner for iOS and/or Android apps, you can use our scripts:
`pnpm run build:inject-smartbanner`. You will need to provide your own app configurations for these services. In the Environment Variables section, name the variables as `SMARTBANNER_APP_NAME`, `SMARTBANNER_ORG_NAME`, `SMARTBANNER_ICON_URL` and `SMARTBANNER_APPSTORE_URL` or `SMARTBANNER_GOOGLEPLAY_URL` and provide the respective values.

For more details, check out Vercel's [official documentation](https://vercel.com/docs).

## Deploying to IPFS

### Must Enable HashRouting

Add the following to `.env` file

```
VITE_ROUTER_TYPE=hash
```

### web3.storage: deploy to IPFS via web3.storage using the provided script

Export the API token as an environment variable (replace `your_token` with the generated token), and run the script to build and deploy to IPFS:

```bash
export WEB3_STORAGE_TOKEN=your_token
pnpm run deploy:ipfs
```

Save the URL provided in the output, as it is the link to your deployed content on IPFS.

### IPFS client: deploy with the command-line tool

To use the IPFS command-line tool, run:

```bash
ipfs add -r dist
```

Save the CID provided in the output.

### Accessing your content on IPFS

To access your content on IPFS:

1. **Native IPFS support in a browser:** Use a browser with native IPFS support, such as Brave or Opera. Enable a local IPFS node and visit the URL directly using the IPNS protocol, like `ipfs://your_cid`.

2. **Public IPFS gateway:** Access your content via a public IPFS gateway, such as [https://dweb.link](https://dweb.link/) or [https://w3s.link/](https://w3s.link/). Use the gateway URL with your CID appended, like `https://dweb.link/ipfs/your_cid`.

Replace `your_cid` with the actual CID.

## Cloudflare Settings

We recommend that you add your website to Cloudflare for additional security settings.

To block OFAC Sanctioned countries:

1. Navigate Websites > Domain > Security > WAF

2. Create Rule with the following settings:

- If incoming requests match
  `(ip.geoip.country eq "CU") or (ip.geoip.country eq "IR") or (ip.geoip.country eq "KP") or (ip.geoip.country eq "SY") or (ip.geoip.country eq "MM") or (ip.geoip.subdivision_1_iso_code eq "UA-09") or (ip.geoip.subdivision_1_iso_code eq "UA-14") or (ip.geoip.subdivision_1_iso_code eq "UA-43")`
- This rule will bring up a Cloudflare page when a restricted geography tries to access your site. You will have the option to display:
  1. Custom Text
  - (e.g. `Because you appear to be a resident of, or trading from, a jurisdiction that violates our terms of use, or have engaged in activity that violates our terms of use, you have been blocked. You may withdraw your funds from the protocol at any time.`)
  2. Default Cloudflare WAF block page

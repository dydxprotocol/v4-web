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

Add or modify the relevant endpoints, links and options in `/public/configs/env.json`.
You'll need to provide a Wallet Connect project id to enable onboarding and wallet connection:
- Create a project on https://cloud.walletconnect.com/app
- Copy over the project ID into this [field](https://github.com/dydxprotocol/v4-web/blob/67ecbd75b43e0c264b7b4d2d9b3d969830b0621c/public/configs/env.json#L822C33-L822C46)

## Part 4: Set Enviornment variables
Set environment variables via `.env`.

- `VITE_BASE_URL` (required) the base url of the deployment (e.g https://www.example.com)
- `VITE_ALCHEMY_API_KEY` (optional) Add an Alchemy API Key for evm interactions, app will fallback to public RPCs if not provided
- `VITE_PK_ENCRYPTION_KEY` (optional) AES encryption key used for signature obfuscation, need for enabling "Remember Me" feature.
- `VITE_V3_TOKEN_ADDRESS` (optional) Address of the V3 $DYDX token
- `VITE_TOKEN_MIGRATION_URI` (optional) the URL of the token migration website
- `AMPLITUDE_API_KEY` (optional) Amplitude API Key for enabling Amplitude, used with `pnpm run build:inject-amplitude`
- `BUGSNAG_API_KEY` (optional) API Key for enabling bugsnap, used with `pnpm run build:inject-bugsnag`
- `IOS_APP_ID` (optional) IOS APP ID used for enabling deeplinking to the IOS APP, used with `pnpm run build:inject-app-deeplinks`
- `INTERCOM_APP_ID` (optional) used for enabling intercom, used with `pnpm run build:inject-intercom`
- `STATUS_PAGE_SCRIPT_URI` (optional) used for enabling status page, used with `pnpm run build:inject-statuspage`

# Deployments

## Deploying with Vercel

### Step 1: Connect your repository to Vercel

Select "Import Git Repository" from your dashboard, and provide the URL of this repository or your forked repository.

### Step 2: Configure your project

For the "Build & Development Settings", we recommend the following:
- Framework Preset: `Vite`
- Build Command (override): `pnpm run build`

If you wish to incorporate analytics via Amplitude and Bugsnag, you can use our scripts:
`pnpm run build:inject-amplitude` and `pnpm run build:inject-bugsnag`. You will need to provide your own API keys for these services. In the Environment Variables section, name the variables as `AMPLITUDE_API_KEY` and `BUGSNAG_API_KEY` and provide the respective keys as their values.

For more details, check out Vercel's [official documentation](https://vercel.com/docs).

## Deploying to IPFS

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
  * If incoming requests match
`(ip.geoip.country eq "CU") or (ip.geoip.country eq "IR") or (ip.geoip.country eq "KP") or (ip.geoip.country eq "SY") or (ip.geoip.country eq "MM") or (ip.geoip.subdivision_1_iso_code eq "UA-09") or (ip.geoip.subdivision_1_iso_code eq "UA-14") or (ip.geoip.subdivision_1_iso_code eq "UA-43")`
  * This rule will bring up a Cloudflare page when a restricted geography tries to access your site. You will have the option to display:
    1. Custom Text
      - (e.g. `Because you appear to be a resident of, or trading from, a jurisdiction that violates our terms of use, or have engaged in activity that violates our terms of use, you have been blocked. You may withdraw your funds from the protocol at any time.`)
    2. Default Cloudflare WAF block page

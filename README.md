# v4 Web App

## Prerequisites

- Node.js version 18 and `pnpm` installed on your system

For deploying with Vercel, create an account with [Vercel](https://vercel.com/signup) if you don't have one already.

For deploying to IPFS, choose one of the following:

- **Option 1:** A free [web3.storage](https://web3.storage/) account
- **Option 2:** An IPFS client such as [IPFS Kubo](https://docs.ipfs.tech/install/command-line/)

For web3.storage, sign up for an account and generate an API token on the [API tokens page](https://web3.storage/manage/tokens). web3.storage offers an easy-to-use interface for storing and retrieving content on IPFS.

Alternatively, follow the [IPFS Kubo installation guide](https://docs.ipfs.tech/install/command-line/) to download the IPFS command-line tool.

## Part 1: Setting up your local environment

### Step 1: Clone the repo

Clone the repository and navigate to its directory:

```bash
git clone https://github.com/dydxprotocol/v4-web.git
cd v4-web
```

### Step 2: Install pnpm and dependencies

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

## Part 3: Deploying with Vercel

### Step 1: Connect your repository to Vercel

Select "Import Git Repository" from your dashboard, and provide the URL of this repository or your forked repository.

### Step 2: Configure your project

For the "Build & Development Settings", we recommend the following:
- Framework Preset: `Vite`
- Build Command (override): `pnpm run build`

If you wish to incorporate analytics via Amplitude and Bugsnag, you can use our scripts:
`pnpm run build:inject-amplitude` and `pnpm run build:inject-bugsnag`. You will need to provide your own API keys for these services. In the Environment Variables section, name the variables as `AMPLITUDE_API_KEY` and `BUGSNAG_API_KEY` and provide the respective keys as their values.

For more details, check out Vercel's [official documentation](https://vercel.com/docs).

## Part 4: Deploying to IPFS

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


## Part 5: Customization

### Using CircularXX font

1. **Procure a license for CircularXX:** Visit [Lineto](https://lineto.com/shop/select?family=circular&set=DOPhtVQR-8m) and add `Circular/Family Package` + `Circular Mono/Regular` to your cart. Check the applicable boxes in the `Configure` step to fill out licensing information. After the `Payment` step, download the `.woff2` files.

2. **Add the fonts to `v4-web`:** Add `CircularXXWeb-Bold.woff2`, `CircularXXWeb-Book.woff2`, `CircularXXWeb-Medium.woff2`, and `CircularXXMonoWeb-Regular.woff2` to the `src/styles/fonts` directory.

3. **Add font-family to stylesheets:** In `src/styles/fonts.css`, add the following code to import your newly purchased `Circular` font.
```css
  @font-face {
    src: url("fonts/CircularXXWeb-Book.woff2") format("woff2");
    font-family: "Circular";
    font-weight: 450;
  }

  @font-face {
    src: url("fonts/CircularXXWeb-Medium.woff2") format("woff2");
    font-family: "Circular";
    font-weight: 500;
  }

  @font-face {
    src: url("fonts/CircularXXWeb-Bold.woff2") format("woff2");
    font-family: "Circular";
    font-weight: 700;
  }

  @font-face {
    src: url("fonts/CircularXXMonoWeb-Regular.woff2") format("woff2");
    font-family: "CircularMono";
    font-weight: 400;
  }
```

In `src/styles/text.css`, update lines `4` and `5` to
```css
  --fontFamily-base: "Circular", "Satoshi", system-ui, -apple-system, Helvetica, Arial, sans-serif;
  --fontFamily-monospace: "CircularMono", Courier, monospace, var(--fontFamily-base);
```

Enjoy the newly installed font.

# v4 Web App

## Prerequisites

- Node.js version 18 and `pnpm` installed on your system

For deploying to IPFS, choose one of the following:

- **Option 1:** A free [web3.storage](https://web3.storage/) account
- **Option 2:** An IPFS client such as [IPFS Kubo](https://docs.ipfs.tech/install/command-line/)

For web3.storage, sign up for an account and generate an API token on the [API tokens page](https://web3.storage/manage/tokens). web3.storage offers an easy-to-use interface for storing and retrieving content on IPFS.

Alternatively, follow the [IPFS Kubo installation guide](https://docs.ipfs.tech/install/command-line/) to download the IPFS command-line tool.

## Part 1: Setting up your local environment

### Step 1: Clone the repo

Clone the repository and navigate to its directory:

```bash
git clone https://github.com/dydxprotocol/trader-fe.git
cd trader-fe
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

## Part 3: Deploying to IPFS

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

## Part 4: Accessing your content on IPFS

To access your content on IPFS:

1. **Native IPFS support in a browser:** Use a browser with native IPFS support, such as Brave or Opera. Enable a local IPFS node and visit the URL directly using the IPNS protocol, like `ipfs://your_cid`.

2. **Public IPFS gateway:** Access your content via a public IPFS gateway, such as [https://dweb.link](https://dweb.link/) or [https://w3s.link/](https://w3s.link/). Use the gateway URL with your CID appended, like `https://dweb.link/ipfs/your_cid`.

Replace `your_cid` with the actual CID.
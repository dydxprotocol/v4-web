import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

const GITHUB_API_URL = 'https://api.github.com/repos/wevm/viem/contents/src/chains/definitions';
const GITHUB_RAW_BASE_URL =
  'https://raw.githubusercontent.com/wevm/viem/main/src/chains/definitions';
const OUTPUT_FILE = path.join(process.cwd(), '../public/configs/rpc.json');

// see https://github.com/dydxprotocol/v4-web/blob/main/src/lib/wagmi.ts#L111-L136
const ChainId = {
  ETH_MAINNET: '1',
  ETH_SEPOLIA: '11155111',
  POLYGON_MAINNET: '137',
  POLYGON_MUMBAI: '80002',
  OPT_MAINNET: '10',
  OPT_SEPOLIA: '11155420',
  ARB_MAINNET: '42161',
  ARB_SEPOLIA: '421614',
  BASE_MAINNET: '8453',
  BASE_SEPOLIA: '84532',
};

const getAlchemyRPCUrls = (chainId) => {
  switch (chainId) {
    case ChainId.ETH_MAINNET:
      return `https://eth-mainnet.g.alchemy.com/v2`;
    case ChainId.ETH_SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2`;
    case ChainId.POLYGON_MAINNET:
      return `https://polygon-mainnet.g.alchemy.com/v2`;
    case ChainId.POLYGON_MUMBAI:
      return `https://polygon-mumbai.g.alchemy.com/v2`;
    case ChainId.OPT_MAINNET:
      return `https://opt-mainnet.g.alchemy.com/v2`;
    case ChainId.OPT_SEPOLIA:
      return `https://opt-sepolia.g.alchemy.com/v2`;
    case ChainId.ARB_MAINNET:
      return `https://arb-mainnet.g.alchemy.com/v2`;
    case ChainId.ARB_SEPOLIA:
      return `https://arb-sepolia.g.alchemy.com/v2`;
    case ChainId.BASE_MAINNET:
      return `https://base-mainnet.g.alchemy.com/v2`;
    case ChainId.BASE_SEPOLIA:
      return `https://base-sepolia.g.alchemy.com/v2`;
    default:
      return undefined;
  }
};

async function fetchFile(fileUrl) {
  console.log(`Fetching file: ${fileUrl}`);
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${fileUrl}: ${response.statusText}`);
  }
  return await response.text();
}

function parseTsFile(fileContent) {
  console.log('Parsing file content...');
  const chains = [];
  const chainRegex = /defineChain\s*\(\s*\{\s*(.*?)\s*\}\s*\)/gs;
  const idRegex = /id\s*:\s*([\d_]+)/;
  const nameRegex = /name\s*:\s*'([^']+)'/;
  const rpcRegex = /http\s*:\s*\[\s*'([^']+)'\s*\]/;

  let match;
  while ((match = chainRegex.exec(fileContent)) !== null) {
    const chainMatch = match[1];
    const chainId = idRegex.exec(chainMatch);
    const chainName = nameRegex.exec(chainMatch);
    const chainRpc = rpcRegex.exec(chainMatch);
    if (chainId && chainName && chainRpc) {
      const cleanedId = chainId[1].replace(/_/g, '');
      const alchemyRpcUrl = getAlchemyRPCUrls(cleanedId);
      const chain = {
        id: cleanedId,
        name: chainName[1],
        fallbackRpcUrl: chainRpc[1],
        alchemyRpcUrl: alchemyRpcUrl,
      };
      console.log(
        `Found chain: ${chain.name} with ID ${chain.id} and alchemyRpcUrl ${chain.alchemyRpcUrl} and fallbackRpcUrl ${chain.fallbackRpcUrl}`
      );
      chains.push(chain);
    }
  }
  return chains;
}

async function fetchFileList() {
  console.log('Fetching list of .ts files from GitHub repository...');
  const headers = {};
  const response = await fetch(GITHUB_API_URL, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch file list: ${response.statusText}`);
  }
  const files = await response.json();
  const tsFiles = files
    .filter((file) => file.name.endsWith('.ts'))
    .map((file) => `${GITHUB_RAW_BASE_URL}/${file.name}`);
  console.log(`Found ${tsFiles.length} .ts files.`);
  return tsFiles;
}

async function main() {
  try {
    const fileUrls = await fetchFileList();
    const chainsMap = {};

    for (const fileUrl of fileUrls) {
      try {
        const fileContent = await fetchFile(fileUrl);
        const chains = parseTsFile(fileContent);
        chains.forEach((chain) => {
          chainsMap[chain.id] = {
            name: chain.name,
            fallbackRpcUrl: chain.fallbackRpcUrl,
            alchemyRpcUrl: chain.alchemyRpcUrl || null,
          };
        });
      } catch (error) {
        console.error(`Error processing ${fileUrl}:`, error);
      }
    }

    const jsonContent = JSON.stringify(chainsMap, null, 2);
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf8');
    console.log(`Configuration written to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main().catch((error) => console.error(error));

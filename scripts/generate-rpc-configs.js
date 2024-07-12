import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

const GITHUB_API_URL = 'https://api.github.com/repos/wevm/viem/contents/src/chains/definitions';
const GITHUB_RAW_BASE_URL =
  'https://raw.githubusercontent.com/wevm/viem/main/src/chains/definitions';
const OUTPUT_FILE = path.join(process.cwd(), '../public/configs/rpc.json');
const GITHUB_TOKEN = ''; // Add your GitHub token here if necessary

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
      const chain = {
        id: cleanedId,
        name: chainName[1],
        rpc: chainRpc[1],
      };
      console.log(`Found chain: ${chain.name} with ID ${chain.id} and RPC URL ${chain.rpc}`);
      chains.push(chain);
    }
  }
  return chains;
}

async function fetchFileList() {
  console.log('Fetching list of .ts files from GitHub repository...');
  const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
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
            rpc: chain.rpc,
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

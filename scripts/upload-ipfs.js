/**
 * Uploads contents of the build directory to web3.storage,
 * and returns the CID, which is available over the IPFS network.
 * @param {boolean} rebuild Whether to rebuild the site before uploading, defaults to true
 * @param {string} env The environment to build for, defaults to 'staging'
 * @param {boolean} verbose Whether to print verbose output
 */

import fs from 'fs';
import minimist from 'minimist';
import process from 'process';
import { Web3Storage, getFilesFromPath } from 'web3.storage';
import { execSync } from 'child_process';

const BUILD_DIR_PATH = 'dist';
const API_TOKEN = process.env.WEB3_STORAGE_TOKEN;

const { rebuild, env, verbose } = minimist(process.argv.slice(2), {
  string: ['env'],
  boolean: ['rebuild', 'verbose'],
  default: { env: 'staging', rebuild: true, verbose: false },
  alias: { e: 'env' },
});

if (!API_TOKEN) {
  console.error(
    'Error: An API token is required. Create one at https://web3.storage and set the WEB3_STORAGE_TOKEN environment variable.'
  );
  process.exit(1);
}

if (rebuild || !fs.existsSync(BUILD_DIR_PATH)) {
  if (verbose) console.log(`Building ${env}...`);
  execSync(`pnpm run build --mode ${env} > /dev/null 2>&1`, { stdio: 'inherit' });
}

const client = new Web3Storage({ token: API_TOKEN });
const files = await getFilesFromPath(BUILD_DIR_PATH);

if (verbose) console.log(`Uploading ${files.length} files to web3.storage...`);
const cid = await client.put(files, { wrapWithDirectory: false });

if (verbose) {
  console.log('Content added with CID:', cid);
  console.log(`https://dweb.link/ipfs/${cid}`);
} else {
  console.log(cid);
}

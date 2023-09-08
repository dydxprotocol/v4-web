/**
 * Updates an existing IPNS record or creates a new IPNS record using w3name.
 * @param {string} cid The CID to publish to IPNS
 * @param {string} keyPath The path to the signing key
 * @param {boolean} newIpns Whether to create a new IPNS record
 * @param {boolean} verbose Whether to print verbose output
 */

import * as Name from 'w3name';
import fs from 'fs';
import minimist from 'minimist';
import process from 'process';

const SIGNING_KEY_PATH = '.web3name.key';

async function saveSigningKey(name, outputFilename = SIGNING_KEY_PATH) {
  const bytes = name.key.bytes;
  await fs.promises.writeFile(outputFilename, bytes);
}

async function loadSigningKey(filename) {
  const bytes = await fs.promises.readFile(filename);
  const name = await Name.from(bytes);
  return name;
}

const {
  cid,
  key: keyPath,
  newIpns,
  verbose,
} = minimist(process.argv.slice(2), {
  string: ['cid', 'key'],
  boolean: ['newIpns', 'verbose'],
  default: { verbose: false },
  alias: { c: 'cid', k: 'key' },
});

if (!cid) {
  console.error('Error: Provide the CID with the --cid flag.');
  process.exit(1);
}

if (!keyPath && !newIpns) {
  console.error(
    'Error: To update an existing IPNS record, provide the path to the key file with the --key flag or create a new IPNS record with the --newIpns flag.'
  );
  process.exit(1);
}

let name;
let newRevision;

if (newIpns) {
  if (verbose) console.log(`Creating new IPNS record with cid ${cid}...`);
  name = await Name.create();
  newRevision = await Name.v0(name, `/ipfs/${cid}`);

  await saveSigningKey(name, keyPath);
  if (verbose)
    console.log(`The associated signing key is saved to ${keyPath ?? SIGNING_KEY_PATH}`);
} else {
  if (verbose) console.log(`Updating existing IPNS record with cid ${cid}...`);
  name = await loadSigningKey(keyPath);
  const latestRevision = await Name.resolve(name);
  newRevision = await Name.increment(latestRevision, `/ipfs/${cid}`);
}

if (verbose) console.log('Publishing...');
await Name.publish(newRevision, name.key);

console.log(`ipns://${name.toString()}`);

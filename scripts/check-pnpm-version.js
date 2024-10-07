import { readFileSync } from 'fs';
import path from 'path';

// Read package.json to get the required package manager version
const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const packageManager = packageJson.packageManager ?? '';
const pnpmVersionFromPackageJson = packageManager.startsWith('pnpm@')
  ? packageManager.split('@')[1]
  : null;

const requiredMajorPnpmVersion = pnpmVersionFromPackageJson[0];

if (!requiredMajorPnpmVersion) {
  console.error('Error: Could not find pnpm version in package.json');
  process.exit(1);
}

// Get the user agent (package manager) that initiated the install
const userAgent = process.env.npm_config_user_agent ?? '';
console.log('userAgent', userAgent);

// Check if pnpm was used
if (!userAgent.includes('pnpm')) {
  console.error('Error: This project requires pnpm. Please use pnpm to install dependencies.');
  process.exit(1);
}

// Extract pnpm version from userAgent
const userAgentParts = userAgent.split(' ');
const pnpmInfo = userAgentParts.find((part) => part.startsWith('pnpm/'));
const pnpmVersion = pnpmInfo ? pnpmInfo.split('/')[1] : '';

if (!pnpmVersion.startsWith(`${requiredMajorPnpmVersion}.`)) {
  console.error(
    `Error: This project requires major pnpm version ${requiredMajorPnpmVersion}, but you're using ${pnpmVersion}`
  );
  process.exit(1);
}

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
const requiredMajorVersion = '8'; // Change to your required version

if (!pnpmVersion.startsWith(`${requiredMajorVersion}.`)) {
  console.error(
    `Error: This project requires pnpm version ${requiredMajorVersion}, but you're using ${pnpmVersion}`
  );
  process.exit(1);
}

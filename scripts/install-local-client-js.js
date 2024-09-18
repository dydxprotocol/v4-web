import { fatalExec, nonFatalExec } from './shared-utils.js';

const clean = process.argv.includes('--clean');

if (clean) {
  infoMessage('Running deep clean.');
  nonFatalExec('pnpm remove @dydxprotocol/v4-client-js'); // remove v4-client-js from node_modules
}

infoMessage('Cleaning up any previously built v4-client-js packages...');
nonFatalExec('rm ../v4-clients/v4-client-js/*.tgz');

infoMessage('Building v4-client-js...');
fatalExec(
  'cd ../v4-clients/v4-client-js && source ~/.nvm/nvm.sh && nvm install && nvm use && npm run build && npm pack'
);

infoMessage('Installing local v4-client-js package...');

fatalExec("find ../v4-clients/v4-client-js -name 'dydx*.tgz' | head -n 1 | xargs pnpm install");
infoMessage('Successfully installed local v4-client-js package.');

infoMessage('Generating local-clients-hash...');
fatalExec(
  "find ../v4-clients/v4-client-js -name 'dydx*.tgz' | head -n 1 | shasum > local-client-js-hash"
);

infoMessage('Vite dev server should have restarted automatically.');

function infoMessage(message) {
  console.log('\n**** install-local-clients.js: ' + message + '\n');
}

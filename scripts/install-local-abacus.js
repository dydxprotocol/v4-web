import { fatalExec, nonFatalExec } from './shared-utils.js';

const clean = process.argv.includes('--clean');

if (clean) {
  infoMessage('Running deep clean.');
  nonFatalExec('pnpm remove @dydxprotocol/v4-abacus'); // remove abacus from node_modules
  nonFatalExec('cd ../v4-abacus && ./gradlew clean'); // cleanup gradle build outputs
  nonFatalExec('cd ../v4-abacus && ./gradlew --stop'); // stop any running gradle daemons
  nonFatalExec('rm -rf ~/.gradle/caches'); // nuke the gradle cache
}

infoMessage('Cleaning up any previously built abacus packages...');
nonFatalExec('rm ../v4-abacus/build/packages/*.tgz');

infoMessage('Building abacus...');
fatalExec('cd ../v4-abacus && ./gradlew packJsPackage');

infoMessage('Installing local abacus package...');
fatalExec("find ../v4-abacus/build/packages -name '*.tgz' | head -n 1 | xargs pnpm install");
infoMessage('Successfully installed local abacus package.');

infoMessage('Generating local-abacus-hash...');
fatalExec(
  "find ../v4-abacus/build/packages -name '*.tgz' | head -n 1 | shasum > local-abacus-hash"
);

infoMessage('Vite dev server should have restarted automatically.');

function infoMessage(message) {
  console.log('\n**** install-local-abacus.js: ' + message + '\n');
}

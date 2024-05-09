/* eslint-disable consistent-return */

/* eslint-disable no-console */
import chalk from 'chalk';
import * as childProcess from 'child_process';
import * as readLineSync from 'readline-sync';

const releaseTypes = ['Major', 'Minor', 'Patch'];

const COLORS = {
  INFO: chalk.cyan,
  ERR: chalk.red,
};

const INFO_HEADER = `${chalk.black(chalk.bgCyan('INFO:'))} `;
const ERROR_HEADER = `${chalk.bgRed('Error:')} `;

const info = (msg) => console.log(INFO_HEADER + COLORS.INFO(msg));
const error = (msg) => console.log(ERROR_HEADER + COLORS.ERR(msg));

const rl = {
  keyInSelect: (opts, msg) => readLineSync.keyInSelect(opts, COLORS.INFO(msg)),
  keyInYN: (msg) => readLineSync.keyInYN(COLORS.INFO(msg)),
};

const execSync = (cmd) => {
  try {
    return childProcess.execSync(cmd, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (err) {
    process.exit(1);
  }
};

const getNewSemVerNumber = (semVerNumber, releaseType) => {
  const semVerNumberAsArray = semVerNumber.split('.');
  const idxToUpdate = releaseType;
  semVerNumberAsArray[idxToUpdate] = Number(semVerNumberAsArray[idxToUpdate]) + 1;
  for (let i = idxToUpdate + 1; i < semVerNumberAsArray.length; i += 1) {
    semVerNumberAsArray[i] = 0;
  }
  return semVerNumberAsArray.join('.');
};

const bumpSemVer = (releaseTypeIndex) => {
  const currentVersion = execSync('git describe --tags $(git rev-list --tags --max-count=1)');

  info('Current version is', currentVersion);
  const semVerNumber = currentVersion.split('v')[1];
  const newSemVerNumber = getNewSemVerNumber(semVerNumber, releaseTypeIndex);
  info(
    `Updated semantic version number [type: ${releaseTypes[releaseTypeIndex]}]`,
    newSemVerNumber
  );
  return newSemVerNumber;
};

const cutTagForSemVer = (newSemVerNumber) => {
  const shouldCutTag = rl.keyInYN(`Next version to release is ${newSemVerNumber}, okay?`);
  if (!shouldCutTag) {
    info('Got it! Not cutting a new tag, exiting now.');
    process.exit(0);
  }
  info('Cutting new tag...');

  execSync(`git tag -a release/v${newSemVerNumber} -m "v4-web release v${newSemVerNumber}"`);
  execSync(`git push origin release/v${newSemVerNumber}`);
  info('New tag successfully published!');
  process.exit(0);
};

const ask = async () => {
  const releaseTypeIndex = rl.keyInSelect(releaseTypes, 'What kind of release is this?');
  if (!releaseTypes[releaseTypeIndex]) {
    console.error('Error, please select 1, 2, or 3!');
    process.exit(1);
  }
  info('Release type:', releaseTypes[releaseTypeIndex]);
  info('Checking git status cleanliness...');
  const uncommittedChanges = execSync('git status --porcelain');
  info(uncommittedChanges);
  if (uncommittedChanges) {
    error('You have uncommitted changes, please clean up your git status first\n');
    process.exit(1);
  }
  info('Checking out main and pulling latest changes...');
  execSync('git checkout main && git pull origin main && git fetch --all');
  const newSemVerNumber = bumpSemVer(releaseTypeIndex);
  cutTagForSemVer(newSemVerNumber);
};

ask();

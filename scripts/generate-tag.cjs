/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable func-names */
/* eslint-disable no-console */
const childProcess = require('child_process');
const rl = require('readline-sync');

const releaseTypes = ['Major', 'Minor', 'Patch'];

const execSync = (cmd) => {
  try {
    childProcess.execSync(cmd, {
      encoding: 'utf-8',
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

  console.log('Current version is', currentVersion);
  const semVerNumber = currentVersion.split('v')[1];
  const newSemVerNumber = getNewSemVerNumber(semVerNumber, releaseTypeIndex);
  console.log(
    `Updated semantic version number [type: ${releaseTypes[releaseTypeIndex]}]`,
    newSemVerNumber
  );
  return newSemVerNumber;
};

const cutTagForSemVer = (newSemVerNumber) => {
  const shouldCutTag = rl.keyInYN(`Next version to release is ${newSemVerNumber}, okay?`);
  if (!shouldCutTag) {
    console.log('Got it! Not cutting a new tag, exiting now.');
    process.exit(0);
  }
  console.log('Cutting new tag...');

  execSync(`git tag -a release/v${newSemVerNumber} -m "v4-web release v${newSemVerNumber}"`);
  execSync(`git push origin release/v${newSemVerNumber}`);
  console.log('New tag successfully published!');
  process.exit(0);
};

const ask = async () => {
  const releaseTypeIndex = rl.keyInSelect(releaseTypes, 'What kind of release is this?');
  if (!releaseTypes[releaseTypeIndex]) {
    console.error('Error, please select 1, 2, or 3!');
    process.exit(1);
  }
  console.log('\nRelease type:', releaseTypes[releaseTypeIndex]);
  console.log('Checking out main branch');
  execSync('git checkout main && git pull origin main && git fetch --all');
  const newSemVerNumber = bumpSemVer(releaseTypeIndex);
  cutTagForSemVer(newSemVerNumber);
};

ask();

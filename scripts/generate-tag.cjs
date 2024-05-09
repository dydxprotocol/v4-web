/* eslint-disable func-names */
/* eslint-disable no-console */
const childProcess = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const releaseTypeToSemVerIdx = {
  1: 0,
  2: 1,
  3: 2,
};

const releaseTypeToName = {
  1: 'Major',
  2: 'Minor',
  3: 'Patch',
};

const getNewSemVerNumber = (semVerNumber, releaseType) => {
  const semVerNumberAsArray = semVerNumber.split('.');
  const idxToUpdate = releaseTypeToSemVerIdx[releaseType];
  semVerNumberAsArray[idxToUpdate] = Number(semVerNumberAsArray[idxToUpdate]) + 1;
  for (let i = idxToUpdate + 1; i < semVerNumberAsArray.length; i += 1) {
    semVerNumberAsArray[i] = 0;
  }
  return semVerNumberAsArray.join('.');
};

const ask = () => {
  rl.question(
    'What kind of release is this?\n[1] Major\n[2] Minor\n[3] Patch\n',
    function (releaseType) {
      if (!releaseTypeToName[releaseType]) {
        console.error('Error, please select 1, 2, or 3!');
        process.exit(1);
      }
      console.log('\nRelease type:', releaseTypeToName[releaseType]);
      console.log('Checking out main branch');
      childProcess.execSync('git checkout main && git pull origin main && git fetch --all');
      const currentVersion = childProcess.execSync(
        'git describe --tags $(git rev-list --tags --max-count=1)',
        {
          encoding: 'utf-8',
        }
      );

      console.log('Current version is', currentVersion);
      const semVerNumber = currentVersion.split('v')[1];
      const newSemVerNumber = getNewSemVerNumber(semVerNumber, releaseType);
      console.log(
        `Updated semantic version number [type: ${releaseTypeToName[releaseType]}]`,
        newSemVerNumber
      );
      rl.question(`Next version to release is ${newSemVerNumber}, okay? [y/n]`, function (answer) {
        if (answer !== 'y') {
          console.log('Got it! Not cutting a new tag, exiting now.');
          process.exit(0);
        }
        console.log('Cutting new tag...');
        try {
          childProcess.execSync(
            `git tag -a release/v${newSemVerNumber} -m "v4-web release v${newSemVerNumber}"`
          );
          childProcess.execSync(`git push origin release/v${newSemVerNumber}`);
          console.log('New tag successfully published!');
          process.exit(0);
        } catch (err) {
          console.log('Error cutting new tag:', err);
          process.exit(1);
        }
      });
    }
  );
};

rl.on('close', function () {
  console.log('\nBYE BYE !!!');
  process.exit(0);
});

ask();

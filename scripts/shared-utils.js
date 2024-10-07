import { execSync } from 'child_process';

export function nonFatalExec(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    // Do nothing.
  }
}

export function fatalExec(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    process.exit(1);
  }
}

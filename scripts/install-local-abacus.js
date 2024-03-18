import { execSync } from 'child_process';

console.log("Cleaning up any previously built abacus packages...")
try {
    execSync('rm ../v4-abacus/build/packages/*.tgz', { stdio: "inherit" });
} catch (error) {
    console.error('Error cleaning up:', error);
    process.exit(1); 
}

console.log("Building abacus...")
try {
    execSync('cd ../v4-abacus && ./gradlew packJsPackage', { stdio: "inherit" });
} catch (error) {
    console.error('Error building abacus:', error);
    process.exit(1); 
}


console.log("Installing local abacus package...")
try {
    execSync("find ../v4-abacus/build/packages -name '*.tgz' | head -n 1 | xargs pnpm install", { stdio: "inherit" });
} catch (error) {
    console.error('Error installing abacus:', error);
    process.exit(1); 
}

console.log("Successfully installed local abacus package - restart pnpm dev")
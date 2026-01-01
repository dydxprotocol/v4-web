#!/usr/bin/env node
import { copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const envFiles = [
  { example: '.env.example', target: '.env' },
  { example: '.env.test.example', target: '.env.test' },
];

console.log('📝 Generating .env files from .example templates...\n');

envFiles.forEach(({ example, target }) => {
  const examplePath = join(projectRoot, example);
  const targetPath = join(projectRoot, target);

  if (!existsSync(examplePath)) {
    console.log(`⚠️  ${example} not found, skipping...`);
    return;
  }

  if (existsSync(targetPath)) {
    console.log(`✓ ${target} already exists, skipping...`);
    return;
  }

  try {
    copyFileSync(examplePath, targetPath);
    console.log(`✓ Created ${target} from ${example}`);
  } catch (error) {
    console.error(`✗ Failed to create ${target}:`, error.message);
  }
});

console.log('\n✨ Environment setup complete!');

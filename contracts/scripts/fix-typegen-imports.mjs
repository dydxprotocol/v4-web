#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const typesDir = new URL('../types', import.meta.url).pathname;

async function fixImports() {
  const files = await readdir(typesDir);

  for (const file of files) {
    if (!file.endsWith('.ts')) continue;

    const filePath = join(typesDir, file);
    let content = await readFile(filePath, 'utf-8');

    // Add .js extension to relative imports
    content = content.replace(
      /from ['"](\.\/.+?)(?<!\.js)['"]/g,
      'from "$1.js"'
    );

    await writeFile(filePath, content, 'utf-8');
  }

  console.log('✓ Fixed imports in generated types');
}

fixImports().catch(console.error);

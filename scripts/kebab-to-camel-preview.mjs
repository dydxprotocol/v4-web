#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to process
const TARGET_DIRS = [
  path.resolve(__dirname, '../frontend/src'),
  path.resolve(__dirname, '../fuel-ts-sdk/src'),
];

// Directories to skip
const SKIP_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage'];

/**
 * Convert kebab-case to camelCase
 */
function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert kebab-case to PascalCase
 */
function kebabToPascal(str) {
  const camel = kebabToCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Check if a file is a React component
 */
function isReactComponent(filePath) {
  const ext = path.extname(filePath);
  if (!['.tsx', '.jsx'].includes(ext)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for common React component patterns
    const hasExportDefault = /export\s+default\s+/.test(content);
    const hasExportFunction = /export\s+(function|const)\s+[A-Z]/.test(content);
    const hasJSX = /<[A-Z]/.test(content) || /<>/.test(content) || /React\.createElement/.test(content);

    return (hasExportDefault || hasExportFunction) && hasJSX;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a name contains kebab-case
 */
function hasKebabCase(name) {
  return /-/.test(name);
}

/**
 * Get the new name for a file or directory
 */
function getNewName(oldPath, isFile) {
  const dir = path.dirname(oldPath);
  const ext = path.extname(oldPath);
  const baseName = path.basename(oldPath, ext);

  if (!hasKebabCase(baseName)) {
    return null; // No change needed
  }

  let newBaseName;

  if (isFile && isReactComponent(oldPath)) {
    // React component - use PascalCase
    newBaseName = kebabToPascal(baseName);
  } else {
    // Everything else - use camelCase
    newBaseName = kebabToCamel(baseName);
  }

  const newName = isFile ? `${newBaseName}${ext}` : newBaseName;
  return path.join(dir, newName);
}

/**
 * Recursively find all files and directories
 */
function findAllPaths(dir, results = { files: [], dirs: [] }) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (SKIP_DIRS.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      results.dirs.push(fullPath);
      findAllPaths(fullPath, results);
    } else if (entry.isFile()) {
      results.files.push(fullPath);
    }
  }

  return results;
}

/**
 * Build a map of old paths to new paths
 */
function buildRenameMap(targetDirs) {
  const renameMap = new Map();

  for (const targetDir of targetDirs) {
    console.log(`Scanning ${targetDir}...`);
    const { files, dirs } = findAllPaths(targetDir);

    // Process files first
    for (const filePath of files) {
      const newPath = getNewName(filePath, true);
      if (newPath && newPath !== filePath) {
        renameMap.set(filePath, newPath);
      }
    }

    // Process directories (sort by depth, deepest first)
    const sortedDirs = dirs.sort((a, b) => {
      const depthA = a.split(path.sep).length;
      const depthB = b.split(path.sep).length;
      return depthB - depthA;
    });

    for (const dirPath of sortedDirs) {
      const newPath = getNewName(dirPath, false);
      if (newPath && newPath !== dirPath) {
        renameMap.set(dirPath, newPath);
      }
    }
  }

  return renameMap;
}

/**
 * Main execution
 */
function main() {
  console.log('Preview: kebab-case to camelCase conversion\n');

  // Build the rename map
  const renameMap = buildRenameMap(TARGET_DIRS);

  if (renameMap.size === 0) {
    console.log('No files or directories to rename.');
    return;
  }

  console.log(`\nFound ${renameMap.size} files/directories to rename:\n`);

  // Group by type
  const components = [];
  const files = [];
  const dirs = [];

  for (const [oldPath, newPath] of renameMap.entries()) {
    const oldName = path.basename(oldPath);
    const newName = path.basename(newPath);
    const item = { old: oldName, new: newName, path: oldPath };

    if (fs.statSync(oldPath).isDirectory()) {
      dirs.push(item);
    } else if (isReactComponent(oldPath)) {
      components.push(item);
    } else {
      files.push(item);
    }
  }

  if (components.length > 0) {
    console.log('React Components (PascalCase):');
    components.forEach(({ old, new: newName }) => {
      console.log(`  ${old} -> ${newName}`);
    });
    console.log('');
  }

  if (files.length > 0) {
    console.log('Other Files (camelCase):');
    files.forEach(({ old, new: newName }) => {
      console.log(`  ${old} -> ${newName}`);
    });
    console.log('');
  }

  if (dirs.length > 0) {
    console.log('Directories (camelCase):');
    dirs.forEach(({ old, new: newName }) => {
      console.log(`  ${old} -> ${newName}`);
    });
    console.log('');
  }

  console.log(`\nTotal: ${components.length} components, ${files.length} files, ${dirs.length} directories`);
  console.log('\nTo apply these changes, run: node scripts/kebab-to-camel.mjs');
}

main();

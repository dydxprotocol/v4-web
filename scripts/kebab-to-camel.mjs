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

// File extensions to process imports in
const IMPORT_FILE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

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
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
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
 * Update import statements in a file
 */
function updateImportsInFile(filePath, renameMap) {
  if (!IMPORT_FILE_EXTS.includes(path.extname(filePath))) {
    return;
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    return;
  }

  let modified = false;
  let newContent = content;

  // Match import/export statements
  const importRegex = /(import|export)([^'"]*from\s+['"])([^'"]+)(['"])/g;

  newContent = newContent.replace(importRegex, (match, keyword, beforePath, importPath, afterPath) => {
    // Resolve the import path relative to the current file
    let resolvedPath;

    if (importPath.startsWith('.')) {
      // Relative import
      const fileDir = path.dirname(filePath);
      resolvedPath = path.resolve(fileDir, importPath);
    } else {
      // Absolute or package import - skip
      return match;
    }

    // Check if this path (or any parent) has been renamed
    let newImportPath = importPath;
    let changed = false;

    // Try to resolve with various extensions
    const possibleExts = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

    for (const ext of possibleExts) {
      const testPath = resolvedPath + ext;

      // Check if this exact file was renamed
      if (renameMap.has(testPath)) {
        const newResolvedPath = renameMap.get(testPath);
        const fileDir = path.dirname(filePath);
        let relative = path.relative(fileDir, newResolvedPath);

        // Ensure relative paths start with ./ or ../
        if (!relative.startsWith('.')) {
          relative = './' + relative;
        }

        // Remove extension if original import didn't have one
        if (!path.extname(importPath)) {
          relative = relative.replace(/\.(tsx?|jsx?|[cm]js)$/, '');
        }

        newImportPath = relative;
        changed = true;
        break;
      }

      // Check if it's a directory import (index file)
      const indexPath = path.join(testPath, 'index' + ext);
      if (renameMap.has(indexPath) || renameMap.has(testPath)) {
        // Check if any parent directory in the path was renamed
        let currentPath = testPath;
        let newPath = testPath;

        while (currentPath !== path.dirname(currentPath)) {
          if (renameMap.has(currentPath)) {
            newPath = newPath.replace(currentPath, renameMap.get(currentPath));
            changed = true;
          }
          currentPath = path.dirname(currentPath);
        }

        if (changed) {
          const fileDir = path.dirname(filePath);
          let relative = path.relative(fileDir, newPath);

          if (!relative.startsWith('.')) {
            relative = './' + relative;
          }

          if (!path.extname(importPath)) {
            relative = relative.replace(/\.(tsx?|jsx?|[cm]js)$/, '');
          }

          newImportPath = relative;
          break;
        }
      }
    }

    // Also check if any parent directory in the import path was renamed
    if (!changed) {
      const fileDir = path.dirname(filePath);
      let testResolvedPath = resolvedPath;

      while (testResolvedPath !== path.dirname(testResolvedPath)) {
        if (renameMap.has(testResolvedPath)) {
          // A parent directory was renamed
          const oldDirPart = testResolvedPath;
          const newDirPart = renameMap.get(testResolvedPath);

          // Replace the old directory with the new one in the full resolved path
          const fullOldPath = resolvedPath;
          const fullNewPath = fullOldPath.replace(oldDirPart, newDirPart);

          let relative = path.relative(fileDir, fullNewPath);

          if (!relative.startsWith('.')) {
            relative = './' + relative;
          }

          if (!path.extname(importPath)) {
            relative = relative.replace(/\.(tsx?|jsx?|[cm]js)$/, '');
          }

          newImportPath = relative;
          changed = true;
          break;
        }
        testResolvedPath = path.dirname(testResolvedPath);
      }
    }

    if (changed) {
      modified = true;
      return `${keyword}${beforePath}${newImportPath}${afterPath}`;
    }

    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

/**
 * Perform the actual renaming
 */
function performRenames(renameMap) {
  // Sort by path depth (deepest first) to avoid conflicts
  const sortedEntries = Array.from(renameMap.entries()).sort((a, b) => {
    const depthA = a[0].split(path.sep).length;
    const depthB = b[0].split(path.sep).length;
    return depthB - depthA;
  });

  for (const [oldPath, newPath] of sortedEntries) {
    try {
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${oldPath} -> ${newPath}`);
      }
    } catch (error) {
      console.error(`Error renaming ${oldPath}: ${error.message}`);
    }
  }
}

/**
 * Update all imports in all files
 */
function updateAllImports(targetDirs, renameMap) {
  console.log('\nUpdating imports...');

  for (const targetDir of targetDirs) {
    const { files } = findAllPaths(targetDir);

    for (const filePath of files) {
      updateImportsInFile(filePath, renameMap);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Starting kebab-case to camelCase conversion...\n');

  // Build the rename map
  const renameMap = buildRenameMap(TARGET_DIRS);

  if (renameMap.size === 0) {
    console.log('No files or directories to rename.');
    return;
  }

  console.log(`\nFound ${renameMap.size} files/directories to rename:\n`);
  for (const [oldPath, newPath] of renameMap.entries()) {
    console.log(`  ${path.basename(oldPath)} -> ${path.basename(newPath)}`);
  }

  // Ask for confirmation
  console.log('\nThis will rename files and update all imports.');
  console.log('Make sure you have committed your changes and have a backup!');
  console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  setTimeout(() => {
    // Perform renames
    console.log('Performing renames...\n');
    performRenames(renameMap);

    // Update imports
    console.log('\nUpdating imports in all files...\n');
    updateAllImports(TARGET_DIRS, renameMap);

    console.log('\nDone! Please review the changes and run your tests.');
  }, 5000);
}

main();

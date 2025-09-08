#!/usr/bin/env node

/**
 * Remark-based Mermaid Syntax Validator
 * Uses remark to parse markdown and validate mermaid code blocks
 * 
 * Usage:
 *   node scripts/validate-mermaid-remark.js [directory]
 * 
 * Examples:
 *   node scripts/validate-mermaid-remark.js                    # Validate current directory
 *   node scripts/validate-mermaid-remark.js ../other-repo     # Validate another repository
 *   node scripts/validate-mermaid-remark.js /path/to/project  # Validate absolute path
 */

import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import { JSDOM } from 'jsdom';
import DOMPurifyFactory from 'isomorphic-dompurify';

// Setup minimal DOM environment for mermaid
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="mermaid-container"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;

// Initialize DOMPurify with the JSDOM window
const DOMPurify = DOMPurifyFactory(dom.window);
global.DOMPurify = DOMPurify;

// Import and initialize mermaid
const mermaidModule = await import('mermaid');
const mermaid = mermaidModule.default || mermaidModule;

// Initialize mermaid with minimal config
mermaid.initialize({ 
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'default'
});

console.log('🧜‍♀️ Remark-based Mermaid Validation');
console.log('===================================');

/**
 * Custom remark plugin to validate mermaid code blocks
 */
function remarkMermaidValidator() {
  return async (tree, file) => {
    const errors = [];
    const validations = [];
    
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid') {
        validations.push({
          node,
          line: node.position.start.line,
          column: node.position.start.column
        });
      }
    });
    
    // Process all mermaid blocks
    for (const { node, line, column } of validations) {
      try {
        await mermaid.parse(node.value);
        console.log(`  ✅ Valid mermaid diagram at line ${line}`);
      } catch (error) {
        const errorInfo = {
          line,
          column,
          message: error.message,
          content: node.value.split('\n')[0] + '...'
        };
        errors.push(errorInfo);
        console.log(`  ❌ Invalid mermaid diagram at line ${line}: ${error.message.split('\n')[0]}`);
      }
    }
    
    // Store errors in file data for later access
    file.data.mermaidErrors = errors;
  };
}

/**
 * Process a single markdown file
 */
async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const processor = remark().use(remarkMermaidValidator);
    
    console.log(`Processing: ${filePath}`);
    
    const result = await processor.process(content);
    const errors = result.data.mermaidErrors || [];
    
    return errors;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Find all markdown files
 */
function findMarkdownFiles(dir = '.') {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Main function
 */
async function main() {
  // Check for help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🧜‍♀️ Mermaid Syntax Validator

Usage: node scripts/validate-mermaid-remark.js [directory]

Arguments:
  directory    Path to directory to validate (default: current directory)

Options:
  -h, --help   Show this help message

Examples:
  node scripts/validate-mermaid-remark.js                    # Validate current directory
  node scripts/validate-mermaid-remark.js ../other-repo     # Validate another repository
  node scripts/validate-mermaid-remark.js /path/to/project  # Validate absolute path
`);
    process.exit(0);
  }

  // Get target directory from command line argument
  const targetDir = process.argv[2] || '.';
  
  // Resolve to absolute path and check if it exists
  const absoluteTargetDir = path.resolve(targetDir);
  
  if (!fs.existsSync(absoluteTargetDir)) {
    console.error(`❌ Directory does not exist: ${targetDir}`);
    process.exit(1);
  }
  
  if (!fs.statSync(absoluteTargetDir).isDirectory()) {
    console.error(`❌ Path is not a directory: ${targetDir}`);
    process.exit(1);
  }
  
  console.log(`🔍 Finding markdown files in: ${absoluteTargetDir}`);
  const markdownFiles = findMarkdownFiles(absoluteTargetDir);
  console.log(`Found ${markdownFiles.length} markdown files\n`);
  
  let totalErrors = 0;
  const allErrors = [];
  
  for (const filePath of markdownFiles) {
    const errors = await processFile(filePath);
    if (errors.length > 0) {
      totalErrors += errors.length;
      allErrors.push({ file: filePath, errors });
    }
  }
  
  console.log('\n===================================');
  
  if (totalErrors === 0) {
    console.log('✅ All mermaid diagrams are valid!');
    process.exit(0);
  } else {
    console.log(`❌ Found ${totalErrors} invalid mermaid diagram(s)\n`);
    
    console.log('📍 Error Details:');
    console.log('------------------');
    
    for (const { file, errors } of allErrors) {
      console.log(`\n📄 ${file}:`);
      for (const error of errors) {
        console.log(`   ❌ Line ${error.line}: ${error.message.split('\n')[0]}`);
        console.log(`      Content: ${error.content}`);
      }
    }
    
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
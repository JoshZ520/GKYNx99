#!/usr/bin/env node
// cleanup-emojis.js - AGGRESSIVELY remove ALL emojis from text files (JS, MD, HTML, CSS, etc.)
//
// This script removes ALL emojis without preservation - use carefully!
//
// Usage:
// node scripts/cleanup-emojis.js # Process all text files
// node scripts/cleanup-emojis.js file1.js file2.md # Process specific files
// node scripts/cleanup-emojis.js src/core/game-core.js # Process one file
// node scripts/cleanup-emojis.js --type js # Process only JS files
// node scripts/cleanup-emojis.js --type md # Process only Markdown files

const fs = require('fs');
const path = require('path');

// Emoji regex pattern - matches most common emojis
const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

// Specific patterns we want to clean up
const patterns = [
// Match console.log with emoji at start: console.log('message')
/(console\.log\(['"]\s*)[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+\s*/gu,
// Match any remaining emojis in console statements
/(console\.[a-z]+\([^)]*?)[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+\s*/gu
];

// Supported file extensions for text files that might contain emojis
const TEXT_FILE_EXTENSIONS = ['.js', '.md', '.html', '.css', '.txt', '.json', '.xml', '.svg', '.vue', '.jsx', '.ts', '.tsx'];

function findTextFiles(dir, fileList = [], filterExtensions = null) {
const files = fs.readdirSync(dir);

files.forEach(file => {
const filePath = path.join(dir, file);
const stat = fs.statSync(filePath);

if (stat.isDirectory()) {
// Skip node_modules, .git, and other hidden directories
if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
findTextFiles(filePath, fileList, filterExtensions);
}
} else {
const ext = path.extname(file).toLowerCase();
const extensions = filterExtensions || TEXT_FILE_EXTENSIONS;
if (extensions.includes(ext)) {
fileList.push(filePath);
}
}
});

return fileList;
}

function cleanEmojisFromFile(filePath) {
try {
const content = fs.readFileSync(filePath, 'utf8');
const originalEmojiCount = (content.match(emojiRegex) || []).length;

if (originalEmojiCount === 0) {
return false; // No emojis found
}

// AGGRESSIVE REMOVAL: Remove ALL emojis from all file types
let cleanContent = content;

// Remove all emojis using the comprehensive regex
cleanContent = cleanContent.replace(emojiRegex, '');

// Clean up any double spaces that might result from emoji removal
cleanContent = cleanContent.replace(/ +/g, ' ');

// Clean up lines that now start with space after emoji removal
cleanContent = cleanContent.replace(/^(\s*) +/gm, '$1');

// Clean up any trailing spaces at end of lines
cleanContent = cleanContent.replace(/ +$/gm, '');

const finalEmojiCount = (cleanContent.match(emojiRegex) || []).length;
const totalRemoved = originalEmojiCount - finalEmojiCount;

if (content !== cleanContent) {
fs.writeFileSync(filePath, cleanContent, 'utf8');
console.log(` Removed ${totalRemoved} emojis from: ${path.relative(process.cwd(), filePath)}`);
return true;
}

return false;
} catch (error) {
console.error(`Error processing ${filePath}:`, error.message);
return false;
}
}

function main() {
const args = process.argv.slice(2);
let filesToProcess = [];
let filterType = null;

// Parse arguments
const fileArgs = [];
for (let i = 0; i < args.length; i++) {
if (args[i] === '--type' && i + 1 < args.length) {
filterType = args[i + 1].toLowerCase();
i++; // Skip the next argument
} else {
fileArgs.push(args[i]);
}
}

if (fileArgs.length > 0) {
// Process specific files provided as arguments
console.log('Processing specific files:');
fileArgs.forEach(arg => {
const fullPath = path.resolve(arg);
if (fs.existsSync(fullPath)) {
const ext = path.extname(fullPath).toLowerCase();
if (TEXT_FILE_EXTENSIONS.includes(ext)) {
filesToProcess.push(fullPath);
console.log(` - ${path.relative(process.cwd(), fullPath)}`);
} else {
console.log(` ️ Skipping non-text file: ${arg}`);
}
} else {
console.error(` File not found: ${arg}`);
}
});
} else {
// Default behavior: process all text files (or filtered by type)
const rootDir = process.cwd();
let extensions = TEXT_FILE_EXTENSIONS;

if (filterType) {
const ext = filterType.startsWith('.') ? filterType : '.' + filterType;
if (TEXT_FILE_EXTENSIONS.includes(ext)) {
extensions = [ext];
console.log(`Scanning for ${filterType.toUpperCase()} files in: ${rootDir}`);
} else {
console.error(`Unsupported file type: ${filterType}`);
console.log(`Supported types: ${TEXT_FILE_EXTENSIONS.join(', ')}`);
return;
}
} else {
console.log(`Scanning for text files in: ${rootDir}`);
}

filesToProcess = findTextFiles(rootDir, [], extensions);
console.log(`Found ${filesToProcess.length} files`);
}

if (filesToProcess.length === 0) {
console.log('No files to process.');
return;
}

console.log(''); // Empty line
let totalCleaned = 0;

filesToProcess.forEach(filePath => {
if (cleanEmojisFromFile(filePath)) {
totalCleaned++;
}
});

console.log(`\n Summary: Cleaned emojis from ${totalCleaned} of ${filesToProcess.length} files`);

if (totalCleaned === 0) {
console.log('No emoji cleanup needed!');
}
}

// Run if called directly
if (require.main === module) {
main();
}

module.exports = { cleanEmojisFromFile, findTextFiles, TEXT_FILE_EXTENSIONS };
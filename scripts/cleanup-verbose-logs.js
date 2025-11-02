#!/usr/bin/env node
// cleanup-verbose-logs.js - Reduce verbose console logs for production

const fs = require('fs');
const path = require('path');

// Patterns of console logs that should be removed in production
const verbosePatterns = [
    // Action logs (user interactions)
    /console\.log\(['"`]Switching to next question['"`]\);?\s*/g,
    /console\.log\(['"`]Going to (previous|next) question['"`]\);?\s*/g,
    /console\.log\(['"`]Skipping question['"`]\);?\s*/g,
    /console\.log\(['"`]Selected option [12]['"`]\);?\s*/g,
    /console\.log\(['"`]Submitting answer['"`]\);?\s*/g,
    /console\.log\(['"`]All answers finished['"`]\);?\s*/g,
    /console\.log\(['"`]Picking random topic['"`]\);?\s*/g,
    /console\.log\(['"`]Toggling topics panel['"`]\);?\s*/g,
    
    // Page navigation logs
    /console\.log\(['"`](Previous|Next) topic page['"`]\);?\s*/g,
];

function cleanVerboseLogsFromFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let cleanContent = content;
        let totalRemoved = 0;
        
        verbosePatterns.forEach(pattern => {
            const matches = cleanContent.match(pattern);
            if (matches) {
                totalRemoved += matches.length;
                cleanContent = cleanContent.replace(pattern, '');
            }
        });
        
        if (totalRemoved > 0) {
            fs.writeFileSync(filePath, cleanContent, 'utf8');
            console.log(`Removed ${totalRemoved} verbose logs from: ${path.relative(process.cwd(), filePath)}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

function findJavaScriptFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules') {
                findJavaScriptFiles(filePath, fileList);
            }
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

function main() {
    const rootDir = process.cwd();
    console.log('Cleaning verbose console logs from JavaScript files...\n');
    
    const jsFiles = findJavaScriptFiles(rootDir);
    let totalCleaned = 0;
    
    jsFiles.forEach(filePath => {
        if (cleanVerboseLogsFromFile(filePath)) {
            totalCleaned++;
        }
    });
    
    console.log(`\nCleaned verbose logs from ${totalCleaned} files`);
    
    if (totalCleaned === 0) {
        console.log('No verbose logs found to remove.');
    } else {
        console.log('Essential logs (initialization, connections, errors) have been preserved.');
    }
}

if (require.main === module) {
    main();
}
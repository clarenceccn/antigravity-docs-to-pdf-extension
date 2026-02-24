import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
    try {
        // The folder containing the Extension Manifest package.json
        // Since this file compiles to out/src/test/runTest.js, we go up 3 levels
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

        // The path to the extension test suite entry point
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // Download VS Code, unzip it, and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            version: '1.96.0', // Pin to a known-compatible stable version
            launchArgs: ['--disable-extensions'], // Disable other extensions for clean test
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();

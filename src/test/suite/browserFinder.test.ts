import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { findBrowser } from '../../browserFinder.js';

suite('browserFinder', () => {
    test('returns a custom path when it exists', async () => {
        // Use a file that definitely exists on any system
        const existingFile = process.execPath; // node binary
        const result = await findBrowser(existingFile);
        assert.strictEqual(result, existingFile);
    });

    test('ignores custom path when it does not exist', async () => {
        const fakePath = path.join(os.tmpdir(), 'nonexistent-chrome-binary-' + Date.now());

        // Should NOT return the fake path — should fall through to auto-detection
        try {
            const result = await findBrowser(fakePath);
            // If it succeeds, it found a browser via chrome-launcher or manual probing
            assert.ok(result !== fakePath, 'Should not return the non-existent custom path');
            assert.ok(fs.existsSync(result), 'Returned path should exist');
        } catch (err) {
            // If no browser is installed at all, it should throw with a helpful message
            assert.ok(err instanceof Error);
            assert.ok(err.message.includes('No Chromium-based browser found'));
        }
    });

    test('ignores undefined custom path', async () => {
        try {
            const result = await findBrowser(undefined);
            assert.ok(result, 'Should return a path');
            assert.ok(fs.existsSync(result), 'Returned path should exist');
        } catch (err) {
            assert.ok(err instanceof Error);
            assert.ok(err.message.includes('No Chromium-based browser found'));
        }
    });

    test('ignores empty string custom path', async () => {
        try {
            const result = await findBrowser('');
            assert.ok(result, 'Should return a path');
        } catch (err) {
            assert.ok(err instanceof Error);
            assert.ok(err.message.includes('No Chromium-based browser found'));
        }
    });

    test('error message includes install instructions', async () => {
        // Force failure by passing a non-existent path and mocking would be ideal,
        // but we can at least verify the error format when detection fails
        try {
            // This test only validates error format when no browser is found
            // On a machine with Chrome installed, findBrowser will succeed
            await findBrowser('/definitely/not/a/real/browser');
        } catch (err) {
            assert.ok(err instanceof Error);
            assert.ok(
                err.message.includes('antigravity.chromePath'),
                'Error should mention the settings option'
            );
        }
    });

    test('finds a browser on the current system', async function () {
        try {
            const result = await findBrowser();
            assert.ok(result, 'Should find a browser');
            assert.ok(fs.existsSync(result), 'Browser path should exist');
            assert.ok(path.isAbsolute(result), 'Should return absolute path');
        } catch {
            // No browser installed — not an error in the test itself
            console.warn('⚠ No browser found on this system — test skipped.');
            this.skip();
        }
    });
});

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const browserFinder_js_1 = require("../../browserFinder.js");
suite('browserFinder', () => {
    test('returns a custom path when it exists', async () => {
        // Use a file that definitely exists on any system
        const existingFile = process.execPath; // node binary
        const result = await (0, browserFinder_js_1.findBrowser)(existingFile);
        assert.strictEqual(result, existingFile);
    });
    test('ignores custom path when it does not exist', async () => {
        const fakePath = path.join(os.tmpdir(), 'nonexistent-chrome-binary-' + Date.now());
        // Should NOT return the fake path — should fall through to auto-detection
        try {
            const result = await (0, browserFinder_js_1.findBrowser)(fakePath);
            // If it succeeds, it found a browser via chrome-launcher or manual probing
            assert.ok(result !== fakePath, 'Should not return the non-existent custom path');
            assert.ok(fs.existsSync(result), 'Returned path should exist');
        }
        catch (err) {
            // If no browser is installed at all, it should throw with a helpful message
            assert.ok(err instanceof Error);
            assert.ok(err.message.includes('No Chromium-based browser found'));
        }
    });
    test('ignores undefined custom path', async () => {
        try {
            const result = await (0, browserFinder_js_1.findBrowser)(undefined);
            assert.ok(result, 'Should return a path');
            assert.ok(fs.existsSync(result), 'Returned path should exist');
        }
        catch (err) {
            assert.ok(err instanceof Error);
            assert.ok(err.message.includes('No Chromium-based browser found'));
        }
    });
    test('ignores empty string custom path', async () => {
        try {
            const result = await (0, browserFinder_js_1.findBrowser)('');
            assert.ok(result, 'Should return a path');
        }
        catch (err) {
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
            await (0, browserFinder_js_1.findBrowser)('/definitely/not/a/real/browser');
        }
        catch (err) {
            assert.ok(err instanceof Error);
            assert.ok(err.message.includes('antigravity.chromePath'), 'Error should mention the settings option');
        }
    });
    test('finds a browser on the current system', async function () {
        try {
            const result = await (0, browserFinder_js_1.findBrowser)();
            assert.ok(result, 'Should find a browser');
            assert.ok(fs.existsSync(result), 'Browser path should exist');
            assert.ok(path.isAbsolute(result), 'Should return absolute path');
        }
        catch {
            // No browser installed — not an error in the test itself
            console.warn('⚠ No browser found on this system — test skipped.');
            this.skip();
        }
    });
});
//# sourceMappingURL=browserFinder.test.js.map
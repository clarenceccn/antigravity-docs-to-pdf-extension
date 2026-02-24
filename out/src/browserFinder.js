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
exports.findBrowser = findBrowser;
const fs = __importStar(require("fs"));
/**
 * Well-known Chrome/Chromium, Edge, and Brave installation paths per platform.
 */
const BROWSER_PATHS = {
    darwin: [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ],
    win32: [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `${process.env.LOCALAPPDATA ?? ''}\\Google\\Chrome\\Application\\chrome.exe`,
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        `${process.env.LOCALAPPDATA ?? ''}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    ],
    linux: [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        '/usr/bin/microsoft-edge',
        '/usr/bin/microsoft-edge-stable',
        '/usr/bin/brave-browser',
        '/usr/bin/brave-browser-stable',
        '/snap/bin/brave',
    ],
};
/** Platform-specific installation guidance. */
const INSTALL_HINTS = {
    darwin: 'Install Chrome from https://google.com/chrome or via `brew install --cask google-chrome`',
    win32: 'Install Chrome from https://google.com/chrome or Edge from https://microsoft.com/edge',
    linux: 'Install Chrome: `sudo apt install google-chrome-stable` or Chromium: `sudo apt install chromium-browser`',
};
/**
 * Attempts to find an installed Chromium-based browser.
 *
 * Resolution order:
 *   1. User-configured custom path (from `antigravity.chromePath` setting)
 *   2. chrome-launcher library (handles many edge cases)
 *   3. Manual path probing of well-known install locations
 *
 * @param customPath - Optional user-configured browser executable path.
 * @returns Absolute path to the browser executable.
 * @throws If no browser is found.
 */
async function findBrowser(customPath) {
    // 0. User-configured path takes highest priority
    if (customPath && fs.existsSync(customPath)) {
        return customPath;
    }
    // 1. Try chrome-launcher (it handles many edge cases)
    try {
        const { Launcher } = await import('chrome-launcher');
        const installations = Launcher.getInstallations();
        if (installations.length > 0) {
            return installations[0];
        }
    }
    catch {
        // chrome-launcher may not be available or may fail — fall through
    }
    // 2. Manual fallback: probe well-known paths
    const candidates = BROWSER_PATHS[process.platform] ?? [];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    const hint = INSTALL_HINTS[process.platform] ?? 'Install a Chromium-based browser.';
    const searchedPaths = candidates.length > 0
        ? '\nSearched paths:\n' + candidates.map((p) => `  • ${p}`).join('\n')
        : '';
    throw new Error(`No Chromium-based browser found.\n\n${hint}\n` +
        `Alternatively, set "antigravity.chromePath" in VS Code settings to specify a custom browser path.` +
        searchedPaths);
}
//# sourceMappingURL=browserFinder.js.map
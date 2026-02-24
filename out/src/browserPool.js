"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserPool = void 0;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const browserFinder_js_1 = require("./browserFinder.js");
/**
 * Default Chromium launch arguments for headless PDF rendering.
 */
const LAUNCH_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
];
/**
 * BrowserPool manages a single shared Chromium browser instance.
 *
 * Instead of launching a new browser for every PDF export, the pool lazily
 * launches one on the first `acquire()` call and reuses it for subsequent
 * calls. Call `dispose()` once (typically in `deactivate()`) to shut down
 * the browser process.
 *
 * A promise-lock prevents concurrent launches if multiple `acquire()` calls
 * arrive before the first browser is ready.
 */
class BrowserPool {
    constructor(customChromePath) {
        this.browser = null;
        this.launching = null;
        this.customChromePath = customChromePath;
    }
    /**
     * Update the custom Chrome path (e.g. when settings change).
     * This does NOT restart an already-running browser — call `dispose()`
     * first if a path change should take effect immediately.
     */
    setChromePath(chromePath) {
        this.customChromePath = chromePath;
    }
    /**
     * Acquires the shared browser instance, launching it if necessary.
     *
     * Safe to call concurrently — only one launch will occur.
     */
    async acquire() {
        // Fast path: browser already running and connected
        if (this.browser?.connected) {
            return this.browser;
        }
        // If a launch is already in progress, wait for it
        if (this.launching) {
            return this.launching;
        }
        // Launch a new browser
        this.launching = this.launch();
        try {
            this.browser = await this.launching;
            return this.browser;
        }
        finally {
            this.launching = null;
        }
    }
    /**
     * Closes the shared browser and releases resources.
     * Safe to call multiple times.
     */
    async dispose() {
        const browser = this.browser;
        this.browser = null;
        this.launching = null;
        if (browser?.connected) {
            try {
                await browser.close();
            }
            catch {
                // Browser may have already exited — ignore
            }
        }
    }
    async launch() {
        const browserPath = await (0, browserFinder_js_1.findBrowser)(this.customChromePath);
        return puppeteer_core_1.default.launch({
            executablePath: browserPath,
            headless: true,
            args: [...LAUNCH_ARGS],
        });
    }
}
exports.BrowserPool = BrowserPool;
//# sourceMappingURL=browserPool.js.map
import type { Browser } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';
import { findBrowser } from './browserFinder.js';

/**
 * Default Chromium launch arguments for headless PDF rendering.
 */
const LAUNCH_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
] as const;

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
export class BrowserPool {
    private browser: Browser | null = null;
    private launching: Promise<Browser> | null = null;
    private customChromePath: string | undefined;

    constructor(customChromePath?: string) {
        this.customChromePath = customChromePath;
    }

    /**
     * Update the custom Chrome path (e.g. when settings change).
     * This does NOT restart an already-running browser — call `dispose()`
     * first if a path change should take effect immediately.
     */
    setChromePath(chromePath: string | undefined): void {
        this.customChromePath = chromePath;
    }

    /**
     * Acquires the shared browser instance, launching it if necessary.
     *
     * Safe to call concurrently — only one launch will occur.
     */
    async acquire(): Promise<Browser> {
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
        } finally {
            this.launching = null;
        }
    }

    /**
     * Closes the shared browser and releases resources.
     * Safe to call multiple times.
     */
    async dispose(): Promise<void> {
        const browser = this.browser;
        this.browser = null;
        this.launching = null;

        if (browser?.connected) {
            try {
                await browser.close();
            } catch {
                // Browser may have already exited — ignore
            }
        }
    }

    private async launch(): Promise<Browser> {
        const browserPath = await findBrowser(this.customChromePath);
        return puppeteer.launch({
            executablePath: browserPath,
            headless: true,
            args: [...LAUNCH_ARGS],
        });
    }
}

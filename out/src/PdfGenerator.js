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
exports.PdfGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const markdownRenderer_js_1 = require("./markdownRenderer.js");
// ─── Constants ────────────────────────────────────────────────────────────────
const HEADER_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif';
const DEFAULT_TIMEOUT_MS = 30000;
const MERMAID_TIMEOUT_MS = 15000;
const MERMAID_POLL_MS = 200;
// ─── Header / Footer Templates ────────────────────────────────────────────────
function buildHeaderTemplate(title) {
    const escaped = escapeHtml(title);
    return [
        `<div style="width:100%;font-size:8px;color:#8b949e;padding:0 15mm;font-family:${HEADER_FONT};">`,
        `  <span style="float:left;">${escaped}</span>`,
        `  <span style="float:right;">Antigravity Docs</span>`,
        `</div>`,
    ].join('');
}
function buildFooterTemplate() {
    return [
        `<div style="width:100%;font-size:8px;color:#8b949e;padding:0 15mm;text-align:center;font-family:${HEADER_FONT};">`,
        `  Page <span class="pageNumber"></span> of <span class="totalPages"></span>`,
        `</div>`,
    ].join('');
}
// ─── PdfGenerator ─────────────────────────────────────────────────────────────
/**
 * PdfGenerator handles the full lifecycle:
 *   Markdown → HTML → Puppeteer render (with Mermaid wait) → PDF
 *
 * It receives a `BrowserPool` for efficient browser reuse across
 * multiple exports (e.g. during "Export All" batch operations).
 */
class PdfGenerator {
    constructor(browserPool, assetsDir) {
        this.browserPool = browserPool;
        // Resolve assets relative to this compiled file (dist/) or a custom directory
        const dir = assetsDir ?? path.dirname(__filename);
        this.templateHtml = fs.readFileSync(path.join(dir, 'template.html'), 'utf-8');
        this.stylesCss = fs.readFileSync(path.join(dir, 'styles.css'), 'utf-8');
    }
    /**
     * Generate a PDF from a markdown file.
     *
     * Opens a new page in the shared browser, renders, prints, then closes
     * just the page — the browser stays alive for subsequent calls.
     */
    async generate(options) {
        const { inputPath, outputPath, title, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
        // 1. Read the markdown source
        const markdown = fs.readFileSync(inputPath, 'utf-8');
        // 2. Convert to HTML body
        const htmlBody = (0, markdownRenderer_js_1.renderMarkdown)(markdown);
        // 3. Determine if the markdown contains mermaid blocks
        const hasMermaid = /```mermaid/i.test(markdown);
        // 4. Build full HTML page
        const displayTitle = title || this.extractTitle(markdown) || path.basename(inputPath, '.md');
        const fullHtml = this.buildHtml(htmlBody, displayTitle, hasMermaid);
        // 5. Acquire shared browser and create a new page
        const browser = await this.browserPool.acquire();
        const page = await browser.newPage();
        try {
            // Set a generous viewport for rendering
            await page.setViewport({ width: 1200, height: 800 });
            // Load HTML content
            await page.setContent(fullHtml, {
                waitUntil: 'networkidle0',
                timeout: timeoutMs,
            });
            // 6. Wait for Mermaid diagrams to render (if any)
            if (hasMermaid) {
                await this.waitForMermaid(page);
            }
            // 7. Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            // 8. Print to PDF
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm',
                },
                displayHeaderFooter: true,
                headerTemplate: buildHeaderTemplate(displayTitle),
                footerTemplate: buildFooterTemplate(),
            });
            return outputPath;
        }
        finally {
            await page.close();
        }
    }
    /**
     * Waits until all `.mermaid` divs contain rendered SVGs, or times out.
     */
    async waitForMermaid(page) {
        try {
            await page.waitForFunction(`(() => {
                    const mermaidDivs = document.querySelectorAll('.mermaid');
                    if (mermaidDivs.length === 0) return true;
                    return Array.from(mermaidDivs).every(
                        (div) => div.querySelector('svg') !== null
                    );
                })()`, { timeout: MERMAID_TIMEOUT_MS, polling: MERMAID_POLL_MS });
        }
        catch {
            // If Mermaid fails to render, log but don't fail the entire PDF
            console.warn('Warning: Timed out waiting for Mermaid diagrams to render. Some diagrams may be missing.');
        }
    }
    /**
     * Assemble the final HTML page from template, styles, and rendered markdown.
     */
    buildHtml(body, title, includeMermaid) {
        let html = this.templateHtml;
        html = html.replace('{{TITLE}}', escapeHtml(title));
        html = html.replace('{{STYLES}}', this.stylesCss);
        html = html.replace('{{BODY}}', body);
        if (includeMermaid) {
            const mermaidScript = [
                '<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>',
                '<script>',
                '  mermaid.initialize({',
                '    startOnLoad: true,',
                '    theme: "default",',
                '    securityLevel: "loose",',
                `    fontFamily: '${HEADER_FONT}',`,
                '    flowchart: { useMaxWidth: true, htmlLabels: true },',
                '    sequence: { useMaxWidth: true },',
                '  });',
                '</script>',
            ].join('\n');
            html = html.replace('{{MERMAID_SCRIPT}}', mermaidScript);
        }
        else {
            html = html.replace('{{MERMAID_SCRIPT}}', '');
        }
        return html;
    }
    /**
     * Extract the first H1 heading from markdown as a title.
     */
    extractTitle(markdown) {
        const match = markdown.match(/^#\s+(.+)$/m);
        return match ? match[1].trim() : null;
    }
}
exports.PdfGenerator = PdfGenerator;
// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
//# sourceMappingURL=PdfGenerator.js.map
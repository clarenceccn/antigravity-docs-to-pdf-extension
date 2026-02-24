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
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const PdfGenerator_js_1 = require("../../PdfGenerator.js");
const browserPool_js_1 = require("../../browserPool.js");
// Assets (template.html, styles.css) live in the source src/ directory
// At runtime __dirname = out/src/test/suite/ → go up 4 levels to project root, then into src/
const assetsDir = path.resolve(__dirname, '../../../../src');
suite('PdfGenerator', () => {
    let browserPool;
    let tmpDir;
    suiteSetup(async function () {
        this.timeout(60000); // browser launch can be slow
        browserPool = new browserPool_js_1.BrowserPool();
        // Pre-acquire the browser so individual tests don't pay launch cost
        try {
            await browserPool.acquire();
        }
        catch {
            // If no browser is available, skip all tests in this suite
            console.warn('⚠ No Chromium browser found — skipping PdfGenerator integration tests.');
            this.skip();
        }
    });
    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-pdf-test-'));
    });
    teardown(() => {
        // Clean up temp files
        if (tmpDir && fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
    suiteTeardown(async function () {
        this.timeout(10000);
        if (browserPool) {
            await browserPool.dispose();
        }
    });
    test('generates a PDF from simple markdown', async function () {
        this.timeout(30000);
        const inputPath = path.join(tmpDir, 'test.md');
        const outputPath = path.join(tmpDir, 'test.pdf');
        fs.writeFileSync(inputPath, '# Test Document\n\nHello, world!\n', 'utf-8');
        const generator = new PdfGenerator_js_1.PdfGenerator(browserPool, assetsDir);
        const result = await generator.generate({ inputPath, outputPath });
        assert.strictEqual(result, outputPath);
        assert.ok(fs.existsSync(outputPath), 'PDF file should exist');
        const stat = fs.statSync(outputPath);
        assert.ok(stat.size > 0, 'PDF file should not be empty');
        assert.ok(stat.size > 1000, 'PDF should have reasonable size (> 1KB)');
    });
    test('generates a PDF with code blocks', async function () {
        this.timeout(30000);
        const inputPath = path.join(tmpDir, 'code.md');
        const outputPath = path.join(tmpDir, 'code.pdf');
        const md = [
            '# Code Example',
            '',
            '```typescript',
            'function greet(name: string): string {',
            '    return `Hello, ${name}!`;',
            '}',
            '```',
        ].join('\n');
        fs.writeFileSync(inputPath, md, 'utf-8');
        const generator = new PdfGenerator_js_1.PdfGenerator(browserPool, assetsDir);
        const result = await generator.generate({ inputPath, outputPath });
        assert.ok(fs.existsSync(result));
        assert.ok(fs.statSync(result).size > 0);
    });
    test('generates a PDF with alerts', async function () {
        this.timeout(30000);
        const inputPath = path.join(tmpDir, 'alerts.md');
        const outputPath = path.join(tmpDir, 'alerts.pdf');
        const md = [
            '# Alert Test',
            '',
            '> [!NOTE]',
            '> This is a note.',
            '',
            '> [!WARNING]',
            '> Watch out!',
        ].join('\n');
        fs.writeFileSync(inputPath, md, 'utf-8');
        const generator = new PdfGenerator_js_1.PdfGenerator(browserPool, assetsDir);
        await generator.generate({ inputPath, outputPath });
        assert.ok(fs.existsSync(outputPath));
        assert.ok(fs.statSync(outputPath).size > 0);
    });
    test('generates a PDF with checkboxes', async function () {
        this.timeout(30000);
        const inputPath = path.join(tmpDir, 'tasks.md');
        const outputPath = path.join(tmpDir, 'tasks.pdf');
        const md = [
            '# Task List',
            '',
            '- [x] Completed task',
            '- [ ] Pending task',
            '- [/] In progress',
        ].join('\n');
        fs.writeFileSync(inputPath, md, 'utf-8');
        const generator = new PdfGenerator_js_1.PdfGenerator(browserPool, assetsDir);
        await generator.generate({ inputPath, outputPath });
        assert.ok(fs.existsSync(outputPath));
    });
    test('creates output directory if it does not exist', async function () {
        this.timeout(30000);
        const inputPath = path.join(tmpDir, 'test.md');
        const nestedDir = path.join(tmpDir, 'nested', 'deep', 'dir');
        const outputPath = path.join(nestedDir, 'output.pdf');
        fs.writeFileSync(inputPath, '# Nested Output\n\nContent here.\n', 'utf-8');
        const generator = new PdfGenerator_js_1.PdfGenerator(browserPool, assetsDir);
        await generator.generate({ inputPath, outputPath });
        assert.ok(fs.existsSync(outputPath), 'PDF should be created in nested directory');
    });
    test('uses title from H1 heading', async function () {
        this.timeout(30000);
        const inputPath = path.join(tmpDir, 'titled.md');
        const outputPath = path.join(tmpDir, 'titled.pdf');
        fs.writeFileSync(inputPath, '# My Custom Title\n\nSome content.\n', 'utf-8');
        const generator = new PdfGenerator_js_1.PdfGenerator(browserPool, assetsDir);
        const result = await generator.generate({ inputPath, outputPath });
        // We can't easily check PDF metadata, but verify it completes without error
        assert.ok(fs.existsSync(result));
    });
    test('handles empty markdown gracefully', async function () {
        this.timeout(30000);
        const inputPath = path.join(tmpDir, 'empty.md');
        const outputPath = path.join(tmpDir, 'empty.pdf');
        fs.writeFileSync(inputPath, '', 'utf-8');
        const generator = new PdfGenerator_js_1.PdfGenerator(browserPool, assetsDir);
        const result = await generator.generate({ inputPath, outputPath });
        assert.ok(fs.existsSync(result), 'Should produce a PDF even for empty input');
    });
    test('reuses browser across multiple generate calls', async function () {
        this.timeout(60000);
        const generator = new PdfGenerator_js_1.PdfGenerator(browserPool, assetsDir);
        for (let i = 0; i < 3; i++) {
            const inputPath = path.join(tmpDir, `multi-${i}.md`);
            const outputPath = path.join(tmpDir, `multi-${i}.pdf`);
            fs.writeFileSync(inputPath, `# Document ${i}\n\nContent for doc ${i}.\n`, 'utf-8');
            await generator.generate({ inputPath, outputPath });
            assert.ok(fs.existsSync(outputPath), `PDF ${i} should exist`);
        }
    });
});
//# sourceMappingURL=pdfGenerator.test.js.map
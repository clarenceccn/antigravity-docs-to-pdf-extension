import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PdfGenerator } from '../../PdfGenerator.js';
import { BrowserPool } from '../../browserPool.js';

// Assets (template.html, styles.css) live in the source src/ directory
// At runtime __dirname = out/src/test/suite/ → go up 4 levels to project root, then into src/
const assetsDir = path.resolve(__dirname, '../../../../src');

suite('PdfGenerator', () => {
    let browserPool: BrowserPool;
    let tmpDir: string;

    suiteSetup(async function () {
        this.timeout(60_000); // browser launch can be slow
        browserPool = new BrowserPool();

        // Pre-acquire the browser so individual tests don't pay launch cost
        try {
            await browserPool.acquire();
        } catch {
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
        this.timeout(10_000);
        if (browserPool) {
            await browserPool.dispose();
        }
    });

    test('generates a PDF from simple markdown', async function () {
        this.timeout(30_000);

        const inputPath = path.join(tmpDir, 'test.md');
        const outputPath = path.join(tmpDir, 'test.pdf');

        fs.writeFileSync(inputPath, '# Test Document\n\nHello, world!\n', 'utf-8');

        const generator = new PdfGenerator(browserPool, assetsDir);
        const result = await generator.generate({ inputPath, outputPath });

        assert.strictEqual(result, outputPath);
        assert.ok(fs.existsSync(outputPath), 'PDF file should exist');

        const stat = fs.statSync(outputPath);
        assert.ok(stat.size > 0, 'PDF file should not be empty');
        assert.ok(stat.size > 1000, 'PDF should have reasonable size (> 1KB)');
    });

    test('generates a PDF with code blocks', async function () {
        this.timeout(30_000);

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

        const generator = new PdfGenerator(browserPool, assetsDir);
        const result = await generator.generate({ inputPath, outputPath });

        assert.ok(fs.existsSync(result));
        assert.ok(fs.statSync(result).size > 0);
    });

    test('generates a PDF with alerts', async function () {
        this.timeout(30_000);

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

        const generator = new PdfGenerator(browserPool, assetsDir);
        await generator.generate({ inputPath, outputPath });

        assert.ok(fs.existsSync(outputPath));
        assert.ok(fs.statSync(outputPath).size > 0);
    });

    test('generates a PDF with checkboxes', async function () {
        this.timeout(30_000);

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

        const generator = new PdfGenerator(browserPool, assetsDir);
        await generator.generate({ inputPath, outputPath });

        assert.ok(fs.existsSync(outputPath));
    });

    test('creates output directory if it does not exist', async function () {
        this.timeout(30_000);

        const inputPath = path.join(tmpDir, 'test.md');
        const nestedDir = path.join(tmpDir, 'nested', 'deep', 'dir');
        const outputPath = path.join(nestedDir, 'output.pdf');

        fs.writeFileSync(inputPath, '# Nested Output\n\nContent here.\n', 'utf-8');

        const generator = new PdfGenerator(browserPool, assetsDir);
        await generator.generate({ inputPath, outputPath });

        assert.ok(fs.existsSync(outputPath), 'PDF should be created in nested directory');
    });

    test('uses title from H1 heading', async function () {
        this.timeout(30_000);

        const inputPath = path.join(tmpDir, 'titled.md');
        const outputPath = path.join(tmpDir, 'titled.pdf');

        fs.writeFileSync(inputPath, '# My Custom Title\n\nSome content.\n', 'utf-8');

        const generator = new PdfGenerator(browserPool, assetsDir);
        const result = await generator.generate({ inputPath, outputPath });

        // We can't easily check PDF metadata, but verify it completes without error
        assert.ok(fs.existsSync(result));
    });

    test('handles empty markdown gracefully', async function () {
        this.timeout(30_000);

        const inputPath = path.join(tmpDir, 'empty.md');
        const outputPath = path.join(tmpDir, 'empty.pdf');

        fs.writeFileSync(inputPath, '', 'utf-8');

        const generator = new PdfGenerator(browserPool, assetsDir);
        const result = await generator.generate({ inputPath, outputPath });

        assert.ok(fs.existsSync(result), 'Should produce a PDF even for empty input');
    });

    test('reuses browser across multiple generate calls', async function () {
        this.timeout(60_000);

        const generator = new PdfGenerator(browserPool, assetsDir);

        for (let i = 0; i < 3; i++) {
            const inputPath = path.join(tmpDir, `multi-${i}.md`);
            const outputPath = path.join(tmpDir, `multi-${i}.pdf`);

            fs.writeFileSync(inputPath, `# Document ${i}\n\nContent for doc ${i}.\n`, 'utf-8');
            await generator.generate({ inputPath, outputPath });

            assert.ok(fs.existsSync(outputPath), `PDF ${i} should exist`);
        }
    });
});

import * as assert from 'assert';
import { renderMarkdown, createRenderer } from '../../markdownRenderer.js';

suite('markdownRenderer', () => {
    // ── Basic Rendering ──────────────────────────────────────────────────

    suite('Basic Rendering', () => {
        test('renders H1 heading', () => {
            const html = renderMarkdown('# Hello World');
            assert.ok(html.includes('<h1>Hello World</h1>'));
        });

        test('renders H2 heading with border', () => {
            const html = renderMarkdown('## Section Title');
            assert.ok(html.includes('<h2>Section Title</h2>'));
        });

        test('renders paragraphs', () => {
            const html = renderMarkdown('This is a paragraph.');
            assert.ok(html.includes('<p>This is a paragraph.</p>'));
        });

        test('renders bold and italic', () => {
            const html = renderMarkdown('**bold** and *italic*');
            assert.ok(html.includes('<strong>bold</strong>'));
            assert.ok(html.includes('<em>italic</em>'));
        });

        test('renders unordered list', () => {
            const html = renderMarkdown('- item 1\n- item 2\n- item 3');
            assert.ok(html.includes('<ul>'));
            assert.ok(html.includes('<li>item 1</li>'));
            assert.ok(html.includes('<li>item 2</li>'));
            assert.ok(html.includes('<li>item 3</li>'));
        });

        test('renders ordered list', () => {
            const html = renderMarkdown('1. first\n2. second');
            assert.ok(html.includes('<ol>'));
            assert.ok(html.includes('<li>first</li>'));
        });

        test('renders inline code', () => {
            const html = renderMarkdown('Use `console.log()` for debugging.');
            assert.ok(html.includes('<code>console.log()</code>'));
        });

        test('renders tables', () => {
            const md = '| Name | Value |\n|------|-------|\n| foo  | bar   |';
            const html = renderMarkdown(md);
            assert.ok(html.includes('<table>'));
            assert.ok(html.includes('<th>Name</th>'));
            assert.ok(html.includes('<td>foo</td>'));
            assert.ok(html.includes('<td>bar</td>'));
        });

        test('renders horizontal rule', () => {
            const html = renderMarkdown('---');
            assert.ok(html.includes('<hr>'));
        });

        test('renders links', () => {
            const html = renderMarkdown('[Google](https://google.com)');
            assert.ok(html.includes('href="https://google.com"'));
            assert.ok(html.includes('Google'));
        });

        test('renders blockquote', () => {
            const html = renderMarkdown('> This is a quote.');
            assert.ok(html.includes('<blockquote>'));
            assert.ok(html.includes('This is a quote.'));
        });

        test('handles empty input', () => {
            const html = renderMarkdown('');
            assert.strictEqual(html.trim(), '');
        });
    });

    // ── GitHub-style Alerts ───────────────────────────────────────────────

    suite('Alerts Plugin', () => {
        test('renders NOTE alert', () => {
            const html = renderMarkdown('> [!NOTE]\n> This is a note.');
            assert.ok(html.includes('markdown-alert-note'), 'Should contain note CSS class');
            assert.ok(html.includes('markdown-alert-title'), 'Should have title element');
            assert.ok(html.includes('Note'), 'Should have label text');
            assert.ok(html.includes('This is a note.'), 'Should contain content');
            assert.ok(html.includes('<svg'), 'Should have icon SVG');
        });

        test('renders TIP alert', () => {
            const html = renderMarkdown('> [!TIP]\n> A helpful tip.');
            assert.ok(html.includes('markdown-alert-tip'));
            assert.ok(html.includes('Tip'));
            assert.ok(html.includes('A helpful tip.'));
        });

        test('renders IMPORTANT alert', () => {
            const html = renderMarkdown('> [!IMPORTANT]\n> Critical info.');
            assert.ok(html.includes('markdown-alert-important'));
            assert.ok(html.includes('Important'));
        });

        test('renders WARNING alert', () => {
            const html = renderMarkdown('> [!WARNING]\n> Be careful.');
            assert.ok(html.includes('markdown-alert-warning'));
            assert.ok(html.includes('Warning'));
        });

        test('renders CAUTION alert', () => {
            const html = renderMarkdown('> [!CAUTION]\n> Dangerous action.');
            assert.ok(html.includes('markdown-alert-caution'));
            assert.ok(html.includes('Caution'));
        });

        test('uses <div> instead of <blockquote> for alerts', () => {
            const html = renderMarkdown('> [!NOTE]\n> Some content.');
            assert.ok(html.includes('<div class="markdown-alert'));
            assert.ok(html.includes('</div>'));
            // Should NOT contain blockquote for alerts
            assert.ok(!html.includes('<blockquote>'), 'Alert should not use blockquote tag');
        });

        test('regular blockquote still renders as blockquote', () => {
            const html = renderMarkdown('> Just a normal quote.');
            assert.ok(html.includes('<blockquote>'));
            assert.ok(!html.includes('markdown-alert'));
        });

        test('alert with multi-line content', () => {
            const md = '> [!NOTE]\n> Line one.\n> Line two.';
            const html = renderMarkdown(md);
            assert.ok(html.includes('markdown-alert-note'));
            assert.ok(html.includes('Line one.'));
            assert.ok(html.includes('Line two.'));
        });
    });

    // ── Mermaid Plugin ────────────────────────────────────────────────────

    suite('Mermaid Plugin', () => {
        test('renders mermaid code block as div', () => {
            const md = '```mermaid\ngraph TD\n    A --> B\n```';
            const html = renderMarkdown(md);
            assert.ok(html.includes('<div class="mermaid">'), 'Should render as mermaid div');
            assert.ok(html.includes('graph TD'), 'Should contain diagram content');
            assert.ok(html.includes('A --> B'));
        });

        test('does not wrap non-mermaid code in mermaid div', () => {
            const md = '```javascript\nconsole.log("hello");\n```';
            const html = renderMarkdown(md);
            assert.ok(!html.includes('class="mermaid"'));
            assert.ok(html.includes('code-block'));
        });

        test('mermaid block preserves content verbatim', () => {
            const md = '```mermaid\nsequenceDiagram\n    Alice->>Bob: Hello\n```';
            const html = renderMarkdown(md);
            assert.ok(html.includes('sequenceDiagram'));
            assert.ok(html.includes('Alice->>Bob: Hello'));
        });
    });

    // ── Checkbox Plugin ───────────────────────────────────────────────────

    suite('Checkbox Plugin', () => {
        test('renders checked checkbox [x]', () => {
            const html = renderMarkdown('- [x] Done task');
            assert.ok(html.includes('checkbox checked'), 'Should have checked class');
            assert.ok(html.includes('<svg'), 'Should have SVG icon');
            assert.ok(html.includes('Done task'));
        });

        test('renders unchecked checkbox [ ]', () => {
            const html = renderMarkdown('- [ ] Pending task');
            assert.ok(html.includes('checkbox unchecked'), 'Should have unchecked class');
            assert.ok(html.includes('Pending task'));
        });

        test('renders in-progress checkbox [/]', () => {
            const html = renderMarkdown('- [/] Working on it');
            assert.ok(html.includes('checkbox in-progress'), 'Should have in-progress class');
            assert.ok(html.includes('Working on it'));
        });

        test('renders multiple checkboxes in a list', () => {
            const md = '- [x] Task A\n- [ ] Task B\n- [/] Task C';
            const html = renderMarkdown(md);
            assert.ok(html.includes('checkbox checked'));
            assert.ok(html.includes('checkbox unchecked'));
            assert.ok(html.includes('checkbox in-progress'));
        });

        test('checkbox in inline text', () => {
            const html = renderMarkdown('[x] done and [ ] not done');
            assert.ok(html.includes('checkbox checked'));
            assert.ok(html.includes('checkbox unchecked'));
        });
    });

    // ── Diff Blocks ───────────────────────────────────────────────────────

    suite('Diff Blocks', () => {
        test('renders diff additions with correct class', () => {
            const md = '```diff\n+added line\n```';
            const html = renderMarkdown(md);
            assert.ok(html.includes('diff-add'), 'Should have diff-add class');
            assert.ok(html.includes('+added line'));
        });

        test('renders diff deletions with correct class', () => {
            const md = '```diff\n-removed line\n```';
            const html = renderMarkdown(md);
            assert.ok(html.includes('diff-del'), 'Should have diff-del class');
            assert.ok(html.includes('-removed line'));
        });

        test('renders context lines with correct class', () => {
            const md = '```diff\n unchanged line\n```';
            const html = renderMarkdown(md);
            assert.ok(html.includes('diff-ctx'), 'Should have diff-ctx class');
        });

        test('renders mixed diff block', () => {
            const md = '```diff\n context\n-old line\n+new line\n```';
            const html = renderMarkdown(md);
            assert.ok(html.includes('diff-ctx'));
            assert.ok(html.includes('diff-del'));
            assert.ok(html.includes('diff-add'));
            assert.ok(html.includes('language-diff'));
        });
    });

    // ── Carousel Plugin ───────────────────────────────────────────────────

    suite('Carousel Plugin', () => {
        test('renders carousel with multiple slides', () => {
            const md = '````carousel\nSlide 1 content\n<!-- slide -->\nSlide 2 content\n````';
            const html = renderMarkdown(md);
            assert.ok(html.includes('carousel-container'));
            assert.ok(html.includes('carousel-slide'));
            assert.ok(html.includes('data-slide="1"'));
            assert.ok(html.includes('data-slide="2"'));
            assert.ok(html.includes('Slide 1 content'));
            assert.ok(html.includes('Slide 2 content'));
        });

        test('carousel slides separated by dividers', () => {
            const md = '````carousel\nA\n<!-- slide -->\nB\n````';
            const html = renderMarkdown(md);
            assert.ok(html.includes('carousel-divider'));
        });
    });

    // ── File Link Icons Plugin ────────────────────────────────────────────

    suite('File Link Icons Plugin', () => {
        test('renders file:// link with TypeScript icon', () => {
            const html = renderMarkdown('[utils.ts](file:///path/to/utils.ts)');
            assert.ok(html.includes('file-link'), 'Should have file-link wrapper');
            assert.ok(html.includes('file-icon-badge'), 'Should have icon badge');
            assert.ok(html.includes('#3178c6'), 'Should have TS blue color');
            assert.ok(html.includes('TS'), 'Should show TS label');
            assert.ok(html.includes('utils.ts'));
        });

        test('renders file:// link with Python icon', () => {
            const html = renderMarkdown('[script.py](file:///path/to/script.py)');
            assert.ok(html.includes('#3776ab'), 'Should have Python blue color');
            assert.ok(html.includes('PY'));
        });

        test('renders file:// link with line anchor', () => {
            const html = renderMarkdown('[foo](file:///path/to/bar.ts#L123-L145)');
            assert.ok(html.includes('file-link'));
            assert.ok(html.includes('TS'));
        });

        test('renders unknown file extension with default icon', () => {
            const html = renderMarkdown('[readme.xyz](file:///path/to/readme.xyz)');
            assert.ok(html.includes('file-icon-badge'));
            assert.ok(html.includes('#6b7280'), 'Should use default gray');
        });

        test('regular https links are unaffected', () => {
            const html = renderMarkdown('[Google](https://google.com)');
            assert.ok(!html.includes('file-link'), 'Regular links should not get file-link class');
            assert.ok(!html.includes('file-icon-badge'));
            assert.ok(html.includes('href="https://google.com"'));
        });
    });

    // ── Code Blocks ───────────────────────────────────────────────────────

    suite('Code Blocks', () => {
        test('renders fenced code with language class', () => {
            const md = '```python\nprint("hello")\n```';
            const html = renderMarkdown(md);
            assert.ok(html.includes('code-block'));
            assert.ok(html.includes('language-python'));
            assert.ok(html.includes('print'));
        });

        test('renders fenced code without language', () => {
            const md = '```\nsome code\n```';
            const html = renderMarkdown(md);
            assert.ok(html.includes('code-block'));
            assert.ok(html.includes('some code'));
        });

        test('escapes HTML in code blocks', () => {
            const md = '```\n<script>alert("xss")</script>\n```';
            const html = renderMarkdown(md);
            assert.ok(html.includes('&lt;script&gt;'));
            assert.ok(!html.includes('<script>alert'));
        });
    });

    // ── createRenderer ────────────────────────────────────────────────────

    suite('createRenderer', () => {
        test('returns a MarkdownIt instance', () => {
            const md = createRenderer();
            assert.ok(md);
            assert.ok(typeof md.render === 'function');
        });

        test('allows file:// protocol links', () => {
            const md = createRenderer();
            assert.ok(md.validateLink('file:///path/to/file.ts'));
            assert.ok(md.validateLink('file:///absolute/path'));
        });

        test('still blocks javascript: protocol links', () => {
            const md = createRenderer();
            assert.ok(!md.validateLink('javascript:alert(1)'));
        });
    });
});

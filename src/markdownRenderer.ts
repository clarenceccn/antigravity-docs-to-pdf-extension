import MarkdownIt from 'markdown-it';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Convenience alias for markdown-it's render rule. */
type RenderRule = MarkdownIt.Renderer.RenderRule;

/** Convenience alias for markdown-it's Token class. */
type Token = MarkdownIt.Token;

// ─── Alert icons (inline SVG, GitHub-style) ──────────────────────────────────

const ALERT_ICONS: Record<string, string> = {
    NOTE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
    TIP: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>',
    IMPORTANT:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
    WARNING:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
    CAUTION:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
};

const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const;
type AlertType = (typeof ALERT_TYPES)[number];

// ─── GitHub Alerts Plugin ─────────────────────────────────────────────────────

function alertPlugin(md: MarkdownIt): void {
    const alertRegex = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/;

    // Capture the original render rules (or create a passthrough)
    const defaultBlockquoteOpen: RenderRule =
        md.renderer.rules.blockquote_open ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

    const defaultBlockquoteClose: RenderRule =
        md.renderer.rules.blockquote_close ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

    md.core.ruler.after('block', 'github_alerts', (state) => {
        const tokens = state.tokens;

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type !== 'blockquote_open') continue;

            // Find the first inline token inside this blockquote
            let inlineIdx = -1;
            let depth = 0;
            for (let j = i + 1; j < tokens.length; j++) {
                if (tokens[j].type === 'blockquote_open') depth++;
                if (tokens[j].type === 'blockquote_close') {
                    if (depth === 0) break;
                    depth--;
                }
                if (tokens[j].type === 'inline' && depth === 0) {
                    inlineIdx = j;
                    break;
                }
            }

            if (inlineIdx === -1) continue;

            const inlineToken = tokens[inlineIdx];
            const match = inlineToken.content.match(alertRegex);
            if (!match) continue;

            const alertType = match[1] as AlertType;

            // Mark the blockquote_open token with alert metadata
            tokens[i].attrSet('data-alert-type', alertType);
            tokens[i].meta = { alertType };

            // Remove the alert marker from the inline content
            inlineToken.content = inlineToken.content.replace(alertRegex, '');

            // Also clean up children tokens if present
            if (inlineToken.children) {
                let remaining = match[0].length;
                for (const child of inlineToken.children) {
                    if (remaining <= 0) break;
                    if (child.content.length <= remaining) {
                        remaining -= child.content.length;
                        child.content = '';
                    } else {
                        child.content = child.content.slice(remaining);
                        remaining = 0;
                    }
                }
                // Remove softbreak token after the alert marker if present
                const firstNonEmpty = inlineToken.children.findIndex(
                    (c: Token) => c.content !== '' || (c.type !== 'text' && c.type !== 'softbreak')
                );
                if (firstNonEmpty > 0) {
                    inlineToken.children.splice(0, firstNonEmpty);
                }
            }
        }
    });

    // Custom blockquote_open renderer
    md.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const alertType = (token.meta as { alertType?: AlertType } | null)?.alertType;

        if (alertType) {
            const icon = ALERT_ICONS[alertType] || '';
            const label = alertType.charAt(0) + alertType.slice(1).toLowerCase();
            return (
                `<div class="markdown-alert markdown-alert-${alertType.toLowerCase()}">\n` +
                `<p class="markdown-alert-title">${icon} ${label}</p>\n`
            );
        }

        return defaultBlockquoteOpen(tokens, idx, options, env, self);
    };

    // Custom blockquote_close renderer
    md.renderer.rules.blockquote_close = (tokens, idx, options, env, self) => {
        // Walk backwards to find the matching blockquote_open
        let depth = 0;
        for (let j = idx - 1; j >= 0; j--) {
            if (tokens[j].type === 'blockquote_close') depth++;
            if (tokens[j].type === 'blockquote_open') {
                if (depth === 0) {
                    if ((tokens[j].meta as { alertType?: string } | null)?.alertType) {
                        return '</div>\n';
                    }
                    break;
                }
                depth--;
            }
        }

        return defaultBlockquoteClose(tokens, idx, options, env, self);
    };
}

// ─── Mermaid Plugin ───────────────────────────────────────────────────────────

function mermaidPlugin(md: MarkdownIt): void {
    const defaultFence: RenderRule =
        md.renderer.rules.fence ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const info = token.info.trim().toLowerCase();

        if (info === 'mermaid') {
            return `<div class="mermaid">${token.content}</div>\n`;
        }

        // Carousel: render all slides stacked (PDF-friendly)
        if (info === 'carousel') {
            const slides = token.content.split('<!-- slide -->');
            const rendered = slides
                .map((slide: string, i: number) => {
                    const slideHtml = md.render(slide.trim());
                    return `<div class="carousel-slide" data-slide="${i + 1}">${slideHtml}</div>`;
                })
                .join('\n<hr class="carousel-divider">\n');
            return `<div class="carousel-container">${rendered}</div>\n`;
        }

        // Diff syntax highlighting
        if (info === 'diff') {
            const lines = token.content.split('\n');
            const highlighted = lines
                .map((line: string) => {
                    if (line.startsWith('+')) {
                        return `<span class="diff-add">${md.utils.escapeHtml(line)}</span>`;
                    } else if (line.startsWith('-')) {
                        return `<span class="diff-del">${md.utils.escapeHtml(line)}</span>`;
                    }
                    return `<span class="diff-ctx">${md.utils.escapeHtml(line)}</span>`;
                })
                .join('\n');
            return `<pre class="code-block language-diff"><code>${highlighted}</code></pre>\n`;
        }

        return defaultFence(tokens, idx, options, env, self);
    };
}

// ─── Syntax Highlighting ──────────────────────────────────────────────────────

function highlightCode(str: string, lang: string): string {
    const escaped = escapeHtml(str);

    if (!lang) {
        return `<pre class="code-block"><code>${escaped}</code></pre>`;
    }

    return `<pre class="code-block language-${escapeHtml(lang)}"><code>${escaped}</code></pre>`;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Checkbox Plugin ──────────────────────────────────────────────────────────

const CHECKBOX_HTML: Record<string, string> = {
    '[x]': '<span class="checkbox checked"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg></span>',
    '[/]': '<span class="checkbox in-progress"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/></svg></span>',
    '[ ]': '<span class="checkbox unchecked"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>',
};

const CHECKBOX_REGEX = /\[x\]|\[\/\]|\[ \]/g;

function checkboxPlugin(md: MarkdownIt): void {
    md.core.ruler.after('inline', 'checkbox', (state) => {
        for (const token of state.tokens) {
            if (token.type !== 'inline') continue;
            if (!token.children) continue;

            const newChildren: Token[] = [];
            let changed = false;

            for (const child of token.children) {
                if (child.type !== 'text' || !CHECKBOX_REGEX.test(child.content)) {
                    newChildren.push(child);
                    continue;
                }

                changed = true;
                // Split the text token around checkbox patterns
                let lastIndex = 0;
                CHECKBOX_REGEX.lastIndex = 0; // Reset regex
                let match: RegExpExecArray | null;

                while ((match = CHECKBOX_REGEX.exec(child.content)) !== null) {
                    // Text before the checkbox
                    if (match.index > lastIndex) {
                        const textToken = new state.Token('text', '', 0);
                        textToken.content = child.content.slice(lastIndex, match.index);
                        newChildren.push(textToken);
                    }

                    // The checkbox as html_inline (so it renders as actual HTML)
                    const htmlToken = new state.Token('html_inline', '', 0);
                    htmlToken.content = CHECKBOX_HTML[match[0]];
                    newChildren.push(htmlToken);

                    lastIndex = match.index + match[0].length;
                }

                // Remaining text after the last checkbox
                if (lastIndex < child.content.length) {
                    const textToken = new state.Token('text', '', 0);
                    textToken.content = child.content.slice(lastIndex);
                    newChildren.push(textToken);
                }
            }

            if (changed) {
                token.children = newChildren;
            }
        }
    });
}

// ─── File Link Icons Plugin ───────────────────────────────────────────────────

/** Map file extensions to icon badge color + short label (matches Antigravity style). */
const FILE_ICON_MAP: Record<string, { label: string; color: string }> = {
    '.ts': { label: 'TS', color: '#3178c6' },
    '.tsx': { label: 'TS', color: '#3178c6' },
    '.js': { label: 'JS', color: '#f0db4f' },
    '.jsx': { label: 'JS', color: '#f0db4f' },
    '.mjs': { label: 'JS', color: '#f0db4f' },
    '.json': { label: '{ }', color: '#5b9a32' },
    '.css': { label: '{ }', color: '#563d7c' },
    '.scss': { label: '{ }', color: '#c6538c' },
    '.html': { label: '</>', color: '#e34c26' },
    '.md': { label: 'M↓', color: '#083fa1' },
    '.py': { label: 'PY', color: '#3776ab' },
    '.go': { label: 'GO', color: '#00add8' },
    '.rs': { label: 'RS', color: '#dea584' },
    '.yaml': { label: 'Y', color: '#cb171e' },
    '.yml': { label: 'Y', color: '#cb171e' },
    '.toml': { label: 'T', color: '#9c4121' },
    '.sh': { label: '$', color: '#89e051' },
    '.bash': { label: '$', color: '#89e051' },
    '.sql': { label: 'SQL', color: '#e38c00' },
    '.svg': { label: 'SVG', color: '#ffb13b' },
    '.png': { label: '🖼', color: '#a074c4' },
    '.jpg': { label: '🖼', color: '#a074c4' },
};

function fileLinkPlugin(md: MarkdownIt): void {
    const defaultLinkOpen: RenderRule =
        md.renderer.rules.link_open ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

    const defaultLinkClose: RenderRule =
        md.renderer.rules.link_close ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const href = token.attrGet('href') || '';

        if (href.startsWith('file:///')) {
            // Extract filename and extension from the file:// URL
            const urlPath = decodeURIComponent(href.replace('file://', ''));
            // Handle line range anchors like #L123-L145
            const cleanPath = urlPath.split('#')[0];
            const ext = '.' + (cleanPath.split('.').pop()?.toLowerCase() ?? '');
            const iconInfo = FILE_ICON_MAP[ext];

            const iconBadge = iconInfo
                ? `<span class="file-icon-badge" style="background:${iconInfo.color};color:#fff;font-size:10px;font-weight:700;padding:1px 4px;border-radius:3px;margin-right:5px;vertical-align:middle;display:inline-block;line-height:14px;">${iconInfo.label}</span>`
                : `<span class="file-icon-badge" style="background:#6b7280;color:#fff;font-size:10px;font-weight:700;padding:1px 4px;border-radius:3px;margin-right:5px;vertical-align:middle;display:inline-block;line-height:14px;">📄</span>`;

            // Mark this token so link_close knows to modify the display text
            token.meta = { ...token.meta, isFileLink: true, iconBadge, cleanPath };

            return `<span class="file-link">${iconBadge}<span class="file-link-name">`;
        }

        return defaultLinkOpen(tokens, idx, options, env, self);
    };

    md.renderer.rules.link_close = (tokens, idx, options, env, self) => {
        // Walk back to find the matching link_open
        for (let j = idx - 1; j >= 0; j--) {
            if (tokens[j].type === 'link_open') {
                if ((tokens[j].meta as { isFileLink?: boolean } | null)?.isFileLink) {
                    return '</span></span>';
                }
                break;
            }
        }
        return defaultLinkClose(tokens, idx, options, env, self);
    };
}

// ─── Create Renderer ──────────────────────────────────────────────────────────

export function createRenderer(): MarkdownIt {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        highlight: (str: string, lang: string): string => {
            return highlightCode(str, lang);
        },
    });

    // Allow file:// protocol links (blocked by default)
    const originalValidateLink = md.validateLink.bind(md);
    md.validateLink = (url: string): boolean => {
        if (url.startsWith('file:///') || url.startsWith('file://')) {
            return true;
        }
        return originalValidateLink(url);
    };

    // Apply plugins
    alertPlugin(md);
    mermaidPlugin(md);
    checkboxPlugin(md);
    fileLinkPlugin(md);

    return md;
}

/**
 * Render a markdown string to an HTML body fragment.
 */
export function renderMarkdown(markdown: string): string {
    const md = createRenderer();
    return md.render(markdown);
}

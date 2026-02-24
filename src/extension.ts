import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PdfGenerator } from './PdfGenerator.js';
import { BrowserPool } from './browserPool.js';

/** The artifact filenames we look for during "Export All". */
const ARTIFACT_FILES = ['task.md', 'implementation_plan.md', 'walkthrough.md'];

// ─── Shared State ─────────────────────────────────────────────────────────────

let browserPool: BrowserPool;
let statusBarItem: vscode.StatusBarItem;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Expand `~` to the user's home directory.
 */
function expandHome(filepath: string): string {
    if (filepath.startsWith('~/') || filepath === '~') {
        return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
}

/**
 * Read the user-configured Chrome path, returning undefined if empty.
 */
function getChromePath(): string | undefined {
    const config = vscode.workspace.getConfiguration('antigravity');
    const chromePath = config.get<string>('chromePath', '');
    return chromePath ? expandHome(chromePath) : undefined;
}

/**
 * Resolve the export output directory based on settings and workspace.
 */
function resolveExportPath(): string {
    const config = vscode.workspace.getConfiguration('antigravity');
    const exportPath = config.get<string>('exportPath', 'docs');

    // If absolute, use directly
    if (path.isAbsolute(expandHome(exportPath))) {
        return expandHome(exportPath);
    }

    // Otherwise, resolve relative to workspace root
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
        return path.join(workspaceRoot, exportPath);
    }

    // Fallback: home directory
    return path.join(os.homedir(), 'antigravity-exports');
}

/**
 * Recursively find all artifact files within the brain directory.
 * Brain structure: brainPath/<conversation-id>/{task.md, implementation_plan.md, walkthrough.md}
 */
function findArtifacts(brainPath: string): { filePath: string; conversationId: string }[] {
    const results: { filePath: string; conversationId: string }[] = [];

    if (!fs.existsSync(brainPath)) {
        return results;
    }

    const entries = fs.readdirSync(brainPath, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const conversationDir = path.join(brainPath, entry.name);
        for (const artifactName of ARTIFACT_FILES) {
            const artifactPath = path.join(conversationDir, artifactName);
            if (fs.existsSync(artifactPath)) {
                results.push({
                    filePath: artifactPath,
                    conversationId: entry.name,
                });
            }
        }
    }

    return results;
}

/**
 * Generate a unique output filename for an artifact.
 */
function buildOutputPath(exportDir: string, conversationId: string, filename: string): string {
    const baseName = path.basename(filename, '.md');
    // Use first 8 chars of conversation ID for brevity
    const shortId = conversationId.slice(0, 8);
    return path.join(exportDir, `${baseName}_${shortId}.pdf`);
}

// ─── Command: Export All ──────────────────────────────────────────────────────

async function exportAll(): Promise<void> {
    const config = vscode.workspace.getConfiguration('antigravity');
    const brainPath = expandHome(config.get<string>('brainPath', '~/.gemini/antigravity/brain'));

    if (!fs.existsSync(brainPath)) {
        vscode.window.showErrorMessage(
            `Brain directory not found: ${brainPath}\n\nConfigure it via Settings → antigravity.brainPath`
        );
        return;
    }

    const artifacts = findArtifacts(brainPath);
    if (artifacts.length === 0) {
        vscode.window.showWarningMessage(
            `No artifacts found in ${brainPath}. Looking for: ${ARTIFACT_FILES.join(', ')}`
        );
        return;
    }

    const exportDir = resolveExportPath();

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Antigravity: Exporting artifacts to PDF',
            cancellable: true,
        },
        async (progress, token) => {
            // Ensure the browser pool has the latest Chrome path
            browserPool.setChromePath(getChromePath());
            const generator = new PdfGenerator(browserPool);

            let completed = 0;
            const errors: string[] = [];
            const total = artifacts.length;

            for (const artifact of artifacts) {
                if (token.isCancellationRequested) break;

                const outputPath = buildOutputPath(exportDir, artifact.conversationId, path.basename(artifact.filePath));
                const label = `${path.basename(artifact.filePath)} (${artifact.conversationId.slice(0, 8)}...)`;

                progress.report({
                    message: `${label} (${completed + 1}/${total})`,
                    increment: (1 / total) * 100,
                });

                try {
                    await generator.generate({
                        inputPath: artifact.filePath,
                        outputPath,
                    });
                    completed++;
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    errors.push(`${label}: ${msg}`);
                }
            }

            if (errors.length > 0) {
                vscode.window.showErrorMessage(
                    `Exported ${completed}/${total} PDFs with ${errors.length} error(s):\n${errors.join('\n')}`
                );
            } else {
                const action = await vscode.window.showInformationMessage(
                    `Exported ${completed} PDF(s) to ${exportDir}`,
                    'Open Folder'
                );
                if (action === 'Open Folder') {
                    vscode.env.openExternal(vscode.Uri.file(exportDir));
                }
            }
        }
    );
}

// ─── Artifact Resolution from Tab Label ───────────────────────────────────────

/** Map Antigravity preview tab labels to artifact filenames. */
const TAB_LABEL_TO_FILENAME: Record<string, string> = {
    'walkthrough': 'walkthrough.md',
    'task': 'task.md',
    'implementation plan': 'implementation_plan.md',
    'implementation_plan': 'implementation_plan.md',
};

/**
 * When the active tab is an Antigravity webview preview (no URI on the tab input),
 * attempt to find the artifact file by matching the tab label to known filenames
 * within the brain directory.
 */
async function resolveArtifactFromTabLabel(tabLabel?: string): Promise<string | undefined> {
    if (!tabLabel) return undefined;

    const normalizedLabel = tabLabel.toLowerCase().trim();
    const targetFilename = TAB_LABEL_TO_FILENAME[normalizedLabel];

    if (!targetFilename) {
        // Unknown tab label — can't resolve
        return undefined;
    }

    // Search the brain directory for matching files
    const config = vscode.workspace.getConfiguration('antigravity');
    const brainPath = expandHome(config.get<string>('brainPath', '~/.gemini/antigravity/brain'));

    if (!fs.existsSync(brainPath)) return undefined;

    // Collect all matching files across conversation directories
    const matches: { filePath: string; conversationId: string; mtime: number }[] = [];

    const entries = fs.readdirSync(brainPath, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const candidatePath = path.join(brainPath, entry.name, targetFilename);
        if (fs.existsSync(candidatePath)) {
            const stat = fs.statSync(candidatePath);
            matches.push({
                filePath: candidatePath,
                conversationId: entry.name,
                mtime: stat.mtimeMs,
            });
        }
    }

    if (matches.length === 0) return undefined;

    // Sort by most recently modified first
    matches.sort((a, b) => b.mtime - a.mtime);

    if (matches.length === 1) {
        return matches[0].filePath;
    }

    // Multiple matches: let the user pick
    const items = matches.map((m) => ({
        label: `${targetFilename} (${m.conversationId.slice(0, 8)}...)`,
        description: new Date(m.mtime).toLocaleString(),
        filePath: m.filePath,
    }));

    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: `Multiple ${targetFilename} files found. Which one?`,
    });

    return picked?.filePath;
}

// ─── Command: Export Current File ─────────────────────────────────────────────

async function exportCurrentFile(uri?: vscode.Uri): Promise<void> {
    // Resolve the file path from multiple possible sources
    let filePath: string | undefined;

    if (uri) {
        // 1. Direct URI (from context menu or explicit invocation)
        filePath = uri.fsPath;
    } else if (vscode.window.activeTextEditor) {
        // 2. Active text editor
        filePath = vscode.window.activeTextEditor.document.uri.fsPath;
    } else {
        // 3. Active tab — handle custom editors and webview panels
        const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
        const input = activeTab?.input;

        if (input instanceof vscode.TabInputCustom) {
            filePath = input.uri.fsPath;
        } else if (input instanceof vscode.TabInputText) {
            filePath = input.uri.fsPath;
        } else {
            // 4. Fallback: resolve from brain directory by tab label
            //    (Antigravity artifact preview uses webview panels without a URI)
            filePath = await resolveArtifactFromTabLabel(activeTab?.label);
        }
    }

    if (!filePath) {
        // User cancelled the quick pick or no file context — silently return
        return;
    }

    if (!filePath.endsWith('.md')) {
        const proceed = await vscode.window.showWarningMessage(
            'The current file is not a Markdown file. Export anyway?',
            'Export',
            'Cancel'
        );
        if (proceed !== 'Export') return;
    }

    // Show native "Save As" dialog
    const defaultDir = resolveExportPath();
    const defaultName = path.basename(filePath, '.md') + '.pdf';

    const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(defaultDir, defaultName)),
        filters: { 'PDF Files': ['pdf'] },
        title: 'Export PDF — Choose location and filename',
    });

    if (!saveUri) {
        // User cancelled the dialog
        return;
    }

    const outputPath = saveUri.fsPath;

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Antigravity: Exporting ${path.basename(filePath)}`,
            cancellable: false,
        },
        async (progress) => {
            progress.report({ message: 'Processing...' });

            try {
                // Ensure the browser pool has the latest Chrome path
                browserPool.setChromePath(getChromePath());
                const generator = new PdfGenerator(browserPool);
                const result = await generator.generate({
                    inputPath: filePath,
                    outputPath,
                });

                const action = await vscode.window.showInformationMessage(
                    `PDF saved: ${path.basename(result)}`,
                    'Open PDF',
                    'Open Folder'
                );

                if (action === 'Open PDF') {
                    vscode.env.openExternal(vscode.Uri.file(result));
                } else if (action === 'Open Folder') {
                    vscode.env.openExternal(vscode.Uri.file(path.dirname(result)));
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(`Failed to export PDF: ${msg}`);
            }
        }
    );
}

// ─── Status Bar Button ────────────────────────────────────────────────────────

function createStatusBarButton(context: vscode.ExtensionContext): void {
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'antigravity.exportCurrentFile';
    statusBarItem.text = '$(file-pdf) Export PDF';
    statusBarItem.tooltip = 'Antigravity: Export current file to PDF';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    context.subscriptions.push(statusBarItem);

    // Show/hide based on the active editor
    updateStatusBarVisibility();

    // Listen for editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => updateStatusBarVisibility()),
        vscode.window.tabGroups.onDidChangeTabs(() => updateStatusBarVisibility())
    );
}

function updateStatusBarVisibility(): void {
    // Show for active text editor with .md extension
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.fsPath.endsWith('.md')) {
        statusBarItem.show();
        return;
    }

    // Show for Antigravity artifact preview tabs (custom editor / webview)
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
    if (activeTab) {
        const input = activeTab.input;
        // Check if the tab's input has a URI pointing to a .md file
        if (input && typeof input === 'object' && 'uri' in input) {
            const uri = (input as { uri: vscode.Uri }).uri;
            if (uri.fsPath.endsWith('.md')) {
                statusBarItem.show();
                return;
            }
        }
        // Check tab label for known artifact names
        const label = activeTab.label.toLowerCase();
        if (['walkthrough', 'task', 'implementation plan', 'implementation_plan'].includes(label)) {
            statusBarItem.show();
            return;
        }
    }

    statusBarItem.hide();
}

// ─── Activation ───────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
    // Initialize the shared browser pool
    browserPool = new BrowserPool(getChromePath());

    // Ensure the browser pool is disposed when the extension deactivates
    context.subscriptions.push({ dispose: () => browserPool.dispose() });

    context.subscriptions.push(
        vscode.commands.registerCommand('antigravity.exportAll', exportAll),
        vscode.commands.registerCommand('antigravity.exportCurrentFile', exportCurrentFile)
    );

    // Create visible status bar button
    createStatusBarButton(context);

    // Log version for debugging (console only — no notification for production)
    const version = context.extension.packageJSON.version || 'unknown';
    console.log(`Antigravity Docs to PDF v${version} activated.`);
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
    // Browser pool disposal is handled via context.subscriptions above
}

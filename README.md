# Antigravity Docs to PDF
![Adobe Express - recording-480p](https://github.com/user-attachments/assets/66b3ee48-3b23-49e2-8917-4cd4919e27ed)

**One-click export** of Antigravity AI agent artifacts to high-fidelity PDFs.

Converts `walkthrough.md`, `implementation_plan.md`, and `task.md` files into beautiful PDFs with:

- ✅ **Mermaid diagrams** rendered as crisp SVG vectors
- ✅ **GitHub-style alerts** (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, etc.) with icons and colors
- ✅ **Code blocks** with syntax highlighting
- ✅ **Task checkboxes** — `[x]`, `[/]`, `[ ]` rendered visually
- ✅ **Tables** with zebra striping
- ✅ Lightweight — uses your existing Chrome/Edge installation

## Requirements

- **Google Chrome** or **Microsoft Edge** installed on your system
- VS Code 1.85+

## Commands

| Command | Description |
|---|---|
| `Antigravity: Export All` | Finds and exports all artifacts from the brain directory |
| `Antigravity: Export Current File` | Exports the currently open markdown file |

## Settings

| Setting | Default | Description |
|---|---|---|
| `antigravity.brainPath` | `~/.gemini/antigravity/brain` | Path to the Antigravity brain directory |
| `antigravity.exportPath` | `docs` | Export folder (relative to workspace root) |

## Installation

1. Build the extension:
   ```bash
   npm install
   npm run build
   npm run package
   ```
2. Install the `.vsix` file: **Extensions → ⋯ → Install from VSIX...**

## Development

```bash
npm install
npm run watch   # Auto-rebuild on changes
```

Press `F5` in VS Code to launch the Extension Development Host.

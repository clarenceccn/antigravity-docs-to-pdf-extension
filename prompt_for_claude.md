You are an expert Senior Software Engineer and VS Code Extension Developer. I need you to analyze and improve my current project, `antigravity-vs-code-extension` (ag-docs-to-pdf).

**Project Overview:**
This is a VS Code extension that exports specific Markdown artifacts (tasks, implementation plans, walkthroughs) to high-fidelity PDFs. It uses `markdown-it` for rendering HTML and `puppeteer-core` to print that HTML to PDF. It supports Mermaid diagrams, GitHub-style alerts, and code syntax highlighting.

**Current State:**
- **Entry:** `src/extension.ts` handles commands and UI interactions.
- **Core Logic:** `src/PdfGenerator.ts` orchestrates the conversion.
- **Rendering:** `src/markdownRenderer.ts` handles Markdown-to-HTML, with custom plugins for Alerts and Mermaid.
- **Dependencies:** `puppeteer-core`, `markdown-it`, `chrome-launcher`.

**Objective:**
"Productionize" this extension. I want it to be robust, performant, and maintainable enough for public release.

**Requirements & Focus Areas:**

1.  **Code Quality & Architecture:**
    -   Refactor `PdfGenerator.ts`. Currently, it has hardcoded HTML templates and CSS strings. Separate these into dedicated files (e.g., `templates/base.html`, `styles/main.css`) and load them properly.
    -   Remove `any` types, especially in `src/markdownRenderer.ts`. Ensure strict type safety.
    -   Improve error handling, particularly around browser detection (`browserFinder.ts`) and Puppeteer launching.

2.  **Performance Optimization:**
    -   The current implementation launches a new Puppeteer browser instance for *every* file exported. This is inefficient for batch exports ("Export All"). Implement a pattern to reuse the browser instance or parallelize processing with a worker pool (or simply share one browser instance across the session).
    -   Optimize the Mermaid rendering wait strategy. The current `waitForMermaid` uses a polling mechanism. accurate and efficient detection of when diagrams are fully rendered.

3.  **Correctness & Reliability:**
    -   Ensure the implementation handles edge cases like missing fonts, large files to render, or timeouts gracefully.
    -   Verify that `browserFinder.ts` covers a wide range of OS/install paths or provides a better fallback/user prompt if no browser is found.

4.  **Testing Strategy (Critical):**
    -   There are currently **NO** tests.
    -   Design and implement a comprehensive test suite using `mocha` (standard for VS Code extensions).
    -   **Unit Tests:** specific tests for `markdownRenderer.ts` to ensure plugins (Alerts, Mermaid, Checkboxes) render HTML correctly.
    -   **Integration Tests:** Test `PdfGenerator.ts` to verify it produces a PDF file (checking file existence and potentially size/content validation if possible without being too brittle).
    -   **E2E Tests:** (Optional but good) Test the actual VS Code commands `antigravity.exportAll`.

5.  **UX Improvements:**
    -   Ensure progress reporting in `exportAll` is accurate and provides good feedback.
    -   Add configuration options if necessary (e.g., custom CSS path, custom chrome path).

**Deliverables:**
1.  **Refactored Code:** Provide the updated code for `PdfGenerator.ts`, `markdownRenderer.ts`, and any new utility files.
2.  **Test Suite:** Provide the full setup for tests (`test/suite/index.ts`, `test/runTest.ts`) and the actual test files (`test/suite/markdownRenderer.test.ts`, etc.).
3.  **Configuration:** Update `package.json` and `tsconfig.json` if new dependencies (like `mocha`, `@types/mocha`) or scripts are needed.

Please proceed with the analysis and generate the improved code and tests.

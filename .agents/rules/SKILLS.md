---
trigger: always_on
---

# Agent Skills & Behavioral Rules

## 1. Interaction with Stitch MCP
- **Design Authority:** Always consult the Stitch MCP server before proposing UI changes. Use its output as the primary source of truth for design tokens, spacing, and component logic.
- **Blueprint Mapping:** When Stitch provides a UI/UX suggestion, map those suggestions to the existing project structure (e.g., React components or Tailwind classes) before writing code.
- **Validation:** Use Stitch to verify color contrast, accessibility (WCAG), and responsive breakpoints for every generated UI element.

## 2. High-Compute Reasoning (Gemini 3 Pro)
- **Planning First:** For any UI redesign task, generate a step-by-step "Implementation Plan" in the side panel. Do not modify source files until the plan is approved.
- **Context Awareness:** Leverage the full project context to ensure new UI changes do not break existing business logic or API integrations.
- **Token Optimization:** If the task involves a large number of files, summarize changes by component rather than outputting entire files at once.

## 3. UI/UX Implementation Standards
- **Component Reusability:** Prefer updating existing shared components over creating "one-off" styled divs.
- **Tailwind Integration:** (Adjust if using a different framework) Strictly use Tailwind CSS for all styling. Do not use inline styles or external CSS files unless explicitly requested.
- **Visual Assets:** If Stitch suggests specific imagery or icons, use the internal `image_generation` (Nano Banana 2) tool to create matching assets.

## 4. Arch Linux / Environment specific
- **Execution:** When running tests or dev servers, use `pacman` or `npm` commands as appropriate for this system's environment.
- **Verification:** Always use the built-in browser to take a "Before" and "After" screenshot of the UI for validation.

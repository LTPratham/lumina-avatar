# LuminaAvatar Initial Setup and Skeleton Implementation Plan

This plan establishes the foundation of the **LuminaAvatar** embeddable widget, setting up the build environment, project layout, and the core SDK entry points so we can build and load the widget locally.

## User Review Required

> [!IMPORTANT]
> - **Tech Stack Choices**: We will use **Vite** in library mode to build a single client-side `.js` bundle containing both the SDK loader and the UI components.
> - **Frameworks inside the Widget**: To keep the bundle size extremely small (under 50KB, as specified in the vision), we should use either a lightweight library like **Preact** or **Vanilla JS + Web Components**. We propose using **Preact + TS** or **Vanilla TS** for rendering components. Preact allows using `.tsx` syntax while compiling to tiny bundles. Let us know if you prefer pure Vanilla TS/JS instead of Preact.
> - **CSS Injection**: Since it's a third-party widget embedded on other websites, we want all styles to be bundled directly into the JS file and injected dynamically to prevent clients from needing to load a separate `.css` file. We can configure Vite to inject CSS into the DOM head on load.

## Open Questions

> [!IMPORTANT]
> 1. Do you have a specific Rive file (.riv) we should use for the animation, or should we use a public sample asset for development?
> 2. Should we support an npm-based import (e.g., `import LuminaAvatar from 'lumina-avatar'`) in addition to the CDN `<script>` tag load?

## Proposed Changes

### Project Root

#### [NEW] [package.json](file:///d:/projects/lumina-avatar/package.json)
Initializes npm package, script definitions, and dependencies (Preact, Rive runtime, Vite, TypeScript, etc.).

#### [NEW] [tsconfig.json](file:///d:/projects/lumina-avatar/tsconfig.json)
TypeScript configuration for compiler options and module resolution suited for TS library builds.

#### [NEW] [vite.config.ts](file:///d:/projects/lumina-avatar/vite.config.ts)
Vite configuration for building LuminaAvatar in library mode to compile the code into a single, self-contained, optimized bundle (`dist/lumina-avatar.js`).

### SDK Core

#### [NEW] [loader.ts](file:///d:/projects/lumina-avatar/src/sdk/loader.ts)
Asynchronous loader script that clients paste onto their site. It dynamically injects the main widget script, initializes the global `window.LuminaAvatar` configuration queue, and executes commands.

#### [NEW] [index.ts](file:///d:/projects/lumina-avatar/src/sdk/index.ts)
Main entry point. Initializes the widget canvas, speech bubbles, and interfaces with the page DOM.

### Verification Plan

### Automated Tests
- Build verification using `npm run build` to ensure the final bundle is optimized, single-file, and correct.

### Manual Verification
- Create a test page `demo/index.html` referencing the built script to test if the widget initializes, aligns to target DOM elements, and displays the UI correctly.

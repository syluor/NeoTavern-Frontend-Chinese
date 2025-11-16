_Everthing below written with AI_

<h1 align="center">SillyTavern Experimental Frontend</h1>

<p align="center">
  A modern, experimental frontend for SillyTavern, built with Vue 3 and Vite.
</p>

<p align="center">
  <a href="https://github.com/bmen25124/SillyTavern-Experimental-Frontend/actions/workflows/ci.yml">CI Status</a>
  ·
  <a href="https://github.com/bmen25124/SillyTavern-Experimental-Frontend/issues">Report a Bug</a>
  ·
  <a href="https://github.com/bmen25124/SillyTavern-Experimental-Frontend/issues">Request a Feature</a>
</p>

<p align="center">

[![CI](https://github.com/bmen25124/SillyTavern-Experimental-Frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/bmen25124/SillyTavern-Experimental-Frontend/actions)
[![Codecov](https://codecov.io/github/bmen25124/SillyTavern-Experimental-Frontend/branch/main/graph/badge.svg)](https://codecov.io/github/bmen25124/SillyTavern-Experimental-Frontend)

</p>

This repository contains an experimental, modern frontend for SillyTavern. It aims to provide a clean, performant, and extensible user interface by leveraging modern web technologies like Vue 3, Vite, and Pinia.

## ✨ Features

-   **Modern Tech Stack**: Built with Vue 3, Vite, Pinia, and TypeScript for a fast, type-safe, and maintainable codebase.
-   **Comprehensive Character Management**: A detailed character browser and editor panel, including support for importing, creating, and editing characters with advanced options.
-   **Advanced AI Configuration**: A dedicated panel for managing AI settings like temperature, penalties, context size, and presets.
-   **Flexible API Connections**: UI to connect to various AI backends, with initial support for OpenAI-compatible Chat Completion APIs (including OpenAI, Claude, and OpenRouter).
-   **Powerful World Info (Lorebooks)**: A full-featured system for managing lorebooks and their entries, complete with a two-pane browser and editor view.
-   **User Persona Management**: Create and manage multiple user personas, each with its own avatar, name, and description.
-   **Dynamic & Customizable UI**: Features resizable panels and a clean, modern design.
-   **Extensible**: A simple extension system allows for adding custom functionality via JavaScript and CSS.
-   **Internationalization (i18n)**: Supports multiple languages with `vue-i18n` and includes a script for easy management of translation keys.

## 🚀 Getting Started

### Prerequisites

-   Node.js (v20 or higher recommended)
-   pnpm (or your package manager of choice)
-   A running instance of the SillyTavern backend server.

### Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/sillytavern-experimental-frontend.git
    cd sillytavern-experimental-frontend
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    This will start the Vite development server. By default, it proxies API requests to `http://localhost:8000`, which is the standard SillyTavern backend address. You can configure the proxy in `vite.config.ts`.

### Available Scripts

-   `pnpm dev`: Starts the development server.
-   `pnpm build`: Compiles and bundles the application for production.
-   `pnpm test`: Runs unit tests with Vitest and generates a coverage report.
-   `pnpm lint`: Lints the codebase with ESLint.
-   `pnpm format`: Formats the code with Prettier.
-   `pnpm i18n`: Checks for unused i18n keys and generates TypeScript types for them.

## 📁 Project Structure

The codebase is organized to separate concerns and promote maintainability:

-   `src/`: Main source code directory.
    -   `api/`: Functions for communicating with the SillyTavern backend.
    -   `components/`: Reusable Vue components, organized by feature (e.g., `Chat`, `CharacterPanel`).
    -   `composables/`: Vue composables for reusable, stateful logic (e.g., `useDraggable`).
    -   `stores/`: Pinia state management stores for global application state.
    -   `styles/`: Global SCSS styles, variables, and component-specific styles.
    -   `types/`: TypeScript type definitions for the application.
    -   `utils/`: General utility functions (e.g., date formatting, API helpers).
    -   `main.ts`: The main application entry point.
-   `public/`: Static assets and example extensions.
-   `locales/`: Internationalization (i18n) translation files.
-   `vite.config.ts`: Configuration for the Vite build tool, including the development server proxy.

## ⚖️ License

MIT © [bmen25124](https://github.com/bmen25124)

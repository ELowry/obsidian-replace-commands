# Contributing to Replace Commands

Thank you for your interest in contributing to Replace Commands!

## Intent & Philosophy

The core intent of this plugin is to provide a powerful yet lightweight tool for automating search/replace.

- **Native Feel:**  
  Try to focus on native Obsidian UI components (`PluginSettingTab`, `Setting`, `Menu`) to ensure the plugin blends seamlessly with the rest of your vault.
- **Atomic Operations:**  
  All text replacements must be applied as a single operation. This ensures that a single `Ctrl+Z` (Undo) reverts all changes made by a command, preserving a predictable user experience.
- **Minimal Footprint:**  
  Try to avoid external dependencies and frameworks to keep the plugin fast and the bundle size small.
- **Safety First:**  
  User-provided regex must always be handled within `try/catch` blocks to prevent plugin crashes from invalid patterns.

## Development Setup

If you want to build this plugin locally or contribute code, follow these steps:

1. **Clone the repository:**
    ```bash
    git clone https://github.com/ELowry/obsidian-replace-commands.git
    ```
2. **Install dependencies:**  
   Make sure you have Node.js (v20 or higher) installed and run.
    ```bash
    npm install
    ```
3. **Build the plugin:**
    ```bash
    npm run build
    ```
4. **Test in Obsidian:**
   Copy the project folder inside your Obsidian vault's plugin directory:
   `<Vault>/.obsidian/plugins/replace-commands/`
   Then enable it in **Settings → Community plugins**.

## How to Contribute

### Reporting Bugs & Requesting Features

Please [open an issue on GitHub](https://github.com/elowry/obsidian-replace-commands/issues/new/choose), and select the appropriate template to use (bug report, feature request, or general question).

### Submitting Pull Requests

To ensure a smooth review process:

- **Always create an issue first:**  
  Whether it's a bug report, feature request, or general question, please create an issue before making a pull request to ensure your idea is valid and applicable to the plugin.
- **Keep it focused:**  
  Each PR should address a single bug fix or feature.
- **Stick to the stack:**  
  Do not add new NPM dependencies or UI frameworks without explicit permission in the corresponding issue first.

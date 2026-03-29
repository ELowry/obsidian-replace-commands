# Replace Commands

![License: 0-BSD](https://img.shields.io/badge/License-0--BSD-blue.svg)

An Obsidian plugin that lets you preconfigure custom search and replace actions using plain text or regex to quickly modify selections or documents.

Whether you need to quickly clean up messy OCR text, standardize markdown formatting, or chain complex regex replacements, this plugin lets you save those sequences as single-click actions.

## Features

- **Custom Actions:** Create named actions (e.g., "Clean OCR", "Format Tables") that contain one or more search/replace rules.
- **Sequential Processing:** Chain multiple rules together. They execute in order from top to bottom.
- **Smart Targeting:** If you highlight text, the action only applies to your selection. If nothing is selected, it applies to the entire document.
- **Single-Step Undo:** No matter how many rules are in your action, they are applied as a single atomic transaction. One press of `Ctrl+Z` undoes the entire operation.
- **Regex & Capture Groups:** Full support for JavaScript Regular Expressions. Use capture groups (e.g., `$1`, `$2`) in your replacement strings.
- **Custom Regex Flags:** easily add flags like `i` (case-insensitive) or `m` (multiline) to your regex rules.
- **Plaintext Escapes:** If you turn regex off, you can still search for `\n` (newlines) and `\t` (tabs) in plaintext mode.
- **Easy Access:** Run your actions directly from the Obsidian Command Palette (`Ctrl/Cmd + P`), or add them to the right-click Editor Context Menu.

## How to Use

1. **Configure an Action:** - Go to **Settings -> Replace Commands**.
    - Click **Add new action** and give it a name (Example: "Fix spacing").
    - Add your search and replace terms. Toggle "Use regex" if you are using regular expressions.
2. **Apply to Text:**
    - Open any note in Obsidian.
    - **Targeted:** Highlight a specific block of text to only apply the replacement to your selection.
    - **Document-wide:** Leave your cursor unselected to apply the replacement to the entire note.
3. **Execute:**
    - Right-click the editor and select your action from the **Custom replace** context menu.
    - _Alternatively:_ Open the Command Palette (`Ctrl/Cmd + P`), type your action's name, and hit Enter.
4. **Undo:**
    - Made a mistake? Press `Ctrl/Cmd + Z` once to undo the entire action instantly.

## Installation

### From the Community Plugins List (Recommended)

1. Open Obsidian and navigate to **Settings → Community plugins**.
2. If **Restricted mode** is enabled, click **Turn off** to allow third-party plugins.
3. Click **Browse** and search for **Replace Commands**.
4. Click **Install**, and then click **Enable**.

### Manually installing the plugin

To install the plugin manually from GitHub:

1. Download the latest release from the [GitHub Releases page](https://github.com/ELowry/replace-commands/releases).
2. Extract the files and copy `main.js`, `manifest.json`, and `styles.css` (if applicable) to your vault at `YourVaultFolder/.obsidian/plugins/replace-commands/`.
3. Open Obsidian, go to **Settings → Community plugins**, and toggle on **Replace Commands**.

### Manually installing the plugin

To install the plugin manually before it is available in the community store:

1. Download the latest release from the GitHub repository.
2. Copy over `main.js`, `manifest.json`, and `styles.css` (if applicable) to your vault at `VaultFolder/.obsidian/plugins/replace-commands/`.
3. Open Obsidian, go to **Settings > Community Plugins**, disable "Restricted mode", and toggle on **Replace Commands**.

## Development

If you want to build this plugin locally or contribute:

1. Clone this repo.
2. Make sure your NodeJS is at least v16 (`node --version`).
3. Run `npm i` or `yarn` to install dependencies.
4. Run `npm run dev` to start compilation in watch mode.
5. Place the project folder inside your `.obsidian/plugins/` directory to test it live in Obsidian.

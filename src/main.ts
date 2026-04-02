import { Editor, MarkdownView, Plugin, Menu, MenuItem } from 'obsidian';
import { CustomReplaceSettings, DEFAULT_SETTINGS } from './types';
import { CustomReplaceSettingTab } from './settings';
import { applyReplaceAction } from './engine';

/**
 * Main Obsidian plugin class that manages settings, commands, and context menus.
 */
export default class CustomReplacePlugin extends Plugin {
	/** Stores the plugin configuration. */
	settings!: CustomReplaceSettings;

	/**
	 * Called when the plugin is enabled and loaded.
	 */
	async onload() {
		await this.loadSettings();

		// Add the settings tab
		this.addSettingTab(new CustomReplaceSettingTab(this.app, this));

		// Register the editor context menu event
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				// Filter actions that should be in the context menu
				const contextMenuActions = this.settings.actions.filter(
					(action) => action.showInContextMenu,
				);

				if (contextMenuActions.length > 0) {
					menu.addItem((item: MenuItem) => {
						item.setTitle('Custom replace').setIcon('search');

						interface SubmenuItem extends MenuItem {
							setSubmenu(): Menu;
						}
						const submenu = (item as SubmenuItem).setSubmenu();

						contextMenuActions.forEach((action) => {
							submenu.addItem((subItem: MenuItem) => {
								subItem.setTitle(action.name).onClick(() => {
									applyReplaceAction(editor, action);
								});
							});
						});
					});
				}
			}),
		);

		// Register the dynamic commands for the palette
		this.registerActionCommands();
	}

	/**
	 * Loads plugin settings from disk.
	 */
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<CustomReplaceSettings>,
		);
	}

	/**
	 * Persists settings to disk and refreshes commands.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
		this.registerActionCommands();
	}

	/** Set to keep track of currently registered action command IDs. */
	private registeredActionIds: Set<string> = new Set();

	/**
	 * Registers (or refreshes) search/replace actions as commands in the Command Palette.
	 */
	registerActionCommands() {
		// Remove existing action commands to avoid clones
		this.registeredActionIds.forEach((id) => {
			try {
				// @ts-ignore: removeCommand is a modern Obsidian API
				if (typeof this.removeCommand === 'function') {
					this.removeCommand(id);
				}
			} catch (e) {
				console.error('Failed to remove command', id, e);
			}
		});
		this.registeredActionIds.clear();

		// Register new commands for each configured action
		this.settings.actions.forEach((action) => {
			this.addCommand({
				id: action.id,
				name: action.name,
				editorCallback: (editor: Editor) => {
					applyReplaceAction(editor, action);
				},
			});
			this.registeredActionIds.add(action.id);
		});
	}
}

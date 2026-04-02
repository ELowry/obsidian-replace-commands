import { Editor, Plugin, MenuItem, Menu } from 'obsidian';
import { CustomReplaceSettings, DEFAULT_SETTINGS } from './types';
import { CustomReplaceSettingTab } from './settings';
import { applyReplaceAction } from './engine';

/**
 * Main plugin class for Custom Replace.
 * Manages lifecycle, commands, and context menus.
 */
export default class CustomReplacePlugin extends Plugin {
	/** Current plugin settings. */
	settings!: CustomReplaceSettings;

	/** Set of currently registered action command IDs for manual cleanup. */
	private registeredActionIds: Set<string> = new Set();

	/**
	 * Initializes settings, UI, and commands.
	 */
	async onload() {
		await this.loadSettings();

		this.addSettingTab(new CustomReplaceSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
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

		this.registerActionCommands();
	}

	/**
	 * Loads data from disk and merges with defaults.
	 */
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<CustomReplaceSettings>,
		);
	}

	/**
	 * Persists settings and updates registered commands.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
		this.registerActionCommands();
	}

	/**
	 * Refreshes command palette entries based on current settings.
	 */
	registerActionCommands() {
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

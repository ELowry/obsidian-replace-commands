import { Editor, Menu, MenuItem, Plugin } from 'obsidian';

import { applyReplaceAction } from './engine';
import { t } from './locales/i18n';
import { CustomReplaceSettingTab } from './settings';
import { CustomReplacePluginInstance, CustomReplaceSettings, DEFAULT_SETTINGS } from './types';
import { ActionSuggestModal } from './ui/action-suggest-modal';

/**
 * Main plugin class for Custom Replace.  
 * Manages lifecycle, commands, and context menus.
 */
export default class CustomReplacePlugin extends Plugin implements CustomReplacePluginInstance {
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
					(action) => action.showInContextMenu
				);

				if (contextMenuActions.length > 0) {
					menu.addItem((item: MenuItem) => {
						item.setTitle(t('CONTEXT_MENU_TITLE')).setIcon('search');

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
			})
		);

		this.addCommand({
			id: 'run-custom-replace',
			name: 'Run replace action',
			editorCallback: (editor: Editor) => {
				new ActionSuggestModal(this.app, this, editor).open();
			},
		});
	}

	/**
	 * Loads data from disk and merges with defaults.
	 */
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<CustomReplaceSettings>
		);
	}

	/**
	 * Persists settings and updates registered commands.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Scans current settings and registers each action as a command.  
	 * Cleans up previously registered commands to avoid duplicates.
	 */
	registerActionCommands() {
		this.registeredActionIds.forEach((id) => {
			try {
				if (typeof this.removeCommand === 'function') {
					this.removeCommand(id);
				}
			} catch (e) {
				console.error(`Failed to remove command: ${id}`, e);
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

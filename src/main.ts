import { Editor, Menu, MenuItem, Plugin, TAbstractFile } from 'obsidian';

import { applyReplaceAction, applyReplaceActionToFiles } from './engine';
import { t } from './locales/i18n';
import { CustomReplaceSettingTab } from './settings';
import { CustomReplacePluginInstance, CustomReplaceSettings, DEFAULT_SETTINGS } from './types';
import { ActionSuggestModal } from './ui/action-suggest-modal';

/**
 * Main plugin class for Custom Replace managing lifecycle, commands, and context menus.
 */
export default class CustomReplacePlugin extends Plugin implements CustomReplacePluginInstance {
	/** Current plugin settings. */
	settings!: CustomReplaceSettings;

	/** Set of currently registered action command IDs for manual cleanup. */
	private registeredActionIds: Set<string> = new Set();

	/**
	 * Initializes settings, UI, commands, and context menus for editors and file explorers.
	 */
	async onload() {
		await this.loadSettings();
		this.registerActionCommands();

		this.addSettingTab(new CustomReplaceSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				const allActions = this.settings.actions;
				if (allActions.length === 0) return;

				const contextMenuActions = allActions.filter((action) => action.showInContextMenu);
				const unshownCount = allActions.length - contextMenuActions.length;

				menu.addItem((item: MenuItem) => {
					item.setTitle(t('CONTEXT_MENU_TITLE')).setIcon('search');

					if (contextMenuActions.length === 0) {
						item.onClick(() => {
							new ActionSuggestModal(this.app, this, editor).open();
						});
						return;
					}

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

					if (unshownCount > 0) {
						submenu.addSeparator();
						submenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle(t('CONTEXT_MENU_ALL_COMMANDS'))
								.setIcon('list')
								.onClick(() => {
									new ActionSuggestModal(this.app, this, editor).open();
								});
						});
					}
				});
			})
		);

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				const activeExplorer = document.querySelector(
					'.workspace-leaf.mod-active .nav-files-container'
				);
				const selectedItemsCount =
					activeExplorer?.querySelectorAll('.is-selected').length || 0;

				if (selectedItemsCount > 1) {
					return;
				}

				this.#addFileExplorerSubmenu(menu, [file]);
			})
		);

		this.registerEvent(
			this.app.workspace.on('files-menu', (menu, files) => {
				this.#addFileExplorerSubmenu(menu, files);
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
	 * Generates and attaches a submenu to the file explorer context menu containing all applicable custom replace actions.
	 *
	 * @private
	 * @param menu - The Obsidian Menu instance to which the submenu will be appended.
	 * @param files - An array of abstract files representing the user's selection in the file explorer.
	 */
	#addFileExplorerSubmenu(menu: Menu, files: TAbstractFile[]) {
		const contextMenuActions = this.settings.actions.filter(
			(action) => action.showInContextMenu
		);

		if (contextMenuActions.length > 0) {
			menu.addItem((item: MenuItem) => {
				item.setTitle(t('CONTEXT_MENU_BULK_TITLE')).setIcon('search');

				interface SubmenuItem extends MenuItem {
					setSubmenu(): Menu;
				}
				const submenu = (item as SubmenuItem).setSubmenu();

				contextMenuActions.forEach((action) => {
					submenu.addItem((subItem: MenuItem) => {
						subItem.setTitle(action.name).onClick(async () => {
							await applyReplaceActionToFiles(this.app, action, files);
						});
					});
				});
			});
		}
	}

	/**
	 * Loads data from disk and merges with default settings.
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
		this.registerActionCommands();
	}

	/**
	 * Scans current settings and registers each action as a command while cleaning up previously registered commands to avoid duplicates.
	 */
	registerActionCommands() {
		this.registeredActionIds.forEach((id) => {
			try {
				// Cast to an intersection type to satisfy ESLint and strict TS without using 'any'
				const plugin = this as Plugin & { removeCommand?: (id: string) => void };
				if (typeof plugin.removeCommand === 'function') {
					plugin.removeCommand(id);
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

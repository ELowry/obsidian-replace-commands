import { App, PluginSettingTab } from 'obsidian';

import { t } from './locales/i18n';
import { CustomReplacePluginInstance } from './types';
import { ActionDetailModal } from './ui/action-detail-modal';
import { ConfirmModal } from './ui/confirm-modal';

/**
 * The main settings tab for configuring Custom Replace actions.
 */
export class CustomReplaceSettingTab extends PluginSettingTab {
	/** The main plugin instance. */
	plugin: CustomReplacePluginInstance;

	/**
	 * Creates a new CustomReplaceSettingTab.
	 *
	 * @param app - The Obsidian App instance.
	 * @param plugin - The CustomReplacePlugin instance.
	 */
	constructor(app: App, plugin: CustomReplacePluginInstance) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Constructs and returns the declarative definitions for the plugin's settings tab.
	 *
	 * @returns An array of settings definitions including the action list configuration.
	 */
	getSettingDefinitions() {
		return [
			{
				type: 'list' as const,
				heading: t('SETTINGS_TITLE'),
				desc: t('SETTINGS_DESCRIPTION'),
				emptyState: t('SETTINGS_DESCRIPTION'),
				addItem: {
					name: t('BUTTON_ADD_ACTION'),
					action: async () => {
						const newId = `replace-action-${Date.now()}`;
						const newAction = {
							id: newId,
							name: t('NEW_ACTION_DEFAULT_NAME'),
							showInContextMenu: true,
							showTestBench: true,
							rules: [
								{
									search: '',
									replace: '',
									useRegex: false,
									regexFlags: 'g',
								},
							],
						};

						this.plugin.settings.actions.push(newAction);
						await this.plugin.saveSettings();
						this.update();

						new ActionDetailModal(this.app, this.plugin, newAction, () =>
							this.update()
						).open();
					},
				},
				onReorder: async (oldIndex: number, newIndex: number) => {
					const actions = this.plugin.settings.actions;
					const [movedItem] = actions.splice(oldIndex, 1);
					if (movedItem) {
						actions.splice(newIndex, 0, movedItem);
						await this.plugin.saveSettings();
					}
				},
				onDelete: async (idx: number) => {
					new ConfirmModal(
						this.app,
						t('CONFIRM_DELETE_ACTION_TITLE'),
						t('CONFIRM_DELETE_ACTION_DESC'),
						t('BUTTON_DELETE'),
						async () => {
							// Confirm: remove and update
							this.plugin.settings.actions.splice(idx, 1);
							await this.plugin.saveSettings();
							this.update();
						},
						() => {
							// Cancel: update to restore view
							this.update();
						}
					).open();
				},
				items: this.plugin.settings.actions.map((action) => {
					const count = action.rules.length;
					const countText =
						count === 1 ? t('RULE_COUNT_SINGLE', count) : t('RULE_COUNT_PLURAL', count);
					const menuStatus = action.showInContextMenu
						? t('CONTEXT_MENU_VISIBLE')
						: t('CONTEXT_MENU_HIDDEN');

					return {
						name: action.name,
						desc: t('ACTION_SUMMARY', countText, menuStatus),
						searchable: false,
						action: () => {
							new ActionDetailModal(this.app, this.plugin, action, () =>
								this.update()
							).open();
						},
					};
				}),
			},
		];
	}
}

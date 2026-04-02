import { App, PluginSettingTab, Setting, ButtonComponent, TextComponent } from 'obsidian';
import CustomReplacePlugin from './main';

/**
 * Settings tab for configuring Custom Replace actions and rules.
 */
export class CustomReplaceSettingTab extends PluginSettingTab {
	/** Plugin instance reference. */
	plugin: CustomReplacePlugin;

	/** Set of action IDs currently expanded in the UI. */
	expandedActions: Set<string> = new Set();

	/**
	 * @param app - Obsidian App instance.
	 * @param plugin - Plugin instance.
	 */
	constructor(app: App, plugin: CustomReplacePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Renders the settings view.
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Custom replace actions')
			.setDesc('Manage preset find-and-replace actions.')
			.addButton((button: ButtonComponent) => {
				button
					.setButtonText('Add new action')
					.setCta()
					.onClick(async () => {
						const newId = `replace-action-${Date.now()}`;
						this.plugin.settings.actions.push({
							id: newId,
							name: 'New action',
							showInContextMenu: true,
							rules: [
								{
									search: '',
									replace: '',
									useRegex: false,
									regexFlags: 'g',
								},
							],
						});
						this.expandedActions.add(newId);
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.actions.forEach((action, actionIndex) => {
			const isExpanded = this.expandedActions.has(action.id);

			const actionContainer = containerEl.createDiv({
				cls: 'custom-replace-action-block',
				attr: {
					style: 'border: 1px solid var(--background-modifier-border); padding: 10px; margin-top: 15px; border-radius: 5px;',
				},
			});

			const headerContainer = actionContainer.createDiv();

			const rulesContainer = actionContainer.createDiv({
				attr: {
					style: `display: ${isExpanded ? 'block' : 'none'}; padding-top: 15px; margin-top: 10px; border-top: 1px solid var(--background-modifier-border-hover);`,
				},
			});

			const headerSetting = new Setting(headerContainer)
				.setName('Action name')
				.addText((text: TextComponent) => {
					text.setPlaceholder('Example: remove extra spaces')
						.setValue(action.name)
						.onChange(async (value) => {
							action.name = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.setCssProps({ width: '100%' });
				})
				.addToggle((toggle) => {
					toggle
						.setTooltip('Show in right-click context menu')
						.setValue(action.showInContextMenu)
						.onChange(async (value) => {
							action.showInContextMenu = value;
							await this.plugin.saveSettings();
						});
				})
				.addButton((button: ButtonComponent) => {
					button
						.setIcon('trash')
						.setWarning()
						.setTooltip('Delete action')
						.onClick(async () => {
							this.plugin.settings.actions.splice(actionIndex, 1);
							this.expandedActions.delete(action.id);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addButton((button: ButtonComponent) => {
					button
						.setIcon(isExpanded ? 'chevron-down' : 'chevron-right')
						.setTooltip(isExpanded ? 'Collapse rules' : 'Expand rules')
						.onClick(() => {
							if (this.expandedActions.has(action.id)) {
								this.expandedActions.delete(action.id);
								rulesContainer.hide();
								button.setIcon('chevron-right').setTooltip('Expand rules');
							} else {
								this.expandedActions.add(action.id);
								rulesContainer.show();
								button.setIcon('chevron-down').setTooltip('Collapse rules');
							}
						});
					button.buttonEl.setCssProps({ boxShadow: 'none', background: 'transparent' });
				});

			headerSetting.controlEl.setCssProps({
				flexGrow: '1',
				justifyContent: 'flex-start',
			});
			headerSetting.infoEl.setCssProps({
				flex: 'none',
				marginRight: '15px',
			});
			const textWrapper =
				headerSetting.controlEl.querySelector('.search-input-container')
				|| headerSetting.controlEl.firstElementChild;
			if (textWrapper) {
				(textWrapper as HTMLElement).setCssProps({
					flexGrow: '1',
					marginRight: '15px',
				});
			}

			action.rules.forEach((rule, ruleIndex) => {
				const ruleRow = rulesContainer.createDiv({
					attr: {
						style: 'display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; background-color: var(--background-secondary-alt); padding: 10px; border-radius: 4px;',
					},
				});

				const searchContainer = ruleRow.createDiv({
					attr: {
						style: 'display: flex; flex-direction: column; flex: 1; min-width: 150px;',
					},
				});
				searchContainer.createEl('label', {
					text: 'Search',
					attr: {
						style: 'font-size: 0.8em; font-weight: bold; margin-bottom: 4px;',
					},
				});
				new TextComponent(searchContainer)
					.setPlaceholder('Search for...')
					.setValue(rule.search)
					.onChange(async (value) => {
						rule.search = value;
						await this.plugin.saveSettings();
					});

				const replaceContainer = ruleRow.createDiv({
					attr: {
						style: 'display: flex; flex-direction: column; flex: 1; min-width: 150px;',
					},
				});
				replaceContainer.createEl('label', {
					text: 'Replace',
					attr: {
						style: 'font-size: 0.8em; font-weight: bold; margin-bottom: 4px;',
					},
				});
				new TextComponent(replaceContainer)
					.setPlaceholder('Replace with...')
					.setValue(rule.replace)
					.onChange(async (value) => {
						rule.replace = value;
						await this.plugin.saveSettings();
					});

				const regexToggleContainer = ruleRow.createDiv({
					attr: {
						style: 'display: flex; flex-direction: column; align-items: center;',
					},
				});
				regexToggleContainer.createEl('label', {
					text: 'Regex',
					attr: {
						style: 'font-size: 0.8em; font-weight: bold; margin-bottom: 4px;',
					},
				});
				const regexToggle = new Setting(regexToggleContainer).addToggle((toggle) => {
					toggle
						.setTooltip('Use regex')
						.setValue(rule.useRegex)
						.onChange(async (value) => {
							rule.useRegex = value;
							if (value) flagsContainer.show();
							else flagsContainer.hide();
							await this.plugin.saveSettings();
						});
				});
				regexToggle.settingEl.setCssProps({
					border: 'none',
					padding: '0',
					background: 'none',
				});
				regexToggle.infoEl.setCssProps({ display: 'none' });

				const flagsContainer = ruleRow.createDiv({
					attr: {
						style: `display: ${rule.useRegex ? 'flex' : 'none'}; flex-direction: column; width: 80px;`,
					},
				});
				flagsContainer.createEl('label', {
					text: 'Flags',
					attr: {
						style: 'font-size: 0.8em; font-weight: bold; margin-bottom: 4px;',
					},
				});
				new TextComponent(flagsContainer)
					.setPlaceholder('Flags')
					.setValue(rule.regexFlags || 'g')
					.onChange(async (value) => {
						rule.regexFlags = value;
						await this.plugin.saveSettings();
					});

				const removeBtnContainer = ruleRow.createDiv({
					attr: {
						style: 'display: flex; align-items: center; padding-top: 18px;',
					},
				});
				new ButtonComponent(removeBtnContainer)
					.setIcon('cross')
					.setTooltip('Remove rule')
					.onClick(async () => {
						action.rules.splice(ruleIndex, 1);
						await this.plugin.saveSettings();
						this.display();
					});
			});

			const addRuleSetting = new Setting(rulesContainer).addButton((button) => {
				button
					.setIcon('plus')
					.setButtonText('Add rule')
					.onClick(async () => {
						action.rules.push({
							search: '',
							replace: '',
							useRegex: false,
							regexFlags: 'g',
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});
			addRuleSetting.settingEl.setCssProps({ border: 'none', background: 'none' });
		});
	}
}

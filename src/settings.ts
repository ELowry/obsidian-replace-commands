import { App, PluginSettingTab, Setting, ButtonComponent, TextComponent } from 'obsidian';
import CustomReplacePlugin from './main';

/**
 * Settings tab UI for configuring search/replace actions.
 */
export class CustomReplaceSettingTab extends PluginSettingTab {
	/** Reference to the plugin instance. */
	plugin: CustomReplacePlugin;

	/**
	 * @param app - The Obsidian App instance.
	 * @param plugin - A reference to the CustomReplacePlugin.
	 */
	constructor(app: App, plugin: CustomReplacePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Renders the settings UI.
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Custom replace actions')
			.setDesc('Create and manage your preset find-and-replace actions.')
			.addButton((button: ButtonComponent) => {
				button
					.setButtonText('Add new action')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.actions.push({
							id: `replace-action-${Date.now()}`,
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
						await this.plugin.saveSettings();
						this.display(); // Force a re-render to show the new action
					});
			});

		// Render each action
		this.plugin.settings.actions.forEach((action, actionIndex) => {
			const actionContainer = containerEl.createDiv({
				cls: 'custom-replace-action-block',
				attr: {
					style: 'border: 1px solid var(--background-modifier-border); padding: 10px; margin-top: 15px; border-radius: 5px;',
				},
			});

			// Action Header and Name
			new Setting(actionContainer)
				.setName('Action name')
				.addText((text: TextComponent) => {
					text.setPlaceholder('Example: remove extra spaces')
						.setValue(action.name)
						.onChange(async (value) => {
							action.name = value;
							await this.plugin.saveSettings();
						});
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
							await this.plugin.saveSettings();
							this.display();
						});
				});

			// --- Rules Loop ---
			action.rules.forEach((rule, ruleIndex) => {
				const ruleRow = actionContainer.createDiv({
					attr: {
						style: 'display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; background-color: var(--background-secondary-alt); padding: 10px; border-radius: 4px;',
					},
				});

				// Search Field
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

				// Replace Field
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

				// Regex Target Toggle
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
							// Show/hide flags field
							flagsContainer.setCssProps({ display: value ? 'flex' : 'none' });
							await this.plugin.saveSettings();
						});
				});
				// Remove the extra margin/padding that 'Setting' adds by default
				regexToggle.settingEl.setCssProps({
					border: 'none',
					padding: '0',
					background: 'none',
				});
				regexToggle.infoEl.setCssProps({ display: 'none' });

				// Flags Field (Conditional)
				const flagsContainer = ruleRow.createDiv({
					attr: {
						style: `display: ${
							rule.useRegex ? 'flex' : 'none'
						}; flex-direction: column; width: 80px;`,
					},
				});
				flagsContainer.createEl('label', {
					text: 'Flags',
					attr: {
						style: 'font-size: 0.8em; font-weight: bold; margin-bottom: 4px;',
					},
				});
				new TextComponent(flagsContainer)
					.setPlaceholder('Example: g, i, m')
					.setValue(rule.regexFlags || 'g')
					.onChange(async (value) => {
						rule.regexFlags = value;
						await this.plugin.saveSettings();
					});

				// Remove Button
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

			// Add Rule Button
			const addRuleSetting = new Setting(actionContainer).addButton((button) => {
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
			// Clean up the background of the Add Rule section
			addRuleSetting.settingEl.setCssProps({ border: 'none', background: 'none' });
		});
	}
}

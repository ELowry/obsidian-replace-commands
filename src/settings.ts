/* global activeDocument, activeWindow */

import {
	App,
	PluginSettingTab,
	Setting,
	ButtonComponent,
	TextComponent,
	TextAreaComponent,
} from 'obsidian';
import CustomReplacePlugin from './main';
import { processText } from './processor';
import { ReplaceRule, ReplaceAction } from './types';
import { t } from './locales/i18n';

/**
 * Settings tab for configuring Custom Replace actions and rules.
 */
export class CustomReplaceSettingTab extends PluginSettingTab {
	/** Plugin instance reference. */
	plugin: CustomReplacePlugin;

	/** Set of action IDs currently expanded in the UI. */
	private expandedActions: Set<string> = new Set();

	/** Targets of the last actions that were moved (visual feedback). */
	private recentlyMovedActions: { id: string; dir: 'up' | 'down' }[] = [];

	/** Targets of the last rules that were moved (visual feedback). */
	private recentlyMovedRules: { actionId: string; index: number; dir: 'up' | 'down' }[] = [];

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

		// Capture the closest scrolling container and its position to prevent bad UX jumps
		// when the settings view is completely emptied and rebuilt.
		let scrollEl: HTMLElement | null = containerEl;
		let scrollTop = 0;
		while (scrollEl && scrollEl !== activeDocument.body) {
			if (scrollEl.scrollTop > 0) {
				scrollTop = scrollEl.scrollTop;
				break;
			}
			scrollEl = scrollEl.parentElement as HTMLElement;
		}

		containerEl.empty();

		new Setting(containerEl)
			.setName(t('SETTINGS_TITLE'))
			.setDesc(t('SETTINGS_DESCRIPTION'))
			.addButton((button: ButtonComponent) => {
				button
					.setButtonText(t('BUTTON_ADD_ACTION'))
					.setCta()
					.onClick(async () => {
						const newId = `replace-action-${Date.now()}`;
						this.plugin.settings.actions.push({
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
						});
						this.expandedActions.add(newId);
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.actions.forEach((action, index) => {
			this.renderAction(containerEl, action, index);
		});

		// Restore scroll position after DOM is rebuilt.
		// We use multiple attempts to account for the asynchronous nature of
		// TextArea resizing which might affect the total height of the container.
		if (scrollEl && scrollTop > 0) {
			const targetScrollEl = scrollEl; // Capture for timeout closure
			targetScrollEl.scrollTop = scrollTop;

			activeWindow.setTimeout(() => {
				targetScrollEl.scrollTop = scrollTop;
			}, 10);
			activeWindow.setTimeout(() => {
				targetScrollEl.scrollTop = scrollTop;
			}, 50);
		}
	}

	/**
	 * Renders a single action block.
	 *
	 * @param containerEl - Parent container.
	 * @param action - Action configuration.
	 * @param index - Action index.
	 */
	private renderAction(containerEl: HTMLElement, action: ReplaceAction, index: number): void {
		const isExpanded = this.expandedActions.has(action.id);

		const actionContainer = containerEl.createDiv({
			cls: 'custom-replace-action-block',
		});
		const recentlyMoved = this.recentlyMovedActions.find((m) => m.id === action.id);
		if (recentlyMoved) {
			actionContainer.addClass(`custom-replace-moved-${recentlyMoved.dir}`);
		}

		const headerContainer = actionContainer.createDiv();
		const rulesContainer = actionContainer.createDiv({
			cls: 'custom-replace-rules-container',
		});

		if (!isExpanded) {
			rulesContainer.hide();
		}

		new Setting(headerContainer)
			.setName(t('ACTION_NAME_LABEL'))
			.setClass('custom-replace-action-header')
			.addText((text: TextComponent) => {
				text.setPlaceholder(t('ACTION_NAME_PLACEHOLDER'))
					.setValue(action.name)
					.onChange(async (value) => {
						action.name = value;
						await this.plugin.saveSettings();
					});
			})
			.addToggle((toggle) => {
				toggle
					.setTooltip(t('ACTION_CONTEXT_MENU_TOOLTIP'))
					.setValue(action.showInContextMenu)
					.onChange(async (value) => {
						action.showInContextMenu = value;
						await this.plugin.saveSettings();
					});
			})
			.addButton((button: ButtonComponent) => {
				button
					.setIcon('arrow-up')
					.setTooltip(t('BUTTON_MOVE_ACTION_UP'))
					.setDisabled(index === 0)
					.onClick(async () => {
						const actions = this.plugin.settings.actions;
						const current = actions[index];
						const previous = actions[index - 1];
						if (current && previous) {
							actions[index - 1] = current;
							actions[index] = previous;
							this.recentlyMovedActions = [
								{ id: current.id, dir: 'up' },
								{ id: previous.id, dir: 'down' },
							];
							this.recentlyMovedRules = [];
							await this.plugin.saveSettings();
							this.display();
							this.recentlyMovedActions = [];
						}
					});
			})
			.addButton((button: ButtonComponent) => {
				button
					.setIcon('arrow-down')
					.setTooltip(t('BUTTON_MOVE_ACTION_DOWN'))
					.setDisabled(index === this.plugin.settings.actions.length - 1)
					.onClick(async () => {
						const actions = this.plugin.settings.actions;
						const current = actions[index];
						const next = actions[index + 1];
						if (current && next) {
							actions[index + 1] = current;
							actions[index] = next;
							this.recentlyMovedActions = [
								{ id: current.id, dir: 'down' },
								{ id: next.id, dir: 'up' },
							];
							this.recentlyMovedRules = [];
							await this.plugin.saveSettings();
							this.display();
							this.recentlyMovedActions = [];
						}
					});
			})
			.addButton((button: ButtonComponent) => {
				button
					.setIcon('trash')
					.setWarning()
					.setTooltip(t('BUTTON_DELETE_ACTION'))
					.onClick(async () => {
						this.plugin.settings.actions.splice(index, 1);
						this.expandedActions.delete(action.id);
						await this.plugin.saveSettings();
						this.display();
					});
			})
			.addButton((button: ButtonComponent) => {
				button
					.setIcon(isExpanded ? 'chevron-down' : 'chevron-right')
					.setTooltip(isExpanded ? t('BUTTON_COLLAPSE_RULES') : t('BUTTON_EXPAND_RULES'))
					.onClick(() => {
						if (this.expandedActions.has(action.id)) {
							this.expandedActions.delete(action.id);
							rulesContainer.hide();
							button.setIcon('chevron-right').setTooltip(t('BUTTON_EXPAND_RULES'));
						} else {
							this.expandedActions.add(action.id);
							rulesContainer.show();
							button.setIcon('chevron-down').setTooltip(t('BUTTON_COLLAPSE_RULES'));
						}
					});
				button.buttonEl.addClass('custom-replace-collapse-btn');
			});

		this.renderTestBench(rulesContainer, action);
	}

	/**
	 * Renders the live preview test bench for an action.
	 *
	 * @param rulesContainer - Container for rules and test input.
	 * @param action - Action associated with the test bench.
	 */
	private renderTestBench(rulesContainer: HTMLElement, action: ReplaceAction): void {
		const outputContainers: HTMLElement[] = [];
		const outputBoxes: { component: TextAreaComponent; errorEl: HTMLElement }[] = [];

		/**
		 * Updates previews based on test input.
		 * Applies each rule sequentially to simulate the replacement pipeline.
		 */
		const updatePreviews = () => {
			let currentText = action.testText || '';
			let pipelineBroken = false;

			action.rules.forEach((rule, i) => {
				const box = outputBoxes[i];
				if (!box) return;

				if (pipelineBroken) {
					box.component.setValue('');
					box.errorEl.setText(t('ERROR_PREVIOUS_STEP_FAILED'));
					box.errorEl.show();
					this.autoResize(box.component.inputEl);
					return;
				}

				try {
					currentText = processText(currentText, [rule]).text;
					box.component.setValue(currentText);
					box.errorEl.hide();
					this.autoResize(box.component.inputEl);
				} catch (e) {
					pipelineBroken = true;
					box.component.setValue('');
					box.errorEl.empty();
					const message = e instanceof Error ? e.message : t('ERROR_INVALID_REGEX');
					if (message.includes(': ')) {
						const splitIdx = message.indexOf(': ') + 2;
						const label = message.substring(0, splitIdx);
						const pattern = message.substring(splitIdx);
						box.errorEl.createSpan({ text: label });
						box.errorEl.createEl('code', { text: pattern });
					} else {
						box.errorEl.setText(message);
					}
					box.errorEl.show();
					this.autoResize(box.component.inputEl);
				}
			});
		};

		new Setting(rulesContainer)
			.setName(t('TEST_BENCH_LABEL'))
			.setClass('custom-replace-test-toggle')
			.addToggle((toggle) => {
				toggle.setValue(action.showTestBench ?? true).onChange(async (value) => {
					action.showTestBench = value;
					if (value) {
						testInputContainer.show();
						outputContainers.forEach((c) => c.show());
						activeWindow.setTimeout(() => {
							this.autoResize(testInput.inputEl);
							outputBoxes.forEach((box) => this.autoResize(box.component.inputEl));
						}, 10);
					} else {
						testInputContainer.hide();
						outputContainers.forEach((c) => c.hide());
					}
					await this.plugin.saveSettings();
				});
			});

		const testInputContainer = rulesContainer.createDiv({
			cls: 'custom-replace-test-input-container',
		});
		if (!(action.showTestBench ?? true)) {
			testInputContainer.hide();
		}

		testInputContainer.createEl('label', {
			cls: 'custom-replace-label',
			text: t('TEST_INPUT_LABEL'),
		});

		const testInput = new TextAreaComponent(testInputContainer)
			.setPlaceholder(t('TEST_INPUT_PLACEHOLDER'))
			.setValue(action.testText || '');

		testInput.inputEl.addClass('custom-replace-textarea');
		testInput.inputEl.addClass('custom-replace-test-input-textarea');
		testInput.inputEl.addEventListener('input', () => this.autoResize(testInput.inputEl));

		testInput.onChange(async (value: string) => {
			action.testText = value;
			updatePreviews();
			await this.plugin.saveSettings();
		});

		action.rules.forEach((rule, index) => {
			this.renderRule(
				rulesContainer,
				rule,
				index,
				action,
				updatePreviews,
				outputBoxes,
				outputContainers,
			);
		});

		this.autoResize(testInput.inputEl);
		updatePreviews();

		const addRuleContainer = rulesContainer.createDiv({
			cls: 'custom-replace-add-rule-btn-row',
		});

		new ButtonComponent(addRuleContainer)
			.setIcon('plus')
			.setButtonText(t('BUTTON_ADD_RULE'))
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
	}

	/**
	 * Renders a single rule row with its corresponding preview box.
	 *
	 * @param rulesContainer - Container for the rules.
	 * @param rule - Rule configuration.
	 * @param index - Index in action rules.
	 * @param action - Parent action.
	 * @param updatePreviews - Callback for updating the pipeline.
	 * @param outputBoxes - Array of rule output components.
	 * @param outputContainers - Array of rule output containers.
	 */
	private renderRule(
		rulesContainer: HTMLElement,
		rule: ReplaceRule,
		index: number,
		action: ReplaceAction,
		updatePreviews: () => void,
		outputBoxes: { component: TextAreaComponent; errorEl: HTMLElement }[],
		outputContainers: HTMLElement[],
	): void {
		const ruleRow = rulesContainer.createDiv({
			cls: 'custom-replace-rule-row',
		});
		const recentlyMoved = this.recentlyMovedRules.find(
			(m) => m.actionId === action.id && m.index === index,
		);
		if (recentlyMoved) {
			ruleRow.addClass(`custom-replace-moved-${recentlyMoved.dir}`);
		}

		const inputsRow = ruleRow.createDiv({
			cls: 'custom-replace-rule-inputs',
		});

		// Search
		const searchContainer = inputsRow.createDiv({
			cls: 'custom-replace-input-column',
		});
		searchContainer.createEl('label', {
			cls: 'custom-replace-column-label',
			text: t('RULE_SEARCH_LABEL'),
		});
		new TextComponent(searchContainer)
			.setPlaceholder(t('RULE_SEARCH_PLACEHOLDER'))
			.setValue(rule.search)
			.onChange(async (value) => {
				rule.search = value;
				updatePreviews();
				await this.plugin.saveSettings();
			});

		// Replace
		const replaceContainer = inputsRow.createDiv({
			cls: 'custom-replace-input-column',
		});
		replaceContainer.createEl('label', {
			cls: 'custom-replace-column-label',
			text: t('RULE_REPLACE_LABEL'),
		});
		new TextComponent(replaceContainer)
			.setPlaceholder(t('RULE_REPLACE_PLACEHOLDER'))
			.setValue(rule.replace)
			.onChange(async (value) => {
				rule.replace = value;
				updatePreviews();
				await this.plugin.saveSettings();
			});

		// Regex toggle
		const regexToggleContainer = inputsRow.createDiv({
			cls: 'custom-replace-regex-col',
		});
		regexToggleContainer.createEl('label', {
			cls: 'custom-replace-column-label',
			text: t('RULE_REGEX_LABEL'),
		});

		const flagsContainer = inputsRow.createDiv({
			cls: 'custom-replace-flags-col',
		});
		if (!rule.useRegex) {
			flagsContainer.hide();
		}

		const regexToggle = new Setting(regexToggleContainer).addToggle((toggle) => {
			toggle.setValue(rule.useRegex).onChange(async (value) => {
				rule.useRegex = value;
				if (value) flagsContainer.show();
				else flagsContainer.hide();
				updatePreviews();
				await this.plugin.saveSettings();
			});
		});
		regexToggle.setClass('custom-replace-toggle-inner');
		regexToggle.infoEl.hide();

		// Flags
		flagsContainer.createEl('label', {
			cls: 'custom-replace-column-label',
			text: t('RULE_FLAGS_LABEL'),
		});
		const flagsText = new TextComponent(flagsContainer)
			.setPlaceholder('G, i')
			.setValue(rule.regexFlags || 'g')
			.onChange(async (value) => {
				rule.regexFlags = value;
				updatePreviews();
				await this.plugin.saveSettings();
			});
		const uniqueAnchorId = `--flags-anchor-${action.id}-${index}`;
		flagsText.inputEl.addClass('custom-replace-flags-input');
		flagsText.inputEl.setAttr('pattern', '^[gimsuyvdGIMSUYVD\\s,]*$');
		flagsText.inputEl.style.setProperty('anchor-name', uniqueAnchorId);

		const errorMsg = flagsContainer.createDiv({
			cls: 'custom-replace-flags-error-msg',
		});
		errorMsg.createSpan({ text: t('RULE_FLAGS_INFO') });
		errorMsg.createEl('code', {
			text: 'G, i, m, s, u, y, d, v',
			cls: 'custom-replace-flags-list',
		});
		errorMsg.style.setProperty('position-anchor', uniqueAnchorId);

		// Reorder & Remove buttons
		const ruleActionsContainer = inputsRow.createDiv({
			cls: 'custom-replace-remove-col',
		});

		// Move up
		new ButtonComponent(ruleActionsContainer)
			.setIcon('arrow-up')
			.setTooltip(t('BUTTON_MOVE_RULE_UP'))
			.setDisabled(index === 0)
			.onClick(async () => {
				const rules = action.rules;
				const current = rules[index];
				const previous = rules[index - 1];

				if (current && previous) {
					rules[index - 1] = current;
					rules[index] = previous;
					this.recentlyMovedRules = [
						{ actionId: action.id, index: index - 1, dir: 'up' },
						{ actionId: action.id, index: index, dir: 'down' },
					];
					this.recentlyMovedActions = [];
					await this.plugin.saveSettings();
					this.display();
					this.recentlyMovedRules = [];
				}
			});

		// Move down
		new ButtonComponent(ruleActionsContainer)
			.setIcon('arrow-down')
			.setTooltip(t('BUTTON_MOVE_RULE_DOWN'))
			.setDisabled(index === action.rules.length - 1)
			.onClick(async () => {
				const rules = action.rules;
				const current = rules[index];
				const next = rules[index + 1];

				if (current && next) {
					rules[index + 1] = current;
					rules[index] = next;
					this.recentlyMovedRules = [
						{ actionId: action.id, index: index + 1, dir: 'down' },
						{ actionId: action.id, index: index, dir: 'up' },
					];
					this.recentlyMovedActions = [];
					await this.plugin.saveSettings();
					this.display();
					this.recentlyMovedRules = [];
				}
			});

		// Remove button
		new ButtonComponent(ruleActionsContainer)
			.setIcon('trash')
			.setTooltip(t('BUTTON_REMOVE_RULE'))
			.onClick(async () => {
				action.rules.splice(index, 1);
				await this.plugin.saveSettings();
				this.display();
			});

		// Step output
		const outputContainer = ruleRow.createDiv({
			cls: 'custom-replace-output-col',
		});
		if (!(action.showTestBench ?? true)) {
			outputContainer.hide();
		}
		outputContainers.push(outputContainer);

		const isLastRule = index === action.rules.length - 1;
		const outputLabel = outputContainer.createEl('label', {
			cls: 'custom-replace-step-label',
			text: isLastRule ? t('FINAL_OUTPUT_LABEL') : t('STEP_OUTPUT_LABEL'),
		});
		if (isLastRule) {
			outputLabel.addClass('custom-replace-final-label');
		}

		const errorEl = outputContainer.createDiv({
			cls: 'custom-replace-error',
		});
		errorEl.hide();

		const outputBox = new TextAreaComponent(outputContainer);
		outputBox.inputEl.addClass('custom-replace-textarea');
		outputBox.inputEl.addClass('custom-replace-output-textarea');
		outputBox.setDisabled(true);

		outputBoxes.push({ component: outputBox, errorEl });
	}

	/**
	 * Helper to automatically resize text areas to fit their content.
	 *
	 * @param el - HTML Element to resize.
	 */
	private autoResize(el: HTMLTextAreaElement | HTMLElement): void {
		if (el.style.display === 'none' || el.offsetParent === null) return;
		activeWindow.setTimeout(() => {
			el.setCssProps({ height: 'auto' });
			el.setCssProps({ height: `${el.scrollHeight}px` });
		}, 0);
	}
}

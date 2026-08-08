import { Modal, App, Setting, ButtonComponent, TextComponent, TextAreaComponent } from 'obsidian';
import CustomReplacePlugin from '../main';
import { processText } from '../processor';
import { ReplaceRule, ReplaceAction } from '../types';
import { t } from '../locales/i18n';
import { ConfirmModal } from './confirm-modal';

/**
 * Modal interface for editing a specific Custom Replace action.
 */
export class ActionDetailModal extends Modal {
	/** The main plugin instance. */
	private plugin: CustomReplacePlugin;
	/** The specific replacement action being edited. */
	private action: ReplaceAction;
	/** Tracks rules that were just reordered to trigger CSS animations. */
	private recentlyMovedRules: { actionId: string; index: number; dir: 'up' | 'down' }[] = [];
	/** Refreshes the parent list view when the modal closes. */
	private onUpdate: () => void;
	/** Debounces live preview text processing. */
	private debounceTimer: number | null = null;

	/**
	 * Creates a new ActionDetailModal.
	 *
	 * @param app - The Obsidian App instance.
	 * @param plugin - The CustomReplacePlugin instance.
	 * @param action - The ReplaceAction object to be edited.
	 * @param onUpdate - Callback executed when the modal closes to refresh the parent list view.
	 */
	constructor(
		app: App,
		plugin: CustomReplacePlugin,
		action: ReplaceAction,
		onUpdate: () => void,
	) {
		super(app);
		this.plugin = plugin;
		this.action = action;
		this.onUpdate = onUpdate;

		this.modalEl.addClass('custom-replace-wide-modal');
	}

	/**
	 * Called when the modal is opened. Triggers UI rendering.
	 */
	onOpen() {
		this.renderUI();
	}

	/**
	 * Called when the modal is closed.
	 * Cleans up and refreshes the parent list view.
	 */
	onClose() {
		this.contentEl.empty();
		if (this.debounceTimer) {
			window.clearTimeout(this.debounceTimer);
		}
		this.onUpdate();
	}

	/**
	 * Renders the primary user interface inside the modal, including the configuration grid and the test bench.
	 */
	renderUI(): void {
		const { contentEl } = this;
		contentEl.empty();

		this.titleEl.setText(this.action.name);

		/* General action configuration */
		new Setting(contentEl).setName(t('ACTION_CONFIGURATION_TITLE')).setHeading();

		const configGrid = contentEl.createDiv({ cls: 'custom-replace-config-grid' });

		const nameCol = configGrid.createDiv({
			cls: 'custom-replace-config-col',
		});
		const nameSetting = new Setting(nameCol)
			.setName(t('ACTION_NAME_LABEL'))
			.setClass('custom-replace-name-setting');

		const nameErrorEl = nameCol.createDiv({
			cls: 'custom-replace-error custom-replace-name-error-msg',
		});
		nameErrorEl.hide();

		nameSetting.addText((text: TextComponent) => {
			text.setPlaceholder(t('ACTION_NAME_PLACEHOLDER'))
				.setValue(this.action.name)
				.onChange(async (value) => {
					const trimmed = value.trim();

					if (!trimmed) {
						text.inputEl.addClass('custom-replace-input-error');
						nameErrorEl.setText(t('ERROR_NAME_EMPTY'));
						nameErrorEl.show();
						return;
					}

					const isDuplicate = this.plugin.settings.actions.some(
						(a) =>
							a.id !== this.action.id
							&& a.name.toLowerCase() === trimmed.toLowerCase(),
					);

					if (isDuplicate) {
						text.inputEl.addClass('custom-replace-input-error');
						nameErrorEl.setText(t('ERROR_NAME_DUPLICATE'));
						nameErrorEl.show();
						return;
					}

					text.inputEl.removeClass('custom-replace-input-error');
					nameErrorEl.hide();

					this.action.name = trimmed;
					this.titleEl.setText(trimmed);
					await this.plugin.saveSettings();
				});

			window.setTimeout(() => {
				text.inputEl.focus();
				text.inputEl.select();
			}, 50);
		});

		const toggleCol = configGrid.createDiv({
			cls: 'custom-replace-config-col',
		});
		new Setting(toggleCol).setName(t('ACTION_CONTEXT_MENU_TOOLTIP')).addToggle((toggle) => {
			toggle.setValue(this.action.showInContextMenu).onChange(async (value) => {
				this.action.showInContextMenu = value;
				await this.plugin.saveSettings();
			});
		});

		/* Rules and test bench container */
		const rulesContainer = contentEl.createDiv({
			cls: 'custom-replace-rules-container',
		});

		this.renderTestBench(rulesContainer, this.action);
	}

	/**
	 * Renders the interactive test bench, input fields, and sequential rule editors.
	 *
	 * @param rulesContainer - The parent HTML element to append the test bench to.
	 * @param action - The ReplaceAction containing the rules and test text.
	 */
	private renderTestBench(rulesContainer: HTMLElement, action: ReplaceAction): void {
		const outputContainers: HTMLElement[] = [];
		const outputBoxes: { component: TextAreaComponent; errorEl: HTMLElement }[] = [];

		/** Evaluates the text pipeline and updates the live preview boxes. */
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
			.setDesc(t('TEST_BENCH_DESC'))
			.setClass('custom-replace-test-toggle')
			.addToggle((toggle) => {
				toggle.setValue(action.showTestBench ?? true).onChange(async (value) => {
					action.showTestBench = value;
					if (value) {
						testInputContainer.show();
						outputContainers.forEach((c) => c.show());
						window.setTimeout(() => {
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

		new Setting(rulesContainer).setName(t('TEST_BENCH_TITLE')).setHeading();

		const testInputId = `test-input-${action.id}`;
		testInputContainer.createEl('label', {
			cls: 'custom-replace-label',
			text: t('TEST_INPUT_LABEL'),
			attr: { for: testInputId },
		});

		const testInput = new TextAreaComponent(testInputContainer)
			.setPlaceholder(t('TEST_INPUT_PLACEHOLDER'))
			.setValue(action.testText || '');

		testInput.inputEl.id = testInputId;
		testInput.inputEl.addClass('custom-replace-textarea');
		testInput.inputEl.addClass('custom-replace-test-input-textarea');

		testInput.inputEl.addEventListener('input', () => this.autoResize(testInput.inputEl));

		testInput.onChange(async (value: string) => {
			action.testText = value;
			await this.plugin.saveSettings();

			if (this.debounceTimer) {
				window.clearTimeout(this.debounceTimer);
			}
			this.debounceTimer = window.setTimeout(() => {
				updatePreviews();
			}, 300);
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
			.setCta()
			.onClick(async () => {
				action.rules.push({
					search: '',
					replace: '',
					useRegex: false,
					regexFlags: 'g',
				});
				await this.plugin.saveSettings();
				this.renderUI();
			});
	}

	/**
	 * Renders an individual rule's editor section.
	 *
	 * @param rulesContainer - The parent HTML element.
	 * @param rule - The ReplaceRule data object.
	 * @param index - The index of the rule in the pipeline.
	 * @param action - The ReplaceAction containing the rule.
	 * @param updatePreviews - Callback to trigger test bench evaluation.
	 * @param outputBoxes - Array to store references to the output TextAreaComponents.
	 * @param outputContainers - Array to store references to the parent containers of the output boxes.
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

		const ruleHeader = ruleRow.createDiv({ cls: 'custom-replace-rule-header' });
		ruleHeader.createSpan({
			cls: 'custom-replace-rule-badge',
			text: `Rule ${index + 1}`,
		});

		const ruleActionsContainer = ruleHeader.createDiv({
			cls: 'custom-replace-rule-actions',
		});

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
					await this.plugin.saveSettings();
					this.renderUI();
					this.recentlyMovedRules = [];
				}
			});

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
					await this.plugin.saveSettings();
					this.renderUI();
					this.recentlyMovedRules = [];
				}
			});

		new ButtonComponent(ruleActionsContainer)
			.setIcon('trash')
			.setTooltip(t('BUTTON_REMOVE_RULE'))
			.onClick(() => {
				new ConfirmModal(
					this.plugin.app,
					t('CONFIRM_DELETE_RULE_TITLE'),
					t('CONFIRM_DELETE_RULE_DESC'),
					t('BUTTON_DELETE'),
					async () => {
						action.rules.splice(index, 1);
						await this.plugin.saveSettings();
						this.renderUI();
					},
				).open();
			});

		const inputsRow = ruleRow.createDiv({
			cls: 'custom-replace-rule-inputs',
		});

		/* Search */
		const searchContainer = inputsRow.createDiv({
			cls: 'custom-replace-input-column',
		});
		const searchId = `search-input-${action.id}-${index}`;
		searchContainer.createEl('label', {
			cls: 'custom-replace-column-label',
			text: t('RULE_SEARCH_LABEL'),
			attr: { for: searchId },
		});
		const searchText = new TextComponent(searchContainer)
			.setPlaceholder(t('RULE_SEARCH_PLACEHOLDER'))
			.setValue(rule.search)
			.onChange(async (value) => {
				rule.search = value;
				updatePreviews();
				await this.plugin.saveSettings();
			});
		searchText.inputEl.id = searchId;

		/* Replace */
		const replaceContainer = inputsRow.createDiv({
			cls: 'custom-replace-input-column',
		});
		const replaceId = `replace-input-${action.id}-${index}`;
		replaceContainer.createEl('label', {
			cls: 'custom-replace-column-label',
			text: t('RULE_REPLACE_LABEL'),
			attr: { for: replaceId },
		});
		const replaceText = new TextComponent(replaceContainer)
			.setPlaceholder(t('RULE_REPLACE_PLACEHOLDER'))
			.setValue(rule.replace)
			.onChange(async (value) => {
				rule.replace = value;
				updatePreviews();
				await this.plugin.saveSettings();
			});
		replaceText.inputEl.id = replaceId;

		/* Regex toggle */
		const regexToggleContainer = inputsRow.createDiv({
			cls: 'custom-replace-regex-col',
		});
		const regexLabelId = `regex-label-${action.id}-${index}`;
		regexToggleContainer.createEl('label', {
			cls: 'custom-replace-column-label',
			text: t('RULE_REGEX_LABEL'),
			attr: { id: regexLabelId },
		});

		const regexToggle = new Setting(regexToggleContainer).addToggle((toggle) => {
			toggle.toggleEl.setAttr('aria-labelledby', regexLabelId);
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

		/* Flags */
		const flagsContainer = inputsRow.createDiv({
			cls: 'custom-replace-flags-col',
		});
		if (!rule.useRegex) {
			flagsContainer.hide();
		}

		const flagsId = `flags-input-${action.id}-${index}`;
		flagsContainer.createEl('label', {
			cls: 'custom-replace-column-label',
			text: t('RULE_FLAGS_LABEL'),
			attr: { for: flagsId },
		});
		const flagsText = new TextComponent(flagsContainer)
			.setPlaceholder('G, i')
			.setValue(rule.regexFlags || 'g')
			.onChange(async (value) => {
				rule.regexFlags = value;
				updatePreviews();
				await this.plugin.saveSettings();
			});
		flagsText.inputEl.id = flagsId;

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

		/* Step output */
		const outputContainer = ruleRow.createDiv({
			cls: 'custom-replace-output-col',
		});
		if (!(action.showTestBench ?? true)) {
			outputContainer.hide();
		}
		outputContainers.push(outputContainer);

		const isLastRule = index === action.rules.length - 1;
		const outputLabelId = `output-label-${action.id}-${index}`;
		const outputLabel = outputContainer.createEl('label', {
			cls: 'custom-replace-step-label',
			text: isLastRule ? t('FINAL_OUTPUT_LABEL') : t('STEP_OUTPUT_LABEL'),
			attr: { id: outputLabelId },
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
		outputBox.inputEl.setAttr('aria-labelledby', outputLabelId);
		outputBox.setDisabled(true);

		outputBoxes.push({ component: outputBox, errorEl });
	}

	/**
	 * Adjusts the height of a textarea element to fit its content.
	 *
	 * @param el - The target textarea/HTML element to resize.
	 */
	private autoResize(el: HTMLTextAreaElement | HTMLElement): void {
		if (el.style.display === 'none' || el.offsetParent === null) return;

		window.setTimeout(() => {
			el.setCssProps({ height: 'auto' });
			el.setCssProps({ height: `${el.scrollHeight}px` });
		}, 0);
	}
}

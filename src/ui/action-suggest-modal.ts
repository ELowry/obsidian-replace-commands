import { App, Editor, SuggestModal } from 'obsidian';

import { applyReplaceAction } from '../engine';
import { CustomReplacePluginInstance, ReplaceAction } from '../types';

/**
 * A native modal allowing users to search and select a custom replace action.
 */
export class ActionSuggestModal extends SuggestModal<ReplaceAction> {
	constructor(
		app: App,
		private plugin: CustomReplacePluginInstance,
		private editor: Editor
	) {
		super(app);
	}

	getSuggestions(query: string): ReplaceAction[] {
		const lowerQuery = query.toLowerCase();
		return this.plugin.settings.actions.filter((action) =>
			action.name.toLowerCase().includes(lowerQuery)
		);
	}

	renderSuggestion(action: ReplaceAction, el: HTMLElement) {
		el.createDiv({ text: action.name });
		el.createEl('small', {
			text: `${action.rules.length} rule(s)`,
			cls: 'custom-replace-rule-badge',
		});
	}

	onChooseSuggestion(action: ReplaceAction, evt: MouseEvent | KeyboardEvent) {
		applyReplaceAction(this.editor, action);
	}
}

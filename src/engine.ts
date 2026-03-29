import { Editor, Notice } from 'obsidian';
import { ReplaceAction } from './types';
import { processText } from './processor';

/**
 * Core engine logic to apply a replace action to the current editor.
 */
export function applyReplaceAction(editor: Editor, action: ReplaceAction) {
	const selection = editor.getSelection();
	const hasSelection = selection.length > 0;
	const textToProcess = hasSelection ? selection : editor.getValue();

	let finalText: string;
	try {
		finalText = processText(textToProcess, action.rules);
	} catch (error) {
		console.error(error);
		new Notice(`Custom Replace: Invalid Regex in "${action.name}"`);
		return; // Abort transaction
	}

	if (hasSelection) {
		editor.replaceSelection(finalText);
	} else {
		editor.transaction({
			changes: [
				{
					from: { line: 0, ch: 0 },
					to: {
						line: editor.lastLine(),
						ch: editor.getLine(editor.lastLine()).length,
					},
					text: finalText,
				},
			],
		});
	}

	new Notice(`Applied "${action.name}"`);
}

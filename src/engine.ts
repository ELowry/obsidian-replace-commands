import { Editor, Notice, EditorPosition } from 'obsidian';
import { ReplaceAction } from './types';
import { processText } from './processor';

/**
 * Reorders selection bounds to ensure from <= to.
 *
 * @param anchor - Start of the selection drag.
 * @param head - End of the selection drag.
 * @returns Ordered bounds.
 */
function getOrderedBounds(
	anchor: EditorPosition,
	head: EditorPosition,
): { from: EditorPosition; to: EditorPosition } {
	if (anchor.line < head.line) return { from: anchor, to: head };
	if (anchor.line > head.line) return { from: head, to: anchor };
	return anchor.ch < head.ch ? { from: anchor, to: head } : { from: head, to: anchor };
}

/**
 * Applies search and replace rules to selection or document.
 *
 * @param editor - Editor instance.
 * @param action - Replace rules to apply.
 */
export function applyReplaceAction(editor: Editor, action: ReplaceAction) {
	const selections = editor.listSelections();

	const hasSelection = selections.some(
		(selection) =>
			selection.anchor.line !== selection.head.line
			|| selection.anchor.ch !== selection.head.ch,
	);

	try {
		if (hasSelection) {
			const changes = selections
				.map((selection) => {
					const { from, to } = getOrderedBounds(selection.anchor, selection.head);
					const text = editor.getRange(from, to);

					if (text.length > 0) {
						return {
							from,
							to,
							text: processText(text, action.rules),
						};
					}
					return null;
				})
				.filter((change): change is NonNullable<typeof change> => change !== null);

			if (changes.length > 0) {
				editor.transaction({ changes });
			}
		} else {
			const textToProcess = editor.getValue();
			const finalText = processText(textToProcess, action.rules);

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
	} catch (error) {
		console.error(error);
		new Notice(
			`Custom replace error: ${error instanceof Error ? error.message : 'Invalid regex'}`,
		);
	}
}

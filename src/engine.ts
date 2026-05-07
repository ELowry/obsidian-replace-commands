import { Editor, Notice, EditorPosition } from 'obsidian';
import { ReplaceAction } from './types';
import { processText } from './processor';
import { t } from './locales/i18n';

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

	let totalMatchCount = 0;

	try {
		if (hasSelection) {
			const changes = selections
				.map((selection) => {
					const { from, to } = getOrderedBounds(selection.anchor, selection.head);
					const text = editor.getRange(from, to);

					if (text.length > 0) {
						const processed = processText(text, action.rules);
						totalMatchCount += processed.matchCount;
						return {
							from,
							to,
							text: processed.text,
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
			const processed = processText(textToProcess, action.rules);
			const finalText = processed.text;
			totalMatchCount += processed.matchCount;

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

		new Notice(t('NOTICE__APPLIED_CHANGES')(action.name, totalMatchCount));
	} catch (error) {
		console.error(error);
		new Notice(
			t('NOTICE__ERROR')(error instanceof Error ? error.message : t('ERROR_INVALID_REGEX')),
		);
	}
}

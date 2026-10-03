import { App, Editor, EditorPosition, Notice, TAbstractFile, TFile, TFolder } from 'obsidian';

import { t } from './locales/i18n';
import { processText } from './processor';
import { ReplaceAction } from './types';
import { ConfirmModal } from './ui/confirm-modal';

/**
 * Reorders selection bounds to ensure from <= to.
 *
 * @param anchor - Start of the selection drag.
 * @param head - End of the selection drag.
 * @returns Ordered bounds.
 */
function getOrderedBounds(
	anchor: EditorPosition,
	head: EditorPosition
): { from: EditorPosition; to: EditorPosition } {
	if (anchor.line < head.line) {
		return { from: anchor, to: head };
	}

	if (anchor.line > head.line) {
		return { from: head, to: anchor };
	}

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
			|| selection.anchor.ch !== selection.head.ch
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

		const changesMsg =
			totalMatchCount === 1
				? t('NOTICE__APPLIED_CHANGES_SINGLE', action.name, totalMatchCount)
				: t('NOTICE__APPLIED_CHANGES_PLURAL', action.name, totalMatchCount);
		new Notice(changesMsg);
	} catch (error) {
		new Notice(t('NOTICE__ERROR', error instanceof Error ? error.message : String(error)));
		console.error(error);
	}
}

/**
 * Recursively extracts all markdown files from a mix of files and folders by checking if vault files start with the folder path.
 *
 * @param files - An array of abstract files representing the user's selection in the file explorer.
 * @returns An array of unique markdown files found within the selection.
 */
function getMarkdownFiles(files: TAbstractFile[]): TFile[] {
	const mdFiles = new Set<TFile>();

	for (const file of files) {
		if (file instanceof TFile && file.extension === 'md') {
			mdFiles.add(file);
		} else if (file instanceof TFolder) {
			const vaultFiles = file.vault.getMarkdownFiles();
			for (const vFile of vaultFiles) {
				if (vFile.path.startsWith(file.path + '/')) {
					mdFiles.add(vFile);
				}
			}
		}
	}
	return Array.from(mdFiles);
}

/**
 * Safely applies an action to multiple files on disk bypassing the editor. Uses app.vault.process to handle file-locking and prevent data corruption.
 *
 * @param app - The Obsidian App instance.
 * @param action - The ReplaceAction object containing the rules to apply.
 * @param selectedItems - An array of abstract files representing the user's selection in the file explorer.
 */
export async function applyReplaceActionToFiles(
	app: App,
	action: ReplaceAction,
	selectedItems: TAbstractFile[]
): Promise<void> {
	const mdFiles = getMarkdownFiles(selectedItems);

	if (mdFiles.length === 0) {
		new Notice(t('ERROR_NO_MARKDOWN_FILES'));
		return;
	}

	const warningDesc =
		mdFiles.length === 1
			? t('BULK_REPLACE_WARNING_DESC_SINGLE', mdFiles.length, action.name)
			: t('BULK_REPLACE_WARNING_DESC_PLURAL', mdFiles.length, action.name);

	new ConfirmModal(
		app,
		t('BULK_REPLACE_WARNING_TITLE'),
		warningDesc,
		t('BUTTON_REPLACE_ALL'),
		async () => {
			const processingMsg =
				mdFiles.length === 1
					? t('NOTICE__PROCESSING_FILES_SINGLE', mdFiles.length)
					: t('NOTICE__PROCESSING_FILES_PLURAL', mdFiles.length);
			const notice = new Notice(processingMsg, 0);
			let totalMatchCount = 0;
			let modifiedFileCount = 0;

			try {
				for (const file of mdFiles) {
					const content = await app.vault.cachedRead(file);
					const initialCheck = processText(content, action.rules);

					if (initialCheck.matchCount > 0) {
						await app.vault.process(file, (currentContent) => {
							const finalProcess = processText(currentContent, action.rules);
							totalMatchCount += finalProcess.matchCount;
							modifiedFileCount++;
							return finalProcess.text;
						});
					}
				}
				new Notice(t('NOTICE__BULK_REPLACE_COMPLETE', totalMatchCount, modifiedFileCount));
			} catch (error) {
				new Notice(
					t('NOTICE__ERROR', error instanceof Error ? error.message : String(error))
				);
				console.error(error);
			} finally {
				notice.hide();
			}
		}
	).open();
}

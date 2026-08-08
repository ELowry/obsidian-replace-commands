import { App, Modal, Setting } from 'obsidian';
import { t } from '../locales/i18n';

/**
 * A reusable modal that prompts the user for confirmation before executing a destructive action.
 */
export class ConfirmModal extends Modal {
	/** Tracks whether the user explicitly clicked the confirm button. */
	private isConfirmed = false;

	/**
	 * Creates a new ConfirmModal.
	 *
	 * @param app - The Obsidian App instance.
	 * @param title - The title displayed at the top of the modal.
	 * @param message - The descriptive warning message displayed to the user.
	 * @param ctaLabel - The text for the main button.
	 * @param onConfirm - Callback executed when the user confirms the action.
	 * @param onCancel - Optional callback executed if the user closes or cancels the modal without confirming.
	 */
	constructor(
		app: App,
		private title: string,
		private message: string,
		private ctaLabel: string,
		private onConfirm: () => Promise<void> | void,
		private onCancel?: () => void,
	) {
		super(app);
	}

	/**
	 * Called when the modal is opened.
	 * Renders the title, message, and action buttons.
	 */
	onOpen() {
		const { contentEl, titleEl } = this;
		titleEl.setText(this.title);
		contentEl.createEl('p', { text: this.message });

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText(t('BUTTON_CANCEL')).onClick(() => {
					this.close();
				}),
			)
			.addButton((btn) =>
				btn
					.setButtonText(this.ctaLabel)
					.setDestructive()
					.setCta()
					.onClick(async () => {
						this.isConfirmed = true;
						await this.onConfirm();
						this.close();
					}),
			);
	}

	/**
	 * Called when the modal is closed.
	 * Cleans up the DOM and fires the cancellation callback if the action was not confirmed.
	 */
	onClose() {
		this.contentEl.empty();
		if (!this.isConfirmed && this.onCancel) {
			this.onCancel();
		}
	}
}

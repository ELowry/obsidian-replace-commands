import { Editor } from 'obsidian';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyReplaceAction } from './engine';
import { ReplaceAction } from './types';

// Mock Obsidian's classes so the tests don't crash when files are evaluated
vi.mock('obsidian', () => {
	class MockModal {
		app: unknown;
		contentEl: { createEl: Mock; empty: Mock };
		titleEl: { setText: Mock };
		constructor(app: unknown) {
			this.app = app;
			this.contentEl = { createEl: vi.fn(), empty: vi.fn() };
			this.titleEl = { setText: vi.fn() };
		}
		open() {}
		close() {}
	}

	class MockSetting {
		addButton() {
			return this;
		}
	}

	class MockTFile {
		extension = 'md';
		path = '';
	}

	class MockTFolder {
		path = '';
	}

	return {
		Notice: vi.fn(),
		Modal: MockModal,
		Setting: MockSetting,
		TFile: MockTFile,
		TFolder: MockTFolder,
		moment: {
			locale: vi.fn(() => 'en'),
		},
	};
});

interface MockEditor {
	listSelections: Mock;
	getRange: Mock;
	getValue: Mock;
	lastLine: Mock;
	getLine: Mock;
	transaction: Mock;
}

describe('Engine (applyReplaceAction)', () => {
	let mockEditor: MockEditor;
	let mockAction: ReplaceAction;

	beforeEach(() => {
		// Reset the mocked editor before each test to ensure a clean slate
		mockEditor = {
			listSelections: vi.fn(),
			getRange: vi.fn(),
			getValue: vi.fn(),
			lastLine: vi.fn(),
			getLine: vi.fn(),
			transaction: vi.fn(),
		};

		mockAction = {
			id: 'test-action',
			name: 'Test Action',
			showInContextMenu: true,
			rules: [{ search: 'apple', replace: 'orange', useRegex: false }],
		};
	});

	it('should process the entire document when nothing is selected', () => {
		mockEditor.listSelections.mockReturnValue([
			{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } },
		]);
		mockEditor.getValue.mockReturnValue('I have an apple.');
		mockEditor.lastLine.mockReturnValue(0);
		mockEditor.getLine.mockReturnValue('I have an apple.');

		// Cast the mock to unknown, then Editor, to satisfy the parameter type safely
		applyReplaceAction(mockEditor as unknown as Editor, mockAction);

		expect(mockEditor.transaction).toHaveBeenCalledWith({
			changes: [
				{
					from: { line: 0, ch: 0 },
					to: { line: 0, ch: 16 },
					text: 'I have an orange.',
				},
			],
		});
	});

	it('should process only the selected text when a selection exists', () => {
		mockEditor.listSelections.mockReturnValue([
			{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 5 } },
		]);
		mockEditor.getRange.mockReturnValue('apple');

		applyReplaceAction(mockEditor as unknown as Editor, mockAction);

		expect(mockEditor.transaction).toHaveBeenCalledWith({
			changes: [
				{
					from: { line: 0, ch: 0 },
					to: { line: 0, ch: 5 },
					text: 'orange',
				},
			],
		});
	});

	it('should reorder backwards selections (head before anchor)', () => {
		// Simulating mouse text select
		mockEditor.listSelections.mockReturnValue([
			{ anchor: { line: 0, ch: 10 }, head: { line: 0, ch: 5 } },
		]);
		mockEditor.getRange.mockReturnValue('apple');

		applyReplaceAction(mockEditor as unknown as Editor, mockAction);

		expect(mockEditor.transaction).toHaveBeenCalledWith({
			changes: [
				{
					from: { line: 0, ch: 5 },
					to: { line: 0, ch: 10 },
					text: 'orange',
				},
			],
		});
	});
});

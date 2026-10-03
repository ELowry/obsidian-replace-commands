import { beforeEach, describe, expect, it, vi } from 'vitest';

import { t } from './locales/i18n';

let mockLocale = 'en';

vi.mock('obsidian', () => {
	return {
		moment: {
			locale: vi.fn(() => mockLocale),
		},
	};
});

describe('Translation Engine (i18n.ts)', () => {
	beforeEach(() => {
		mockLocale = 'en';
	});

	it('should return the correct English translation by default', () => {
		expect(t('SETTINGS_TITLE')).toBe('Custom replace actions');
	});

	it('should correctly replace {0} and {1} placeholders with arguments', () => {
		const pluralResult = t('NOTICE__APPLIED_CHANGES_PLURAL', 'remove-spaces', 5);
		expect(pluralResult).toBe('Applied "remove-spaces" (5 changes)');

		const singularResult = t('NOTICE__APPLIED_CHANGES_SINGLE', 'format-date', 1);
		expect(singularResult).toBe('Applied "format-date" (1 change)');

		const singularBulk = t('BULK_REPLACE_WARNING_DESC_SINGLE', 1, 'Format');
		expect(singularBulk).toBe(
			'You are about to modify 1 file using "Format". This writes directly to disk and CANNOT be undone with Ctrl+Z. Are you sure you want to proceed?'
		);

		const pluralBulk = t('BULK_REPLACE_WARNING_DESC_PLURAL', 3, 'Fix text');
		expect(pluralBulk).toBe(
			'You are about to modify 3 files using "Fix text". This writes directly to disk and CANNOT be undone with Ctrl+Z. Are you sure you want to proceed?'
		);
	});

	it('should return the correct localized string when language is switched', () => {
		mockLocale = 'es';
		expect(t('SETTINGS_TITLE')).toBe('Acciones de reemplazo personalizadas');

		mockLocale = 'fr';
		expect(t('SETTINGS_TITLE')).toBe('Groupes de remplacements personnalisés');
	});

	it('should inject variables correctly even when using a translated language', () => {
		mockLocale = 'es';
		const result = t('NOTICE__ERROR', 'Regex invalida');
		expect(result).toBe('Error de reemplazo personalizado: Regex invalida');
	});
});

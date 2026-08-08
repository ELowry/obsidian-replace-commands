import { vi, describe, it, expect, beforeEach } from 'vitest';

let mockLocale = 'en';

vi.mock('obsidian', () => {
	return {
		moment: {
			locale: vi.fn(() => mockLocale),
		},
	};
});

import { t } from './locales/i18n';

describe('Translation Engine (i18n.ts)', () => {
	beforeEach(() => {
		mockLocale = 'en';
	});

	it('should return the correct English translation by default', () => {
		expect(t('SETTINGS_TITLE')).toBe('Custom replace actions');
	});

	it('should correctly replace {0} and {1} placeholders with arguments', () => {
		const result = t('NOTICE__APPLIED_CHANGES', 'remove-spaces', 5, 's');
		expect(result).toBe('Applied "remove-spaces" (5 changes)');

		const singularResult = t('NOTICE__APPLIED_CHANGES', 'format-date', 1, '');
		expect(singularResult).toBe('Applied "format-date" (1 change)');
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

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { t } from './locales/i18n';

describe('i18n Translation Helper', () => {
	beforeEach(() => {
		vi.stubGlobal('window', {
			moment: {
				locale: () => 'fr',
			},
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should return French strings when locale is fr', () => {
		expect(t('SETTINGS_TITLE')).toBe('Groupes de remplacements personnalisés');
	});

	it('should properly format dynamic strings', () => {
		expect(t('NOTICE__ERROR')('Test')).toBe('Erreur de remplacement: Test');
	});
});

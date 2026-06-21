// locales/i18n.ts
import en from './en';
import fr from './fr';

const frDict = fr as Partial<typeof en>;

export function t<K extends keyof typeof en>(key: K): (typeof en)[K] {
	const locale = typeof window !== 'undefined' ? window.moment?.locale() : 'en';

	if (locale === 'fr' && frDict[key]) {
		return frDict[key];
	}
	return en[key];
}

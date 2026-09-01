import { moment } from 'obsidian';

import en from './en.json';
import es from './es.json';
import fr from './fr.json';

// import de from './de.json';
// import tr from './tr.json';
// import zh_Hans from './zh_Hans.json';

/**
 * Map of language codes mapped to translations.
 */
const localeMap: Record<string, Partial<typeof en>> = {
	en,
	es,
	fr,
	// de,
	// tr,
	// "zh-cn": zh_Hans,
};

/**
 * Retrieves and formats a localized string based on the active Obsidian application language.
 *
 * @param key - The translation key.
 * @param args - Optional dynamic values injected into placeholders.
 * @returns The formatted translation string.
 */
export function t(key: keyof typeof en, ...args: (string | number)[]): string {
	const currentLanguage = moment.locale();

	let rawString = localeMap[currentLanguage]?.[key];

	if (rawString === undefined || rawString === '') {
		rawString = en[key];
	}

	let finalString: string = rawString;

	if (args.length > 0) {
		args.forEach((argument, index) => {
			finalString = finalString.replace(`{${index}}`, String(argument));
		});
	}

	return finalString;
}

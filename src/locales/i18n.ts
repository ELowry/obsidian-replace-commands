import { moment } from 'obsidian';

import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import ptBR from './pt_BR.json';

// import de from './de.json';
// import ja from './ja.json';
// import tr from './tr.json';
// import zhHans from './zh_Hans.json';

/**
 * Type definition representing the expected structure of localized JSON files based on the WebExtension format.
 */
type TranslationType = {
	[K in keyof typeof en]?: { message: string; description?: string };
};

/**
 * Registry mapping Obsidian's language codes to their respective imported translation objects.
 */
const localeMap: Record<string, TranslationType> = {
	en,
	es,
	fr,
	'pt-br': ptBR,
	// de,
	// ja,
	// tr,
	// 'zh-cn': zhHans,
};

/**
 * Retrieves and formats a localized string based on the active Obsidian application language.
 *
 * @param key - The translation key matching a valid property in the base English translation file.
 * @param args - Optional dynamic values to be injected into positional placeholders (e.g., {0}, {1}).
 * @returns The formatted translation string.
 */
export function t(key: keyof typeof en, ...args: (string | number)[]): string {
	const currentLanguage = moment.locale();
	const translation = localeMap[currentLanguage]?.[key];

	let finalString = translation?.message ?? en[key].message;

	if (args.length > 0) {
		args.forEach((argument, index) => {
			finalString = finalString.replace(`{${index}}`, String(argument));
		});
	}

	return finalString;
}

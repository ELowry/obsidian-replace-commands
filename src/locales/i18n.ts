import { moment } from 'obsidian';

import en from './en.json';
import es from './es.json';
import fr from './fr.json';
// import de from './de.json';
// import tr from './tr.json';
// import zh_Hans from './zh_Hans.json';

const localeMap: Record<string, Partial<typeof en>> = {
	en,
	es,
	fr,
	// de,
	// tr,
	// "zh-cn": zh_Hans,
};

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

import { ReplaceRule } from './types';

/**
 * Pure function to process text based on a set of rules.
 * Extracted for easy unit testing without Obsidian dependencies.
 */
export function processText(text: string, rules: ReplaceRule[]): string {
	let processedText = text;

	for (const rule of rules) {
		if (!rule.search) continue; // Skip empty rules

		if (rule.useRegex) {
			try {
				const flags = rule.regexFlags || 'g';
				const regex = new RegExp(rule.search, flags);
				processedText = processedText.replace(regex, rule.replace);
			} catch {
				// We throw the error so the caller can catch it and abort
				throw new Error(`Invalid Regex: ${rule.search}`);
			}
		} else {
			// Unescape common characters so users can use hotkeys like \n and \t in plain text mode
			const searchString = rule.search.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
			const replaceString = rule.replace.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

			processedText = processedText.replaceAll(searchString, replaceString);
		}
	}

	return processedText;
}

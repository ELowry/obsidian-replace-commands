import { ReplaceRule } from './types';

/**
 * Applies search and replace rules to text in sequence.
 *
 * @param text - The input string to transform.
 * @param rules - Array of rules to apply sequentially.
 * @returns The transformed string.
 * @throws Error if a regex pattern is invalid.
 */
export function processText(text: string, rules: ReplaceRule[]): string {
	let processedText = text;

	for (const rule of rules) {
		if (!rule.search) continue;

		if (rule.useRegex) {
			try {
				const flags = rule.regexFlags || 'g';
				const regex = new RegExp(rule.search, flags.replace(/[\s,]/g, '').toLowerCase());
				processedText = processedText.replace(regex, rule.replace);
			} catch {
				throw new Error(`Invalid Regex: /${rule.search}/${rule.regexFlags || 'g'}`);
			}
		} else {
			const search = rule.search.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
			const replace = rule.replace.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

			processedText = processedText.replaceAll(search, replace);
		}
	}

	return processedText;
}

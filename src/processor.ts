import { ReplaceRule } from './types';

/**
 * Applies search and replace rules to text in sequence.
 *
 * @param text - The input string to transform.
 * @param rules - Array of rules to apply sequentially.
 * @returns An object containing the transformed string and the number of matches replaced.
 * @throws Error if a regex pattern is invalid.
 */
export function processText(
	text: string,
	rules: ReplaceRule[],
): { text: string; matchCount: number } {
	let processedText = text;
	let matchCount = 0;

	for (const rule of rules) {
		if (!rule.search) continue;

		if (rule.useRegex) {
			try {
				const flags = rule.regexFlags || 'g';
				const cleanedFlags = flags.replace(/[\s,]/g, '').toLowerCase();
				const regex = new RegExp(rule.search, cleanedFlags);

				const matches = processedText.match(new RegExp(rule.search, cleanedFlags));
				if (matches) {
					matchCount += cleanedFlags.includes('g') ? matches.length : 1;
				}

				processedText = processedText.replace(regex, rule.replace);
			} catch {
				throw new Error(`Invalid Regex: /${rule.search}/${rule.regexFlags || 'g'}`);
			}
		} else {
			const search = rule.search.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
			const replace = rule.replace.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

			if (search.length > 0) {
				matchCount += processedText.split(search).length - 1;
			}
			processedText = processedText.replaceAll(search, replace);
		}
	}

	return { text: processedText, matchCount };
}

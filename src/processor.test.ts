import { describe, expect, it } from 'vitest';
import { processText } from './processor';
import { ReplaceRule } from './types';

/**
 * Unit tests for text processing logic (processor.ts).
 */
describe('Custom Replace Processor', () => {
	/**
	 * Plain text replacement.
	 */
	it('should replace basic plain text', () => {
		const text = 'Hello world';
		const rules: ReplaceRule[] = [{ search: 'world', replace: 'Obsidian', useRegex: false }];
		expect(processText(text, rules).text).toBe('Hello Obsidian');
	});

	/**
	 * Plain text newline unescaping (\n).
	 */
	it('should parse plaintext escaped newlines (\\n)', () => {
		const text = 'Line 1\nLine 2';
		const rules: ReplaceRule[] = [{ search: '\\n', replace: ' - ', useRegex: false }];
		expect(processText(text, rules).text).toBe('Line 1 - Line 2');
	});

	/**
	 * Regex with capture groups.
	 */
	it('should handle regex capture groups', () => {
		const text = 'Lastname, Firstname';
		const rules: ReplaceRule[] = [
			{ search: '(\\w+), (\\w+)', replace: '$2 $1', useRegex: true, regexFlags: 'g' },
		];
		expect(processText(text, rules).text).toBe('Firstname Lastname');
	});

	/**
	 * Error handling for invalid patterns.
	 */
	it('should throw an error on invalid regex', () => {
		const text = 'Test string';
		const rules: ReplaceRule[] = [
			{ search: '[Unclosed bracket', replace: 'Oops', useRegex: true, regexFlags: 'g' },
		];
		expect(() => processText(text, rules)).toThrow(SyntaxError);
	});

	/**
	 * Match counting.
	 */
	it('should correctly count the number of matches replaced', () => {
		const text = 'apple banana apple grape apple';
		const rules: ReplaceRule[] = [{ search: 'apple', replace: 'orange', useRegex: false }];

		const result = processText(text, rules);
		expect(result.text).toBe('orange banana orange grape orange');
		expect(result.matchCount).toBe(3);
	});

	/**
	 * Sequential pipeline processing.
	 */
	it('should process multiple rules sequentially (pipeline)', () => {
		const text = 'The quick brown fox';
		const rules: ReplaceRule[] = [
			{ search: 'quick', replace: 'slow', useRegex: false },
			{ search: 'brown', replace: 'red', useRegex: false },
			{ search: 'slow red', replace: 'fast blue', useRegex: false },
		];

		const result = processText(text, rules);
		expect(result.text).toBe('The fast blue fox');
		expect(result.matchCount).toBe(3);
	});
});

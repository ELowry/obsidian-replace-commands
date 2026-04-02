import { describe, expect, it } from 'vitest';
import { processText } from './processor';
import { ReplaceRule } from './types';

/**
 * Unit tests for text processing logic.
 */
describe('Custom Replace Engine', () => {
	/**
	 * Plain text replacement.
	 */
	it('should replace basic plain text', () => {
		const text = 'Hello world';
		const rules: ReplaceRule[] = [{ search: 'world', replace: 'Obsidian', useRegex: false }];
		expect(processText(text, rules)).toBe('Hello Obsidian');
	});

	/**
	 * Plain text newline unescaping (\n).
	 */
	it('should parse plaintext escaped newlines (\\n)', () => {
		const text = 'Line 1\nLine 2';
		const rules: ReplaceRule[] = [{ search: '\\n', replace: ' - ', useRegex: false }];
		expect(processText(text, rules)).toBe('Line 1 - Line 2');
	});

	/**
	 * Regex with capture groups.
	 */
	it('should handle regex capture groups', () => {
		const text = 'Lastname, Firstname';
		const rules: ReplaceRule[] = [
			{ search: '(\\w+), (\\w+)', replace: '$2 $1', useRegex: true, regexFlags: 'g' },
		];
		expect(processText(text, rules)).toBe('Firstname Lastname');
	});

	/**
	 * Error handling for invalid patterns.
	 */
	it('should throw an error on invalid regex', () => {
		const text = 'Test string';
		const rules: ReplaceRule[] = [
			{ search: '[Unclosed bracket', replace: 'Oops', useRegex: true, regexFlags: 'g' },
		];
		expect(() => processText(text, rules)).toThrow(/Invalid Regex/);
	});
});

import { describe, expect, it } from 'vitest';
import { processText } from './processor';
import { ReplaceRule } from './types';

/**
 * Unit tests for the core text processing engine of the Custom Replace plugin.
 * These tests focus on the logical transformation of text based on user-defined rules,
 * ensuring both plain text and regex-based replacements are handled correctly.
 */
describe('Custom Replace Engine', () => {
	/**
	 * Tests basic string replacement without special characters or regex.
	 */
	it('should replace basic plain text', () => {
		const text = 'Hello world';
		const rules: ReplaceRule[] = [{ search: 'world', replace: 'Obsidian', useRegex: false }];
		expect(processText(text, rules)).toBe('Hello Obsidian');
	});

	/**
	 * Tests that escaped newlines in plain text mode (e.g., \n) are correctly unescaped
	 * and replaced as actual newline characters.
	 */
	it('should parse plaintext escaped newlines (\\n)', () => {
		const text = 'Line 1\nLine 2';
		const rules: ReplaceRule[] = [{ search: '\\n', replace: ' - ', useRegex: false }];
		expect(processText(text, rules)).toBe('Line 1 - Line 2');
	});

	/**
	 * Tests regex replacements with capture groups and flags.
	 */
	it('should handle regex capture groups', () => {
		const text = 'Lastname, Firstname';
		const rules: ReplaceRule[] = [
			{ search: '(\\w+), (\\w+)', replace: '$2 $1', useRegex: true, regexFlags: 'g' },
		];
		expect(processText(text, rules)).toBe('Firstname Lastname');
	});

	/**
	 * Tests the safety mechanism for invalid user-provided regex patterns.
	 */
	it('should throw an error on invalid regex', () => {
		const text = 'Test string';
		const rules: ReplaceRule[] = [
			{ search: '[Unclosed bracket', replace: 'Oops', useRegex: true, regexFlags: 'g' },
		];
		expect(() => processText(text, rules)).toThrow(/Invalid Regex/);
	});
});

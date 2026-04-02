/**
 * Search and replace rule definition.
 */
export interface ReplaceRule {
	/** Search term or regex pattern. */
	search: string;
	/** Replacement string. */
	replace: string;
	/** Treat search as regular expression. */
	useRegex: boolean;
	/** Regex evaluation flags. */
	regexFlags?: string;
}

export interface ReplaceAction {
	/** Unique action ID. */
	id: string;
	/** Action display name. */
	name: string;
	/** Sequential rules to apply. */
	rules: ReplaceRule[];
	/** Display in editor context menu. */
	showInContextMenu: boolean;
	/** Sample text for testing rules. */
	testText?: string;
	/** Display live preview test bench. */
	showTestBench?: boolean;
}

/**
 * Plugin configuration schema.
 */
export interface CustomReplaceSettings {
	/** All defined replace actions. */
	actions: ReplaceAction[];
}

/**
 * Default configuration.
 */
export const DEFAULT_SETTINGS: CustomReplaceSettings = {
	actions: [],
};

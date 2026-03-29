/**
 * Represents a single search and replace rule.
 */
export interface ReplaceRule {
	/** The text or regex pattern to search for. */
	search: string;
	/** The text to replace the search pattern with. */
	replace: string;
	/** Whether the search pattern should be treated as a regular expression. */
	useRegex: boolean;
	/** Optional flags for the regular expression (e.g., 'i', 'm'). */
	regexFlags?: string;
}

/**
 * Represents a collection of rules grouped under a single named action.
 */
export interface ReplaceAction {
	/** Unique identifier for the action. */
	id: string;
	/** User-friendly name for the action. */
	name: string;
	/** Sequential list of rules to apply. */
	rules: ReplaceRule[];
	/** Whether this action should appear in the editor's right-click context menu. */
	showInContextMenu: boolean;
}

/**
 * Plugin-wide settings structure.
 */
export interface CustomReplaceSettings {
	/** List of all configured replace actions. */
	actions: ReplaceAction[];
}

/**
 * Default settings used when the plugin is first loaded.
 */
export const DEFAULT_SETTINGS: CustomReplaceSettings = {
	actions: [],
};

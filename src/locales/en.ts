// locales/en.ts
export default {
	// Settings: General
	SETTINGS_TITLE: 'Custom replace actions',
	SETTINGS_DESCRIPTION: 'Manage preset find-and-replace actions.',
	BUTTON_ADD_ACTION: 'Add new action',

	// Settings: Action Block
	NEW_ACTION_DEFAULT_NAME: 'New action',
	ACTION_NAME_LABEL: 'Action name',
	ACTION_NAME_PLACEHOLDER: 'Example: remove extra spaces',
	ACTION_CONTEXT_MENU_TOOLTIP: 'Show in right-click context menu',
	BUTTON_MOVE_ACTION_UP: 'Move action up',
	BUTTON_MOVE_ACTION_DOWN: 'Move action down',
	BUTTON_DELETE_ACTION: 'Delete action',
	BUTTON_COLLAPSE_RULES: 'Collapse rules',
	BUTTON_EXPAND_RULES: 'Expand rules',

	// Settings: Test Bench
	TEST_BENCH_LABEL: 'Live preview test bench',
	TEST_INPUT_LABEL: 'Test input',
	TEST_INPUT_PLACEHOLDER: 'Paste sample text here to test your rules...',
	BUTTON_ADD_RULE: 'Add new rule',
	ERROR_PREVIOUS_STEP_FAILED: 'A previous step failed',
	ERROR_INVALID_REGEX: 'Invalid regex',

	// Settings: Rule Row
	RULE_SEARCH_LABEL: 'Search',
	RULE_SEARCH_PLACEHOLDER: 'Search...',
	RULE_REPLACE_LABEL: 'Replace',
	RULE_REPLACE_PLACEHOLDER: 'Replace with...',
	RULE_REGEX_LABEL: 'Regex',
	RULE_FLAGS_LABEL: 'Flags',
	RULE_FLAGS_INFO: 'Can include: ',
	BUTTON_MOVE_RULE_UP: 'Move rule up',
	BUTTON_MOVE_RULE_DOWN: 'Move rule down',
	BUTTON_REMOVE_RULE: 'Remove rule',
	FINAL_OUTPUT_LABEL: 'Final output',
	STEP_OUTPUT_LABEL: 'Step output',

	// Main Context Menu
	CONTEXT_MENU_TITLE: 'Custom replace',

	// Engine Notifications
	NOTICE__APPLIED_CHANGES: (actionName: string, count: number) =>
		`Applied "${actionName}" (${count} change${count === 1 ? '' : 's'})`,
	NOTICE__ERROR: (message: string) => `Custom replace error: ${message}`,
};

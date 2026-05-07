// locales/fr.ts
export default {
	// Settings: General
	SETTINGS_TITLE: 'Groupes de remplacements personnalisés',
	SETTINGS_DESCRIPTION: 'Gérez votre catalogue de groupes de remplacements prédéfinis.',
	BUTTON_ADD_ACTION: 'Ajouter un groupe de remplacements',

	// Settings: Action Block
	NEW_ACTION_DEFAULT_NAME: 'Nouveau groupe de remplacements',
	ACTION_NAME_LABEL: 'Nom du groupe de remplacements',
	ACTION_NAME_PLACEHOLDER: 'Exemple: supprimer les espaces en trop',
	ACTION_CONTEXT_MENU_TOOLTIP: 'Afficher dans le menu contextuel (clic droit)',
	BUTTON_MOVE_ACTION_UP: 'Déplacer le groupe vers le haut',
	BUTTON_MOVE_ACTION_DOWN: 'Déplacer le groupe vers le bas',
	BUTTON_DELETE_ACTION: 'Supprimer le groupe',
	BUTTON_COLLAPSE_RULES: 'Masquer les règles',
	BUTTON_EXPAND_RULES: 'Afficher les règles',

	// Settings: Test Bench
	TEST_BENCH_LABEL: 'Zone de prévisualisation',
	TEST_INPUT_LABEL: 'Texte à modifier',
	TEST_INPUT_PLACEHOLDER: 'Collez votre texte ici pour prévisualiser les remplacements...',
	BUTTON_ADD_RULE: 'Ajouter une règle',
	ERROR_PREVIOUS_STEP_FAILED: 'Étape précédente invalide',
	ERROR_INVALID_REGEX: 'Regex invalide',

	// Settings: Rule Row
	RULE_SEARCH_LABEL: 'Rechercher',
	RULE_SEARCH_PLACEHOLDER: 'Rechercher...',
	RULE_REPLACE_LABEL: 'Remplacer',
	RULE_REPLACE_PLACEHOLDER: 'Remplacer par...',
	RULE_REGEX_LABEL: 'Regex',
	RULE_FLAGS_LABEL: 'Flags',
	RULE_FLAGS_INFO: 'Peut inclure: ',
	BUTTON_MOVE_RULE_UP: 'Déplacer la règle vers le haut',
	BUTTON_MOVE_RULE_DOWN: 'Déplacer la règle vers le bas',
	BUTTON_REMOVE_RULE: 'Supprimer la règle',
	FINAL_OUTPUT_LABEL: 'Résultat final',
	STEP_OUTPUT_LABEL: "Résultat de l'étape",

	// Main Context Menu
	CONTEXT_MENU_TITLE: 'Remplacements personnalisés',

	// Engine Notifications
	NOTICE__APPLIED_CHANGES: (actionName: string, count: number) =>
		`"${actionName}" appliqué (${count} modification${count === 1 ? '' : 's'})`,
	NOTICE__ERROR: (message: string) => `Erreur de remplacement: ${message}`,
};

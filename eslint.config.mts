/// <reference types="node" />
import eslintConfigPrettier from 'eslint-config-prettier';
import obsidianmd from 'eslint-plugin-obsidianmd';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mts', 'eslint.config.js', 'manifest.json'],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json'],
			},
		},
	},
	...((obsidianmd.configs?.recommended || []) as any[]),
	eslintConfigPrettier,
	globalIgnores([
		'node_modules',
		'dist',
		'.*/**',
		'esbuild.config.mjs',
		'eslint.config.mts',
		'version-bump.mjs',
		'versions.json',
		'main.js',
		'package.json',
		'tsconfig.json',
	])
);

'use strict';

const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const pluginVue = require('eslint-plugin-vue');
const prettierConfig = require('eslint-config-prettier');

const customRules = {
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-explicit-any': 'warn',
};

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // Global ignores
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },

  // TypeScript rules (applies to .ts/.tsx files by default from flat/recommended)
  ...tsPlugin.configs['flat/recommended'],

  // Vue rules (applies to .vue files)
  ...pluginVue.configs['flat/recommended'],

  // Override: tell vue-eslint-parser to use TS parser for <script> blocks
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: customRules,
  },

  // Custom TS rules scoped to project source files
  {
    files: ['apps/**/*.ts', 'packages/**/*.ts'],
    rules: customRules,
  },

  // Disable Prettier-conflicting formatting rules (must be last)
  prettierConfig,
];

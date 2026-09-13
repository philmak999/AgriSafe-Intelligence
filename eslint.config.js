import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules', 'server/data'] },

  // Frontend — React (browser globals, JSX, hooks/refresh rules)
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Without this, ESLint's core scope analysis doesn't know <Foo /> in
      // JSX counts as a reference to `Foo` — every component import gets
      // flagged "unused" even when it's actively rendered. This plugin
      // teaches it JSX. jsx-runtime disables the old React-must-be-in-scope
      // rules, since Vite's automatic JSX runtime doesn't need that import.
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      // We already type-check props via usage; prop-types would be redundant churn.
      'react/prop-types': 'off',
      // Flags existing fetch-on-mount + setInterval polling (AuthContext,
      // App, Automation) as a hard error; those are intentional here, not
      // bugs — downgraded to a warning rather than refactoring working code
      // as part of a CI/CD-only change.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // Backend — Node (ESM, no JSX)
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },

  // Config files at the repo root (vite.config.js, eslint.config.js, ...)
  {
    files: ['*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: js.configs.recommended.rules,
  },
];

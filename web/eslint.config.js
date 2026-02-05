import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import globals from 'globals';

import tsParser from '@typescript-eslint/parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const ignores = [
  'build/**',
  'public/**',
  '**/public/**',
  '.eslintrc.cjs',
  '**/.eslintrc.cjs',
  'eslint.config.js',
  '**/eslint.config.js',
  'vite.config.ts',
  '**/vite.config.ts',
  '.vscode/**',
  '**/.vscode/**',
  '.github/**',
  '**/.github/**',
  '*.d.ts',
  '**/*.d.ts',
  'wasm_exec.js',
  '**/wasm_exec.js',
  '**/node_modules/**',
];

const compatConfigs = compat.extends(
  'plugin:react/recommended',
  'eslint:recommended',
  'plugin:react-hooks/recommended',
  'plugin:import/recommended',
  'plugin:import/typescript',
  'plugin:@typescript-eslint/recommended',
  'plugin:prettier/recommended'
);

export default [
  {
    ignores,
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
  ...compatConfigs.map((config) => ({
    ...config,
    ignores: config.ignores ? [...config.ignores, ...ignores] : ignores,
  })),
  {
    files: ['**/*.{js,jsx}'],
    ignores,
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
        project: ['tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores,
    settings: {
      react: {
        version: 'detect',
      },
      'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['**/tsconfig.json'],
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-named-as-default-member': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-restricted-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'import/namespace': 'off',
      'prefer-const': 'off',
    },
  },
];

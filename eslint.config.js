import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

import globals from 'globals';
import path from 'node:path';
import js from '@eslint/js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const compat = new FlatCompat({
    baseDirectory: dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    ...compat.extends('airbnb-base', 'prettier', 'plugin:@typescript-eslint/recommended'),
    {
        languageOptions: {
            globals: {
                ...globals.browser
            },
            parserOptions: {
                project: './tsconfig.json'
            }
        },

        rules: {
            radix: 'off',
            curly: ['error', 'multi-line'],
            'no-console': 'off',
            'no-return-await': 'off',
            'no-else-return': 'off',
            'consistent-return': 'off',
            'spaced-comment': 'off',
            'import/named': 'off',
            'import/no-extraneous-dependencies': 'off',
            'import/extensions': [
                'error',
                'ignorePackages',
                {
                    js: 'never',
                    jsx: 'never',
                    ts: 'never',
                    tsx: 'never'
                }
            ],
            '@typescript-eslint/no-explicit-any': 'off'
        },

        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json'
                }
            }
        }
    }
];

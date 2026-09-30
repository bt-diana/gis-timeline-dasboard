import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import fs from 'node:fs'

const FEATURES_DIR = 'src/features'
const MAX_FEATURE_NESTING = 5
const SOURCE_FILES = '*.{ts,tsx}'

const featureNames = fs
  .readdirSync(FEATURES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const restrictImports = (files, patterns) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
})

const otherFeatureImports = (feature, nesting) => {
  const self = escapeRegex(feature)
  return [
    {
      regex: `^(\\.\\./){${String(nesting + 1)}}(?!${self}(/|$))[^./][^/]*`,
      message: `Features do not import each other; move shared code to src/shared/ (TR-60).`,
    },
    {
      regex: `(^|[/@])features/(?!${self}(/|$))`,
      message: `Features do not import each other; move shared code to src/shared/ (TR-60).`,
    },
  ]
}

const featureBoundaries = featureNames.flatMap((feature) =>
  Array.from({ length: MAX_FEATURE_NESTING + 1 }, (_, nesting) =>
    restrictImports(
      [`${FEATURES_DIR}/${feature}/${'*/'.repeat(nesting)}${SOURCE_FILES}`],
      otherFeatureImports(feature, nesting),
    ),
  ),
)

const sharedImportsNoFeatures = {
  regex: '(^|[/@])features(/|$)',
  message: 'src/shared/ does not import from src/features/ (TR-60).',
}

const apiImportsNoStore = {
  regex: '(^|[/@])(shared/)?store(/|$)',
  message: 'src/shared/api/ does not import from src/shared/store/ (TR-60).',
}

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    },
  },
  ...featureBoundaries,
  restrictImports(['src/shared/**/*.{ts,tsx}'], [sharedImportsNoFeatures]),
  restrictImports(['src/shared/api/**/*.{ts,tsx}'], [sharedImportsNoFeatures, apiImportsNoStore]),
)

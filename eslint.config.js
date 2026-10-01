import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import fs from 'node:fs'
import path from 'node:path'

const SLICED_LAYERS = ['widgets', 'features', 'entities']
const LAYER_ORDER = ['app', ...SLICED_LAYERS, 'shared']
const MAX_SLICE_NESTING = 5
const SOURCE_FILES = '*.{ts,tsx}'
const STORE_FILE = 'src/shared/store/appStore.ts'

const slicesOf = (layer) => {
  const layerDir = path.join(import.meta.dirname, 'src', layer)
  return fs.existsSync(layerDir)
    ? fs
        .readdirSync(layerDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : []
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const restrictImports = (files, patterns) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
})

const higherLayerImports = (layer) => {
  const higher = LAYER_ORDER.slice(0, LAYER_ORDER.indexOf(layer))
  return higher.length === 0
    ? []
    : [
        {
          regex: `^@(${higher.join('|')})(/|$)`,
          message: `src/${layer}/ imports only from lower FSD layers (TR-60, layer-panel INT-4).`,
        },
      ]
}

const devMocksImports = {
  regex: '(^@shared/mocks|^(\\.\\./)+mocks)(/|$)',
  message: 'Only src/app/ and main.tsx import the mocks (layer-panel PLAN-12).',
}

const deepSliceImports = {
  regex: `^@(${SLICED_LAYERS.join('|')})/[^/]+/`,
  message: 'Import another slice only through its index.ts (layer-panel INT-4).',
}

const sliceImports = (layer, slice, nesting) => [
  ...higherLayerImports(layer),
  deepSliceImports,
  devMocksImports,
  {
    regex: `^@${layer}/(?!${escapeRegex(slice)}$)`,
    message: `Slices of src/${layer}/ do not import each other (layer-panel INT-4).`,
  },
  {
    regex: `^(\\.\\./){${String(nesting + 1)}}`,
    message: 'Leave a slice only through an alias to another slice\'s index.ts (layer-panel INT-4).',
  },
]

const sliceBoundaries = SLICED_LAYERS.flatMap((layer) =>
  slicesOf(layer).flatMap((slice) =>
    Array.from({ length: MAX_SLICE_NESTING + 1 }, (_, nesting) =>
      restrictImports(
        [`src/${layer}/${slice}/${'*/'.repeat(nesting)}${SOURCE_FILES}`],
        sliceImports(layer, slice, nesting),
      ),
    ),
  ),
)

const relativeLayerImports = (layer) => ({
  regex: `^(\\.\\./)+(${LAYER_ORDER.filter((other) => other !== layer).join('|')})(/|$)`,
  message: `src/${layer}/ imports other layers through their alias, not a relative path (layer-panel INT-4).`,
})

const appBoundaries = restrictImports(['src/app/**/*.{ts,tsx}'], [deepSliceImports, relativeLayerImports('app')])

const sharedBoundaries = {
  ...restrictImports(
    ['src/shared/**/*.{ts,tsx}'],
    [...higherLayerImports('shared'), relativeLayerImports('shared'), devMocksImports],
  ),
  ignores: ['src/shared/mocks/**'],
}

const sharedMocksBoundaries = restrictImports(
  ['src/shared/mocks/**/*.{ts,tsx}'],
  [...higherLayerImports('shared'), relativeLayerImports('shared')],
)

const storeException = restrictImports(
  [STORE_FILE],
  [
    relativeLayerImports('shared'),
    devMocksImports,
    {
      regex: `^@(?!entities/[^/]+/model/[^/]+Slice$)(${LAYER_ORDER.filter((layer) => layer !== 'shared').join('|')})(/|$)`,
      message: 'appStore.ts may import only entity slice files (layer-panel PLAN-5).',
    },
  ],
)

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'public/mockServiceWorker.js'] },
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
  ...sliceBoundaries,
  appBoundaries,
  sharedBoundaries,
  sharedMocksBoundaries,
  storeException,
)

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '**/dist/*',
      '**/build/*',
      '**/storybook-static/*',
      '**/node_modules/*',
      '**/!.storybook/*',
      '**/eslint.config.cjs',
    ],
  },
  {
    files: ['*.ts', '*.tsx', '*.js'],
  },
  prettierConfig,
];

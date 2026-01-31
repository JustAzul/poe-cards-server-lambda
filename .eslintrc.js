module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
        paths: ['.'],
      },
    },
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'airbnb-base',
        'plugin:@typescript-eslint/recommended',
      ],
      plugins: ['@typescript-eslint'],
      parserOptions: {
        ecmaVersion: 13,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      rules: {
        // TypeScript parameter properties are not useless constructors
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'off',
        // Empty constructor body is valid with parameter properties
        'no-empty-function': ['error', { allow: ['constructors'] }],
        // Disable import resolution for TypeScript (tsc handles this)
        'import/no-unresolved': 'off',
        // Allow named exports without default export
        'import/prefer-default-export': 'off',
      },
    },
  ],
  rules: {
  },
};

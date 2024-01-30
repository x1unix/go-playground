module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    "plugin:react/recommended",
    "eslint:recommended",
    "plugin:react-hooks/recommended",
    "standard-with-typescript",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  plugins: [
    "react",
    "react-hooks",
    "import",
    "@typescript-eslint",
    "prettier",
    "unused-imports"
  ],
  parserOptions: {
    ecmaVersion: "latest",
    ecmaFeatures: {
      jsx: true
    },
    sourceType: "module",
    project: [
      "tsconfig.json"
    ],
    tsconfigRootDir: __dirname
  },
  settings: {
    react: {
      version: "detect"
    },
    'import/extensions': [
      ".js",
      ".jsx",
      ".ts",
      ".tsx"
    ],
    'import/parsers': {
      '@typescript-eslint/parser': [
        ".ts",
        ".tsx"
      ]
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      }
    }
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
    '@typescript-eslint/ban-types': [
      "error",
      {
        "types": {
          "Function": false,
          "{}": false,
        },
        "extendDefaults": true
      }
    ],
  }
}
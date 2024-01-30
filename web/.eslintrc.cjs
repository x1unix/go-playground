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
  }
}
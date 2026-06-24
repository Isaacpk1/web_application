const tseslint = require("@typescript-eslint/eslint-plugin");
const parser = require("@typescript-eslint/parser");

module.exports = [
  // Regras para código de PRODUÇÃO (moderadas)
  {
    files: ["src/**/*.ts", "!src/**/*.spec.ts"],
    languageOptions: {
      parser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      
      // Regras de complexidade (Aula 9 - Testes e Automação)
      // Production: mais relaxadas (warnings)
      "complexity": ["warn", 15],
      "max-depth": ["warn", 5],
      "max-params": ["warn", 5],
      "max-lines-per-function": ["warn", 80],
      "max-nested-callbacks": ["warn", 4],
    },
  },
  
  // Regras para TESTES (muito mais relaxadas)
  {
    files: ["src/**/*.spec.ts", "src/test/**/*.ts"],
    languageOptions: {
      parser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      
      // Testes podem ser bem mais longos e complexos
      "complexity": "off",
      "max-depth": "off",
      "max-params": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
    },
  },
];

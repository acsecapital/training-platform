// c:\Users\egcha\Documents\triniloyalty.backup2\SALESCOACHAIIDX2.51-main\training-platform\eslint.config.js
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier'; // To disable ESLint rules that conflict with Prettier

export default tseslint.config(
  {
    // Global ignores for this specific sub-project
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      // Add any other files or directories specific to 'training-platform' to ignore
    ],
  },
  // Base ESLint recommended rules
  pluginJs.configs.recommended,

  // TypeScript specific rules
  // For type-aware linting (recommended for TypeScript projects):
  ...tseslint.configs.recommendedTypeChecked,
  // Or, for less strict, non-type-aware linting:
  // ...tseslint.configs.recommended,

  // Next.js specific rules
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // Apply Next.js rules to relevant files
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // You can add or override Next.js specific rules here
      // e.g., '@next/next/no-html-link-for-pages': 'error',
    },
    settings: {
      next: {
        // This should correctly point to your Next.js project root within training-platform
        rootDir: import.meta.dirname,
      },
    },
  },

  // For JavaScript files (like .prettierrc.js, next.config.js, this eslint.config.js itself, etc.),
  // explicitly disable TypeScript type-aware linting rules.
  // These files are typically not part of the main TypeScript `project` compilation
  // that `parserOptions.project` refers to, so type information isn't available for them.
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'], // Targets all JS-like files
                                               // You can be more specific, e.g., '*.config.js', '.*rc.js'
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Configuration for TypeScript files (especially for type-aware linting)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true, // This will look for tsconfig.json in tsconfigRootDir
        tsconfigRootDir: import.meta.dirname, // Assumes tsconfig.json is in the same directory as this eslint.config.js
      },
    },
    // You can add TypeScript specific rule overrides here if needed
    // rules: {
    //   '@typescript-eslint/no-unused-vars': 'warn',
    // },
  },

  // Global language options for this sub-project
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021, // Or a more recent ES version like es2022
        React: 'readonly', // If you're not using the new JSX transform or want to be explicit
      },
    }
  },

  // Prettier config should be last to turn off any ESLint rules that conflict with Prettier's formatting.
  eslintConfigPrettier
);

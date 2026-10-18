import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import eslintReact from '@eslint-react/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', '.astro/**', 'public/cgi-bin/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // .astro: синтаксис + jsx-a11y-расширения (eslint-plugin-jsx-a11y-x для ESLint 10)
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  // React-острова: hooks-правила и ключи списков
  {
    files: ['src/components/react/**/*.{ts,tsx}'],
    ...eslintReact.configs['recommended-typescript'],
    rules: { ...eslintReact.configs['recommended-typescript'].rules, '@eslint-react/no-missing-key': 'warn' },
    plugins: { '@eslint-react': eslintReact },
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  // формат — за Prettier; ESLint форматные правила выключены
  prettier,
);
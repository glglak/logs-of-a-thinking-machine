/* eslint-disable no-console */
let eslintPluginAstro = { configs: { recommended: [] } };
try {
  eslintPluginAstro = (await import("eslint-plugin-astro")).default;
} catch {
  console.warn("eslint-plugin-astro not found; skipping");
}
let globals = { browser: {}, node: {} };
try {
  globals = (await import("globals")).default;
} catch {
  console.warn("globals package not found; using empty globals");
}

let tseslint = { configs: { recommended: [] } };
try {
  tseslint = (await import("typescript-eslint")).default;
} catch {
  console.warn("typescript-eslint not found; skipping");
}

export default [
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  { rules: { "no-console": "error" } },
  { ignores: ["dist/**", ".astro", "public/pagefind/**"] },
];

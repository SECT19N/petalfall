import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist/**", "demo/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
];
